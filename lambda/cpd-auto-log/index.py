"""
CPD Auto-Log Lambda — triggered by AppSync mutation `completeLesson`.
Creates a locked CPD activity entry from lesson metadata.
Also records the lesson completion in the lesson_completions table.
"""

import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

# ── Config ────────────────────────────────────────────────────────────────────
LESSONS_TABLE = os.environ["LESSONS_TABLE"]
CPD_ACTIVITIES_TABLE = os.environ["CPD_ACTIVITIES_TABLE"]
LESSON_COMPLETIONS_TABLE = os.environ["LESSON_COMPLETIONS_TABLE"]

dynamodb = boto3.resource("dynamodb")
lessons_table = dynamodb.Table(LESSONS_TABLE)
cpd_table = dynamodb.Table(CPD_ACTIVITIES_TABLE)
completions_table = dynamodb.Table(LESSON_COMPLETIONS_TABLE)


def handler(event, context):
    """
    Called by AppSync resolver or directly.
    Payload:
    {
      "userId": "auth0|...",
      "lessonId": "lesson-123"
    }
    """
    user_id = event["userId"]
    lesson_id = event["lessonId"]

    # 1. Get lesson metadata
    lesson = lessons_table.get_item(Key={"lessonId": lesson_id}).get("Item")
    if not lesson:
        raise ValueError(f"Lesson not found: {lesson_id}")

    # 2. Check if already completed (idempotency)
    existing = completions_table.get_item(
        Key={"userId": user_id, "lessonId": lesson_id}
    ).get("Item")
    if existing:
        return {
            "userId": user_id,
            "lessonId": lesson_id,
            "completedAt": existing["completedAt"],
            "cpdActivityId": existing["cpdActivityId"],
        }

    now = datetime.now(timezone.utc).isoformat()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    activity_id = str(uuid.uuid4())

    # 3. Create locked CPD activity
    cpd_table.put_item(
        Item={
            "userId": user_id,
            "activityId": activity_id,
            "name": f"Lesson: {lesson.get('title', 'Untitled')}",
            "description": lesson.get("description", ""),
            "categoryId": lesson.get("categoryId", "general"),
            "activityDate": today,
            "hours": float(lesson.get("cpdCreditHours", 0)),
            "isLocked": True,
            "sourceLesson": lesson_id,
            "customFields": {},
            "createdAt": now,
            "updatedAt": now,
        }
    )

    # 4. Record completion
    completions_table.put_item(
        Item={
            "userId": user_id,
            "lessonId": lesson_id,
            "completedAt": now,
            "cpdActivityId": activity_id,
        }
    )

    return {
        "userId": user_id,
        "lessonId": lesson_id,
        "completedAt": now,
        "cpdActivityId": activity_id,
    }
