variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Deployment environment (dev / prod)"
  type        = string
  default     = "dev"
}

variable "auth0_issuer_url" {
  description = "Auth0 tenant issuer URL, e.g. https://your-tenant.au.auth0.com/"
  type        = string
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm and budget notifications"
  type        = string
}

variable "monthly_budget_usd" {
  description = "Monthly AWS budget limit in USD"
  type        = string
  default     = "100"
}

variable "personalize_event_tracker_arn" {
  description = "ARN of the Amazon Personalize event tracker (created manually or via separate Personalize setup)"
  type        = string
  default     = ""
}

# ── Subscriptions ─────────────────────────────────────────────────────────────
variable "trial_days" {
  description = "Length of the free trial, counted from each user's first request"
  type        = number
  default     = 30
}

variable "subscription_product_ids" {
  description = "App Store / Google Play subscription product IDs that unlock the app"
  type        = list(string)
  default     = []
}

variable "apple_bundle_id" {
  type    = string
  default = ""
}

variable "apple_issuer_id" {
  type    = string
  default = ""
}

variable "apple_key_id" {
  type    = string
  default = ""
}

variable "android_package_name" {
  type    = string
  default = ""
}
