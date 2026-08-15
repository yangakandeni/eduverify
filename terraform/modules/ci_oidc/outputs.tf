output "role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes via OIDC. Set as the AWS_ROLE_ARN repo secret for the deploy workflow."
  value       = aws_iam_role.github_actions_deploy.arn
}
