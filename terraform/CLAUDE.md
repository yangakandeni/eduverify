# terraform/CLAUDE.md

Guidance for working in `terraform/` (and its companion `scripts/`). See the repo root `CLAUDE.md` for what this part fits into.

## Commands

```bash
./scripts/verify_deployment.sh   # production pre-flight: creds, backend, pytest, terraform plan (see docs/DEPLOYMENT.md)
cd terraform && terraform plan   # / apply — provisions S3, DynamoDB, Lambda, IAM
python scripts/seed_dynamodb.py                                   # bulk-load data/institutions.json into DynamoDB
python scripts/seed_dynamodb.py --endpoint-url http://localhost:8000  # against DynamoDB Local
```

First-ever deploy needs the Terraform remote-state backend bootstrapped once before `verify_deployment.sh`/`terraform plan` can run — see `docs/DEPLOYMENT.md`'s Pre-flight section.

## Architecture

`main.tf` wires four modules: `s3` (raw PDF uploads under `raw/`), `dynamodb` (the institutions table + GSI1), `iam` (Lambda execution role), `lambda` (packages `parser/` using `requirements-lambda.txt`, a trimmed dependency set for cold-start size). An S3 `ObjectCreated` notification on `raw/*.pdf` invokes the Lambda, which is `parser/lambda_handler.py`.

`backend_state.tf` provisions the S3 bucket + DynamoDB lock table backing the `backend "s3" {}` block in `main.tf` (config supplied via `backend.hcl`, gitignored-secret-free since bucket/table names aren't sensitive). Chicken-and-egg: it has to be applied with **local** state first, before the S3 backend it creates can be pointed at — see the bootstrap steps in `docs/DEPLOYMENT.md`.

`eventbridge.tf` schedules a weekly `aws_cloudwatch_event_rule` to invoke the ingestion Lambda directly (no S3 upload). **Currently a no-op**: `lambda_handler.handler` only reads `event["Records"]` (the S3 trigger shape), so the EventBridge-invoked payload (`{"source": "aws.events", ...}`) has no matching handling and returns `{"processed": []}` every time — the schedule doesn't yet fetch or ingest anything.

`monitoring.tf` adds an SNS topic (`eduverify-alerts`, optional email subscription via `var.alert_email`) and two CloudWatch alarms (Lambda `Errors` / `Throttles`) that publish to it.

Production deploys go through `scripts/verify_deployment.sh` (credentials → backend reachability → `pytest` → `terraform plan`) per the runbook in `docs/DEPLOYMENT.md`, which also covers the manual apply and post-deploy smoke test.
