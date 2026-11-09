output "pdf_generator_function_name"      { value = aws_lambda_function.pdf_generator.function_name }
output "pdf_generator_function_arn"       { value = aws_lambda_function.pdf_generator.arn }
output "pdf_generator_invoke_arn"         { value = aws_lambda_function.pdf_generator.invoke_arn }

output "cpd_auto_log_function_name"       { value = aws_lambda_function.cpd_auto_log.function_name }
output "cpd_auto_log_function_arn"        { value = aws_lambda_function.cpd_auto_log.arn }
output "cpd_auto_log_invoke_arn"          { value = aws_lambda_function.cpd_auto_log.invoke_arn }

output "personalize_ingest_function_name" { value = aws_lambda_function.personalize_ingest.function_name }
output "personalize_ingest_function_arn"  { value = aws_lambda_function.personalize_ingest.arn }
output "personalize_ingest_invoke_arn"    { value = aws_lambda_function.personalize_ingest.invoke_arn }

output "subscription_function_name"       { value = aws_lambda_function.subscription.function_name }
output "subscription_function_arn"        { value = aws_lambda_function.subscription.arn }
output "subscription_notifications_url"   { value = aws_lambda_function_url.subscription_notifications.function_url }
output "apple_iap_key_secret_arn"         { value = aws_secretsmanager_secret.apple_iap_key.arn }
output "google_play_service_account_secret_arn" { value = aws_secretsmanager_secret.google_play_service_account.arn }

output "all_function_arns" {
  value = [
    aws_lambda_function.pdf_generator.arn,
    aws_lambda_function.cpd_auto_log.arn,
    aws_lambda_function.personalize_ingest.arn,
    aws_lambda_function.subscription.arn,
  ]
}

output "all_invoke_arns" {
  value = {
    pdf_generator      = aws_lambda_function.pdf_generator.invoke_arn
    cpd_auto_log       = aws_lambda_function.cpd_auto_log.invoke_arn
    personalize_ingest = aws_lambda_function.personalize_ingest.invoke_arn
    subscription       = aws_lambda_function.subscription.invoke_arn
  }
}
