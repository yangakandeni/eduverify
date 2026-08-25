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
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # Values supplied via partial configuration - see environments/*.backend.hcl
  # and the `terraform init -backend-config=environments/<env>.backend.hcl`
  # step in the runbook. One per environment/account, so staging and
  # production never share state.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# AWS Amplify Hosting has no regional endpoint in af-south-1 (confirmed via a
# failed apply: "dial tcp: lookup amplify.af-south-1.amazonaws.com: no such
# host") — it's simply not offered in that region. Everything data-plane
# (DynamoDB, S3, Lambda) stays in af-south-1 for in-country residency/
# latency; only the Amplify resources in frontend.tf use this alias.
provider "aws" {
  alias  = "amplify"
  region = var.amplify_region
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

# The staging registers bucket already existed in AWS (BucketAlreadyOwnedByYou
# on create) but wasn't tracked in the staging state file, so `terraform
# apply` kept trying to create it and failing with a 409. This block is a
# no-op once a given environment's bucket is already in state, so it's safe
# to leave in place across environments/re-applies — but it's NOT a no-op on
# an environment's first-ever apply if the bucket doesn't exist yet: the
# provider can't tell "denied" from "doesn't exist" here (same ambiguity as
# the s3:GetReplicationConfiguration gap below), so the import just fails
# with "Cannot import non-existent remote object" and blocks the whole apply.
# Gated per-environment via import_existing_registers_bucket for that reason.
import {
  for_each = var.import_existing_registers_bucket ? [1] : []
  to       = module.s3.aws_s3_bucket.registers
  id       = var.s3_bucket_name
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

module "ci_oidc" {
  source = "./modules/ci_oidc"

  project_name         = var.project_name
  github_repo          = var.github_repo
  github_deploy_refs   = var.github_deploy_refs
  github_environment   = var.github_environment
  tf_state_bucket_name = var.tf_state_bucket_name
  tf_lock_table_name   = aws_dynamodb_table.tf_locks.name
  amplify_app_id       = var.amplify_app_id
  tags                 = local.common_tags
}

module "lambda" {
  source = "./modules/lambda"

  function_name      = local.lambda_function_name
  role_arn           = module.iam.role_arn
  source_dir         = "${path.module}/../parser"
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
