# Lets GitHub Actions assume an IAM role via OIDC instead of long-lived
# access keys, so `deploy.yml` can run `terraform apply` without a secret
# any more sensitive than a role ARN. One provider/role pair per AWS
# account (staging and production are separate accounts, so applying this
# stack into each creates its own independent trust relationship).

data "tls_certificate" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]

  tags = var.tags
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # StringLike (not Equals) so a single ref can also be expressed as a
    # wildcard pattern later (e.g. "refs/heads/release-*") without changing
    # the condition operator. Also StringLike because GitHub's actual `sub`
    # claim here is "repo:<owner>@<owner_id>/<repo>@<repo_id>:ref:<ref>" (the
    # org has the immutable-ID subject-claim format as its default, confirmed
    # via `gh api repos/<repo>/actions/oidc/customization/sub`), not the
    # classic "repo:<owner>/<repo>:ref:<ref>" — matching both keeps this
    # working whether or not that default changes again.
    #
    # Also includes the "environment:<name>" form (not just "ref:<ref>"):
    # any job that sets `environment:` gets an OIDC token whose sub claim is
    # repo:<owner>/<repo>:environment:<name> instead of the ref form, per
    # GitHub's docs. A deploy workflow with an `environment:` block (as both
    # deploy.yml and deploy-staging.yml have, to scope environment secrets/
    # vars and branch-restriction rules) is denied AssumeRoleWithWebIdentity
    # without this, even though the ref-based condition above looks correct —
    # confirmed via CloudTrail: userName was
    # "repo:<owner>@<id>/<repo>@<id>:environment:staging", which matched
    # neither ref pattern.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = concat(
        flatten([
          for ref in var.github_deploy_refs : [
            "repo:${var.github_repo}:ref:${ref}",
            "repo:${split("/", var.github_repo)[0]}@*/${split("/", var.github_repo)[1]}@*:ref:${ref}",
          ]
        ]),
        var.github_environment != "" ? [
          "repo:${var.github_repo}:environment:${var.github_environment}",
          "repo:${split("/", var.github_repo)[0]}@*/${split("/", var.github_repo)[1]}@*:environment:${var.github_environment}",
        ] : []
      )
    }
  }
}

resource "aws_iam_role" "github_actions_deploy" {
  name               = "${var.project_name}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
  tags               = var.tags
}

data "aws_caller_identity" "current" {}

locals {
  account_id       = data.aws_caller_identity.current.account_id
  project_resource = "${var.project_name}*"

  # Exact names, NOT the project_resource wildcard: this role's own name
  # (${var.project_name}-github-actions-deploy) also matches that prefix,
  # and granting iam:AttachRolePolicy/CreateRole etc. on a resource pattern
  # that includes yourself is a privilege-escalation path (the role could
  # attach a more permissive policy to itself). List every IAM
  # role/policy main.tf and frontend.tf actually create instead.
  managed_role_names = [
    "${var.project_name}-lambda-exec-role",
    "${var.project_name}-amplify-ssr-compute",
  ]
  managed_policy_names = [
    "${var.project_name}-lambda-exec-role-policy",
    "${var.project_name}-amplify-ssr-compute-policy",
  ]
  managed_role_arns   = [for n in local.managed_role_names : "arn:aws:iam::${local.account_id}:role/${n}"]
  managed_policy_arns = [for n in local.managed_policy_names : "arn:aws:iam::${local.account_id}:policy/${n}"]

  tf_state_bucket_arn = "arn:aws:s3:::${var.tf_state_bucket_name}"
  tf_lock_table_arn   = "arn:aws:dynamodb:*:${local.account_id}:table/${var.tf_lock_table_name}"

  # This module's own OIDC provider/role/policy live in the same state this
  # role applies, so every plan/apply refreshes them too. Read-only, unlike
  # managed_role_arns/managed_policy_arns above — Get/List actions can't be
  # used to escalate privilege the way AttachRolePolicy/CreateRole could, so
  # granting them on the role's own ARN doesn't reintroduce the self-
  # management risk the comment above is guarding against.
  self_oidc_provider_arn = "arn:aws:iam::${local.account_id}:oidc-provider/token.actions.githubusercontent.com"
  self_role_arn          = "arn:aws:iam::${local.account_id}:role/${var.project_name}-github-actions-deploy"

  # Two managed policies below (deploy_permissions / deploy_permissions_app):
  # a single policy document hit IAM's 6,144-character managed-policy-size
  # quota once the various Refresh*/List*ForResource statements were added
  # to fix the CI role's own refresh permissions. Both are well-known names,
  # not resource attributes, for the same reason self_role_arn above is —
  # RefreshOwnCiInfra needs to reference them without a dependency cycle.
  self_policy_arns = [
    "arn:aws:iam::${local.account_id}:policy/${var.project_name}-github-actions-deploy-policy",
    "arn:aws:iam::${local.account_id}:policy/${var.project_name}-github-actions-deploy-app-policy",
  ]
}

# Scoped by the project_name prefix every resource in main.tf/frontend.tf/
# monitoring.tf/eventbridge.tf names itself with, rather than a broad
# managed policy — so this role can `terraform apply` the eduverify stack
# and nothing else in the account.
data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid       = "TerraformStateObjects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${local.tf_state_bucket_arn}/*"]
  }

  statement {
    sid       = "TerraformStateBucketList"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [local.tf_state_bucket_arn]
  }

  # backend_state.tf's tf_state bucket and lock table live in this same
  # root module, so every plan/apply refreshes them too (not just the
  # object/lock-row access above) — read-only, since they're bootstrapped
  # once by hand with local state per docs/DEPLOYMENT.md and `prevent_destroy`
  # in their lifecycle blocks rules out CI ever needing to create/delete them.
  statement {
    sid    = "RefreshBackendStateInfra"
    effect = "Allow"
    actions = [
      "s3:GetEncryptionConfiguration",
      # Despite the name, this one isn't covered by the s3:GetBucket*
      # wildcard below — AWS's actual action name has no "Bucket" in it,
      # same as GetEncryptionConfiguration above.
      "s3:GetLifecycleConfiguration",
      # aws_s3_bucket's Read populates a long tail of deprecated/sub-resource
      # attributes (policy, acl, cors_rule, website, replication, ...) on
      # every refresh, none of which this project declares as their own
      # resource. The exact set the provider reads has grown three times
      # already (website, CORS, replication) as it evolved, so this is
      # wildcarded rather than enumerated action-by-action.
      "s3:GetBucket*",
    ]
    resources = [local.tf_state_bucket_arn]
  }

  statement {
    sid       = "RefreshBackendLockTable"
    effect    = "Allow"
    actions   = ["dynamodb:DescribeTable", "dynamodb:ListTagsOfResource", "dynamodb:DescribeContinuousBackups", "dynamodb:DescribeTimeToLive"]
    resources = [local.tf_lock_table_arn]
  }

  statement {
    sid       = "TerraformStateLock"
    effect    = "Allow"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = [local.tf_lock_table_arn]
  }

  statement {
    sid    = "ManageProjectBuckets"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:PutBucketVersioning",
      "s3:PutEncryptionConfiguration", "s3:GetEncryptionConfiguration",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutBucketOwnershipControls",
      "s3:PutBucketNotification",
      "s3:PutBucketTagging",
      # Despite the name, this one isn't covered by the s3:GetBucket*
      # wildcard below — AWS's actual action name has no "Bucket" in it,
      # same as GetEncryptionConfiguration above.
      "s3:GetLifecycleConfiguration",
      # aws_s3_bucket's Read populates a long tail of deprecated/sub-resource
      # attributes (policy, acl, cors_rule, website, replication, ...) on
      # every refresh, none of which this project declares as their own
      # resource. The exact set the provider reads has grown three times
      # already (website, CORS, replication) as it evolved, so this is
      # wildcarded rather than enumerated action-by-action.
      "s3:GetBucket*",
      # Distinct from the "s3:GetBucket*" wildcard above: HeadBucket (how the
      # provider checks the bucket still exists on every refresh) requires
      # this exact bucket-level action name, which "GetBucket*" doesn't
      # match. It was previously granted only on the object ARN
      # (ManageProjectBucketObjects, below), which doesn't count for a
      # bucket-level call — so refresh got denied, the provider treated the
      # bucket as deleted, and apply then tried to recreate a bucket that
      # already existed (BucketAlreadyOwnedByYou).
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::${local.project_resource}"]
  }

  statement {
    sid       = "ManageProjectBucketObjects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${local.project_resource}/*"]
  }

  statement {
    sid       = "ReadOwnIdentity"
    effect    = "Allow"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "deploy_permissions" {
  name   = "${var.project_name}-github-actions-deploy-policy"
  policy = data.aws_iam_policy_document.deploy_permissions.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "deploy_permissions" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.deploy_permissions.arn
}

# Split from deploy_permissions above purely to stay under IAM's 6,144-
# character managed-policy-size quota — DynamoDB/Lambda/IAM/logs/alarms/SNS/
# EventBridge/Amplify management plus the self-refresh statement pushed the
# single document over the limit. No scoping difference intended; this is
# the same role's second attached policy, not a separate permission tier.
data "aws_iam_policy_document" "deploy_permissions_app" {
  statement {
    sid    = "ManageProjectDynamoDbTable"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable", "dynamodb:UpdateTable", "dynamodb:DeleteTable", "dynamodb:DescribeTable",
      "dynamodb:UpdateContinuousBackups", "dynamodb:DescribeContinuousBackups", "dynamodb:DescribeTimeToLive",
      "dynamodb:TagResource", "dynamodb:ListTagsOfResource",
    ]
    resources = [
      "arn:aws:dynamodb:*:${local.account_id}:table/${local.project_resource}",
      "arn:aws:dynamodb:*:${local.account_id}:table/${local.project_resource}/index/*",
    ]
  }

  statement {
    sid    = "ManageProjectLambda"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction", "lambda:UpdateFunctionCode", "lambda:UpdateFunctionConfiguration",
      "lambda:DeleteFunction", "lambda:GetFunction", "lambda:GetFunctionConfiguration",
      "lambda:AddPermission", "lambda:RemovePermission", "lambda:GetPolicy",
      "lambda:PublishLayerVersion", "lambda:GetLayerVersion", "lambda:DeleteLayerVersion",
      "lambda:ListVersionsByFunction", "lambda:TagResource", "lambda:ListTags",
      # aws_lambda_function's Read always calls GetFunctionCodeSigningConfig,
      # even though this project has no code signing config attached.
      "lambda:GetFunctionCodeSigningConfig",
    ]
    resources = [
      "arn:aws:lambda:*:${local.account_id}:function:${local.project_resource}",
      "arn:aws:lambda:*:${local.account_id}:layer:${local.project_resource}",
    ]
  }

  statement {
    sid    = "ManageProjectIamRolesAndPolicies"
    effect = "Allow"
    actions = [
      "iam:CreateRole", "iam:DeleteRole", "iam:GetRole", "iam:UpdateRole", "iam:TagRole",
      "iam:CreatePolicy", "iam:DeletePolicy", "iam:GetPolicy", "iam:GetPolicyVersion",
      "iam:CreatePolicyVersion", "iam:DeletePolicyVersion", "iam:ListPolicyVersions", "iam:TagPolicy",
      "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies", "iam:ListInstanceProfilesForRole",
    ]
    resources = concat(local.managed_role_arns, local.managed_policy_arns)
  }

  statement {
    sid       = "PassProjectServiceRoles"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = local.managed_role_arns

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com", "amplify.amazonaws.com"]
    }
  }

  statement {
    sid    = "ManageProjectLogGroups"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup", "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy", "logs:TagResource", "logs:ListTagsForResource",
    ]
    resources = ["arn:aws:logs:*:${local.account_id}:log-group:/aws/lambda/${local.project_resource}*"]
  }

  # logs:DescribeLogGroups doesn't support resource-level permissions (it's an
  # account-wide list operation, not scoped to one log group) — IAM silently
  # denies it if the statement's Resource is anything but "*", regardless of
  # whether the action is also listed in a scoped statement above.
  statement {
    sid       = "ListLogGroupsForRefresh"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid    = "ManageProjectAlarms"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricAlarm", "cloudwatch:DeleteAlarms", "cloudwatch:DescribeAlarms",
      "cloudwatch:TagResource", "cloudwatch:ListTagsForResource",
    ]
    resources = ["arn:aws:cloudwatch:*:${local.account_id}:alarm:${local.project_resource}"]
  }

  statement {
    sid    = "ManageProjectSnsTopic"
    effect = "Allow"
    actions = [
      "sns:CreateTopic", "sns:DeleteTopic", "sns:GetTopicAttributes", "sns:SetTopicAttributes",
      "sns:Subscribe", "sns:Unsubscribe", "sns:ListSubscriptionsByTopic", "sns:TagResource",
      "sns:ListTagsForResource",
    ]
    resources = ["arn:aws:sns:*:${local.account_id}:${local.project_resource}"]
  }

  statement {
    sid    = "ManageProjectEventBridgeRule"
    effect = "Allow"
    actions = [
      "events:PutRule", "events:DeleteRule", "events:DescribeRule",
      "events:PutTargets", "events:RemoveTargets", "events:ListTargetsByRule", "events:TagResource",
      "events:ListTagsForResource",
    ]
    resources = ["arn:aws:events:*:${local.account_id}:rule/${local.project_resource}"]
  }

  dynamic "statement" {
    for_each = var.amplify_app_id != "" ? [1] : []
    content {
      sid    = "ManageProjectAmplifyDomain"
      effect = "Allow"
      actions = [
        "amplify:GetApp",
        "amplify:GetDomainAssociation", "amplify:CreateDomainAssociation",
        "amplify:UpdateDomainAssociation", "amplify:DeleteDomainAssociation",
      ]
      resources = ["arn:aws:amplify:*:${local.account_id}:apps/${var.amplify_app_id}/*"]
    }
  }

  dynamic "statement" {
    for_each = var.amplify_app_id != "" ? [1] : []
    content {
      sid       = "ManageProjectRoute53RecordsForAmplifyDomain"
      effect    = "Allow"
      actions   = ["route53:ChangeResourceRecordSets", "route53:GetChange", "route53:ListResourceRecordSets"]
      resources = ["arn:aws:route53:::hostedzone/*", "arn:aws:route53:::change/*"]
    }
  }

  statement {
    sid    = "RefreshOwnCiInfra"
    effect = "Allow"
    actions = [
      "iam:GetOpenIDConnectProvider", "iam:ListOpenIDConnectProviderTags",
      "iam:GetRole", "iam:ListRoleTags", "iam:ListAttachedRolePolicies", "iam:ListRolePolicies",
      "iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListPolicyVersions", "iam:ListPolicyTags",
    ]
    resources = concat([local.self_oidc_provider_arn, local.self_role_arn], local.self_policy_arns)
  }
}

resource "aws_iam_policy" "deploy_permissions_app" {
  name   = "${var.project_name}-github-actions-deploy-app-policy"
  policy = data.aws_iam_policy_document.deploy_permissions_app.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "deploy_permissions_app" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = aws_iam_policy.deploy_permissions_app.arn
}
