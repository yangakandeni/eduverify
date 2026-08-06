# Production environment. Apply with:
#   terraform init -backend-config=environments/production.backend.hcl
#   terraform plan -var-file=environments/production.tfvars
#
# Secrets (clerk_secret_key, github_access_token) are deliberately absent
# here — supply them via TF_VAR_* env vars or a gitignored
# environments/production.secrets.tfvars layered on top with a second
# -var-file flag. See docs/DEPLOYMENT.md.

environment         = "production"
project_name        = "eduverify"
dynamodb_table_name = "eduverify-institutions"
s3_bucket_name      = "eduverify-registers"
amplify_branch_name = "main"
log_retention_days  = 30
