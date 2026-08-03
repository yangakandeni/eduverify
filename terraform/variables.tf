variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "af-south-1"
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

variable "s3_bucket_name" {
  description = "Globally-unique name for the registers bucket (S3 bucket names are unique across all of AWS, so the default will need overriding)."
  type        = string
  default     = "eduverify-registers"
}

variable "lambda_memory_size" {
  description = "Memory (MB) allocated to the ingestion Lambda."
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout (seconds) for the ingestion Lambda."
  type        = number
  default     = 120
}

variable "lambda_architecture" {
  description = "Instruction set architecture for the ingestion Lambda (x86_64 or arm64)."
  type        = string
  default     = "x86_64"
}

variable "tf_state_bucket_name" {
  description = "Globally-unique name for the S3 bucket storing Terraform remote state (S3 bucket names are unique across all of AWS, so the default will need overriding). Must match the `bucket` value in backend.hcl."
  type        = string
  default     = "eduverify-tf-state"
}

variable "scraper_schedule_expression" {
  description = "EventBridge schedule expression controlling how often the ingestion Lambda runs to fetch and parse the latest DHET register PDF."
  type        = string
  default     = "cron(0 6 ? * MON *)"
}

variable "log_retention_days" {
  description = "Retention period (days) for the ingestion Lambda's CloudWatch log group."
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address to subscribe to the eduverify-alerts SNS topic for CloudWatch alarm notifications. Leave empty to skip creating a subscription."
  type        = string
  default     = ""
}
