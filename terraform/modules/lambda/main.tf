locals {
  layer_build_dir = "${path.module}/build/layer"
}

# The layer_build_dir/python directory is populated by
# scripts/build_lambda_layer.sh, which must run before `terraform plan`/
# `apply` (see that script's header comment for why this can't be done with
# a null_resource local-exec inside this module).
data "archive_file" "layer" {
  type        = "zip"
  source_dir  = local.layer_build_dir
  output_path = "${path.module}/build/layer.zip"

  lifecycle {
    precondition {
      condition     = length(fileset(local.layer_build_dir, "python/**")) > 0
      error_message = "Lambda layer build directory is empty or missing. Run scripts/build_lambda_layer.sh before terraform plan/apply."
    }
  }
}

resource "aws_lambda_layer_version" "deps" {
  layer_name               = "${var.function_name}-deps"
  filename                 = data.archive_file.layer.output_path
  source_code_hash         = data.archive_file.layer.output_base64sha256
  compatible_runtimes      = [var.runtime]
  compatible_architectures = [var.architecture]
}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/build/source.zip"
  excludes = [
    ".venv",
    "__pycache__",
    ".pytest_cache",
    "tests",
    "fixtures",
    "requirements.txt",
    "requirements-lambda.txt",
  ]
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = var.log_group_name
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "ingestion" {
  function_name    = var.function_name
  role             = var.role_arn
  handler          = "lambda_handler.handler"
  runtime          = var.runtime
  architectures    = [var.architecture]
  filename         = data.archive_file.source.output_path
  source_code_hash = data.archive_file.source.output_base64sha256
  layers           = [aws_lambda_layer_version.deps.arn]
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = var.environment_variables
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.lambda]
}
