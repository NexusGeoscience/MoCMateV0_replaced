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
