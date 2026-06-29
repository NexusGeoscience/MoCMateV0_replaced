# ─────────────────────────────────────────────────────────────────────────────
# VPC Gateway Endpoints for S3 and DynamoDB
# These are free and avoid NAT Gateway costs for Lambda → S3/DynamoDB traffic.
# Lambda functions are deployed outside a VPC (default for serverless-first).
# The endpoints are created on the default VPC for completeness and to support
# any future VPC-based compute.
# ─────────────────────────────────────────────────────────────────────────────

data "aws_vpc" "default" {
  default = true
}

data "aws_route_tables" "default" {
  vpc_id = data.aws_vpc.default.id
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.default.ids

  tags = {
    Name        = "moc-mate-${var.environment}-s3-endpoint"
    Environment = var.environment
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.default.ids

  tags = {
    Name        = "moc-mate-${var.environment}-dynamodb-endpoint"
    Environment = var.environment
  }
}
