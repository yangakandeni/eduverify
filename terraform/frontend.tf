# Hosting for the web/ frontend on AWS Amplify Hosting.
#
# web/ is a full Next.js app (API routes under app/api/, Clerk auth
# middleware in proxy.ts, server-side DynamoDB reads) — not a static SPA —
# so it needs a request-time compute layer. Amplify Hosting's WEB_COMPUTE
# platform runs Next.js SSR/API routes on Lambda behind its own managed
# CloudFront distribution, and provisions/renews the HTTPS certificate for
# custom domains itself (no separate ACM resource to manage here).

locals {
  frontend_domain_enabled = var.domain_name != ""
}

# Role Next.js server code assumes at request time (DynamoDB reads via
# web/lib/dynamodb.ts). Distinct from Amplify's build/deploy service role.
data "aws_iam_policy_document" "amplify_ssr_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "amplify_ssr_compute" {
  name               = "${var.project_name}-amplify-ssr-compute"
  assume_role_policy = data.aws_iam_policy_document.amplify_ssr_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "amplify_ssr_compute" {
  statement {
    sid       = "ReadInstitutionRecords"
    effect    = "Allow"
    actions   = ["dynamodb:GetItem", "dynamodb:BatchGetItem"]
    resources = [module.dynamodb.table_arn]
  }

  statement {
    sid       = "QueryInstitutionsByStatus"
    effect    = "Allow"
    actions   = ["dynamodb:Query"]
    resources = [module.dynamodb.gsi1_arn]
  }
}

resource "aws_iam_policy" "amplify_ssr_compute" {
  name   = "${var.project_name}-amplify-ssr-compute-policy"
  policy = data.aws_iam_policy_document.amplify_ssr_compute.json
  tags   = local.common_tags
}

resource "aws_iam_role_policy_attachment" "amplify_ssr_compute" {
  role       = aws_iam_role.amplify_ssr_compute.name
  policy_arn = aws_iam_policy.amplify_ssr_compute.arn
}

resource "aws_amplify_app" "web" {
  name         = "${var.project_name}-web"
  repository   = var.github_repository_url
  access_token = var.github_access_token != "" ? var.github_access_token : null
  platform     = "WEB_COMPUTE"
  tags         = local.common_tags

  compute_role_arn = aws_iam_role.amplify_ssr_compute.arn

  # web/ lives inside a monorepo; scope the build to that subdirectory.
  build_spec = <<-YAML
    version: 1
    applications:
      - appRoot: web
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
  YAML

  environment_variables = {
    EDUVERIFY_TABLE_NAME                            = module.dynamodb.table_name
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY               = var.clerk_publishable_key
    CLERK_SECRET_KEY                                = var.clerk_secret_key
    NEXT_PUBLIC_CLERK_SIGN_IN_URL                   = "/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL                   = "/sign-up"
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = "/dashboard"
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL = "/dashboard"
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.web.id
  branch_name       = var.amplify_branch_name
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true
  tags              = local.common_tags
}

resource "aws_amplify_domain_association" "web" {
  count = local.frontend_domain_enabled ? 1 : 0

  app_id                = aws_amplify_app.web.id
  domain_name           = var.domain_name
  wait_for_verification = false

  certificate_settings {
    type = "AMPLIFY_MANAGED"
  }

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = ""
  }
}

# Amplify hands back "<name> <type> <value>" space-delimited DNS records
# for both certificate verification and the subdomain CNAME; Route 53
# needs them split into their own record.
locals {
  amplify_cert_validation_record = local.frontend_domain_enabled ? split(
    " ", aws_amplify_domain_association.web[0].certificate_verification_dns_record
  ) : []

  amplify_subdomain_record = local.frontend_domain_enabled ? split(
    " ", [for s in aws_amplify_domain_association.web[0].sub_domain : s.dns_record][0]
  ) : []
}

resource "aws_route53_record" "amplify_cert_validation" {
  count = local.frontend_domain_enabled ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.amplify_cert_validation_record[0]
  type    = local.amplify_cert_validation_record[1]
  records = [local.amplify_cert_validation_record[2]]
  ttl     = 300
}

resource "aws_route53_record" "amplify_alias" {
  count = local.frontend_domain_enabled ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = local.amplify_subdomain_record[0]
  type    = local.amplify_subdomain_record[1]
  records = [local.amplify_subdomain_record[2]]
  ttl     = 300
}
