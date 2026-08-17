# Deploys into the eduverify-api-prod AWS account (924285051814) — mirrors api-staging.tfvars
# exactly, different account/names.
# Apply with:
#   aws sso login --profile eduverify-api-prod
#   AWS_PROFILE=eduverify-api-prod terraform init -backend-config=environments/api-prod.backend.hcl
#   AWS_PROFILE=eduverify-api-prod terraform plan -var-file=environments/api-prod.tfvars
#
# First-ever apply into this account needs backend_state.tf bootstrapped with LOCAL state
# first — see api-staging.tfvars's comment for the exact sequence; identical here.

environment          = "production"
project_name         = "eduverify-api-prod"
dynamodb_table_name  = "eduverify-api-prod-institutions"
s3_bucket_name       = "eduverify-api-prod-registers"
tf_state_bucket_name = "eduverify-api-prod-tfstate-924285051814"
log_retention_days   = 30
