#!/usr/bin/env bash
# Pre-flight checks + Terraform plan for an EduVerify production deployment.
# See docs/DEPLOYMENT.md for the full runbook, including the post-deploy smoke test
# (Lambda invoke + log tail + DynamoDB read), which is interactive/manual by design.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO_ROOT="$(pwd)"

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; exit 1; }
step() { printf '\n\033[1m%s\033[0m\n' "$1"; }

step "1. AWS credentials"
if identity=$(aws sts get-caller-identity --output json 2>&1); then
  account=$(printf '%s' "$identity" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Account"])')
  arn=$(printf '%s' "$identity" | python3 -c 'import json,sys; print(json.load(sys.stdin)["Arn"])')
  pass "authenticated as $arn (account $account)"
else
  fail "aws sts get-caller-identity failed: $identity"
fi

step "2. Terraform backend config"
BACKEND_HCL="$REPO_ROOT/terraform/backend.hcl"
[[ -f "$BACKEND_HCL" ]] || fail "$BACKEND_HCL not found"

bucket_in_hcl=$(grep -E '^[[:space:]]*bucket[[:space:]]*=' "$BACKEND_HCL" | sed -E 's/^[[:space:]]*bucket[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')
bucket_default=$(grep -A5 'variable "tf_state_bucket_name"' "$REPO_ROOT/terraform/variables.tf" | grep -E '^[[:space:]]*default[[:space:]]*=' | sed -E 's/^[[:space:]]*default[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')

[[ -n "$bucket_in_hcl" ]] || fail "could not parse 'bucket' out of backend.hcl"
pass "backend.hcl targets bucket: $bucket_in_hcl"

if [[ "$bucket_in_hcl" != "$bucket_default" ]]; then
  echo "  note: backend.hcl bucket ($bucket_in_hcl) differs from variables.tf's tf_state_bucket_name default ($bucket_default)."
  echo "        confirm this is intentional (default may have been overridden for collision avoidance)."
fi

if aws s3api head-bucket --bucket "$bucket_in_hcl" >/dev/null 2>&1; then
  pass "state bucket exists and is reachable: $bucket_in_hcl"
else
  fail "state bucket '$bucket_in_hcl' is not reachable with current credentials — run the backend_state.tf bootstrap first (see docs/DEPLOYMENT.md)"
fi

step "3. Parser test suite"
if [[ -d "$REPO_ROOT/parser/.venv" ]]; then
  (cd "$REPO_ROOT/parser" && source .venv/bin/activate && pytest -q) \
    && pass "pytest passed" || fail "pytest failed"
else
  fail "parser/.venv not found — create it and 'pip install -r requirements.txt' first"
fi

step "4. Terraform init + plan"
(
  cd "$REPO_ROOT/terraform"
  terraform init -backend-config=backend.hcl -input=false
  terraform plan -input=false -out=tfplan
)
pass "plan written to terraform/tfplan"

echo
echo "Pre-flight complete. Review terraform/tfplan, then:"
echo "  cd terraform && terraform apply tfplan"
echo
echo "After apply, continue with the smoke test in docs/DEPLOYMENT.md."
