terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "moc-mate-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "moc-mate-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "moc-mate"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Budgets (global, must use us-east-1) ──────────────────────────────────────
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "moc-mate"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── DynamoDB ──────────────────────────────────────────────────────────────────
module "dynamodb" {
  source      = "../../modules/dynamodb"
  environment = var.environment
}

# ── S3 ────────────────────────────────────────────────────────────────────────
module "s3" {
  source      = "../../modules/s3"
  environment = var.environment
  aws_region  = var.aws_region
}

# ── Lambda ────────────────────────────────────────────────────────────────────
module "lambda" {
  source                        = "../../modules/lambda"
  environment                   = var.environment
  aws_region                    = var.aws_region
  lessons_table_arn             = module.dynamodb.lessons_table_arn
  lessons_table_name            = module.dynamodb.lessons_table_name
  cpd_activities_table_arn      = module.dynamodb.cpd_activities_table_arn
  cpd_activities_table_name     = module.dynamodb.cpd_activities_table_name
  drafts_table_name             = module.dynamodb.drafts_table_name
  export_presets_table_arn      = module.dynamodb.export_presets_table_arn
  export_presets_table_name     = module.dynamodb.export_presets_table_name
  lesson_completions_table_arn  = module.dynamodb.lesson_completions_table_arn
  lesson_completions_table_name = module.dynamodb.lesson_completions_table_name
  pdf_exports_bucket_name       = module.s3.pdf_exports_bucket_name
  pdf_exports_bucket_arn        = module.s3.pdf_exports_bucket_arn
  personalize_event_tracker_arn = var.personalize_event_tracker_arn

  # Subscriptions
  subscriptions_table_arn  = module.dynamodb.subscriptions_table_arn
  subscriptions_table_name = module.dynamodb.subscriptions_table_name
  trial_days               = var.trial_days
  subscription_product_ids = var.subscription_product_ids
  apple_bundle_id          = var.apple_bundle_id
  apple_issuer_id          = var.apple_issuer_id
  apple_key_id             = var.apple_key_id
  android_package_name     = var.android_package_name
}

# ── AppSync ───────────────────────────────────────────────────────────────────
module "appsync" {
  source               = "../../modules/appsync"
  environment          = var.environment
  auth0_issuer_url     = var.auth0_issuer_url
  dynamodb_table_arns  = module.dynamodb.all_table_arns
  lambda_function_arns = module.lambda.all_function_arns
  lambda_invoke_arns   = module.lambda.all_invoke_arns
  users_table_name              = module.dynamodb.users_table_name
  cpd_activities_table_name     = module.dynamodb.cpd_activities_table_name
  drafts_table_name             = module.dynamodb.drafts_table_name
  lessons_table_name            = module.dynamodb.lessons_table_name
  lesson_completions_table_name = module.dynamodb.lesson_completions_table_name
  export_presets_table_name     = module.dynamodb.export_presets_table_name
  user_groups_table_name        = module.dynamodb.user_groups_table_name
  pdf_lambda_arn                = module.lambda.pdf_generator_function_arn
  subscriptions_table_name      = module.dynamodb.subscriptions_table_name
  subscription_lambda_arn       = module.lambda.subscription_function_arn
  trial_days                    = var.trial_days
}

# ── VPC endpoints & monitoring ────────────────────────────────────────────────
module "vpc" {
  source      = "../../modules/vpc"
  environment = var.environment
  aws_region  = var.aws_region
}

module "monitoring" {
  source                           = "../../modules/monitoring"
  environment                      = var.environment
  pdf_generator_function_name      = module.lambda.pdf_generator_function_name
  cpd_auto_log_function_name       = module.lambda.cpd_auto_log_function_name
  personalize_ingest_function_name = module.lambda.personalize_ingest_function_name
  alarm_email                      = var.alarm_email
}

module "budgets" {
  source            = "../../modules/budgets"
  environment       = var.environment
  monthly_limit_usd = var.monthly_budget_usd
  alert_email       = var.alarm_email

  providers = {
    aws = aws.us_east_1
  }
}
