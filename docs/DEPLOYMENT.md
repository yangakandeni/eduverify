# Deployment Runbook

Manual verification steps for deploying EduVerify's infra (`terraform/`).
Pre-flight checks and the `terraform plan` step are automated by
[`scripts/verify_deployment.sh`](../scripts/verify_deployment.sh); this doc
covers that script plus the interactive apply/smoke-test steps that follow it.

## Environments

Staging and production are **fully separate AWS accounts** under the
`eduverify` AWS Organization — not just separate resource namespaces in one
account. This gives real blast-radius isolation: a runaway `terraform apply`
or an over-broad IAM policy in one environment cannot touch the other.

| | Production | Staging |
|---|---|---|
| AWS account ID | `367740899404` | `755729228319` |
| SSO profile (`~/.aws/config`) | `eduverify-prod` | `eduverify-staging` |
| Terraform state bucket | `eduverify-prod-tfstate-367740899404` | `eduverify-staging-tfstate-755729228319` |
| Lambda function | `eduverify-ingestion` | `eduverify-staging-ingestion` |
| Lambda log group | `/aws/lambda/eduverify-ingestion` | `/aws/lambda/eduverify-staging-ingestion` |
| DynamoDB table | `eduverify-institutions` | `eduverify-staging-institutions` |
| S3 register bucket | `eduverify-registers` | `eduverify-staging-registers` |
| Amplify app | `eduverify-web` | `eduverify-staging-web` |
| Amplify branch | `main` | `staging` |
| Region | `af-south-1` | `af-south-1` |

They're configured via `terraform/environments/<env>.{backend,tfvars}` and
selected with a `terraform init -backend-config=...` / `-var-file=...` pair,
or by passing the env name as `scripts/verify_deployment.sh`'s one argument
(which also picks the matching SSO profile — see below). Everything else
(Lambda function name, IAM role, log group, Amplify app, SNS alerts) derives
from `project_name`, which each environment's tfvars sets to a distinct
value (`eduverify` / `eduverify-staging`) — that naming split is now a
belt-and-suspenders convenience, not the isolation mechanism.

### Credentials: IAM Identity Center (SSO)

Both accounts are reached through IAM Identity Center — no long-lived IAM
access keys. Add these profiles once to `~/.aws/config` (machine-local, not
versioned):

```ini
[sso-session eduverify]
sso_start_url = https://identitycenter.amazonaws.com/ssoins-72232864a7bbe269
sso_region = us-east-1
sso_registration_scopes = sso:account:access

[profile eduverify-staging]
sso_session = eduverify
sso_account_id = 755729228319
sso_role_name = DelegatedAdminAccess
region = af-south-1
output = json

[profile eduverify-prod]
sso_session = eduverify
sso_account_id = 367740899404
sso_role_name = DelegatedAdminAccess
region = af-south-1
output = json
```

Log in (opens a browser to approve; the session is shared, so one login
covers both profiles):

```bash
aws sso login --profile eduverify-staging
```

`scripts/verify_deployment.sh <env>` exports `AWS_PROFILE` to the matching
profile automatically (`staging` → `eduverify-staging`, `production` →
`eduverify-prod`) unless the caller already set `AWS_PROFILE` — e.g. a future
CI job authenticating via an OIDC role instead of a named profile. It also
hard-fails if the authenticated account doesn't match the target
environment's expected account ID, so a stale/wrong profile can't
accidentally apply staging config into prod or vice versa.

**New-account gotcha — opt-in region:** `af-south-1` is an AWS opt-in region,
and member accounts created under AWS Organizations do **not** inherit
opt-in-region enablement from the management account. A brand-new account
will fail every AWS call in `af-south-1` (including `terraform plan`) with
`InvalidClientTokenId` until the region is explicitly enabled:

```bash
aws account enable-region --region-name af-south-1 --profile eduverify-staging --region us-east-1
# poll until ENABLED (takes a few minutes):
aws account get-region-opt-status --region-name af-south-1 --profile eduverify-staging --region us-east-1
```

(Use `--region us-east-1` for the `account` API calls themselves — they're a
global/partition-level service — even though the region being *enabled* is
`af-south-1`.) Do this once per account before anything else in this doc.

Deploying staging for the first time also needs a `staging` branch to exist
in the GitHub repo (Amplify's `aws_amplify_branch` resource points at it by
name — it doesn't create the branch itself).

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
1. `aws sts get-caller-identity` succeeds, and the authenticated account
   matches the target environment's expected account ID (see the table
   above) — hard-fails on mismatch rather than risking a cross-account apply.
2. `terraform/environments/<env>.backend.hcl`'s `bucket` is parseable and
   actually reachable.
3. `pytest` passes in `parser/` (regex extraction, Pydantic model validation,
   bogus-institution filtering — all fully local, no AWS calls).
4. `terraform init -backend-config=environments/<env>.backend.hcl` +
   `terraform plan -var-file=environments/<env>.tfvars -out=tfplan`.

If the state bucket / lock table don't exist yet (first-ever deploy of a
given account), bootstrap them first. Each account owns its **own** state
bucket/lock table (`terraform/backend_state.tf`, parameterized by each
environment's `tf_state_bucket_name`) — there's a chicken-and-egg problem
since the S3 backend can't point at a bucket that doesn't exist yet, so this
has to be applied once with a **local** backend, then migrated in:

```bash
cd terraform
aws sso login --profile eduverify-staging   # or eduverify-prod

# Temporarily comment out `backend "s3" {}` in main.tf — an empty backend
# block still requires bucket/key/region even with -backend=false, so this
# is the reliable way to get a genuinely local backend for the bootstrap.
AWS_PROFILE=eduverify-staging terraform init -input=false

AWS_PROFILE=eduverify-staging terraform plan -input=false \
  -var-file=environments/staging.tfvars \
  -target=aws_s3_bucket.tf_state \
  -target=aws_s3_bucket_versioning.tf_state \
  -target=aws_s3_bucket_server_side_encryption_configuration.tf_state \
  -target=aws_s3_bucket_public_access_block.tf_state \
  -target=aws_s3_bucket_ownership_controls.tf_state \
  -target=aws_dynamodb_table.tf_locks \
  -out=bootstrap.tfplan
AWS_PROFILE=eduverify-staging terraform apply -input=false bootstrap.tfplan
rm -f bootstrap.tfplan

# Restore the `backend "s3" {}` block, then migrate the local bootstrap
# state into it:
AWS_PROFILE=eduverify-staging terraform init -backend-config=environments/staging.backend.hcl -migrate-state
# (answer "yes" to "copy existing state to the new backend?")
```

Repeat with the `eduverify-prod` profile and `environments/production.*` for
the production account, once you're ready to bootstrap it too.

**Opt-in region gotcha, second form:** even after `af-south-1` is enabled on
the account (see above), some SSO/federation credential sources mint tokens
against the **global** STS endpoint by default, which AWS also rejects for
opt-in regions — every AWS call (including `terraform plan`) fails with
`InvalidClientTokenId`, while the same credentials work fine against another
region. Confirm with:

```bash
aws sts get-caller-identity --region af-south-1   # fails with InvalidClientTokenId if hitting this
```

Fix by getting a token issued via the regional STS endpoint for `af-south-1`
(e.g. `sts_regional_endpoints = regional` in `~/.aws/config`, or
re-authenticate through whatever regional-aware flow your credential source
supports) — this is a credential-sourcing issue, not a Terraform or
account-permissions one.

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
