# ─────────────────────────────────────────────────────────────────────────────
# Bootstrap: creates the S3 state buckets + DynamoDB lock table.
# Run this ONCE before initialising any environment.
# Usage:
#   cd terraform/backend
#   terraform init
#   terraform apply -var="environment=dev"
#   terraform apply -var="environment=prod"
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-2"
}

variable "environment" {
  type = string
}

# ── State bucket ──────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "tf_state" {
  bucket        = "moc-mate-terraform-state-${var.environment}"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state" {
  bucket                  = aws_s3_bucket.tf_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Lock table (shared across envs) ──────────────────────────────────────────
resource "aws_dynamodb_table" "tf_locks" {
  name         = "moc-mate-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}
