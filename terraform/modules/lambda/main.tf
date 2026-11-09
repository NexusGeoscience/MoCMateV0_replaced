# ─────────────────────────────────────────────────────────────────────────────
# Lambda functions for MoC-mate
# Each function gets its own least-privilege IAM role.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix       = "moc-mate-${var.environment}"
  lambda_src   = "${path.module}/../../../lambda"
}

data "aws_caller_identity" "current" {}

# ── Shared assume-role policy ─────────────────────────────────────────────────
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. PDF Generator
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "pdf_generator" {
  name               = "${local.prefix}-pdf-generator-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "pdf_generator" {
  name = "pdf-generator-policy"
  role = aws_iam_role.pdf_generator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadDynamo"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          var.cpd_activities_table_arn,
          "${var.cpd_activities_table_arn}/index/*",
          var.export_presets_table_arn
        ]
      },
      {
        Sid    = "WritePdfBucket"
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject"]
        Resource = "${var.pdf_exports_bucket_arn}/*"
      },
      {
        Sid    = "Logs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-pdf-generator:*"
      }
    ]
  })
}

data "archive_file" "pdf_generator" {
  type        = "zip"
  source_dir  = "${local.lambda_src}/pdf-generator"
  output_path = "${path.module}/dist/pdf-generator.zip"
}

resource "aws_lambda_function" "pdf_generator" {
  function_name    = "${local.prefix}-pdf-generator"
  role             = aws_iam_role.pdf_generator.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.pdf_generator.output_path
  source_code_hash = data.archive_file.pdf_generator.output_base64sha256
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      ENVIRONMENT             = var.environment
      CPD_ACTIVITIES_TABLE    = var.cpd_activities_table_name
      EXPORT_PRESETS_TABLE    = var.export_presets_table_name
      PDF_EXPORTS_BUCKET      = var.pdf_exports_bucket_name
      AWS_ACCOUNT_ID          = data.aws_caller_identity.current.account_id
    }
  }

  tracing_config { mode = "Active" }

  tags = { Name = "${local.prefix}-pdf-generator" }
}

resource "aws_cloudwatch_log_group" "pdf_generator" {
  name              = "/aws/lambda/${aws_lambda_function.pdf_generator.function_name}"
  retention_in_days = 30
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. CPD Auto-Log (triggered after lesson completion via AppSync mutation)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "cpd_auto_log" {
  name               = "${local.prefix}-cpd-auto-log-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "cpd_auto_log" {
  name = "cpd-auto-log-policy"
  role = aws_iam_role.cpd_auto_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadLessons"
        Effect = "Allow"
        Action = ["dynamodb:GetItem"]
        Resource = var.lessons_table_arn
      },
      {
        Sid    = "WriteCpdActivities"
        Effect = "Allow"
        Action = ["dynamodb:PutItem"]
        Resource = var.cpd_activities_table_arn
      },
      {
        Sid    = "WriteCompletions"
        Effect = "Allow"
        Action = ["dynamodb:PutItem", "dynamodb:UpdateItem"]
        Resource = var.lesson_completions_table_arn
      },
      {
        Sid    = "Logs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-cpd-auto-log:*"
      }
    ]
  })
}

data "archive_file" "cpd_auto_log" {
  type        = "zip"
  source_dir  = "${local.lambda_src}/cpd-auto-log"
  output_path = "${path.module}/dist/cpd-auto-log.zip"
}

resource "aws_lambda_function" "cpd_auto_log" {
  function_name    = "${local.prefix}-cpd-auto-log"
  role             = aws_iam_role.cpd_auto_log.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.cpd_auto_log.output_path
  source_code_hash = data.archive_file.cpd_auto_log.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT                = var.environment
      LESSONS_TABLE              = var.lessons_table_name
      CPD_ACTIVITIES_TABLE       = var.cpd_activities_table_name
      LESSON_COMPLETIONS_TABLE   = var.lesson_completions_table_name
    }
  }

  tracing_config { mode = "Active" }

  tags = { Name = "${local.prefix}-cpd-auto-log" }
}

resource "aws_cloudwatch_log_group" "cpd_auto_log" {
  name              = "/aws/lambda/${aws_lambda_function.cpd_auto_log.function_name}"
  retention_in_days = 30
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. Personalize Event Ingest
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "personalize_ingest" {
  name               = "${local.prefix}-personalize-ingest-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "personalize_ingest" {
  name = "personalize-ingest-policy"
  role = aws_iam_role.personalize_ingest.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PersonalizePutEvents"
        Effect = "Allow"
        Action = ["personalize:PutEvents"]
        # Scope to the specific event tracker when known
        Resource = var.personalize_event_tracker_arn != "" ? var.personalize_event_tracker_arn : "*"
      },
      {
        Sid    = "Logs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-personalize-ingest:*"
      }
    ]
  })
}

data "archive_file" "personalize_ingest" {
  type        = "zip"
  source_dir  = "${local.lambda_src}/personalize-ingest"
  output_path = "${path.module}/dist/personalize-ingest.zip"
}

resource "aws_lambda_function" "personalize_ingest" {
  function_name    = "${local.prefix}-personalize-ingest"
  role             = aws_iam_role.personalize_ingest.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.personalize_ingest.output_path
  source_code_hash = data.archive_file.personalize_ingest.output_base64sha256
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      ENVIRONMENT                   = var.environment
      PERSONALIZE_EVENT_TRACKER_ARN = var.personalize_event_tracker_arn
    }
  }

  tracing_config { mode = "Active" }

  tags = { Name = "${local.prefix}-personalize-ingest" }
}

resource "aws_cloudwatch_log_group" "personalize_ingest" {
  name              = "/aws/lambda/${aws_lambda_function.personalize_ingest.function_name}"
  retention_in_days = 30
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Subscription: free trial + App Store / Google Play purchase verification
# ─────────────────────────────────────────────────────────────────────────────
# Store credentials live in Secrets Manager. Terraform creates the empty
# secrets; put the values in once, out of band (see README "Subscriptions").
resource "aws_secretsmanager_secret" "apple_iap_key" {
  name        = "${local.prefix}/apple-in-app-purchase-key"
  description = "App Store Connect In-App Purchase API private key (.p8 contents)"
}

resource "aws_secretsmanager_secret" "google_play_service_account" {
  name        = "${local.prefix}/google-play-service-account"
  description = "Google Play Developer API service-account JSON key"
}

resource "aws_iam_role" "subscription" {
  name               = "${local.prefix}-subscription-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy" "subscription" {
  name = "subscription-policy"
  role = aws_iam_role.subscription.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Subscriptions"
        Effect = "Allow"
        Action = ["dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:Query"]
        Resource = [
          var.subscriptions_table_arn,
          "${var.subscriptions_table_arn}/index/*"
        ]
      },
      {
        Sid      = "StoreCredentials"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [
          aws_secretsmanager_secret.apple_iap_key.arn,
          aws_secretsmanager_secret.google_play_service_account.arn
        ]
      },
      {
        Sid    = "Logs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-subscription:*"
      }
    ]
  })
}

# Run lambda/subscription/build.sh first so vendor/ (PyJWT + cryptography) is included
data "archive_file" "subscription" {
  type        = "zip"
  source_dir  = "${local.lambda_src}/subscription"
  output_path = "${path.module}/dist/subscription.zip"
  excludes    = ["build.sh", "requirements.txt"]
}

resource "aws_lambda_function" "subscription" {
  function_name    = "${local.prefix}-subscription"
  role             = aws_iam_role.subscription.arn
  handler          = "index.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.subscription.output_path
  source_code_hash = data.archive_file.subscription.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      ENVIRONMENT                       = var.environment
      SUBSCRIPTIONS_TABLE               = var.subscriptions_table_name
      TRIAL_DAYS                        = tostring(var.trial_days)
      ALLOWED_PRODUCT_IDS               = join(",", var.subscription_product_ids)
      APPLE_BUNDLE_ID                   = var.apple_bundle_id
      APPLE_ISSUER_ID                   = var.apple_issuer_id
      APPLE_KEY_ID                      = var.apple_key_id
      APPLE_PRIVATE_KEY_SECRET_ARN      = aws_secretsmanager_secret.apple_iap_key.arn
      ANDROID_PACKAGE_NAME              = var.android_package_name
      GOOGLE_SERVICE_ACCOUNT_SECRET_ARN = aws_secretsmanager_secret.google_play_service_account.arn
    }
  }

  tracing_config { mode = "Active" }

  tags = { Name = "${local.prefix}-subscription" }
}

resource "aws_cloudwatch_log_group" "subscription" {
  name              = "/aws/lambda/${aws_lambda_function.subscription.function_name}"
  retention_in_days = 30
}

# Public HTTPS endpoint for store server notifications:
#   <url>apple   → App Store Connect › App › App Store Server Notifications (V2)
#   <url>google  → Google Cloud Pub/Sub push subscription for Play RTDN
# Notification bodies are never trusted: the Lambda re-fetches the
# subscription from Apple / Google before changing anything.
resource "aws_lambda_function_url" "subscription_notifications" {
  function_name      = aws_lambda_function.subscription.function_name
  authorization_type = "NONE"
}
