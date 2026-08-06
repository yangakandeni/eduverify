# Partial backend configuration for `terraform init -backend-config=backend.hcl`.
# None of these values are secret, so this file is checked into git.
#
# If you override `tf_state_bucket_name` in variables.tf (S3 bucket names are
# globally unique, so the default here may collide), update `bucket` below to
# match before running `terraform init -backend-config=backend.hcl`.

bucket         = "eduverify-tf-state"
key            = "eduverify/state/terraform.tfstate"
region         = "af-south-1"
dynamodb_table = "eduverify-tf-locks"
encrypt        = true
