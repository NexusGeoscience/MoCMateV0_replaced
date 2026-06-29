"""
Personalize Event Ingest Lambda — records lesson interaction events
(views, starts, completions) into Amazon Personalize for recommendations.
"""

import os
import time

import boto3

# ── Config ────────────────────────────────────────────────────────────────────
TRACKING_ID = os.environ.get("PERSONALIZE_EVENT_TRACKER_ARN", "")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")

personalize_events = boto3.client("personalize-events")


def handler(event, context):
    """
    Payload:
    {
      "userId": "auth0|...",
      "lessonId": "lesson-123",
      "eventType": "view" | "start" | "complete",
      "sessionId": "optional-session-id"
    }
    """
    user_id = event["userId"]
    lesson_id = event["lessonId"]
    event_type = event.get("eventType", "view")
    session_id = event.get("sessionId", f"session-{user_id}")

    if not TRACKING_ID:
        # Personalize not configured yet — log and return silently
        print(
            f"[{ENVIRONMENT}] Personalize not configured. "
            f"Skipping event: user={user_id}, lesson={lesson_id}, type={event_type}"
        )
        return {"success": True, "message": "Personalize not configured, event logged locally"}

    # Extract tracking ID from ARN
    # ARN format: arn:aws:personalize:region:account:event-tracker/tracker-id
    tracking_id = TRACKING_ID.split("/")[-1] if "/" in TRACKING_ID else TRACKING_ID

    try:
        personalize_events.put_events(
            trackingId=tracking_id,
            userId=user_id,
            sessionId=session_id,
            eventList=[
                {
                    "sentAt": int(time.time()),
                    "eventType": event_type,
                    "itemId": lesson_id,
                    "properties": f'{{"lessonId": "{lesson_id}", "eventSource": "moc-mate-app"}}',
                }
            ],
        )
    except Exception as e:
        # Don't fail the request if Personalize ingestion fails
        print(f"[ERROR] Personalize put_events failed: {str(e)}")
        return {"success": False, "error": str(e)}

    return {"success": True}
