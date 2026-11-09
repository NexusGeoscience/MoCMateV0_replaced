variable "environment" { type = string }
variable "aws_region"  { type = string }

variable "lessons_table_arn"            { type = string }
variable "lessons_table_name"           { type = string }
variable "cpd_activities_table_arn"     { type = string }
variable "cpd_activities_table_name"    { type = string }
variable "drafts_table_name"            { type = string }
variable "lesson_completions_table_arn"  { type = string }
variable "lesson_completions_table_name" { type = string }
variable "export_presets_table_arn"     { type = string }
variable "export_presets_table_name"    { type = string }
variable "pdf_exports_bucket_name"      { type = string }
variable "pdf_exports_bucket_arn"       { type = string }
variable "personalize_event_tracker_arn" {
  type    = string
  default = ""
}

# ── Subscriptions ─────────────────────────────────────────────────────────────
variable "subscriptions_table_arn"  { type = string }
variable "subscriptions_table_name" { type = string }

variable "trial_days" {
  type    = number
  default = 30
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
  description = "App Store Connect API issuer ID"
  type        = string
  default     = ""
}

variable "apple_key_id" {
  description = "App Store Connect In-App Purchase key ID"
  type        = string
  default     = ""
}

variable "android_package_name" {
  type    = string
  default = ""
}
