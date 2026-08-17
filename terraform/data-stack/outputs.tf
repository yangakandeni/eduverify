output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  value = module.dynamodb.table_arn
}

output "dynamodb_gsi_arn" {
  value = module.dynamodb.gsi1_arn
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "lambda_function_name" {
  value = module.lambda.function_name
}
