# Partial backend configuration for the production environment. Used via:
#   terraform init -backend-config=environments/production.backend.hcl
#
# None of these values are secret, so this file is checked into git. Both
# environments share one state bucket and lock table (bootstrapped once by
# backend_state.tf) but write to different `key`s, so staging and production
# state never collide.
#
# If you override `tf_state_bucket_name` in variables.tf (S3 bucket names are
# globally unique, so the default here may collide), update `bucket` below to
# match before running `terraform init`.

bucket         = "eduverify-tf-state"
key            = "eduverify/production/terraform.tfstate"
region         = "af-south-1"
dynamodb_table = "eduverify-tf-locks"
encrypt        = true
