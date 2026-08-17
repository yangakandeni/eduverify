# Ingestion + data stack — S3 (raw PDFs/backups), DynamoDB (institutions table), the parser
# Lambda, and its S3 trigger, deployed into a NEW eduverify-api-* account rather than the
# original eduverify-staging/prod accounts. Deliberately a SEPARATE Terraform root from
# ../main.tf (which still owns the original accounts' full stack, frontend included) rather
# than adding conditionals to that live, working config — this reuses the SAME underlying
# modules (../modules/s3, dynamodb, iam, lambda) so there's no code duplication, just a
# leaner root that omits everything frontend/Amplify-specific (frontend.tf's amplify_ssr_compute
# role has no reason to exist in an account with no Amplify app).
#
# Once this is live and eduverify-api's own serving Lambda reads from it, the original
# accounts' copies of these same resources (module.s3/dynamodb/iam/lambda in ../main.tf) become
# safe to tear down — a separate, deliberate step, not bundled into standing this up.

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

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

locals {
  lambda_function_name = "${var.project_name}-ingestion"
  log_group_name       = "/aws/lambda/${local.lambda_function_name}"

  common_tags = {
    Project     = "EduVerify-API"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Stack       = "data"
  }
}

module "dynamodb" {
  source = "../modules/dynamodb"

  table_name = var.dynamodb_table_name
  tags       = local.common_tags
}

module "s3" {
  source = "../modules/s3"

  bucket_name = var.s3_bucket_name
  tags        = local.common_tags
}

module "iam" {
  source = "../modules/iam"

  role_name          = "${var.project_name}-lambda-exec-role"
  s3_bucket_arn      = module.s3.bucket_arn
  dynamodb_table_arn = module.dynamodb.table_arn
  dynamodb_gsi_arn   = module.dynamodb.gsi1_arn
  log_group_name     = local.log_group_name
  tags               = local.common_tags
}

module "lambda" {
  source = "../modules/lambda"

  function_name      = local.lambda_function_name
  role_arn           = module.iam.role_arn
  source_dir         = "${path.module}/../../parser"
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
