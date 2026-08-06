# Staging environment — a fully separate stack (own DynamoDB table, S3
# bucket, Lambda, IAM role, Amplify app) from production, so staging data
# and deploys never touch prod. Apply with:
#   terraform init -backend-config=environments/staging.backend.hcl
#   terraform plan -var-file=environments/staging.tfvars
#
# Every name below is namespaced off project_name ("eduverify-staging") so
# nothing collides with the production stack in the same AWS account.
#
# Secrets are deliberately absent here — supply them via TF_VAR_* env vars
# or a gitignored environments/staging.secrets.tfvars layered on top with a
# second -var-file flag. See docs/DEPLOYMENT.md.

environment         = "staging"
project_name        = "eduverify-staging"
dynamodb_table_name = "eduverify-staging-institutions"
s3_bucket_name      = "eduverify-staging-registers"
amplify_branch_name = "staging"
log_retention_days  = 7
