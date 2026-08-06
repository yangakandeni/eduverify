# Deployment Runbook

Manual verification steps for deploying EduVerify's infra (`terraform/`).
Pre-flight checks and the `terraform plan` step are automated by
[`scripts/verify_deployment.sh`](../scripts/verify_deployment.sh); this doc
covers that script plus the interactive apply/smoke-test steps that follow it.

## Environments

Staging and production are **fully separate stacks** — own DynamoDB table, S3
bucket, Lambda, IAM role, and Amplify app each — sharing only the Terraform
state bucket/lock table (bootstrapped once, see below). They're configured
via `terraform/environments/<env>.{backend,tfvars}` and selected with a
`terraform init -backend-config=... ` / `-var-file=...` pair, or by passing
the env name as `scripts/verify_deployment.sh`'s one argument.

Everything (Lambda function name, IAM role, log group, Amplify app, SNS
alerts) derives from `project_name`, which each environment's tfvars sets to
a distinct value (`eduverify` / `eduverify-staging`), so nothing collides in
the same AWS account. `dynamodb_table_name` and `s3_bucket_name` are set
explicitly per environment for the same reason.

| Resource | Production | Staging |
|---|---|---|
| Lambda function | `eduverify-ingestion` | `eduverify-staging-ingestion` |
| Lambda log group | `/aws/lambda/eduverify-ingestion` | `/aws/lambda/eduverify-staging-ingestion` |
| DynamoDB table | `eduverify-institutions` | `eduverify-staging-institutions` |
| S3 register bucket | `eduverify-registers` | `eduverify-staging-registers` |
| Amplify app | `eduverify-web` | `eduverify-staging-web` |
| Amplify branch | `main` | `staging` |
| Terraform state key | `eduverify/production/terraform.tfstate` | `eduverify/staging/terraform.tfstate` |
| Region | `af-south-1` | `af-south-1` |

Deploying staging for the first time needs a `staging` branch to exist in the
GitHub repo (Amplify's `aws_amplify_branch` resource points at it by name —
it doesn't create the branch itself).

Secrets (`clerk_secret_key`, `github_access_token`) are deliberately absent
from the committed `environments/*.tfvars` files. Supply them either via
`TF_VAR_clerk_secret_key` / `TF_VAR_github_access_token` env vars, or a
gitignored `environments/<env>.secrets.tfvars` — `verify_deployment.sh` picks
it up automatically if present (layered on top with a second `-var-file`).

## 1. Pre-flight

```bash
./scripts/verify_deployment.sh staging      # or: production (default if omitted)
```

This checks, in order:
1. `aws sts get-caller-identity` succeeds (valid credentials, and prints the
   identity/account you're about to deploy as — confirm it's the intended one).
2. `terraform/environments/<env>.backend.hcl`'s `bucket` matches
   `variables.tf`'s `tf_state_bucket_name` default (or flags the divergence
   for you to confirm is intentional) and that the bucket is actually
   reachable.
3. `pytest` passes in `parser/` (regex extraction, Pydantic model validation,
   bogus-institution filtering — all fully local, no AWS calls).
4. `terraform init -backend-config=environments/<env>.backend.hcl` +
   `terraform plan -var-file=environments/<env>.tfvars -out=tfplan`.

If the state bucket / lock table don't exist yet (first-ever deploy of either
environment), bootstrap them first — `terraform/backend_state.tf` provisions
both (shared by staging and production), but has to be applied with **local**
state before `main.tf`'s `backend "s3" {}` can point at it:

```bash
cd terraform
terraform init                                    # local state, no -backend-config
terraform apply -target=aws_s3_bucket.tf_state \
                 -target=aws_s3_bucket_versioning.tf_state \
                 -target=aws_s3_bucket_server_side_encryption_configuration.tf_state \
                 -target=aws_s3_bucket_public_access_block.tf_state \
                 -target=aws_s3_bucket_ownership_controls.tf_state \
                 -target=aws_dynamodb_table.tf_locks
# migrate whichever environment's local state you were working from into the
# new S3 backend, e.g. for production:
terraform init -backend-config=environments/production.backend.hcl -migrate-state
```

**Opt-in region gotcha:** `af-south-1` is an AWS opt-in region. If your credentials come from SSO/federation/a `login_session`-style CLI login, they're typically minted against the **global** STS endpoint by default, which AWS rejects for opt-in regions even when the region is enabled on the account — every AWS call (including `terraform plan`) fails with `InvalidClientTokenId`, while the same credentials work fine with no region override. Confirm with:

```bash
aws sts get-caller-identity --region af-south-1   # fails with InvalidClientTokenId if hitting this
```

Fix by getting a token issued via the regional STS endpoint for `af-south-1` (e.g. `sts_regional_endpoints = regional` in `~/.aws/config`, or re-authenticate through whatever regional-aware flow your credential source supports) — this is a credential-sourcing issue, not a Terraform or account-permissions one.

## 2. Review and apply

`verify_deployment.sh` leaves a plan file at `terraform/tfplan`. Read it, then:

```bash
cd terraform
terraform apply tfplan
```

`tfplan` is bound to whichever environment's backend was active during step 1
— applying it doesn't need `-var-file` again, but if you `terraform init`
against the *other* environment's backend.hcl in between (switching from
staging to production, say), re-run step 1 first to regenerate `tfplan`
against the right state.

Grab the outputs you'll need for the smoke test:

```bash
terraform output lambda_function_name
terraform output dynamodb_table_name
terraform output s3_bucket_name
```

## 3. Post-deployment smoke test

**Caveat:** `parser/lambda_handler.py`'s `handler` reads
`event["Records"][...]["s3"]["bucket"]["name"]` / `["s3"]["object"]["key"]` —
it's written for the S3 `ObjectCreated` trigger shape, not an arbitrary
payload. Invoking it with `{"source": "cli_smoke_test"}` will return
`{"processed": []}` (no `Records` key, so it no-ops) — that's still a valid
smoke test of "does the function boot, import its dependencies, and return
without erroring," it just won't exercise the parse-and-write path. Use it
first as a cheap health check, then use the S3-upload version below to
actually confirm end-to-end ingestion.

### 3a. Health-check invoke (confirms cold start / imports / IAM role)

```bash
FUNCTION_NAME=$(terraform -chdir=terraform output -raw lambda_function_name)

aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --cli-binary-format raw-in-base64-out \
  --payload '{"source": "cli_smoke_test"}' \
  /tmp/smoke_test_response.json

cat /tmp/smoke_test_response.json   # expect: {"processed": []}
```

### 3b. Real ingestion smoke test (exercises parse + DynamoDB write)

Upload a small known-good DHET-format PDF to the `raw/` prefix — this fires
the real S3 trigger, so no synthetic payload is needed:

```bash
BUCKET_NAME=$(terraform -chdir=terraform output -raw s3_bucket_name)

aws s3 cp path/to/sample_register.pdf "s3://$BUCKET_NAME/raw/smoke_test.pdf"
```

### 3c. Tail logs

```bash
aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow --since 5m
```

Look for the handler completing without a traceback and a `total_written` /
`total_skipped` count in the returned summary (visible in the invoke response
for 3a-style invokes, or in the log stream for the S3-triggered run in 3b).

### 3d. Verify DynamoDB

```bash
TABLE_NAME=$(terraform -chdir=terraform output -raw dynamodb_table_name)

# Scan a few items to confirm records landed (cheap sanity check, not exhaustive)
aws dynamodb scan --table-name "$TABLE_NAME" --max-items 5

# Or look up a specific institution once you know a registration number/name
# from the source PDF, using the same key scheme as parser/dynamo_item.py:
aws dynamodb get-item \
  --table-name "$TABLE_NAME" \
  --key '{"PK": {"S": "INST#<registration_number>"}}'
```

### 3e. Clean up the smoke-test object

The uploaded PDF also triggers `_process_pdf`'s backup write to
`backups/smoke_test.json` in the same bucket — remove both once verified, so
they don't linger as one-off institution rows or confuse a future
`ALL_INSTITUTIONS` diff:

```bash
aws s3 rm "s3://$BUCKET_NAME/raw/smoke_test.pdf"
aws s3 rm "s3://$BUCKET_NAME/backups/smoke_test.json"
```

If step 3b ran, also remove whatever institution records it wrote to
DynamoDB (identify them via the `total_written` count and the source PDF's
contents), unless the sample PDF was a real DHET excerpt you want kept.
