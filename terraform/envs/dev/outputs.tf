output "appsync_graphql_url" {
  description = "AppSync GraphQL endpoint URL"
  value       = module.appsync.graphql_url
}

output "appsync_api_id" {
  description = "AppSync API ID"
  value       = module.appsync.api_id
}

output "lesson_media_bucket_name" {
  description = "S3 bucket for lesson media assets"
  value       = module.s3.lesson_media_bucket_name
}

output "pdf_exports_bucket_name" {
  description = "S3 bucket for generated PDF exports"
  value       = module.s3.pdf_exports_bucket_name
}

output "pdf_generator_function_name" {
  description = "PDF generator Lambda function name"
  value       = module.lambda.pdf_generator_function_name
}

output "dynamodb_table_names" {
  description = "All DynamoDB table names"
  value       = module.dynamodb.all_table_names
}
