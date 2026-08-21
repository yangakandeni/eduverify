# terraform/CLAUDE.md

Guidance for working in `terraform/` (and its companion `scripts/`). See the repo root `CLAUDE.md` for what this part fits into.

This stack no longer provisions or runs any data ingestion — the DHET-register scraper and its S3→Lambda pipeline now live entirely in `eduverify-api`. What's left here is what the `web/` app itself needs: read access to its DynamoDB table, its own hosting, and the CI plumbing to deploy both.

## Commands

```bash
./scripts/verify_deployment.sh   # pre-flight: creds, backend reachability, terraform plan (see docs/DEPLOYMENT.md)
cd terraform && terraform plan   # / apply — provisions DynamoDB, Amplify hosting, CI OIDC role, remote-state backend
```

First-ever deploy needs the Terraform remote-state backend bootstrapped once before `verify_deployment.sh`/`terraform plan` can run — see `docs/DEPLOYMENT.md`'s Pre-flight section.

## Architecture

`main.tf` wires two modules: `dynamodb` (the institutions table + GSI1, populated by `eduverify-api`'s ingestion, read directly by `web/lib/dynamodb.ts`) and `ci_oidc` (the IAM role GitHub Actions assumes via OIDC to run `terraform apply` for this stack).

`frontend.tf` provisions AWS Amplify Hosting for the Next.js `web/` app: the SSR compute role (DynamoDB read-only) Next.js assumes at request time, plus an optional custom-domain association and Route 53 records. The Amplify app/branch itself is deliberately *not* Terraform-managed (see the comment in `frontend.tf` for the platform bug this works around) — it's created once by hand through the Console.

`backend_state.tf` provisions the S3 bucket + DynamoDB lock table backing the `backend "s3" {}` block in `main.tf` (config supplied via `backend.hcl`, gitignored-secret-free since bucket/table names aren't sensitive). Chicken-and-egg: it has to be applied with **local** state first, before the S3 backend it creates can be pointed at — see the bootstrap steps in `docs/DEPLOYMENT.md`.

Deploys go through `scripts/verify_deployment.sh` (credentials → backend reachability → `terraform plan`) per the runbook in `docs/DEPLOYMENT.md`, which also covers the manual apply.
