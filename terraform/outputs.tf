output "dynamodb_table_name" {
  description = "Name of the institutions DynamoDB table."
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "ARN of the institutions DynamoDB table."
  value       = module.dynamodb.table_arn
}

output "s3_bucket_name" {
  description = "Name of the registers S3 bucket."
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the registers S3 bucket."
  value       = module.s3.bucket_arn
}

output "lambda_function_name" {
  description = "Name of the ingestion Lambda function."
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the ingestion Lambda function."
  value       = module.lambda.function_arn
}

output "iam_role_arn" {
  description = "ARN of the Lambda execution role."
  value       = module.iam.role_arn
}

output "scraper_schedule_rule_name" {
  description = "Name of the EventBridge rule scheduling the ingestion Lambda."
  value       = aws_cloudwatch_event_rule.weekly_pdf_scraper.name
}

output "scraper_schedule_rule_arn" {
  description = "ARN of the EventBridge rule scheduling the ingestion Lambda."
  value       = aws_cloudwatch_event_rule.weekly_pdf_scraper.arn
}
