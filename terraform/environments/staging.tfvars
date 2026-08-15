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

environment         = "staging"
project_name        = "eduverify-staging"
dynamodb_table_name = "eduverify-staging-institutions"
s3_bucket_name      = "eduverify-staging-registers"
amplify_branch_name = "staging"
amplify_app_id      = "d1w5n2yybv3bld"
# us-west-1, not the eu-west-1 default: that's the region the app was
# actually created in via the AWS Console (see frontend.tf).
amplify_region       = "us-west-1"
log_retention_days   = 7
tf_state_bucket_name = "eduverify-staging-tfstate-755729228319"
# No staging deploy workflow exists yet (deploy.yml only runs on pushes to
# main) — this just provisions the role in advance for when one does.
github_deploy_refs = ["refs/heads/staging"]
