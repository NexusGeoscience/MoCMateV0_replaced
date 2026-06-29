# ─────────────────────────────────────────────────────────────────────────────
# CloudWatch Alarms — one per Lambda function
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix = "moc-mate-${var.environment}"
}

# ── SNS topic for alarm notifications ────────────────────────────────────────
resource "aws_sns_topic" "alarms" {
  name              = "${local.prefix}-alarms"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ─────────────────────────────────────────────────────────────────────────────
# Helper locals for DRY alarm creation
# ─────────────────────────────────────────────────────────────────────────────
locals {
  lambda_functions = {
    pdf_generator      = var.pdf_generator_function_name
    cpd_auto_log       = var.cpd_auto_log_function_name
    personalize_ingest = var.personalize_ingest_function_name
  }
}

# ── Error-rate alarm per function ─────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = local.lambda_functions

  alarm_name          = "${local.prefix}-${each.key}-errors"
  alarm_description   = "Error count > 5 in 5 minutes for ${each.value}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]
}

# ── Throttle alarm per function ───────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = local.lambda_functions

  alarm_name          = "${local.prefix}-${each.key}-throttles"
  alarm_description   = "Throttle count > 10 in 5 minutes for ${each.value}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
}

# ── Duration alarm (warn if approaching timeout) ──────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = local.lambda_functions

  alarm_name          = "${local.prefix}-${each.key}-duration"
  alarm_description   = "P95 duration > 25s for ${each.value} (approaching timeout)"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 25000   # ms
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = each.value
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
}

# ── AppSync 5XX alarm ─────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "appsync_5xx" {
  alarm_name          = "${local.prefix}-appsync-5xx"
  alarm_description   = "AppSync 5XX errors > 10 in 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/AppSync"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]
}
