# Partial backend configuration for the staging environment. Used via:
#   AWS_PROFILE=eduverify-staging terraform init -backend-config=environments/staging.backend.hcl
#
# Lives in the eduverify-staging AWS account (755729228319) — its own state
# bucket and lock table, bootstrapped once via backend_state.tf with local
# state (see docs/DEPLOYMENT.md). Account-level isolation from production
# means the `key` no longer needs an environment segment, but one is kept
# for clarity/history.

bucket         = "eduverify-staging-tfstate-755729228319"
key            = "eduverify/staging/terraform.tfstate"
region         = "af-south-1"
dynamodb_table = "eduverify-tf-locks"
encrypt        = true
