# ─────────────────────────────────────────────────────────────────────────────
# DynamoDB tables for MoC-mate
# All tables use PAY_PER_REQUEST billing (true serverless, zero idle cost).
# Point-in-time recovery and encryption at rest enabled on every table.
# ─────────────────────────────────────────────────────────────────────────────

locals {
  prefix = "moc-mate-${var.environment}"
}

# ── Users ─────────────────────────────────────────────────────────────────────
# PK: userId (Auth0 sub)
resource "aws_dynamodb_table" "users" {
  name         = "${local.prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  # GSI: look up by email (admin operations)
  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-users" }
}

# ── CPD Activities ─────────────────────────────────────────────────────────────
# PK: userId  SK: activityId (ULID — sortable by creation time)
resource "aws_dynamodb_table" "cpd_activities" {
  name         = "${local.prefix}-cpd-activities"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "activityId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "activityId"
    type = "S"
  }

  # GSI: filter by category within a user's activities
  attribute {
    name = "categoryId"
    type = "S"
  }

  # GSI: sort by activityDate for date-range queries
  attribute {
    name = "activityDate"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-categoryId-index"
    hash_key        = "userId"
    range_key       = "categoryId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "userId-activityDate-index"
    hash_key        = "userId"
    range_key       = "activityDate"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-cpd-activities" }
}

# ── Drafts ────────────────────────────────────────────────────────────────────
# PK: userId  SK: draftId
resource "aws_dynamodb_table" "drafts" {
  name         = "${local.prefix}-drafts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "draftId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "draftId"
    type = "S"
  }

  # TTL: auto-expire very old drafts after 90 days of inactivity
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-drafts" }
}

# ── Lessons ───────────────────────────────────────────────────────────────────
# PK: lessonId   (admin-created, read by all premium users)
resource "aws_dynamodb_table" "lessons" {
  name         = "${local.prefix}-lessons"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "lessonId"

  attribute {
    name = "lessonId"
    type = "S"
  }

  # GSI: browse by category
  attribute {
    name = "categoryId"
    type = "S"
  }

  # GSI: sort within category by publishedAt
  attribute {
    name = "publishedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "categoryId-publishedAt-index"
    hash_key        = "categoryId"
    range_key       = "publishedAt"
    projection_type = "ALL"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-lessons" }
}

# ── Lesson Completions ────────────────────────────────────────────────────────
# PK: userId  SK: lessonId  — one record per user/lesson pair
resource "aws_dynamodb_table" "lesson_completions" {
  name         = "${local.prefix}-lesson-completions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "lessonId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "lessonId"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-lesson-completions" }
}

# ── Export Presets ────────────────────────────────────────────────────────────
# PK: userId  SK: presetId
resource "aws_dynamodb_table" "export_presets" {
  name         = "${local.prefix}-export-presets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "presetId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "presetId"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-export-presets" }
}

# ── User Groups ───────────────────────────────────────────────────────────────
# PK: groupId  (free / standard / premium + any custom admin groups)
resource "aws_dynamodb_table" "user_groups" {
  name         = "${local.prefix}-user-groups"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "groupId"

  attribute {
    name = "groupId"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-user-groups" }
}

# ── CPD Categories ────────────────────────────────────────────────────────────
# PK: categoryId  (admin-managed)
resource "aws_dynamodb_table" "categories" {
  name         = "${local.prefix}-categories"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "categoryId"

  attribute {
    name = "categoryId"
    type = "S"
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption { enabled = true }

  tags = { Name = "${local.prefix}-categories" }
}
