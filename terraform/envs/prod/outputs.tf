output "appsync_graphql_url" {
  value = module.appsync.graphql_url
}

output "appsync_api_id" {
  value = module.appsync.api_id
}

output "lesson_media_bucket_name" {
  value = module.s3.lesson_media_bucket_name
}

output "pdf_exports_bucket_name" {
  value = module.s3.pdf_exports_bucket_name
}

output "pdf_generator_function_name" {
  value = module.lambda.pdf_generator_function_name
}

output "dynamodb_table_names" {
  value = module.dynamodb.all_table_names
}

output "subscription_notifications_url" {
  description = "Append 'apple' (App Store Server Notifications V2) or 'google' (Play RTDN Pub/Sub push)"
  value       = module.lambda.subscription_notifications_url
}

output "apple_iap_key_secret_arn"               { value = module.lambda.apple_iap_key_secret_arn }
output "google_play_service_account_secret_arn" { value = module.lambda.google_play_service_account_secret_arn }
