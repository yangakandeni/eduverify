variable "function_name" {
  description = "Name of the ingestion Lambda function."
  type        = string
}

variable "role_arn" {
  description = "ARN of the IAM execution role for the function."
  type        = string
}

variable "source_dir" {
  description = "Path to the /parser directory containing lambda_handler.py and its sibling modules."
  type        = string
}

variable "runtime" {
  description = "Lambda Python runtime."
  type        = string
  default     = "python3.12"
}

variable "architecture" {
  description = "Lambda instruction set architecture (x86_64 or arm64). Must match the platform tag used to build the dependency layer."
  type        = string
  default     = "x86_64"
}

variable "timeout" {
  description = "Function timeout in seconds."
  type        = number
  default     = 120
}

variable "memory_size" {
  description = "Function memory in MB."
  type        = number
  default     = 512
}

variable "environment_variables" {
  description = "Environment variables passed to the function."
  type        = map(string)
  default     = {}
}

variable "log_group_name" {
  description = "CloudWatch Logs log group name for the function, e.g. /aws/lambda/eduverify-ingestion."
  type        = string
}

variable "log_retention_days" {
  description = "Retention period for the function's log group."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to the function, layer, and log group."
  type        = map(string)
  default     = {}
}
