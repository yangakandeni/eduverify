terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # Values supplied via partial configuration - see backend.hcl and the
  # `terraform init -backend-config=backend.hcl` step in the runbook.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

locals {
  lambda_function_name = "${var.project_name}-ingestion"
  log_group_name       = "/aws/lambda/${local.lambda_function_name}"

  common_tags = {
    Project     = "EduVerify"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

module "dynamodb" {
  source = "./modules/dynamodb"

  table_name = var.dynamodb_table_name
  tags       = local.common_tags
}

module "s3" {
  source = "./modules/s3"

  bucket_name = var.s3_bucket_name
  tags        = local.common_tags
}

module "iam" {
  source = "./modules/iam"

  role_name          = "${var.project_name}-lambda-exec-role"
  s3_bucket_arn      = module.s3.bucket_arn
  dynamodb_table_arn = module.dynamodb.table_arn
  dynamodb_gsi_arn   = module.dynamodb.gsi1_arn
  log_group_name     = local.log_group_name
  tags               = local.common_tags
}

module "lambda" {
  source = "./modules/lambda"

  function_name      = local.lambda_function_name
  role_arn           = module.iam.role_arn
  source_dir         = "${path.module}/../parser"
  requirements_file  = "${path.module}/../parser/requirements-lambda.txt"
  architecture       = var.lambda_architecture
  memory_size        = var.lambda_memory_size
  timeout            = var.lambda_timeout
  log_group_name     = local.log_group_name
  log_retention_days = var.log_retention_days
  tags               = local.common_tags

  environment_variables = {
    DYNAMODB_TABLE = module.dynamodb.table_name
    BACKUP_PREFIX  = "backups/"
  }
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = module.s3.bucket_arn
}

resource "aws_s3_bucket_notification" "raw_register_upload" {
  bucket = module.s3.bucket_id

  lambda_function {
    lambda_function_arn = module.lambda.function_arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "raw/"
    filter_suffix       = ".pdf"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
