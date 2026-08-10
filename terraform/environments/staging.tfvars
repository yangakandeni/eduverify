# Staging environment — deployed into its own AWS account (eduverify-staging,
# 755729228319) via the `eduverify-staging` IAM Identity Center profile, so
# staging is fully isolated from production at the account level, not just by
# resource naming. Apply with:
#   aws sso login --profile eduverify-staging
#   AWS_PROFILE=eduverify-staging terraform init -backend-config=environments/staging.backend.hcl
#   AWS_PROFILE=eduverify-staging terraform plan -var-file=environments/staging.tfvars
#
# Secrets are deliberately absent here — supply them via TF_VAR_* env vars
# or a gitignored environments/staging.secrets.tfvars layered on top with a
# second -var-file flag. See docs/DEPLOYMENT.md.

environment          = "staging"
project_name         = "eduverify-staging"
dynamodb_table_name  = "eduverify-staging-institutions"
s3_bucket_name       = "eduverify-staging-registers"
amplify_branch_name  = "staging"
log_retention_days   = 7
tf_state_bucket_name = "eduverify-staging-tfstate-755729228319"
