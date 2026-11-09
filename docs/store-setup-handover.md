# Handover: App Store Connect & Google Play setup for the MoC-mate subscription

**For:** Claude in Chrome, working in the user's browser.
> **Update:** both stores already have the subscription **"Standard" (`standard_monthly`)**:
> Apple approved at A$5.99/month in the "MoC Mate" group, and Google base plan `monthly` active.
> **Reuse it. Do not create `standard_monthly`.** The only changes to it are: on Apple, **end the
> "Free for the first month" introductory offer**; on Google, **deactivate the `free-trial-1m`
> offer**. Do not delete or change the product, its price, or the base plan. Before changing
> anything, report how many active subscribers / trials each store shows. Skip the "create the
> subscription" steps in 3.2 and 4.2; everything else (keys, service account, testers,
> notifications) still applies.

**Goal:** set up the store side of MoC-mate's new paid subscription: the subscription product
on both stores, the API credentials the backend uses to verify purchases, and (once the backend
is deployed) the server-notification URLs.

---

## 1. Background (read first)

MoC-mate (CPD tracking and eLearning for mining and geoscience professionals) is an
iOS + Android app that has been published free. It is being changed so that:

* every user gets a **free first month**. The trial is run by **our server**, not by the stores.
* after that, the **whole app is locked** until the user buys **one monthly auto-renewing
  subscription**, which unlocks everything.
* purchases are verified directly with Apple's App Store Server API and Google's Play
  Developer API. That needs the API credentials created in this handover.

The code is finished: branch `claude/moc-mate-free-trial-check-76x3hh` in
`NexusGeoscience/MoCMateV0_replaced`. The README's "Subscription (app access)" section has
the technical detail. **No coding is needed here.** This handover is only console work.

### Fixed values (the code expects these)

| Item | Value |
|---|---|
| Subscription product ID (both stores) | `standard_monthly` |
| Google Play base plan ID | `monthly` |
| Billing period | 1 month, auto-renewing |
| Apple subscription group | `MoC Mate` (existing) |
| Display name | `MoC-mate Subscription` |
| Description | `Full access to CPD tracking, PDF export and Learn.` |

If `standard_monthly` is already taken or can't be used, pick another ID, use the **same ID on
both stores**, and report it back. The backend and app config must match it.

### Ask the user before starting

* **Price** (e.g. A$X.XX per month) and which countries/regions to sell in. Do not guess a price.
* Which Google Cloud project to use for the Play service account (an existing one, or create
  `mocmate-play`).

---

## 2. Hard rules

1. **NO free trial / introductory offer in either store.** The server already gives 30 days
   free; a store trial would give two free months. On Apple, add no Introductory Offer. On
   Google, add no offer to the base plan (base plan only).
2. **Never paste secrets into chat** or into any web form other than where they are created.
   That covers the `.p8` key file and the service-account JSON key. Let them download to the
   user's Downloads folder and tell the user the file names. The user stores them in AWS
   Secrets Manager themselves.
3. The Apple `.p8` key can be **downloaded only once**. Confirm with the user before clicking
   Download, and tell them to keep the file safe immediately.
4. **Do not submit anything for App Review**, do not publish an app release, and do not change
   the app's existing price, listing, or availability. Creating a subscription and leaving it
   in "Ready to Submit" / draft is the goal on Apple. It gets submitted later with the new app
   build. On Google, activating the base plan is fine. It can't be bought until the app update
   ships.
5. Do not accept legal agreements, enter banking/tax details, or change account-holder
   settings on the user's behalf. If an agreement or payments profile is missing, stop and
   tell the user what is needed.
6. If a screen doesn't match these steps (consoles change), stop and describe what you see
   rather than guessing.

---

## 3. Apple: App Store Connect (https://appstoreconnect.apple.com)

### 3.1 Prerequisite check
* **Business** (or Agreements, Tax, and Banking): the **Paid Apps** agreement must be
  **Active**. If it isn't, stop and tell the user. Only the Account Holder can accept it, and
  banking/tax must be filled in.

### 3.2 Create the subscription
1. **Apps** › MoC-mate › **App Information**: note the **Bundle ID**.
2. **Monetization › Subscriptions** (older UI: Features › Subscriptions): create a
   **Subscription Group** with reference name `MoC-mate`.
3. In the group, **create a subscription**:
   * Reference name: `MoC-mate Monthly`
   * Product ID: `standard_monthly`
4. Fill in the subscription:
   * **Subscription Duration:** 1 month
   * **Subscription Prices:** the price the user gave; base country Australia unless told
     otherwise. Let Apple auto-fill the other regions.
   * **Availability:** as the user specified (default: all regions where the app is sold).
   * **Localization** (English (Australia) at minimum, plus the app's primary language):
     display name and description from the table above.
   * **Review Information:** the screenshot needs the new paywall, which isn't in a build yet.
     Leave it empty and tell the user it's still needed. Review notes:
     `New users get a 30-day free period managed by our server. After it ends the app shows a paywall offering this subscription. Use a sandbox account to test.`
   * **Introductory Offers / Promotional Offers / Offer Codes:** **leave empty** (rule 1).
5. Add the **group localization** (group display name `MoC-mate`) if it's requested.
6. Save. Expected status: **Missing Metadata** (screenshot) or **Ready to Submit**. Do not
   submit.

### 3.3 In-App Purchase API key (used by the backend)
1. **Users and Access › Integrations › In-App Purchase**: **Generate In-App Purchase Key**,
   named `MoC-mate backend`.
2. Record the **Key ID**.
3. Record the **Issuer ID**, shown at the top of the Integrations page (it may be on the
   **App Store Connect API** tab).
4. With the user's OK (rule 3), **Download** the key. The file is `SubscriptionKey_<KEYID>.p8`.

### 3.4 Sandbox testers
* **Users and Access › Sandbox › Test Accounts**: create one sandbox tester if none exists.
  Use an email address the user gives you; it must not be an existing Apple ID. Report the
  email, never the password.

### 3.5 Server notifications ⏸ (do only once the user gives the notification URL)
* **Apps › MoC-mate › App Information › App Store Server Notifications**:
  * Production Server URL: `<NOTIFICATION_URL>apple`
  * Sandbox Server URL: `<NOTIFICATION_URL>apple`
  * Version: **Version 2**

`<NOTIFICATION_URL>` comes from `terraform output subscription_notifications_url` after the
backend is deployed. It looks like `https://xxxx.lambda-url.ap-southeast-2.on.aws/`, so the
full value ends `.../apple`. If the user doesn't have it yet, skip this step and list it as
outstanding.

---

## 4. Google: Play Console (https://play.google.com/console)

### 4.1 Prerequisite checks
* **Settings › Payments profile:** a merchant/payments profile must be set up. If not, stop
  and tell the user.
* Play only lets you create subscriptions once an uploaded build declares the billing
  permission (`com.android.vending.BILLING`, added by the new app version). If the
  Subscriptions page says the app has no billing permission or asks you to upload an APK/AAB
  with billing, **stop**. Tell the user the new build must be uploaded to an internal testing
  track first, then this section can continue.

### 4.2 Create the subscription
1. Select MoC-mate. Note the **package name** (shown under the app name, e.g. `com.…`).
2. **Monetize with Play › Products › Subscriptions › Create subscription**
   * Product ID: `standard_monthly`
   * Name: `MoC-mate Subscription`
3. Fill in **Subscription details**: benefits (e.g. "CPD tracking", "PDF export", "Learn
   lessons") and the description from the table.
4. **Add base plan:**
   * Base plan ID: `monthly`
   * Type: **Auto-renewing**, billing period **1 month**
   * Grace period and account hold: leave the defaults
   * Resubscribe: allow
   * **Prices:** the user's price (set in AUD, let Play convert other regions)
5. **Activate** the base plan. **Do not add any offers** (rule 1).

### 4.3 Service account for the Play Developer API
In **Google Cloud Console** (https://console.cloud.google.com), in the project the user chose:
1. **APIs & Services › Library:** enable **Google Play Android Developer API**.
2. **IAM & Admin › Service Accounts › Create service account**: name `mocmate-play-verifier`.
   It needs no Cloud IAM roles. Record its **email**.
3. Open it › **Keys › Add key › Create new key › JSON**. The key downloads. Tell the user the
   file name (rule 2).
   * If key creation is blocked by an organisation policy
     (`iam.disableServiceAccountKeyCreation`), stop and tell the user. A Google Cloud org admin
     must allow it for this project.

Back in **Play Console › Users and permissions › Invite new users**:
4. Email: the service account email.
5. **App permissions:** add MoC-mate with only **View financial data** and **Manage orders and
   subscriptions**. No account-level admin permissions.
6. Send the invite. Service accounts are accepted automatically. It can take up to 24–36 hours
   for the API to work; that's normal.

### 4.4 License testers
* **Settings › License testing:** add the user's tester Google account(s), so test purchases
  aren't charged.

### 4.5 Real-time developer notifications ⏸ (do only once the user gives the notification URL)
In Google Cloud Console, same project:
1. **Pub/Sub › Topics › Create topic:** `mocmate-play-rtdn` (uncheck "add default subscription").
2. On the topic's **Permissions**: add principal
   `google-play-developer-notifications@system.gserviceaccount.com` with role
   **Pub/Sub Publisher**.
3. **Create subscription** on the topic: ID `mocmate-play-rtdn-push`, delivery type **Push**,
   endpoint `<NOTIFICATION_URL>google`. Leave authentication off.
In Play Console:
4. **Monetize with Play › Monetization setup › Real-time developer notifications:** topic name
   `projects/<PROJECT_ID>/topics/mocmate-play-rtdn`, notification content **Subscriptions**
   (and voided purchases if offered). Save, then **Send test notification**. It should report
   success.

---

## 5. Report back to the user

Finish with this filled in. Leave an item blank if not done and say why.

```
APPLE
  Paid Apps agreement:            Active / NOT ACTIVE
  Bundle ID:                      
  Subscription product ID:        standard_monthly
  Subscription status:            (e.g. Missing Metadata – needs review screenshot)
  Price:                          
  In-App Purchase Key ID:         
  Issuer ID:                      
  .p8 file downloaded as:         SubscriptionKey_XXXXXXXXXX.p8 (in Downloads)
  Sandbox tester email:           
  Server notifications (V2):      set to …/apple   / OUTSTANDING (need URL)

GOOGLE
  Payments profile:               OK / MISSING
  Package name:                   
  Subscription / base plan:       standard_monthly / monthly – Active / BLOCKED (reason)
  Price:                          
  Cloud project ID:               
  Service account email:          
  JSON key downloaded as:         <file name> (in Downloads)
  Play Console permissions:       granted (View financial data, Manage orders and subscriptions)
  License testers:                
  RTDN topic + push subscription: set to …/google, test notification OK / OUTSTANDING

STILL TO DO BY THE USER / DEVELOPER
  - Store .p8 and JSON key in AWS Secrets Manager (README step 4), then delete the local files
  - Put Bundle ID, Key ID, Issuer ID, package name, product ID in terraform.tfvars and app .env
  - Paywall screenshot for Apple review, once the new build exists
  - Notification URLs (sections 3.5 and 4.5) if outstanding
```
