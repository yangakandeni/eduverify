# Production environment — deployed into its own AWS account (eduverify-prod,
# 367740899404) via the `eduverify-prod` IAM Identity Center profile, so
# production is fully isolated from staging at the account level, not just by
# resource naming. Apply with:
#   aws sso login --profile eduverify-prod
#   AWS_PROFILE=eduverify-prod terraform init -backend-config=environments/production.backend.hcl
#   AWS_PROFILE=eduverify-prod terraform plan -var-file=environments/production.tfvars
#
# Secrets (clerk_secret_key) are deliberately absent
# here — supply them via TF_VAR_* env vars or a gitignored
# environments/production.secrets.tfvars layered on top with a second
# -var-file flag. See docs/DEPLOYMENT.md.

environment          = "production"
project_name         = "eduverify"
dynamodb_table_name  = "eduverify-institutions"
s3_bucket_name       = "eduverify-registers"
# Unlike staging, this bucket has never existed in the production account —
# this is production's first-ever apply. The import block in main.tf would
# fail with "Cannot import non-existent remote object" otherwise.
import_existing_registers_bucket = false
amplify_branch_name  = "main"
log_retention_days   = 30
tf_state_bucket_name = "eduverify-prod-tfstate-367740899404"
github_deploy_refs   = ["refs/heads/main"]
# deploy.yml's job sets `environment: production`, which changes the OIDC
# token's sub claim to the environment form — see modules/ci_oidc.
github_environment = "production"
