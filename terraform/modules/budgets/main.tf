# ─────────────────────────────────────────────────────────────────────────────
# AWS Budgets — monthly cost alert at 80% of limit
# This module uses the us-east-1 provider alias (Budgets is a global service)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_budgets_budget" "monthly" {
  name              = "moc-mate-${var.environment}-monthly"
  budget_type       = "COST"
  limit_amount      = var.monthly_limit_usd
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2024-01-01_00:00"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
