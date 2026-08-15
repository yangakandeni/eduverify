variable "project_name" {
  description = "Short project slug used to scope this role's permissions to only the resources this stack creates (e.g. \"eduverify\", \"eduverify-staging\")."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository allowed to assume this role, as \"owner/repo\"."
  type        = string
}

variable "github_deploy_refs" {
  description = "Git refs (e.g. \"refs/heads/main\") whose GitHub Actions runs may assume this role. A push or workflow_dispatch run's OIDC token `sub` claim is repo:<owner>/<repo>:ref:<ref>, matched against these."
  type        = list(string)
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
