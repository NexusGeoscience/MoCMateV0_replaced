# MoC-mate

**CPD Tracking & Informal eLearning for Mining & Geoscience Professionals**

A cross-platform mobile app (iOS + Android) with a separate admin dashboard for managing
lesson content, CPD categories, and user groups. Built on AWS serverless infrastructure
(AppSync, DynamoDB, Lambda, S3) with Auth0 authentication.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Mobile App (React Native / Expo)          │
│  CPD Tracker  │  Learn Tab            │  Profile / Export        │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │ GraphQL           │ GraphQL           │ GraphQL
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS AppSync (Auth0 JWT)                        │
│  VTL Resolvers → DynamoDB   │   Lambda Resolvers                 │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  DynamoDB    │  │  Lambda Functions │  │  S3 Buckets      │
│  (8 tables)  │  │  • PDF Generator │  │  • Lesson Media  │
│              │  │  • CPD Auto-Log  │  │  • PDF Exports   │
│              │  │  • Personalize   │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │ Amazon Personalize│
                  │ (Recommendations)│
                  └──────────────────┘
```

---

## Project Structure

```
moc-mate/
├── terraform/                  # Infrastructure as Code
│   ├── modules/
│   │   ├── dynamodb/           # 8 DynamoDB tables
│   │   ├── s3/                 # Lesson media + PDF exports buckets
│   │   ├── lambda/             # 3 Lambda functions + IAM roles
│   │   ├── appsync/            # GraphQL API + resolvers
│   │   ├── vpc/                # Gateway endpoints (S3, DynamoDB)
│   │   ├── monitoring/         # CloudWatch alarms + SNS
│   │   └── budgets/            # AWS Budgets alert
│   ├── envs/
│   │   ├── dev/                # Dev environment config
│   │   └── prod/               # Production config
│   └── backend/                # S3 state bucket + DynamoDB lock table
├── graphql/
│   └── schema.graphql          # Full GraphQL schema
├── lambda/
│   ├── pdf-generator/          # CPD report PDF generation
│   ├── cpd-auto-log/           # Auto-log CPD from lesson completion
│   └── personalize-ingest/     # Event ingestion for recommendations
├── mobile/                     # React Native (Expo) mobile app
│   └── src/
│       ├── navigation/         # Tab + stack navigators
│       ├── screens/
│       │   ├── cpd/            # CPD tracker screens
│       │   ├── learn/          # Learn tab screens
│       │   └── profile/        # Profile + export settings
│       ├── services/           # Apollo client, Auth0, subscription / in-app purchase
│       ├── types/              # TypeScript types
│       └── config/             # Environment config
├── admin-dashboard/            # React web app (Vite)
│   └── src/
│       ├── pages/              # Categories, Lessons, UserGroups, ExportDefaults
│       ├── components/         # Layout, shared components
│       └── services/           # Apollo client
└── docs/
    └── scaling.md              # Scaling strategy (10× to 100×)
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| AWS CLI | ≥ 2.x | AWS resource management |
| Terraform | ≥ 1.6 | Infrastructure deployment |
| Node.js | ≥ 18 | Mobile app + admin dashboard |
| Python | ≥ 3.9 | Lambda functions |
| Expo CLI | Latest | React Native development |
| Auth0 account | — | Authentication |

---

## Setup Guide

### 1. AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure
# Verify
aws sts get-caller-identity
```

Ensure the IAM user/role has permissions for: AppSync, DynamoDB, Lambda, S3, IAM,
CloudWatch, Budgets, and VPC.

### 2. Install Terraform

```bash
# macOS
brew install terraform

# Linux
curl -fsSL https://releases.hashicorp.com/terraform/1.8.0/terraform_1.8.0_linux_amd64.zip -o tf.zip
unzip tf.zip && sudo mv terraform /usr/local/bin/

# Verify
terraform version
```

### 3. Bootstrap Terraform State

```bash
cd terraform/backend
terraform init
terraform apply -var="environment=dev"
terraform apply -var="environment=prod"
```

This creates the S3 state bucket and DynamoDB lock table.

### 4. Deploy Infrastructure (Dev)

```bash
cd terraform/envs/dev

# Copy and fill in your values
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Auth0 issuer URL, email, budget, etc.

terraform init
terraform plan
terraform apply
```

### 5. Verify Deployment

```bash
# Check AppSync API is live
aws appsync list-graphql-apis --region ap-southeast-2

# Check DynamoDB tables
aws dynamodb list-tables --region ap-southeast-2

# Check Lambda functions
aws lambda list-functions --region ap-southeast-2 --query "Functions[?starts_with(FunctionName, 'moc-mate')]"
```

### 6. Auth0 Configuration

1. Create an API in Auth0 with identifier matching your AppSync endpoint
2. Create a Native Application for the mobile app
3. Add custom claims to tokens:
   - `https://mocmate.com/tier` → user's subscription tier
   - `https://mocmate.com/group` → user's group ID
4. Set the Auth0 issuer URL in `terraform.tfvars`

### 7. Mobile App Setup

```bash
cd mobile
npm install
# Create .env file
echo "EXPO_PUBLIC_APPSYNC_ENDPOINT=<your-appsync-url>" > .env
echo "EXPO_PUBLIC_AUTH0_DOMAIN=<your-tenant>.au.auth0.com" >> .env
echo "EXPO_PUBLIC_AUTH0_CLIENT_ID=<your-client-id>" >> .env
echo "EXPO_PUBLIC_AUTH0_AUDIENCE=<your-api-identifier>" >> .env

npx expo start
```

### 8. Admin Dashboard Setup

```bash
cd admin-dashboard
npm install
# Create .env file
echo "VITE_APPSYNC_ENDPOINT=<your-appsync-url>" > .env

npm run dev
```

---

## Subscription (app access)

MoC-mate is a paid app with a **free first month**:

| | First 30 days | After 30 days |
|---|---|---|
| No subscription | ✅ Full app (free trial) | 🔒 Paywall only |
| Subscribed (one monthly plan via App Store / Google Play) | ✅ Full app | ✅ Full app |

The subscription unlocks everything: CPD tracking, drafts, PDF export, export presets, the
Learn tab, recommendations and auto-CPD from lessons.

### How it is enforced

* **Server-side, on every request.** Every user-facing AppSync resolver is a pipeline whose
  first step (`checkEntitlement`) reads the caller's record in the `subscriptions` table and
  rejects the request with `errorType: SubscriptionRequired` unless the trial or a paid
  subscription is still current. Old app versions and direct API calls are locked out too.
  **Any new user-facing resolver must be added to `local.gated_resolvers` in
  `terraform/modules/appsync/main.tf`**, never as a plain UNIT resolver.
* **Trial clock.** A user's 30 days (`trial_days`) start on their first API request after
  this is deployed, so existing users get a fresh month from the release, and new users
  get a month from sign-up.
* **Purchases** are made with the native store sheet (`react-native-iap`) and verified by the
  `subscription` Lambda directly with Apple's App Store Server API / Google's Play Developer
  API. Each purchase carries a per-user `appAccountToken`, so a receipt can only unlock the
  account that bought it.
* **Renewals, cancellations, refunds** arrive as App Store Server Notifications V2 /
  Play Real-time Developer Notifications at the Lambda Function URL. The Lambda re-fetches
  the subscription from the store (it never trusts the notification body). The app also
  re-checks on launch and when it returns to the foreground.

### Setup checklist

1. **App Store Connect:** create an auto-renewable subscription (e.g. `mocmate_monthly`).
   **Do not add a free-trial introductory offer**: the 30-day trial is handled by the server,
   so a store trial would give users two free months.
   Create an In-App Purchase API key (Users and Access › Integrations › In-App Purchase).
   Set App Store Server Notifications **V2** (production and sandbox) to
   `<subscription_notifications_url>apple`.
2. **Google Play Console:** create a subscription with one monthly base plan and the same
   product ID, again **without a free-trial offer**. Create a Google Cloud service account,
   grant it *View financial data* and *Manage orders and subscriptions* in Play Console › Users
   and permissions. Enable Real-time developer notifications to a Pub/Sub topic with a **push**
   subscription to `<subscription_notifications_url>google`.
3. **Terraform:** set `subscription_product_ids`, `apple_bundle_id`, `apple_issuer_id`,
   `apple_key_id` and `android_package_name` in `terraform.tfvars`. Run
   `lambda/subscription/build.sh`, then `terraform apply`.
4. **Secrets** (once, outside Terraform):
   ```bash
   aws secretsmanager put-secret-value --secret-id <apple_iap_key_secret_arn> \
     --secret-string file://SubscriptionKey_XXXXXXXXXX.p8
   aws secretsmanager put-secret-value --secret-id <google_play_service_account_secret_arn> \
     --secret-string file://service-account.json
   ```
5. **Mobile app:** add to `.env`:
   ```
   EXPO_PUBLIC_IAP_PRODUCT_ID_IOS=mocmate_monthly
   EXPO_PUBLIC_IAP_PRODUCT_ID_ANDROID=mocmate_monthly
   EXPO_PUBLIC_ANDROID_PACKAGE_NAME=<package name>
   EXPO_PUBLIC_TERMS_URL=<terms of use URL>
   EXPO_PUBLIC_PRIVACY_URL=<privacy policy URL>
   ```
   and add `["react-native-iap", { "paymentProvider": "Play Store" }]` to `plugins` in the Expo
   app config. In-app purchases need a development / EAS build (not Expo Go).
6. **Release order:** deploy the backend and publish the app update at the same time. The
   trial clock starts for each user at their first request after the backend deploy.

---

## DynamoDB Access Patterns

| Table | PK | SK | Key Patterns |
|-------|----|----|--------------|
| users | userId | — | Get user by ID; GSI: email-index |
| cpd-activities | userId | activityId (ULID) | Query by user (time-sorted); GSI: category, date |
| drafts | userId | draftId | Query drafts by user; TTL auto-expire |
| lessons | lessonId | — | Get lesson; GSI: categoryId-publishedAt |
| lesson-completions | userId | lessonId | Check if user completed lesson |
| export-presets | userId | presetId | List user presets (max 10) |
| user-groups | groupId | — | Get group defaults |
| categories | categoryId | — | List all categories |

---

## Security

- **Auth0 JWT** validates every GraphQL request via AppSync OIDC config
- **Owner-scoped resolvers** — users can only access their own data (VTL condition expressions)
- **Locked activities** — auto-logged entries cannot be edited/deleted (enforced at resolver level)
- **S3 public access blocked** — all buckets have public access block enabled
- **Encryption at rest** — DynamoDB SSE + S3 AES-256
- **Least-privilege IAM** — each Lambda has its own role scoped to specific tables/buckets
- **No hardcoded credentials** — all secrets via environment variables / Terraform variables
- **VPC Gateway Endpoints** — traffic to S3/DynamoDB stays on AWS backbone

---

## Monitoring & Alerting

- **CloudWatch Alarms** — per-Lambda error rate, throttle count, and P95 duration
- **AppSync 5XX alarm** — catches API-level failures
- **SNS email notifications** — all alarms notify the ops email
- **AWS Budgets** — 80% actual spend + 100% forecasted spend alerts
- **X-Ray tracing** — enabled on all Lambda functions

---

## Development Workflow

```bash
# Format and validate Terraform
terraform fmt -recursive
terraform validate

# Plan before applying
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Destroy dev environment when not needed (saves costs)
terraform destroy
```

---

## Estimated Monthly Cost (Dev Environment)

| Service | Estimate |
|---------|----------|
| DynamoDB (PAY_PER_REQUEST, low traffic) | $1–5 |
| Lambda (infrequent invocations) | $0–1 |
| AppSync (queries/mutations) | $2–5 |
| S3 (minimal storage) | $0–1 |
| CloudWatch (logs, alarms) | $2–5 |
| **Total dev** | **~$10–20/month** |

*Production estimates in [docs/scaling.md](docs/scaling.md).*

---

## License

Proprietary — MoC-mate. All rights reserved.
