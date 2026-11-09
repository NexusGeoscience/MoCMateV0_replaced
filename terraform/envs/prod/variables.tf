variable "aws_region" {
  type    = string
  default = "ap-southeast-2"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "auth0_issuer_url" {
  type = string
}

variable "alarm_email" {
  type = string
}

variable "monthly_budget_usd" {
  type    = string
  default = "500"
}

variable "personalize_event_tracker_arn" {
  type    = string
  default = ""
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
