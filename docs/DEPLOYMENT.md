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

### DEV, and the branch → environment flow

There's a third environment, DEV, that isn't AWS infra at all: it's a
developer's own machine running `npm run dev` in `web/`, calling a
locally-running `eduverify-api` dev server (`USE_EXTERNAL_API=true` by
default — see `web/.env.local.example` and `web/CLAUDE.md`'s Environments
section) instead of the bundled local seed data. No AWS credentials are
needed: `eduverify-api`'s dev server runs against DynamoDB Local, not real
AWS. Falling back to the bundled seed data (`USE_EXTERNAL_API=false`) is
still available for offline work. Day-to-day feature work happens here, on a
feature branch.

Both `main` and `staging` are branch-protected (required PR + passing CI,
direct pushes rejected — `enforce_admins` is on, so this applies to the repo
owner too). CI runs automatically on PRs; deploys are manual-only — neither
`deploy.yml` nor `deploy-staging.yml` has a `push` trigger, so merging alone
never deploys anything:

1. Push a feature branch — this does **not** trigger CI (`.github/workflows/test.yml`
   only runs on `pull_request`, not `push`), so pushing for backup/safety
   mid-work is free.
2. Open a PR into `staging`. CI (parser pytest + terraform validate) must
   pass before it can merge.
3. Merge, then manually run `deploy-staging.yml` from the Actions tab
   (`workflow_dispatch`) to deploy into the staging AWS account and the
   `eduverify-staging-web` Amplify app.
4. Verify on staging, then open a PR from `staging` into `main`.
5. Merge, then manually run `deploy.yml` from the Actions tab
   (`workflow_dispatch`) to deploy into production and `eduverify-web`.

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

Secrets (`clerk_secret_key`) are deliberately absent from the committed
`environments/*.tfvars` files. Supply them either via `TF_VAR_clerk_secret_key`
env vars, or a gitignored `environments/<env>.secrets.tfvars` —
`verify_deployment.sh` picks it up automatically if present (layered on top
with a second `-var-file`).

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
4. `scripts/build_lambda_layer.sh` cross-compiles `parser/requirements-lambda.txt`
   into `terraform/modules/lambda/build/layer` — must run before `plan`, since
   `data.archive_file.layer` reads that directory during the refresh below
   and can't populate it itself on a fresh checkout (see that script's header
   comment for why this isn't a Terraform-internal step).
5. `terraform init -backend-config=environments/<env>.backend.hcl` +
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

**Gotcha — CI can't self-modify its own deploy policy:** if a CI/CD apply
fails with `AccessDenied ... iam:DeletePolicyVersion ... on resource:
policy/eduverify-<env>-github-actions-deploy-policy`, that's not a missing
permission to add. `aws_iam_policy.deploy_permissions` in
`terraform/modules/ci_oidc/main.tf` is the policy attached to the very role
running the apply, and each edit to its document (a new `s3:...`/`iam:...`
action, say) forces IAM to create a new policy version — pruning an old one
once the 5-version cap is hit. The CI role is deliberately **not** granted
`iam:CreatePolicyVersion`/`iam:DeletePolicyVersion` on its own policy ARN
(see the `self_policy_arns` / `RefreshOwnCiInfra` comments in that file):
granting write access to a policy already attached to yourself is a
textbook privilege-escalation path (rewrite the policy, set the new version
as default, now the role has whatever permissions it just gave itself).

Apply changes to `module.ci_oidc` out-of-band with an admin identity instead
of through CI, the same way the state-bucket bootstrap above does:

```bash
cd terraform
aws sso login --profile eduverify-staging   # or eduverify-prod
AWS_PROFILE=eduverify-staging terraform init -backend-config=environments/staging.backend.hcl
AWS_PROFILE=eduverify-staging terraform apply -var-file=environments/staging.tfvars -target=module.ci_oidc
```

Once that's applied, CI can resume applying everything else it already has
permission for. This will recur on every future edit to the CI role's own
policy documents — that's the accepted tradeoff of not granting self-write.

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

## 4. Cutting production over to `USE_EXTERNAL_API`

Production currently reads DynamoDB/local data directly (`USE_EXTERNAL_API`
unset/`false` on the `main` Amplify branch); staging runs the `eduverify-api`
path (`USE_EXTERNAL_API=true`). Do not flip production until all of the
following are true — flipping it is a live, user-facing change with no local
fallback on the API path (`web/lib/institutions.ts`'s doc comments: "an API
outage is a real, user-visible outage").

1. `web/lib/collections.ts`, `HeroShowcase`, and `BrowseSection` have test
   coverage confirming they degrade correctly when `isSponsored`/`isFeatured`/
   `isRecentlyAdded` are absent (they are, on both paths, today — see
   `web/lib/collections.test.ts`'s "against an eduverify-api-shaped response"
   case).
2. Run the parity check from `web/` against **staging** values for
   `EDUVERIFY_API_BASE_URL`/`EDUVERIFY_API_KEY` in `.env.local`:
   ```bash
   npx tsx scripts/parityCheck.ts
   ```
   Confirm a clean `PASSED` — this now also compares `getAllInstitutions()`
   (the call `page.tsx`/the homepage hero/browse grid depend on) and does
   field-level diffs on search results, not just id-set presence.
3. Flip the `USE_EXTERNAL_API` environment variable on the **production**
   Amplify branch (Amplify Console → App → Hosting environments → the `main`
   branch's environment variables — this is app-runtime config, not
   Terraform-managed) to `true`, and redeploy that branch.
4. Monitor real traffic (error rates, `apiClient.ts`'s `ApiError` occurrences
   in logs, the homepage hero/browse rendering) for a period before
   considering this done.
5. **Rollback**: flip `USE_EXTERNAL_API` back to `false` (or unset) on the
   `main` branch and redeploy if anything looks wrong — the legacy
   DynamoDB/local path is untouched and still fully functional.
