output "function_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.ingestion.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function."
  value       = aws_lambda_function.ingestion.arn
}

output "invoke_arn" {
  description = "Invoke ARN, used when wiring API Gateway or other event sources."
  value       = aws_lambda_function.ingestion.invoke_arn
}
