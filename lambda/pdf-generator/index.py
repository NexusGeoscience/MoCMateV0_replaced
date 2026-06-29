"""
PDF Generator Lambda — triggered by AppSync mutation `exportCpdReport`.
Queries CPD activities by date range and category, generates a PDF report,
uploads to S3, and returns a pre-signed download URL.
"""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import boto3
from boto3.dynamodb.conditions import Key, Attr

# ── Config from environment ───────────────────────────────────────────────────
CPD_TABLE = os.environ["CPD_ACTIVITIES_TABLE"]
PDF_BUCKET = os.environ["PDF_EXPORTS_BUCKET"]
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

cpd_table = dynamodb.Table(CPD_TABLE)


def handler(event, context):
    """
    Payload shape (from AppSync VTL):
    {
      "userId": "auth0|...",
      "operation": "exportCpdReport",
      "input": {
        "dateRangeStart": "2024-01-01",
        "dateRangeEnd": "2024-12-31",
        "categoryIds": ["cat-1", "cat-2"],
        "formatStyle": "DETAILED",
        "includeSections": {"summary": true, "details": true},
        "presetId": null
      }
    }
    """
    user_id = event["userId"]
    export_input = event.get("input", {})

    # 1. Query activities
    activities = _query_activities(user_id, export_input)

    # 2. Generate PDF content (simple text-based PDF for MVP)
    pdf_bytes = _generate_pdf(user_id, activities, export_input)

    # 3. Upload to S3
    file_key = _upload_pdf(user_id, pdf_bytes)

    # 4. Generate pre-signed URL (valid 1 hour)
    download_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": PDF_BUCKET, "Key": file_key},
        ExpiresIn=3600,
    )

    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

    return {
        "downloadUrl": download_url,
        "expiresAt": expires_at,
        "fileName": file_key.split("/")[-1],
    }


def _query_activities(user_id: str, export_input: dict) -> list:
    """Query CPD activities for the given user, filtered by date range and categories."""
    date_start = export_input.get("dateRangeStart")
    date_end = export_input.get("dateRangeEnd")
    category_ids = export_input.get("categoryIds") or []

    # Use the date index for date-range queries
    if date_start and date_end:
        response = cpd_table.query(
            IndexName="userId-activityDate-index",
            KeyConditionExpression=Key("userId").eq(user_id)
            & Key("activityDate").between(date_start, date_end),
        )
    else:
        response = cpd_table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
        )

    items = response.get("Items", [])

    # Client-side filter by category if requested
    if category_ids:
        items = [i for i in items if i.get("categoryId") in category_ids]

    # Sort by date descending
    items.sort(key=lambda x: x.get("activityDate", ""), reverse=True)
    return items


def _generate_pdf(user_id: str, activities: list, export_input: dict) -> bytes:
    """
    Generate a PDF report. For MVP, uses reportlab-style simple text generation.
    In production, swap with WeasyPrint or a dedicated PDF template engine.
    """
    format_style = export_input.get("formatStyle", "SUMMARY")
    sections = export_input.get("includeSections") or {}

    # Simple text-based PDF generation using built-in libraries
    # For production, use a Lambda Layer with reportlab or WeasyPrint
    lines = []
    lines.append("=" * 60)
    lines.append("CPD ACTIVITY REPORT")
    lines.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append(f"User: {user_id}")
    lines.append("=" * 60)
    lines.append("")

    # Summary section
    total_hours = sum(float(a.get("hours", 0)) for a in activities)
    lines.append(f"Total Activities: {len(activities)}")
    lines.append(f"Total CPD Hours: {total_hours:.1f}")
    lines.append("")

    if format_style == "DETAILED":
        lines.append("-" * 60)
        lines.append("DETAILED ACTIVITY LOG")
        lines.append("-" * 60)
        for a in activities:
            lines.append(f"\n  Activity: {a.get('name', 'Untitled')}")
            lines.append(f"  Date: {a.get('activityDate', 'N/A')}")
            lines.append(f"  Hours: {a.get('hours', 0)}")
            lines.append(f"  Category: {a.get('categoryId', 'N/A')}")
            if a.get("description"):
                lines.append(f"  Description: {a['description']}")
            lines.append("")

    # Convert to simple PDF format (text/plain for MVP)
    # TODO: Replace with proper PDF generation library in Lambda Layer
    content = "\n".join(lines)
    return content.encode("utf-8")


def _upload_pdf(user_id: str, pdf_bytes: bytes) -> str:
    """Upload PDF to S3 and return the object key."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    file_name = f"cpd-report-{timestamp}-{uuid.uuid4().hex[:8]}.txt"
    file_key = f"exports/{user_id}/{file_name}"

    s3.put_object(
        Bucket=PDF_BUCKET,
        Key=file_key,
        Body=pdf_bytes,
        ContentType="text/plain",
        ServerSideEncryption="AES256",
        Metadata={
            "userId": user_id,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        },
    )
    return file_key
