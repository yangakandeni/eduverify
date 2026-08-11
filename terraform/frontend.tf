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

# The Amplify app and branch are deliberately NOT managed here. AWS Amplify's
# WEB_COMPUTE build orchestrator has a platform bug (undocumented by AWS,
# reproduced consistently across staging) where apps created via the API/CLI
# — which is all Terraform's `aws_amplify_app` resource can do — fail every
# build with a misleading "Unable to assume specified IAM Role" error,
# regardless of which valid IAM role is attached, or whether any role is
# attached at all. Apps created through the Amplify Console (with the GitHub
# App repository connection, not a personal access token) don't hit this.
#
# So the app is created once, by hand, through the Console — see
# docs/DEPLOYMENT.md's "Amplify app setup" section — and its resulting App ID
# is fed back in via var.amplify_app_id for the resources below (compute role,
# custom domain) that attach to it.

resource "aws_amplify_domain_association" "web" {
  provider = aws.amplify
  count    = local.frontend_domain_enabled ? 1 : 0

  app_id                = var.amplify_app_id
  domain_name           = var.domain_name
  wait_for_verification = false

  certificate_settings {
    type = "AMPLIFY_MANAGED"
  }

  sub_domain {
    branch_name = var.amplify_branch_name
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
