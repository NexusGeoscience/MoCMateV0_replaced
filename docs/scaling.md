# MoC-mate — Scaling Strategy

This document describes the current architecture's headroom and the concrete steps to
scale from the initial launch (~100–500 users) through 10× growth (~5,000 users) and
beyond (50,000+ users).

---

## Current Architecture (Designed for 10× Expected Scale)

| Layer | Service | Why It Scales |
|-------|---------|---------------|
| API | AppSync (GraphQL) | Fully managed, auto-scales to thousands of concurrent connections |
| Database | DynamoDB (PAY_PER_REQUEST) | Zero-config scaling; no capacity planning needed under ~40K RCU/WCU |
| Compute | Lambda | Concurrency scales to 1,000 by default in ap-southeast-2 |
| Storage | S3 | Effectively unlimited; 3,500 PUT/5,500 GET per prefix per second |
| Auth | Auth0 | Handles millions of logins; rate limits are generous on paid plans |
| Recommendations | Amazon Personalize | Campaigns auto-scale based on request volume |

### Key Design Decisions for Cost-Effective Scale

1. **PAY_PER_REQUEST DynamoDB** — No idle costs. Scales linearly with traffic. Switch to
   PROVISIONED + Auto Scaling once traffic patterns stabilise (saves ~20% at steady state).

2. **Lambda (no VPC attachment)** — Cold starts are sub-200ms. VPC Lambda adds 1–5s cold
   start. We use VPC Gateway Endpoints on the default VPC for future needs without penalty.

3. **S3 lifecycle policies** — Auto-expire generated PDFs after 7 days. Keeps storage
   costs near zero regardless of export volume.

4. **DynamoDB TTL on drafts** — Old drafts auto-expire after 90 days, preventing unbounded
   table growth without manual cleanup.

5. **Single-table access patterns via GSIs** — Each query uses an index. No Scans in
   production paths (except initial full-lesson browse, which will be replaced).

---

## Scaling to 5,000 Users (10× Launch)

No infrastructure changes needed. The current architecture handles this out of the box.

### What to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lambda concurrent executions | >300 | Request quota increase |
| DynamoDB consumed WCU (burst) | >4,000/sec sustained | Switch to provisioned + auto-scaling |
| AppSync resolver latency P99 | >500ms | Add DAX cache layer |
| S3 prefix throughput | >3,500 PUT/s | Add randomised prefix to PDF exports path |
| Auth0 rate limits | >80% of plan limit | Upgrade Auth0 plan |

### Recommended Optimisations at This Stage

- **Enable DynamoDB DAX** for hot read paths (listCpdActivities, listLessons) — reduces
  read latency from ~5ms to <1ms and cuts RCU consumption by 90%.
- **Add CloudFront** in front of lesson media S3 bucket — reduces S3 GET costs and
  improves video playback latency for users outside Sydney.
- **Move to provisioned DynamoDB** with auto-scaling for predictable workloads.

---

## Scaling to 50,000+ Users (100× Launch)

### Database Layer

| Change | Reason |
|--------|--------|
| DynamoDB provisioned + auto-scaling | Predictable baseline + burst capacity at lower cost |
| DAX cluster (2× r5.large) | Sub-ms reads, offload hot partitions |
| Consider DynamoDB Streams → OpenSearch | Full-text search across activities and lessons |

### Compute Layer

| Change | Reason |
|--------|--------|
| Request Lambda concurrency quota increase to 3,000 | Default is 1,000 in ap-southeast-2 |
| Add reserved concurrency for critical functions (pdf-generator: 100) | Prevent starvation during spikes |
| Consider provisioned concurrency for cpd-auto-log (10) | Eliminate cold starts for lesson completion flow |

### API Layer

| Change | Reason |
|--------|--------|
| AppSync caching (per-resolver TTL) | Reduce DynamoDB reads for lesson catalogue |
| Consider AppSync pipeline resolvers | Chain multiple data sources efficiently |
| Rate limiting via WAF | Protect against abuse at scale |

### Storage & CDN

| Change | Reason |
|--------|--------|
| CloudFront distribution for lesson media | Global edge caching, signed URLs for premium content |
| S3 Intelligent-Tiering for media bucket | Auto-optimise storage class for infrequently accessed content |
| Separate S3 prefix per category | Avoid hot-prefix throttling |

### Personalisation

| Change | Reason |
|--------|--------|
| Increase Personalize campaign minProvisionedTPS | Handle concurrent recommendation requests |
| Add batch inference job (nightly) | Pre-compute recommendations, serve from DynamoDB/ElastiCache |
| Consider EventBridge for event fan-out | Decouple ingestion from serving path |

### Admin Dashboard

| Change | Reason |
|--------|--------|
| Move to CloudFront + S3 static hosting | Zero-server hosting, edge-cached globally |
| Add Cognito admin pool (separate from user auth) | Separate admin IAM from end-user Auth0 |

---

## Scaling Beyond 100,000 Users

At this scale, consider architectural shifts:

1. **Multi-region active-active** — DynamoDB Global Tables + Route 53 latency routing.
   Required if expanding beyond APAC.

2. **Event-driven architecture** — Replace synchronous Lambda calls with EventBridge +
   SQS for PDF generation and Personalize ingestion. Enables retry, dead-letter queues,
   and backpressure handling.

3. **Dedicated search service** — Amazon OpenSearch for full-text search across activities
   and lessons. Ingest via DynamoDB Streams.

4. **Microservice decomposition** — If the admin dashboard grows complex, consider
   separating the lesson CMS into its own service with dedicated AppSync API.

5. **Cost optimisation** — At this scale, evaluate Savings Plans for Lambda, consider
   moving PDF generation to Fargate (longer-running, more memory), and negotiate
   Enterprise pricing with Auth0.

---

## Cost Estimates by Scale

| Scale | Monthly Estimate (USD) | Primary Drivers |
|-------|----------------------|-----------------|
| 500 users | $15–40 | DynamoDB, Lambda, S3 (mostly free tier) |
| 5,000 users | $80–200 | DynamoDB, Personalize, Lambda |
| 50,000 users | $500–1,500 | DynamoDB + DAX, Personalize campaigns, CloudFront |
| 100,000+ users | $2,000–5,000 | All services at scale, multi-region considerations |

*Estimates assume moderate activity (5 CPD entries/user/month, 2 lessons/user/month).*

---

## Migration Checklist (When You're Ready)

- [ ] Set up CloudWatch dashboard with key metrics (Lambda concurrency, DDB consumed capacity, AppSync latency)
- [ ] Configure DynamoDB auto-scaling when switching from PAY_PER_REQUEST
- [ ] Deploy DAX cluster in same VPC as Lambda (requires Lambda VPC attachment)
- [ ] Set up CloudFront for lesson media
- [ ] Request Lambda concurrency quota increase via AWS Support
- [ ] Enable AppSync caching on read-heavy resolvers
- [ ] Add WAF rules for rate limiting and bot protection
- [ ] Set up DynamoDB Global Tables if expanding beyond APAC

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-06 | PAY_PER_REQUEST over Provisioned | Zero idle cost; unpredictable early traffic |
| 2024-06 | Lambda outside VPC | Faster cold starts; no NAT Gateway cost |
| 2024-06 | Gateway endpoints (not Interface) | Free; sufficient for S3/DynamoDB |
| 2024-06 | ULID for activityId sort key | Time-sortable without GSI; 128-bit, URL-safe |
| 2024-06 | Auth0 over Cognito | Already in stack; better developer UX |
| 2024-06 | Single AppSync API (not separate per service) | Simpler for bootstrapped startup; split later if needed |
