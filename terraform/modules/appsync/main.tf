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

resource "aws_appsync_datasource" "subscriptions" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "SubscriptionsTable"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = aws_iam_role.appsync_dynamodb.arn
  dynamodb_config {
    table_name = var.subscriptions_table_name
    region     = "ap-southeast-2"
  }
}

resource "aws_appsync_datasource" "subscription_lambda" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "SubscriptionLambda"
  type             = "AWS_LAMBDA"
  service_role_arn = aws_iam_role.appsync_lambda.arn
  lambda_config {
    function_arn = var.subscription_lambda_arn
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
# Subscription resolvers (NOT gated, so an expired user can see the paywall,
# subscribe and restore purchases)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_appsync_resolver" "get_subscription_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getSubscriptionStatus"
  data_source = aws_appsync_datasource.subscription_lambda.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/subscription-request.vtl")
  response_template = file("${path.module}/resolvers/lambda-response.vtl")
}

resource "aws_appsync_resolver" "verify_purchase" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "verifyPurchase"
  data_source = aws_appsync_datasource.subscription_lambda.name
  kind        = "UNIT"

  request_template  = file("${path.module}/resolvers/subscription-request.vtl")
  response_template = file("${path.module}/resolvers/lambda-response.vtl")
}

# ─────────────────────────────────────────────────────────────────────────────
# Gated resolvers: everything else in the app.
# Each is a PIPELINE: check-entitlement first, then the real data operation.
# A user whose free trial and paid subscription have both ended gets a
# "SubscriptionRequired" error instead of data.
# Any new user-facing resolver MUST be added to this map, not as a UNIT resolver.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_appsync_function" "check_entitlement" {
  api_id                    = aws_appsync_graphql_api.main.id
  name                      = "checkEntitlement"
  data_source               = aws_appsync_datasource.subscriptions.name
  function_version          = "2018-05-29"
  request_mapping_template  = templatefile("${path.module}/resolvers/check-entitlement-request.vtl.tftpl", {
    trial_seconds = var.trial_days * 86400
  })
  response_mapping_template = file("${path.module}/resolvers/check-entitlement-response.vtl")
}

locals {
  gated_resolvers = {
    # CPD activities
    listCpdActivities = { type = "Query",    data_source = aws_appsync_datasource.cpd_activities.name, request = "list-cpd-activities-request.vtl",  response = "list-response.vtl" }
    getCpdActivity    = { type = "Query",    data_source = aws_appsync_datasource.cpd_activities.name, request = "get-cpd-activity-request.vtl",     response = "item-response.vtl" }
    createCpdActivity = { type = "Mutation", data_source = aws_appsync_datasource.cpd_activities.name, request = "create-cpd-activity-request.vtl",  response = "item-response.vtl" }
    updateCpdActivity = { type = "Mutation", data_source = aws_appsync_datasource.cpd_activities.name, request = "update-cpd-activity-request.vtl",  response = "item-response.vtl" }
    deleteCpdActivity = { type = "Mutation", data_source = aws_appsync_datasource.cpd_activities.name, request = "delete-cpd-activity-request.vtl",  response = "delete-response.vtl" }
    # Drafts
    listDrafts  = { type = "Query",    data_source = aws_appsync_datasource.drafts.name, request = "list-drafts-request.vtl",  response = "list-response.vtl" }
    saveDraft   = { type = "Mutation", data_source = aws_appsync_datasource.drafts.name, request = "save-draft-request.vtl",   response = "item-response.vtl" }
    deleteDraft = { type = "Mutation", data_source = aws_appsync_datasource.drafts.name, request = "delete-draft-request.vtl", response = "delete-response.vtl" }
    # Lessons
    listLessons = { type = "Query", data_source = aws_appsync_datasource.lessons.name, request = "list-lessons-request.vtl", response = "list-response.vtl" }
    getLesson   = { type = "Query", data_source = aws_appsync_datasource.lessons.name, request = "get-lesson-request.vtl",   response = "item-response.vtl" }
    # Export
    listExportPresets = { type = "Query",    data_source = aws_appsync_datasource.export_presets.name,       request = "list-export-presets-request.vtl", response = "list-response.vtl" }
    exportCpdReport   = { type = "Mutation", data_source = aws_appsync_datasource.pdf_generator_lambda.name, request = "export-cpd-report-request.vtl",   response = "lambda-response.vtl" }
  }
}

resource "aws_appsync_function" "gated" {
  for_each = local.gated_resolvers

  api_id                    = aws_appsync_graphql_api.main.id
  name                      = each.key
  data_source               = each.value.data_source
  function_version          = "2018-05-29"
  request_mapping_template  = file("${path.module}/resolvers/${each.value.request}")
  response_mapping_template = file("${path.module}/resolvers/${each.value.response}")
}

resource "aws_appsync_resolver" "gated" {
  for_each = local.gated_resolvers

  api_id = aws_appsync_graphql_api.main.id
  type   = each.value.type
  field  = each.key
  kind   = "PIPELINE"

  request_template  = "{}"
  response_template = "$util.toJson($ctx.prev.result)"

  pipeline_config {
    functions = [
      aws_appsync_function.check_entitlement.function_id,
      aws_appsync_function.gated[each.key].function_id,
    ]
  }
}

# The resolvers above used to be individual UNIT resolvers; move them in
# state so Terraform updates each in place instead of deleting and recreating
# (two resolvers cannot exist for the same field at once).
moved {
  from = aws_appsync_resolver.list_cpd_activities
  to   = aws_appsync_resolver.gated["listCpdActivities"]
}
moved {
  from = aws_appsync_resolver.get_cpd_activity
  to   = aws_appsync_resolver.gated["getCpdActivity"]
}
moved {
  from = aws_appsync_resolver.create_cpd_activity
  to   = aws_appsync_resolver.gated["createCpdActivity"]
}
moved {
  from = aws_appsync_resolver.update_cpd_activity
  to   = aws_appsync_resolver.gated["updateCpdActivity"]
}
moved {
  from = aws_appsync_resolver.delete_cpd_activity
  to   = aws_appsync_resolver.gated["deleteCpdActivity"]
}
moved {
  from = aws_appsync_resolver.list_drafts
  to   = aws_appsync_resolver.gated["listDrafts"]
}
moved {
  from = aws_appsync_resolver.save_draft
  to   = aws_appsync_resolver.gated["saveDraft"]
}
moved {
  from = aws_appsync_resolver.delete_draft
  to   = aws_appsync_resolver.gated["deleteDraft"]
}
moved {
  from = aws_appsync_resolver.list_lessons
  to   = aws_appsync_resolver.gated["listLessons"]
}
moved {
  from = aws_appsync_resolver.get_lesson
  to   = aws_appsync_resolver.gated["getLesson"]
}
moved {
  from = aws_appsync_resolver.list_export_presets
  to   = aws_appsync_resolver.gated["listExportPresets"]
}
moved {
  from = aws_appsync_resolver.export_cpd_report
  to   = aws_appsync_resolver.gated["exportCpdReport"]
}
