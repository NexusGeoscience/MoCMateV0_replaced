// ─────────────────────────────────────────────────────────────────────────────
// Core types matching the GraphQL schema
// ─────────────────────────────────────────────────────────────────────────────

export enum SubscriptionTier {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'GRACE_PERIOD' | 'EXPIRED';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isEntitled: boolean;
  trialEndsAt: string;
  expiresAt?: string | null;
  autoRenewing: boolean;
  platform?: 'IOS' | 'ANDROID' | null;
  productId?: string | null;
  appAccountToken: string;
}

export enum LessonStructure {
  SCROLLABLE = 'SCROLLABLE',
  STEPPED = 'STEPPED',
}

export enum ContentType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  QUIZ = 'QUIZ',
}

export enum ExportFormatStyle {
  SUMMARY = 'SUMMARY',
  DETAILED = 'DETAILED',
}

export interface User {
  userId: string;
  email: string;
  displayName?: string;
  subscriptionTier: SubscriptionTier;
  groupId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface CpdActivity {
  userId: string;
  activityId: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  activityDate: string;
  hours: number;
  customFields?: Record<string, unknown>;
  isLocked: boolean;
  sourceLesson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  userId: string;
  draftId: string;
  name?: string;
  description?: string;
  categoryId?: string;
  activityDate?: string;
  hours?: number;
  customFields?: Record<string, unknown>;
  savedAt: string;
  expiresAt?: number;
}

export interface ContentBlock {
  blockId: string;
  type: ContentType;
  order: number;
  title?: string;
  body?: string;
  videoUrl?: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  questionId: string;
  text: string;
  options: string[];
  answerIndex: number;
}

export interface Lesson {
  lessonId: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  durationMinutes: number;
  cpdCreditHours: number;
  structure: LessonStructure;
  contentBlocks: ContentBlock[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonCompletion {
  userId: string;
  lessonId: string;
  completedAt: string;
  cpdActivityId: string;
}

export interface ExportPreset {
  userId: string;
  presetId: string;
  name: string;
  sortOrder: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  categoryIds?: string[];
  formatStyle: ExportFormatStyle;
  includeSections?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
}

// ── Navigation types ────────────────────────────────────────────────────────
export type CpdStackParamList = {
  CpdHome: undefined;
  ActivityDetail: { activityId: string };
  ActivityForm: { draftId?: string; activityId?: string };
  Drafts: undefined;
  ExportOptions: { presetId?: string };
  ExportPresets: undefined;
};

export type LearnStackParamList = {
  LearnHome: undefined;
  LessonDetail: { lessonId: string };
  LessonContent: { lessonId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Subscription: undefined;
  ExportPresets: undefined;
  ExportOptions: { presetId?: string };
};
