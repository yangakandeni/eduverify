#!/usr/bin/env bash
# Pre-flight checks + Terraform plan for an EduVerify deployment.
# Usage: ./scripts/verify_deployment.sh [staging|production]  (default: production)
# See docs/DEPLOYMENT.md for the full runbook, including the post-deploy smoke test
# (Lambda invoke + log tail + DynamoDB read), which is interactive/manual by design.
set -euo pipefail

ENVIRONMENT="${1:-production}"
case "$ENVIRONMENT" in
  staging|production) ;;
  *) echo "usage: $0 [staging|production]" >&2; exit 1 ;;
esac

# Staging and production are separate AWS accounts (see docs/DEPLOYMENT.md),
# reached via distinct IAM Identity Center SSO profiles. An AWS_PROFILE the
# caller already set (e.g. a future CI job using an OIDC role instead of a
# named profile) takes precedence over this default mapping.
case "$ENVIRONMENT" in
  staging)    default_profile="eduverify-staging"; expected_account="755729228319" ;;
  production) default_profile="eduverify-prod";    expected_account="367740899404" ;;
esac
export AWS_PROFILE="${AWS_PROFILE:-$default_profile}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO_ROOT="$(pwd)"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
step() { printf '\n\033[1m%s\033[0m\n' "$1"; }

step "0. Environment"
pass "target environment: $ENVIRONMENT"
pass "AWS profile: $AWS_PROFILE"

step "1. AWS credentials"
if identity=$(aws sts get-caller-identity --output json 2>&1); then
  account=$(printf '%s' "$identity" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Account"])')
  arn=$(printf '%s' "$identity" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Arn"])')
  pass "authenticated as $arn (account $account)"
else
  fail "aws sts get-caller-identity failed: $identity (run 'aws sso login --profile $AWS_PROFILE'?)"
fi

if [[ "$account" != "$expected_account" ]]; then
  fail "authenticated into account $account, but '$ENVIRONMENT' must deploy into account $expected_account — refusing to continue (wrong profile/account would risk one environment's config landing in the other's account)"
fi
pass "account matches expected '$ENVIRONMENT' account: $expected_account"

step "2. Terraform backend config"
BACKEND_HCL="$REPO_ROOT/terraform/environments/$ENVIRONMENT.backend.hcl"
[[ -f "$BACKEND_HCL" ]] || fail "$BACKEND_HCL not found"

bucket_in_hcl=$(grep -E '^[[:space:]]*bucket[[:space:]]*=' "$BACKEND_HCL" | sed -E 's/^[[:space:]]*bucket[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
[[ -n "$bucket_in_hcl" ]] || fail "could not parse 'bucket' out of backend.hcl"
pass "backend.hcl targets bucket: $bucket_in_hcl"

if aws s3api head-bucket --bucket "$bucket_in_hcl" >/dev/null 2>&1; then
  pass "state bucket exists and is reachable: $bucket_in_hcl"
else
  fail "state bucket '$bucket_in_hcl' is not reachable with current credentials — run the backend_state.tf bootstrap first (see docs/DEPLOYMENT.md)"
fi

step "3. Parser test suite"
if [[ -d "$REPO_ROOT/parser/.venv" ]]; then
  # `python -m pytest` (not the bare `pytest` console script) so cwd is on
  # sys.path — required for tests' flat imports (`from build import ...`).
  (cd "$REPO_ROOT/parser" && source .venv/bin/activate && python -m pytest -q) \
    && pass "pytest passed" || fail "pytest failed"
else
  fail "parser/.venv not found — create it and 'pip install -r requirements.txt' first"
fi

step "4. Terraform init + plan"
(
  cd "$REPO_ROOT/terraform"
  VAR_FILE_ARGS=(-var-file="environments/$ENVIRONMENT.tfvars")
  SECRETS_FILE="environments/$ENVIRONMENT.secrets.tfvars"
  [[ -f "$SECRETS_FILE" ]] && VAR_FILE_ARGS+=(-var-file="$SECRETS_FILE")

  # -reconfigure: switching between staging/production backend.hcl files points
  # at a different state key entirely (not a migration), so skip the
  # copy-existing-state-to-new-backend prompt terraform would otherwise show.
  terraform init -backend-config="environments/$ENVIRONMENT.backend.hcl" -reconfigure -input=false
  terraform plan -input=false "${VAR_FILE_ARGS[@]}" -out=tfplan
)
pass "plan written to terraform/tfplan"

echo
echo "Pre-flight complete ($ENVIRONMENT). Review terraform/tfplan, then:"
echo "  cd terraform && terraform apply tfplan"
echo
echo "After apply, continue with the smoke test in docs/DEPLOYMENT.md."
