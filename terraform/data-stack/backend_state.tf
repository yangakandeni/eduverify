# Bootstrap infrastructure for this stack's own Terraform remote state, in the NEW
# eduverify-api-* account. Mirrors ../backend_state.tf's bootstrap for the original
# eduverify-staging/prod accounts — same chicken-and-egg: apply this file alone with
# LOCAL state first (before the `backend "s3" {}` block in main.tf is pointed at it),
# then `terraform init -migrate-state` once it exists. See docs/DEPLOYMENT.md's
# bootstrap steps for the original accounts; the sequence here is identical, just a
# different account/bucket name.

resource "aws_s3_bucket" "tf_state" {
  bucket = var.tf_state_bucket_name
  tags   = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "${var.project_name}-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = local.common_tags

  lifecycle {
    prevent_destroy = true
  }
}
