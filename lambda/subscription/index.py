"""
Subscription Lambda: the single source of truth for who may use MoC-mate.

Access rule: a user may use the app while EITHER
  * their free trial has not ended (trialEndsAt), OR
  * they hold a paid App Store / Google Play subscription (entitlementExpiresAt).

Every gated AppSync resolver runs a pipeline function that reads the same
record, so these two timestamps are what actually lock or unlock the API.

Invoked two ways:
  1. AppSync (direct Lambda resolver)
       operation = "getSubscriptionStatus" | "verifyPurchase"
  2. Lambda Function URL (store server-to-server notifications)
       POST /apple   App Store Server Notifications V2
       POST /google  Google Play Real-time Developer Notifications (Pub/Sub push)

Store notifications are treated only as a hint: we never trust their body,
we re-fetch the subscription from Apple / Google's API and store that.
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

# Third-party packages (PyJWT + cryptography) are vendored by build.sh
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))

import boto3  # noqa: E402
import jwt  # noqa: E402  (PyJWT, from vendor/)
from boto3.dynamodb.conditions import Key  # noqa: E402

# ── Config ────────────────────────────────────────────────────────────────────
SUBSCRIPTIONS_TABLE = os.environ["SUBSCRIPTIONS_TABLE"]
TRIAL_DAYS = int(os.environ.get("TRIAL_DAYS", "30"))

APPLE_BUNDLE_ID = os.environ.get("APPLE_BUNDLE_ID", "")
APPLE_ISSUER_ID = os.environ.get("APPLE_ISSUER_ID", "")
APPLE_KEY_ID = os.environ.get("APPLE_KEY_ID", "")
APPLE_PRIVATE_KEY_SECRET_ARN = os.environ.get("APPLE_PRIVATE_KEY_SECRET_ARN", "")

ANDROID_PACKAGE_NAME = os.environ.get("ANDROID_PACKAGE_NAME", "")
GOOGLE_SERVICE_ACCOUNT_SECRET_ARN = os.environ.get("GOOGLE_SERVICE_ACCOUNT_SECRET_ARN", "")

# Product IDs that unlock the app (comma-separated). Empty = accept any product
# belonging to this app's bundle / package.
ALLOWED_PRODUCT_IDS = {
    p.strip() for p in os.environ.get("ALLOWED_PRODUCT_IDS", "").split(",") if p.strip()
}

APPLE_PROD_HOST = "https://api.storekit.itunes.apple.com"
APPLE_SANDBOX_HOST = "https://api.storekit-sandbox.itunes.apple.com"
GOOGLE_API = "https://androidpublisher.googleapis.com/androidpublisher/v3"

# Namespace for deriving a stable per-user UUID. The app attaches this UUID to
# every purchase (iOS appAccountToken / Android obfuscatedAccountId) so a
# receipt can only ever unlock the MoC-mate account that bought it.
ACCOUNT_TOKEN_NAMESPACE = uuid.UUID("6f1d2c1e-8a8b-4f7e-9d59-2f3f7f0b6a11")

dynamodb = boto3.resource("dynamodb")
secrets = boto3.client("secretsmanager")
table = dynamodb.Table(SUBSCRIPTIONS_TABLE)

_secret_cache: dict = {}
_google_token: dict = {"value": None, "expires": 0}


class PurchaseError(Exception):
    """A purchase that cannot unlock this account. Message is shown to the user."""


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────
def handler(event, context):
    if "requestContext" in event and "http" in event.get("requestContext", {}):
        return _handle_store_notification(event)

    operation = event.get("operation")
    user_id = event.get("userId")
    if not user_id:
        raise Exception("Unauthorised")

    if operation == "getSubscriptionStatus":
        return get_subscription_status(user_id)
    if operation == "verifyPurchase":
        return verify_purchase(user_id, event.get("input") or {})
    raise Exception(f"Unknown operation: {operation}")


# ─────────────────────────────────────────────────────────────────────────────
# AppSync operations
# ─────────────────────────────────────────────────────────────────────────────
def get_subscription_status(user_id):
    record = _ensure_record(user_id)

    # A paid period has lapsed: ask the store whether it renewed before we
    # tell the app to show the paywall.
    now = int(time.time())
    if record.get("storeRef") and int(record.get("entitlementExpiresAt", 0)) <= now:
        try:
            record = _refresh_from_store(record)
        except Exception as exc:  # store unreachable: fall back to what we have
            print(json.dumps({"level": "WARN", "msg": "store refresh failed", "error": str(exc)}))

    return _to_graphql(record)


def verify_purchase(user_id, purchase):
    platform = purchase.get("platform")
    product_id = purchase.get("productId")
    record = _ensure_record(user_id)
    expected_token = account_token(user_id)

    # PurchaseError messages reach the app as the GraphQL error message.
    if platform == "IOS":
        transaction_id = purchase.get("transactionId")
        if not transaction_id:
            raise PurchaseError("Missing App Store transaction.")
        state = _apple_subscription_state(transaction_id)
    elif platform == "ANDROID":
        token = purchase.get("purchaseToken")
        if not token:
            raise PurchaseError("Missing Google Play purchase token.")
        state = _google_subscription_state(token, product_id)
    else:
        raise PurchaseError("Unsupported platform.")

    if state["accountToken"] and state["accountToken"] != expected_token:
        raise PurchaseError(
            "This subscription belongs to a different MoC-mate account. "
            "Sign in with the account that purchased it."
        )
    if ALLOWED_PRODUCT_IDS and state["productId"] not in ALLOWED_PRODUCT_IDS:
        raise PurchaseError("This product does not unlock MoC-mate.")

    if platform == "ANDROID":
        _google_acknowledge(state)

    record = _save_state(user_id, platform, state)
    return _to_graphql(record)


# ─────────────────────────────────────────────────────────────────────────────
# Store notifications (Lambda Function URL)
# ─────────────────────────────────────────────────────────────────────────────
def _handle_store_notification(event):
    path = event.get("rawPath", "")
    body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode()

    try:
        payload = json.loads(body or "{}")
        if path.endswith("/apple"):
            _on_apple_notification(payload)
        elif path.endswith("/google"):
            _on_google_notification(payload)
        else:
            return {"statusCode": 404, "body": "not found"}
    except Exception as exc:
        # Log and return 200 so the store does not retry forever on a payload
        # we can never process. Real failures to reach the store API are
        # re-raised below so the store retries.
        print(json.dumps({"level": "ERROR", "msg": "notification failed", "error": str(exc)}))
        if isinstance(exc, (urllib.error.URLError, TimeoutError)):
            return {"statusCode": 500, "body": "retry"}
    return {"statusCode": 200, "body": "ok"}


def _on_apple_notification(payload):
    # Body is unverified, so only use it to find which subscription changed.
    notification = _jws_payload(payload["signedPayload"])
    data = notification.get("data", {})
    if APPLE_BUNDLE_ID and data.get("bundleId") != APPLE_BUNDLE_ID:
        return
    signed_txn = data.get("signedTransactionInfo")
    if not signed_txn:
        return
    original_id = _jws_payload(signed_txn).get("originalTransactionId")
    record = _find_by_store_ref(f"IOS#{original_id}")
    if record:
        _refresh_from_store(record)


def _on_google_notification(payload):
    message = payload.get("message", {})
    data = json.loads(base64.b64decode(message.get("data", "")) or "{}")
    if ANDROID_PACKAGE_NAME and data.get("packageName") != ANDROID_PACKAGE_NAME:
        return
    sub = data.get("subscriptionNotification")
    if not sub:
        return  # test / one-time-product notifications
    record = _find_by_store_ref(f"ANDROID#{sub['purchaseToken']}")
    if record:
        _refresh_from_store(record)


# ─────────────────────────────────────────────────────────────────────────────
# Records
# ─────────────────────────────────────────────────────────────────────────────
def account_token(user_id):
    return str(uuid.uuid5(ACCOUNT_TOKEN_NAMESPACE, user_id))


def _ensure_record(user_id):
    """Create the record (starting the free trial) the first time we see a user.

    Uses if_not_exists so this is safe to call on every request, and matches
    the check-entitlement AppSync function exactly.
    """
    now = int(time.time())
    resp = table.update_item(
        Key={"userId": user_id},
        UpdateExpression=(
            "SET trialStartedAt = if_not_exists(trialStartedAt, :now), "
            "trialEndsAt = if_not_exists(trialEndsAt, :trialEnd)"
        ),
        ExpressionAttributeValues={":now": now, ":trialEnd": now + TRIAL_DAYS * 86400},
        ReturnValues="ALL_NEW",
    )
    return resp["Attributes"]


def _save_state(user_id, platform, state):
    now = int(time.time())
    resp = table.update_item(
        Key={"userId": user_id},
        UpdateExpression=(
            "SET platform = :platform, productId = :productId, storeRef = :storeRef, "
            "storeStatus = :status, entitlementExpiresAt = :expires, "
            "autoRenewing = :autoRenew, updatedAt = :now"
        ),
        ExpressionAttributeValues={
            ":platform": platform,
            ":productId": state["productId"],
            ":storeRef": state["storeRef"],
            ":status": state["status"],
            ":expires": state["entitlementExpiresAt"],
            ":autoRenew": state["autoRenewing"],
            ":now": now,
        },
        ReturnValues="ALL_NEW",
    )
    return resp["Attributes"]


def _refresh_from_store(record):
    platform, _, ref = record["storeRef"].partition("#")
    if platform == "IOS":
        state = _apple_subscription_state(ref)
    else:
        state = _google_subscription_state(ref, record.get("productId"))
    return _save_state(record["userId"], platform, state)


def _find_by_store_ref(store_ref):
    resp = table.query(
        IndexName="storeRef-index",
        KeyConditionExpression=Key("storeRef").eq(store_ref),
        Limit=1,
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def _to_graphql(record):
    now = int(time.time())
    trial_ends = int(record.get("trialEndsAt", 0))
    paid_ends = int(record.get("entitlementExpiresAt", 0))

    if paid_ends > now:
        status = record.get("storeStatus", "ACTIVE")
    elif trial_ends > now:
        status = "TRIAL"
    else:
        status = "EXPIRED"

    return {
        "status": status,
        "isEntitled": paid_ends > now or trial_ends > now,
        "trialEndsAt": _iso(trial_ends),
        "expiresAt": _iso(paid_ends) if paid_ends else None,
        "autoRenewing": bool(record.get("autoRenewing", False)),
        "platform": record.get("platform"),
        "productId": record.get("productId"),
        "appAccountToken": account_token(record["userId"]),
    }


def _iso(epoch):
    return datetime.fromtimestamp(int(epoch), tz=timezone.utc).isoformat().replace("+00:00", "Z")


# ─────────────────────────────────────────────────────────────────────────────
# Apple: App Store Server API
# ─────────────────────────────────────────────────────────────────────────────
def _apple_jwt():
    now = int(time.time())
    return jwt.encode(
        {
            "iss": APPLE_ISSUER_ID,
            "iat": now,
            "exp": now + 1200,
            "aud": "appstoreconnect-v1",
            "bid": APPLE_BUNDLE_ID,
        },
        _secret(APPLE_PRIVATE_KEY_SECRET_ARN),
        algorithm="ES256",
        headers={"kid": APPLE_KEY_ID, "typ": "JWT"},
    )


def _apple_get(path):
    """Call production first; fall back to sandbox (TestFlight / review builds)."""
    headers = {"Authorization": f"Bearer {_apple_jwt()}"}
    try:
        return _http_json("GET", APPLE_PROD_HOST + path, headers=headers)
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise
    try:
        return _http_json("GET", APPLE_SANDBOX_HOST + path, headers=headers)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise PurchaseError("App Store could not find this purchase.")
        raise


def _apple_subscription_state(transaction_id):
    resp = _apple_get(f"/inApps/v1/subscriptions/{urllib.parse.quote(transaction_id)}")
    if APPLE_BUNDLE_ID and resp.get("bundleId") not in (None, APPLE_BUNDLE_ID):
        raise PurchaseError("This purchase is for a different app.")

    # Pick the subscription in the response that grants access the longest.
    best = None
    for group in resp.get("data", []):
        for last in group.get("lastTransactions", []):
            txn = _jws_payload(last["signedTransactionInfo"])
            renewal = _jws_payload(last["signedRenewalInfo"]) if last.get("signedRenewalInfo") else {}
            apple_status = last.get("status")  # 1 active, 2 expired, 3 billing retry, 4 grace, 5 revoked

            expires = int(txn.get("expiresDate", 0)) // 1000
            if apple_status == 4 and renewal.get("gracePeriodExpiresDate"):
                expires = int(renewal["gracePeriodExpiresDate"]) // 1000
            if apple_status in (2, 3, 5) or txn.get("revocationDate"):
                expires = min(expires, int(time.time()))

            status = {1: "ACTIVE", 4: "GRACE_PERIOD"}.get(apple_status, "EXPIRED")
            auto_renew = renewal.get("autoRenewStatus") == 1
            if status == "ACTIVE" and not auto_renew:
                status = "CANCELLED"  # still usable until expiresAt

            state = {
                "productId": txn.get("productId"),
                "storeRef": f"IOS#{txn.get('originalTransactionId')}",
                "status": status,
                "entitlementExpiresAt": expires,
                "autoRenewing": auto_renew,
                "accountToken": txn.get("appAccountToken"),
            }
            if best is None or state["entitlementExpiresAt"] > best["entitlementExpiresAt"]:
                best = state

    if best is None:
        raise PurchaseError("No App Store subscription found for this purchase.")
    return best


# ─────────────────────────────────────────────────────────────────────────────
# Google: Play Developer API
# ─────────────────────────────────────────────────────────────────────────────
def _google_access_token():
    if _google_token["value"] and _google_token["expires"] > time.time() + 60:
        return _google_token["value"]

    sa = json.loads(_secret(GOOGLE_SERVICE_ACCOUNT_SECRET_ARN))
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": sa["client_email"],
            "scope": "https://www.googleapis.com/auth/androidpublisher",
            "aud": sa.get("token_uri", "https://oauth2.googleapis.com/token"),
            "iat": now,
            "exp": now + 3600,
        },
        sa["private_key"],
        algorithm="RS256",
        headers={"kid": sa.get("private_key_id")},
    )
    resp = _http_json(
        "POST",
        sa.get("token_uri", "https://oauth2.googleapis.com/token"),
        form={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion},
    )
    _google_token.update(value=resp["access_token"], expires=now + int(resp.get("expires_in", 3600)))
    return _google_token["value"]


def _google_subscription_state(purchase_token, product_id=None):
    url = (
        f"{GOOGLE_API}/applications/{ANDROID_PACKAGE_NAME}"
        f"/purchases/subscriptionsv2/tokens/{urllib.parse.quote(purchase_token, safe='')}"
    )
    try:
        resp = _http_json("GET", url, headers={"Authorization": f"Bearer {_google_access_token()}"})
    except urllib.error.HTTPError as exc:
        if exc.code in (400, 404, 410):
            raise PurchaseError("Google Play could not find this purchase.")
        raise

    line_items = resp.get("lineItems", [])
    if not line_items:
        raise PurchaseError("No Google Play subscription found for this purchase.")
    item = max(line_items, key=lambda li: li.get("expiryTime", ""))
    expires = int(datetime.fromisoformat(item["expiryTime"].replace("Z", "+00:00")).timestamp())
    auto_renew = bool(item.get("autoRenewingPlan", {}).get("autoRenewEnabled"))

    google_state = resp.get("subscriptionState", "")
    status = {
        "SUBSCRIPTION_STATE_ACTIVE": "ACTIVE",
        "SUBSCRIPTION_STATE_CANCELED": "CANCELLED",       # usable until expiry
        "SUBSCRIPTION_STATE_IN_GRACE_PERIOD": "GRACE_PERIOD",
    }.get(google_state, "EXPIRED")
    if status == "EXPIRED":
        # ON_HOLD, PAUSED, PENDING, EXPIRED: no access
        expires = min(expires, int(time.time()))

    return {
        "productId": item.get("productId") or product_id,
        "storeRef": f"ANDROID#{purchase_token}",
        "status": status,
        "entitlementExpiresAt": expires,
        "autoRenewing": auto_renew,
        "accountToken": resp.get("externalAccountIdentifiers", {}).get("obfuscatedExternalAccountId"),
        "acknowledged": resp.get("acknowledgementState") == "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
        "purchaseToken": purchase_token,
    }


def _google_acknowledge(state):
    """Google refunds subscriptions not acknowledged within 3 days."""
    if state.get("acknowledged") or state["status"] == "EXPIRED":
        return
    url = (
        f"{GOOGLE_API}/applications/{ANDROID_PACKAGE_NAME}/purchases/subscriptions/"
        f"{urllib.parse.quote(state['productId'], safe='')}/tokens/"
        f"{urllib.parse.quote(state['purchaseToken'], safe='')}:acknowledge"
    )
    try:
        _http_json("POST", url, headers={"Authorization": f"Bearer {_google_access_token()}"}, body={})
    except urllib.error.HTTPError as exc:
        # The app also acknowledges via finishTransaction; log and carry on.
        print(json.dumps({"level": "WARN", "msg": "acknowledge failed", "code": exc.code}))


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _jws_payload(token):
    """Decode a JWS payload without verifying it.

    Only used on (a) responses fetched directly from Apple over TLS, and
    (b) notification bodies used solely to look up which record to refresh.
    """
    return jwt.decode(token, options={"verify_signature": False})


def _secret(arn):
    if arn not in _secret_cache:
        _secret_cache[arn] = secrets.get_secret_value(SecretId=arn)["SecretString"]
    return _secret_cache[arn]


def _http_json(method, url, headers=None, body=None, form=None):
    headers = dict(headers or {})
    data = None
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else {}
