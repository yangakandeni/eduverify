locals {
  python_version = replace(var.runtime, "python", "")
  manylinux_platform = {
    x86_64 = "manylinux2014_x86_64"
    arm64  = "manylinux2014_aarch64"
  }[var.architecture]
  layer_build_dir = "${path.module}/build/layer"
}

# pip's --platform/--only-binary flags cross-compile the dependency layer for
# Lambda's Amazon Linux runtime from a developer machine (e.g. macOS/arm64)
# without needing Docker, provided every dependency ships a prebuilt wheel
# for the target platform (true for pdfplumber/pydantic as of writing).
resource "null_resource" "install_layer_deps" {
  triggers = {
    requirements_hash = filesha256(var.requirements_file)
    platform          = local.manylinux_platform
    python_version    = local.python_version
  }

  provisioner "local-exec" {
    command = <<-EOT
      rm -rf ${local.layer_build_dir}
      mkdir -p ${local.layer_build_dir}/python
      pip install \
        -r ${var.requirements_file} \
        --platform ${local.manylinux_platform} \
        --implementation cp \
        --python-version ${local.python_version} \
        --only-binary=:all: \
        --target ${local.layer_build_dir}/python
    EOT
  }
}

data "archive_file" "layer" {
  type        = "zip"
  source_dir  = local.layer_build_dir
  output_path = "${path.module}/build/layer.zip"
  depends_on  = [null_resource.install_layer_deps]
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
