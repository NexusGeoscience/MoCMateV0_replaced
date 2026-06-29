output "pdf_generator_function_name"      { value = aws_lambda_function.pdf_generator.function_name }
output "pdf_generator_function_arn"       { value = aws_lambda_function.pdf_generator.arn }
output "pdf_generator_invoke_arn"         { value = aws_lambda_function.pdf_generator.invoke_arn }

output "cpd_auto_log_function_name"       { value = aws_lambda_function.cpd_auto_log.function_name }
output "cpd_auto_log_function_arn"        { value = aws_lambda_function.cpd_auto_log.arn }
output "cpd_auto_log_invoke_arn"          { value = aws_lambda_function.cpd_auto_log.invoke_arn }

output "personalize_ingest_function_name" { value = aws_lambda_function.personalize_ingest.function_name }
output "personalize_ingest_function_arn"  { value = aws_lambda_function.personalize_ingest.arn }
output "personalize_ingest_invoke_arn"    { value = aws_lambda_function.personalize_ingest.invoke_arn }

output "all_function_arns" {
  value = [
    aws_lambda_function.pdf_generator.arn,
    aws_lambda_function.cpd_auto_log.arn,
    aws_lambda_function.personalize_ingest.arn,
  ]
}

output "all_invoke_arns" {
  value = {
    pdf_generator      = aws_lambda_function.pdf_generator.invoke_arn
    cpd_auto_log       = aws_lambda_function.cpd_auto_log.invoke_arn
    personalize_ingest = aws_lambda_function.personalize_ingest.invoke_arn
  }
}
