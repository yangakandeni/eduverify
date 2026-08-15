#!/usr/bin/env bash
# Builds the pip dependency directory that terraform/modules/lambda zips into
# the ingestion Lambda's layer via data.archive_file.layer.
#
# Must run BEFORE `terraform plan`/`apply` in terraform/, not inside them.
# The previous design built this directory from a null_resource local-exec
# triggered by requirements-lambda.txt's hash, with archive_file.layer
# depends_on-ing it. That breaks on a fresh CI runner: Terraform reads
# archive_file's source_dir during planning, which runs before (or without
# ever re-running, if the state already shows the null_resource as
# unchanged) the local-exec provisioner populates it — "missing directory"
# on an otherwise-correct plan. Building the directory as an explicit,
# unconditional step ahead of Terraform sidesteps that ordering problem
# entirely, since it always exists by the time archive_file reads it.
#
# Usage: scripts/build_lambda_layer.sh [requirements_file] [build_dir] [python_version] [architecture]
set -euo pipefail

REQUIREMENTS_FILE="${1:-parser/requirements-lambda.txt}"
BUILD_DIR="${2:-terraform/modules/lambda/build/layer}"
PYTHON_VERSION="${3:-3.12}"
ARCHITECTURE="${4:-x86_64}"

case "$ARCHITECTURE" in
  x86_64) PLATFORM="manylinux2014_x86_64" ;;
  arm64) PLATFORM="manylinux2014_aarch64" ;;
  *)
    echo "Unknown architecture: $ARCHITECTURE (expected x86_64 or arm64)" >&2
    exit 1
    ;;
esac

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/python"

pip install \
  -r "$REQUIREMENTS_FILE" \
  --platform "$PLATFORM" \
  --implementation cp \
  --python-version "$PYTHON_VERSION" \
  --only-binary=:all: \
  --target "$BUILD_DIR/python"
