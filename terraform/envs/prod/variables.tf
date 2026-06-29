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
