variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "af-south-1"
}

variable "amplify_region" {
  description = "AWS region for Amplify Hosting resources. Amplify has no regional endpoint in af-south-1 (var.aws_region), so the frontend deploys into this separate region while data-plane resources stay put."
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Deployment environment name, used in resource tags."
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Short project slug used as a prefix for resource names."
  type        = string
  default     = "eduverify"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table storing institution records."
  type        = string
  default     = "eduverify-institutions"
}

variable "tf_state_bucket_name" {
  description = "Globally-unique name for the S3 bucket storing Terraform remote state. Staging and production deploy into separate AWS accounts, each with its own bucket — set per-environment in environments/<env>.tfvars, matching the `bucket` value in that environment's backend.hcl. This default only applies if neither overrides it."
  type        = string
  default     = "eduverify-tf-state"
}

variable "amplify_app_id" {
  description = "ID of the Amplify Hosting app serving the frontend, created manually through the Console (see frontend.tf and docs/DEPLOYMENT.md for why Terraform doesn't create this itself). Empty until that one-time console setup is done for the environment."
  type        = string
  default     = ""
}

variable "amplify_branch_name" {
  description = "Git branch Amplify Hosting deploys from."
  type        = string
  default     = "main"
}

variable "clerk_publishable_key" {
  description = "Clerk publishable key (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) for the deployed frontend."
  type        = string
  default     = ""
}

variable "clerk_secret_key" {
  description = "Clerk secret key (CLERK_SECRET_KEY) for the deployed frontend. Supply via TF_VAR_clerk_secret_key or a gitignored *.tfvars file — never commit it."
  type        = string
  default     = ""
  sensitive   = true
}

variable "domain_name" {
  description = "Optional custom domain (e.g. app.eduverify.co.za) to serve the Amplify Hosting frontend from. Leave empty to use the default *.amplifyapp.com domain only."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID to create the Amplify domain's certificate-validation and alias records in. Required when domain_name is set."
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository (\"owner/repo\") allowed to assume the CI deploy role via OIDC — see modules/ci_oidc."
  type        = string
  default     = "yangakandeni/eduverify"
}

variable "github_deploy_refs" {
  description = "Git refs whose GitHub Actions runs may assume this environment's CI deploy role, e.g. [\"refs/heads/main\"]. Matched against the OIDC token's sub claim — see modules/ci_oidc."
  type        = list(string)
  default     = ["refs/heads/main"]
}
