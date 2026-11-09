// ─────────────────────────────────────────────────────────────────────────────
// Environment configuration
// In production, these come from app config / expo-constants
// ─────────────────────────────────────────────────────────────────────────────

export const ENV = {
  // AppSync
  APPSYNC_ENDPOINT: process.env.EXPO_PUBLIC_APPSYNC_ENDPOINT || '',
  APPSYNC_REGION: 'ap-southeast-2',

  // Auth0
  AUTH0_DOMAIN: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '',
  AUTH0_CLIENT_ID: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '',
  AUTH0_AUDIENCE: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE || '',

  // Subscription (App Store / Google Play product IDs for the one paid plan)
  IAP_PRODUCT_ID_IOS: process.env.EXPO_PUBLIC_IAP_PRODUCT_ID_IOS || '',
  IAP_PRODUCT_ID_ANDROID: process.env.EXPO_PUBLIC_IAP_PRODUCT_ID_ANDROID || '',
  ANDROID_PACKAGE_NAME: process.env.EXPO_PUBLIC_ANDROID_PACKAGE_NAME || '',
  // Required on the paywall by App Store guideline 3.1.2
  TERMS_URL: process.env.EXPO_PUBLIC_TERMS_URL || '',
  PRIVACY_URL: process.env.EXPO_PUBLIC_PRIVACY_URL || '',

  // Feature flags
  PERSONALIZE_ENABLED: process.env.EXPO_PUBLIC_PERSONALIZE_ENABLED === 'true',
} as const;
