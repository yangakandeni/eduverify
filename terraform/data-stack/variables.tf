variable "aws_region" {
  type    = string
  default = "af-south-1"
}

variable "environment" {
  type = string
}

variable "project_name" {
  description = "Short project slug used as a prefix for resource names, e.g. \"eduverify-api-staging\"."
  type        = string
}

variable "dynamodb_table_name" {
  type = string
}

variable "s3_bucket_name" {
  type = string
}

variable "lambda_memory_size" {
  description = "See ../variables.tf's lambda_memory_size for why 3008MB — same parser, same PDF, same memory need."
  type        = number
  default     = 3008
}

variable "lambda_timeout" {
  type    = number
  default = 300
}

variable "lambda_architecture" {
  type    = string
  default = "x86_64"
}

variable "tf_state_bucket_name" {
  description = "Globally-unique name for this stack's own Terraform state bucket, bootstrapped by backend_state.tf. Also used as the backend for eduverify-api's own Terraform (different state key) once ingestion is live here — see that repo's environments/staging.backend.hcl."
  type        = string
}

variable "scraper_schedule_expression" {
  type    = string
  default = "cron(0 6 ? * MON *)"
}

variable "log_retention_days" {
  type    = number
  default = 7
}

variable "alert_email" {
  type    = string
  default = ""
}
