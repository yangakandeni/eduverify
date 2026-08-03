# Deployment Runbook

Manual verification steps for a production deploy of EduVerify's infra
(`terraform/`). Pre-flight checks and the `terraform plan` step are
automated by [`scripts/verify_deployment.sh`](../scripts/verify_deployment.sh);
this doc covers that script plus the interactive apply/smoke-test steps that
follow it.

Resource names below come from `terraform/variables.tf` / `terraform/main.tf`
defaults for `environment = "production"`. If your `terraform.tfvars`
overrides `project_name`, `dynamodb_table_name`, etc., substitute your
actual values (`terraform output` after apply is the source of truth).

| Resource | Default name |
|---|---|
| Lambda function | `eduverify-ingestion` |
| Lambda log group | `/aws/lambda/eduverify-ingestion` |
| DynamoDB table | `eduverify-institutions` |
| S3 register bucket | `eduverify-registers` |
| Region | `af-south-1` |

## 1. Pre-flight

```bash
./scripts/verify_deployment.sh
```

This checks, in order:
1. `aws sts get-caller-identity` succeeds (valid credentials, and prints the
   identity/account you're about to deploy as — confirm it's the intended one).
2. `terraform/backend.hcl`'s `bucket` matches `variables.tf`'s
   `tf_state_bucket_name` default (or flags the divergence for you to confirm
   is intentional) and that the bucket is actually reachable.
3. `pytest` passes in `parser/` (regex extraction, Pydantic model validation,
   bogus-institution filtering — all fully local, no AWS calls).
4. `terraform init -backend-config=backend.hcl` + `terraform plan -out=tfplan`.

If the state bucket / lock table don't exist yet (first-ever deploy), bootstrap
them first — `terraform/backend_state.tf` provisions both, but has to be
applied with **local** state before `main.tf`'s `backend "s3" {}` can point at
it:

```bash
cd terraform
terraform init                                    # local state, no -backend-config
terraform apply -target=aws_s3_bucket.tf_state \
                 -target=aws_s3_bucket_versioning.tf_state \
                 -target=aws_s3_bucket_server_side_encryption_configuration.tf_state \
                 -target=aws_s3_bucket_public_access_block.tf_state \
                 -target=aws_s3_bucket_ownership_controls.tf_state \
                 -target=aws_dynamodb_table.tf_locks
terraform init -backend-config=backend.hcl -migrate-state  # move local state into the new S3 backend
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
