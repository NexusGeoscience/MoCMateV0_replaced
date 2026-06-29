# ─────────────────────────────────────────────────────────────────────────────
# AppSync GraphQL API — Auth0 JWT authorisation
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix = "moc-mate-${var.environment}"
}

# ── API ───────────────────────────────────────────────────────────────────────
resource "aws_appsync_graphql_api" "main" {
  name                = "${local.prefix}-api"
  authentication_type = "OPENID_CONNECT"

  openid_connect_config {
    issuer    = var.auth0_issuer_url
    auth_ttl  = 3600000   # 1 hour in ms
    iat_ttl   = 3600000
  }

  # Secondary auth mode for admin mutations (same Auth0 tenant)
  additional_authentication_provider {
    authentication_type = "OPENID_CONNECT"
    openid_connect_config {
      issuer = var.auth0_issuer_url
    }
  }

  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs.arn
    field_log_level          = var.environment == "prod" ? "ERROR" : "ALL"
    exclude_verbose_content  = var.environment == "prod"
  }

  xray_enabled = true

  schema = file("${path.module}/../../../graphql/schema.graphql")

  tags = { Name = "${local.prefix}-api" }
}

# ── CloudWatch Logs role ──────────────────────────────────────────────────────
resource "aws_iam_role" "appsync_logs" {
  name = "${local.prefix}-appsync-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "appsync_logs" {
  role       = aws_iam_role.appsync_logs.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"
}

# ── IAM role for AppSync → DynamoDB resolvers ─────────────────────────────────
resource "aws_iam_role" "appsync_dynamodb" {
  name = "${local.prefix}-appsync-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_dynamodb" {
  name = "appsync-dynamodb-policy"
  role = aws_iam_role.appsync_dynamodb.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ]
      Resource = concat(
        var.dynamodb_table_arns,
        [for arn in var.dynamodb_table_arns : "${arn}/index/*"]
      )
    }]
  })
}

# ── IAM role for AppSync → Lambda resolvers ───────────────────────────────────
resource "aws_iam_role" "appsync_lambda" {
  name = "${local.prefix}-appsync-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "appsync.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "appsync_lambda" {
  name = "appsync-lambda-policy"
  role = aws_iam_role.appsync_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["lambda:InvokeFunction"]
      Resource = var.lambda_function_arns
    }]
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# Data Sources
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_appsync_datasource" "users" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "UsersTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.users_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "cpd_activities" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "CpdActivitiesTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.cpd_activities_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "drafts" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "DraftsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.drafts_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "lessons" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "LessonsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.lessons_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "lesson_completions" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "LessonCompletionsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.lesson_completions_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "export_presets" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "ExportPresetsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.export_presets_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "user_groups" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "UserGroupsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.user_groups_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "pdf_generator_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "PdfGeneratorLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_lambda.arn
  lambda_config {
    function_arn = var.pdf_lambda_invoke_arn
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Resolvers — direct Lambda for mutations that need compute
# ─────────────────────────────────────────────────────────────────────────────

# exportCpdReport → PDF generator Lambda
resource "aws_appsync_resolver" "export_cpd_report" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "exportCpdReport"
  data_source = aws_appsync_datasource.pdf_generator_lambda.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/export-cpd-report-request.vtl")
  response_template = file("${path.module}/resolvers/lambda-response.vtl")
}

# listCpdActivities — DynamoDB Query resolver
resource "aws_appsync_resolver" "list_cpd_activities" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listCpdActivities"
  data_source = aws_appsync_datasource.cpd_activities.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/list-cpd-activities-request.vtl")
  response_template = file("${path.module}/resolvers/list-response.vtl")
}

# getCpdActivity — DynamoDB GetItem
resource "aws_appsync_resolver" "get_cpd_activity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getCpdActivity"
  data_source = aws_appsync_datasource.cpd_activities.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/get-cpd-activity-request.vtl")
  response_template = file("${path.module}/resolvers/item-response.vtl")
}

# createCpdActivity
resource "aws_appsync_resolver" "create_cpd_activity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createCpdActivity"
  data_source = aws_appsync_datasource.cpd_activities.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/create-cpd-activity-request.vtl")
  response_template = file("${path.module}/resolvers/item-response.vtl")
}

# updateCpdActivity
resource "aws_appsync_resolver" "update_cpd_activity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateCpdActivity"
  data_source = aws_appsync_datasource.cpd_activities.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/update-cpd-activity-request.vtl")
  response_template = file("${path.module}/resolvers/item-response.vtl")
}

# deleteCpdActivity
resource "aws_appsync_resolver" "delete_cpd_activity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteCpdActivity"
  data_source = aws_appsync_datasource.cpd_activities.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/delete-cpd-activity-request.vtl")
  response_template = file("${path.module}/resolvers/delete-response.vtl")
}

# listDrafts
resource "aws_appsync_resolver" "list_drafts" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listDrafts"
  data_source = aws_appsync_datasource.drafts.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/list-drafts-request.vtl")
  response_template = file("${path.module}/resolvers/list-response.vtl")
}

# saveDraft
resource "aws_appsync_resolver" "save_draft" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "saveDraft"
  data_source = aws_appsync_datasource.drafts.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/save-draft-request.vtl")
  response_template = file("${path.module}/resolvers/item-response.vtl")
}

# deleteDraft
resource "aws_appsync_resolver" "delete_draft" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "deleteDraft"
  data_source = aws_appsync_datasource.drafts.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/delete-draft-request.vtl")
  response_template = file("${path.module}/resolvers/delete-response.vtl")
}

# listLessons
resource "aws_appsync_resolver" "list_lessons" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listLessons"
  data_source = aws_appsync_datasource.lessons.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/list-lessons-request.vtl")
  response_template = file("${path.module}/resolvers/list-response.vtl")
}

# getLesson
resource "aws_appsync_resolver" "get_lesson" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getLesson"
  data_source = aws_appsync_datasource.lessons.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/get-lesson-request.vtl")
  response_template = file("${path.module}/resolvers/item-response.vtl")
}

# listExportPresets
resource "aws_appsync_resolver" "list_export_presets" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listExportPresets"
  data_source = aws_appsync_datasource.export_presets.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/list-export-presets-request.vtl")
  response_template = file("${path.module}/resolvers/list-response.vtl")
}
