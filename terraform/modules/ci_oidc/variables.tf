variable "project_name" {
  description = "Short project slug used to scope this role's permissions to only the resources this stack creates (e.g. \"eduverify\", \"eduverify-staging\")."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository allowed to assume this role, as \"owner/repo\"."
  type        = string
}

variable "github_deploy_refs" {
  description = "Git refs (e.g. \"refs/heads/main\") whose GitHub Actions runs may assume this role. A push or workflow_dispatch run's OIDC token `sub` claim is repo:<owner>/<repo>:ref:<ref>, matched against these. Only applies to jobs that do NOT set `environment:` — see github_environment."
  type        = list(string)
}

variable "github_environment" {
  description = "GitHub Environment name (e.g. \"staging\") that the deploying job declares via `environment:`. When a job sets that key, GitHub issues the OIDC token with sub claim repo:<owner>/<repo>:environment:<name> instead of the ref:<ref> form github_deploy_refs matches — so this must be set for any workflow that uses an `environment:` block, or AssumeRoleWithWebIdentity is denied even though github_deploy_refs looks correct. Empty skips adding this condition."
  type        = string
  default     = ""
}

variable "tf_state_bucket_name" {
  description = "Name of the S3 bucket holding this environment's Terraform remote state, so the CI role can read/write state objects."
  type        = string
}

variable "tf_lock_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking."
  type        = string
}

variable "amplify_app_id" {
  description = "ID of the pre-created Amplify Hosting app this stack's CI role manages domain associations for. Empty skips granting Amplify permissions."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to the IAM role."
  type        = map(string)
  default     = {}
}
