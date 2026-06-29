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

  // Feature flags
  PERSONALIZE_ENABLED: process.env.EXPO_PUBLIC_PERSONALIZE_ENABLED === 'true',
} as const;
