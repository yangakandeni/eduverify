# Partial backend configuration for the production environment. Used via:
#   AWS_PROFILE=eduverify-prod terraform init -backend-config=environments/production.backend.hcl
#
# None of these values are secret, so this file is checked into git. Lives in
# the eduverify-prod AWS account (367740899404) — its own state bucket and
# lock table, bootstrapped once via backend_state.tf with local state (see
# docs/DEPLOYMENT.md). Account-level isolation from staging means the `key`
# no longer needs an environment segment, but one is kept for clarity/history.

bucket         = "eduverify-prod-tfstate-367740899404"
key            = "eduverify/production/terraform.tfstate"
region         = "af-south-1"
dynamodb_table = "eduverify-tf-locks"
encrypt        = true
