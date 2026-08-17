# Deploys into the eduverify-api-staging AWS account (228615802615) — a brand-new account,
# not yet holding any live data, so this is the target for the ingestion+data migration.
# Apply with:
#   aws sso login --profile eduverify-api-staging
#   AWS_PROFILE=eduverify-api-staging terraform init -backend-config=environments/api-staging.backend.hcl
#   AWS_PROFILE=eduverify-api-staging terraform plan -var-file=environments/api-staging.tfvars
#
# First-ever apply into this account needs backend_state.tf bootstrapped with LOCAL state
# first (the bucket/table it creates don't exist yet) — see ../../docs/DEPLOYMENT.md's
# bootstrap steps for the pattern; identical here, just this account/bucket name.

environment           = "staging"
project_name          = "eduverify-api-staging"
dynamodb_table_name   = "eduverify-api-staging-institutions"
s3_bucket_name        = "eduverify-api-staging-registers"
tf_state_bucket_name  = "eduverify-api-staging-tfstate-228615802615"
log_retention_days    = 7
