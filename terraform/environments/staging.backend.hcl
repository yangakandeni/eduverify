# Partial backend configuration for the staging environment. Used via:
#   terraform init -backend-config=environments/staging.backend.hcl
#
# Shares the same state bucket/lock table as production (see
# production.backend.hcl) but a distinct `key`, so `terraform apply` here can
# never touch production's state.

bucket         = "eduverify-tf-state"
key            = "eduverify/staging/terraform.tfstate"
region         = "af-south-1"
dynamodb_table = "eduverify-tf-locks"
encrypt        = true
