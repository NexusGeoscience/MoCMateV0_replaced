output "users_table_name"              { value = aws_dynamodb_table.users.name }
output "users_table_arn"               { value = aws_dynamodb_table.users.arn }

output "cpd_activities_table_name"     { value = aws_dynamodb_table.cpd_activities.name }
output "cpd_activities_table_arn"      { value = aws_dynamodb_table.cpd_activities.arn }

output "drafts_table_name"             { value = aws_dynamodb_table.drafts.name }
output "drafts_table_arn"              { value = aws_dynamodb_table.drafts.arn }

output "lessons_table_name"            { value = aws_dynamodb_table.lessons.name }
output "lessons_table_arn"             { value = aws_dynamodb_table.lessons.arn }

output "lesson_completions_table_name" { value = aws_dynamodb_table.lesson_completions.name }
output "lesson_completions_table_arn"  { value = aws_dynamodb_table.lesson_completions.arn }

output "export_presets_table_name"     { value = aws_dynamodb_table.export_presets.name }
output "export_presets_table_arn"      { value = aws_dynamodb_table.export_presets.arn }

output "user_groups_table_name"        { value = aws_dynamodb_table.user_groups.name }
output "user_groups_table_arn"         { value = aws_dynamodb_table.user_groups.arn }

output "categories_table_name"         { value = aws_dynamodb_table.categories.name }
output "categories_table_arn"          { value = aws_dynamodb_table.categories.arn }

output "subscriptions_table_name"      { value = aws_dynamodb_table.subscriptions.name }
output "subscriptions_table_arn"       { value = aws_dynamodb_table.subscriptions.arn }

output "all_table_arns" {
  value = [
    aws_dynamodb_table.users.arn,
    aws_dynamodb_table.cpd_activities.arn,
    aws_dynamodb_table.drafts.arn,
    aws_dynamodb_table.lessons.arn,
    aws_dynamodb_table.lesson_completions.arn,
    aws_dynamodb_table.export_presets.arn,
    aws_dynamodb_table.user_groups.arn,
    aws_dynamodb_table.categories.arn,
    aws_dynamodb_table.subscriptions.arn,
  ]
}

output "all_table_names" {
  value = {
    users              = aws_dynamodb_table.users.name
    cpd_activities     = aws_dynamodb_table.cpd_activities.name
    drafts             = aws_dynamodb_table.drafts.name
    lessons            = aws_dynamodb_table.lessons.name
    lesson_completions = aws_dynamodb_table.lesson_completions.name
    export_presets     = aws_dynamodb_table.export_presets.name
    user_groups        = aws_dynamodb_table.user_groups.name
    categories         = aws_dynamodb_table.categories.name
    subscriptions      = aws_dynamodb_table.subscriptions.name
  }
}
