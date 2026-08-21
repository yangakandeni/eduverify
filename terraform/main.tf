terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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

module "ci_oidc" {
  source = "./modules/ci_oidc"

  project_name         = var.project_name
  github_repo          = var.github_repo
  github_deploy_refs   = var.github_deploy_refs
  tf_state_bucket_name = var.tf_state_bucket_name
  tf_lock_table_name   = aws_dynamodb_table.tf_locks.name
  amplify_app_id       = var.amplify_app_id
  tags                 = local.common_tags
}
