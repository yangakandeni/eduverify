output "dynamodb_table_name" {
  description = "Name of the institutions DynamoDB table."
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the institutions DynamoDB table."
  value       = module.dynamodb.table_arn
}

output "tf_state_bucket_name" {
  description = "Name of the S3 bucket storing Terraform remote state."
  value       = aws_s3_bucket.tf_state.bucket
}

output "tf_locks_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking."
  value       = aws_dynamodb_table.tf_locks.name
}

output "amplify_default_domain" {
  description = "Default (*.amplifyapp.com) URL Amplify Hosting assigns the branch, e.g. https://staging.<app_id>.amplifyapp.com. Amplify's default domain always follows this pattern, so it's derived from var.amplify_app_id rather than read from a managed resource — see frontend.tf for why the app itself isn't Terraform-managed."
  value       = "https://${var.amplify_branch_name}.${var.amplify_app_id}.amplifyapp.com"
}

output "amplify_ssr_compute_role_arn" {
  description = "ARN of the SSR compute role. Attach this manually as the Amplify app's Compute role via the Console (App settings > IAM roles) — see docs/DEPLOYMENT.md."
  value       = aws_iam_role.amplify_ssr_compute.arn
}

output "github_actions_deploy_role_arn" {
  description = "ARN of the role GitHub Actions assumes via OIDC to deploy this environment. Set as the AWS_ROLE_ARN secret on the GitHub repo (per-environment via a GitHub Environment if staging gets its own deploy workflow later)."
  value       = module.ci_oidc.role_arn
}
