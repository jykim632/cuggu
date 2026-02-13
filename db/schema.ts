import {
  pgTable,
  varchar,
  boolean,
  integer,
  timestamp,
  pgEnum,
  text,
  index,
  unique,
  real,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ============================================================
// Enums
// ============================================================

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const premiumPlanEnum = pgEnum('premium_plan', ['FREE', 'PREMIUM']);

export const templateCategoryEnum = pgEnum('template_category', [
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'FLORAL',
  'MINIMAL',
]);
export const templateTierEnum = pgEnum('template_tier', ['FREE', 'PREMIUM']);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'DRAFT',
  'PUBLISHED',
  'EXPIRED',
  'DELETED',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'ATTENDING',
  'NOT_ATTENDING',
  'MAYBE',
]);
export const mealOptionEnum = pgEnum('meal_option', [
  'ADULT',
  'CHILD',
  'VEGETARIAN',
  'NONE',
]);

export const aiStyleEnum = pgEnum('ai_style', [
  // Legacy (하위 호환)
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
  // New styles
  'CLASSIC_STUDIO',
  'OUTDOOR_GARDEN',
  'SUNSET_BEACH',
  'TRADITIONAL_HANBOK',
  'VINTAGE_CINEMATIC',
  'LUXURY_HOTEL',
  'CITY_LIFESTYLE',
  'ENCHANTED_FOREST',
  'BLACK_AND_WHITE',
  'MINIMALIST_GALLERY',
]);
export const aiGenerationStatusEnum = pgEnum('ai_generation_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export const aiThemeStatusEnum = pgEnum('ai_theme_status', [
  'completed',
  'safelist_failed',
  'failed',
]);

export const aiAlbumStatusEnum = pgEnum('ai_album_status', ['draft', 'completed', 'applied']);

export const aiJobModeEnum = pgEnum('ai_job_mode', ['SINGLE', 'BATCH']);
export const aiJobStatusEnum = pgEnum('ai_job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'CANCELLED',
]);
export const aiCreditTxTypeEnum = pgEnum('ai_credit_tx_type', [
  'DEDUCT',
  'REFUND',
  'PURCHASE',
  'BONUS',
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'PREMIUM_UPGRADE',
  'AI_CREDITS',
  'AI_CREDITS_BUNDLE',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'TOSS',
  'KAKAO_PAY',
  'CARD',
]);

// ============================================================
// Tables
// ============================================================

// 1. User
export const users = pgTable('users', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'), // NextAuth required
  name: varchar('name', { length: 255 }),
  image: varchar('image', { length: 500 }), // NextAuth required (profile image)
  role: userRoleEnum('role').default('USER').notNull(),
  premiumPlan: premiumPlanEnum('premium_plan').default('FREE').notNull(),
  aiCredits: integer('ai_credits').default(5).notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Template
export const templates = pgTable(
  'templates',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    name: varchar('name', { length: 255 }).notNull(),
    category: templateCategoryEnum('category').notNull(),
    tier: templateTierEnum('tier').default('FREE').notNull(),
    thumbnail: varchar('thumbnail', { length: 500 }).notNull(),
    config: text('config').notNull(), // JSON string
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tierActiveIdx: index('templates_tier_active_idx').on(
      table.tier,
      table.isActive
    ),
  })
);

// 3. Invitation
export const invitations = pgTable(
  'invitations',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    templateId: varchar('template_id', { length: 128 })
      .notNull()
      .references(() => templates.id),

    // Wedding Info
    groomName: varchar('groom_name', { length: 255 }).notNull(),
    brideName: varchar('bride_name', { length: 255 }).notNull(),
    weddingDate: timestamp('wedding_date').notNull(),
    venueName: varchar('venue_name', { length: 255 }).notNull(),
    venueAddress: varchar('venue_address', { length: 500 }),

    // Content
    introMessage: text('intro_message'),
    galleryImages: text('gallery_images').array(),
    aiPhotoUrl: varchar('ai_photo_url', { length: 500 }),

    // 확장 데이터 (부모님 정보, 계좌, 설정 등)
    extendedData: jsonb('extended_data').default({}).$type<Record<string, unknown>>(),

    // Security
    isPasswordProtected: boolean('is_password_protected')
      .default(false)
      .notNull(),
    passwordHash: varchar('password_hash', { length: 255 }),

    // Analytics
    viewCount: integer('view_count').default(0).notNull(),
    status: invitationStatusEnum('status').default('DRAFT').notNull(),
    expiresAt: timestamp('expires_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('invitations_user_id_idx').on(table.userId),
    statusExpiresIdx: index('invitations_status_expires_idx').on(
      table.status,
      table.expiresAt
    ),
  })
);

// 4. RSVP
export const rsvps = pgTable(
  'rsvps',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    invitationId: varchar('invitation_id', { length: 128 })
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),

    // Guest Info (encrypted)
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 500 }), // encrypted
    guestEmail: varchar('guest_email', { length: 500 }), // encrypted

    // Attendance
    attendance: attendanceStatusEnum('attendance').notNull(),
    guestCount: integer('guest_count').default(1).notNull(),
    mealOption: mealOptionEnum('meal_option'),
    message: text('message'),

    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  },
  (table) => ({
    invitationIdIdx: index('rsvps_invitation_id_idx').on(table.invitationId),
  })
);

// 5. AIGeneration
export const aiGenerations = pgTable(
  'ai_generations',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    originalUrl: varchar('original_url', { length: 500 }).notNull(),
    style: aiStyleEnum('style').notNull(),
    role: varchar('role', { length: 8 }), // 'GROOM' | 'BRIDE'
    generatedUrls: text('generated_urls').array(), // 4 URLs
    selectedUrl: varchar('selected_url', { length: 500 }),
    isFavorited: boolean('is_favorited').default(false).notNull(),
    modelId: varchar('model_id', { length: 64 }),
    status: aiGenerationStatusEnum('status').default('PENDING').notNull(),
    creditsUsed: integer('credits_used').default(1).notNull(),
    cost: real('cost').notNull(), // USD
    replicateId: varchar('replicate_id', { length: 255 }), // deprecated: providerJobId 사용
    providerJobId: varchar('provider_job_id', { length: 255 }),
    providerType: varchar('provider_type', { length: 32 }), // 'replicate' | 'openai' | 'gemini'

    albumId: varchar('album_id', { length: 128 })
      .references(() => aiAlbums.id, { onDelete: 'set null' }),
    jobId: varchar('job_id', { length: 128 })
      .references(() => aiGenerationJobs.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userStatusIdx: index('ai_generations_user_status_idx').on(
      table.userId,
      table.status
    ),
  })
);

// 5.5 AI Albums
export const aiAlbums = pgTable('ai_albums', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  invitationId: varchar('invitation_id', { length: 128 })
    .references(() => invitations.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull().default('My Album'),
  snapType: varchar('snap_type', { length: 32 }),
  images: jsonb('images').default([]).$type<AlbumImage[]>(),
  groups: jsonb('groups').default([]).$type<AlbumGroup[]>(),
  status: aiAlbumStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('ai_albums_user_id_idx').on(table.userId),
}));

// AlbumImage/AlbumGroup types for jsonb
export interface AlbumImage {
  url: string;
  generationId: string;
  style: string;
  role: string;
  sortOrder: number;
  groupId?: string;
  tags?: string[];
}

export interface AlbumGroup {
  id: string;
  name: string;
  sortOrder: number;
}

// 5.6 AI Reference Photos (참조 사진 — 한 번 업로드 후 재사용)
export const aiReferencePhotos = pgTable('ai_reference_photos', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 8 }).notNull(), // 'GROOM' | 'BRIDE'
  originalUrl: varchar('original_url', { length: 500 }).notNull(),
  faceDetected: boolean('face_detected').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userRoleIdx: index('ai_ref_photos_user_role_idx').on(table.userId, table.role),
}));

// 5.7 AI Generation Jobs (생성 작업 — 묶음/개별)
export interface JobConfig {
  snapType?: string;
  styles: string[];
  roles: string[];
  modelId?: string;
  groomRefId?: string;
  brideRefId?: string;
}

export const aiGenerationJobs = pgTable('ai_generation_jobs', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  albumId: varchar('album_id', { length: 128 })
    .references(() => aiAlbums.id, { onDelete: 'set null' }),
  mode: aiJobModeEnum('mode').notNull(),
  config: jsonb('config').default({}).$type<JobConfig>(),
  totalImages: integer('total_images').notNull(),
  completedImages: integer('completed_images').default(0).notNull(),
  failedImages: integer('failed_images').default(0).notNull(),
  creditsReserved: integer('credits_reserved').notNull(),
  creditsUsed: integer('credits_used').default(0).notNull(),
  status: aiJobStatusEnum('status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userStatusIdx: index('ai_jobs_user_status_idx').on(table.userId, table.status),
}));

// 5.8 AI Credit Transactions (크레딧 거래 이력)
export const aiCreditTransactions = pgTable('ai_credit_transactions', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  type: aiCreditTxTypeEnum('type').notNull(),
  amount: integer('amount').notNull(), // 항상 양수, type으로 방향 구분
  balanceAfter: integer('balance_after').notNull(),
  referenceType: varchar('reference_type', { length: 32 }), // JOB | PAYMENT | ADMIN | SYSTEM
  referenceId: varchar('reference_id', { length: 128 }),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('ai_credit_tx_user_idx').on(table.userId),
}));

// 6. Payment
export const payments = pgTable(
  'payments',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    type: paymentTypeEnum('type').notNull(),
    method: paymentMethodEnum('method').notNull(),
    amount: integer('amount').notNull(), // KRW
    creditsGranted: integer('credits_granted'),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    orderId: varchar('order_id', { length: 255 }).unique(),
    paymentKey: varchar('payment_key', { length: 255 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userStatusIdx: index('payments_user_status_idx').on(
      table.userId,
      table.status
    ),
  })
);

// 7. AI Model Settings (Admin 관리)
export const aiModelSettings = pgTable('ai_model_settings', {
  modelId: varchar('model_id', { length: 64 }).primaryKey(),
  enabled: boolean('enabled').default(true).notNull(),
  isRecommended: boolean('is_recommended').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. App Settings (범용 설정 - UI는 추후)
export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('app_settings_category_idx').on(table.category),
}));

// 9. AI Themes (AI 생성 테마 라이브러리)
export const aiThemes = pgTable('ai_themes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitationId: varchar('invitation_id', { length: 128 }).references(() => invitations.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  modelId: varchar('model_id', { length: 64 }),
  theme: jsonb('theme'),
  status: aiThemeStatusEnum('status').default('completed').notNull(),
  failReason: text('fail_reason'),
  creditsUsed: integer('credits_used').default(1).notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cost: real('cost'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('ai_themes_user_id_idx').on(table.userId),
  index('ai_themes_invitation_id_idx').on(table.invitationId),
]);

// 10-11. NextAuth.js tables
export const accounts = pgTable(
  'accounts',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 })
      .notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    providerAccountIdx: unique('accounts_provider_account_idx').on(
      table.provider,
      table.providerAccountId
    ),
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: varchar('session_token', { length: 255 })
      .primaryKey(),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires').notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
  })
);

// ============================================================
// Relations
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  invitations: many(invitations),
  aiGenerations: many(aiGenerations),
  aiAlbums: many(aiAlbums),
  aiThemes: many(aiThemes),
  aiReferencePhotos: many(aiReferencePhotos),
  aiGenerationJobs: many(aiGenerationJobs),
  aiCreditTransactions: many(aiCreditTransactions),
  payments: many(payments),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  invitations: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  user: one(users, {
    fields: [invitations.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [invitations.templateId],
    references: [templates.id],
  }),
  rsvps: many(rsvps),
  aiThemes: many(aiThemes),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  invitation: one(invitations, {
    fields: [rsvps.invitationId],
    references: [invitations.id],
  }),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  user: one(users, {
    fields: [aiGenerations.userId],
    references: [users.id],
  }),
  album: one(aiAlbums, {
    fields: [aiGenerations.albumId],
    references: [aiAlbums.id],
  }),
  job: one(aiGenerationJobs, {
    fields: [aiGenerations.jobId],
    references: [aiGenerationJobs.id],
  }),
}));

export const aiAlbumsRelations = relations(aiAlbums, ({ one, many }) => ({
  user: one(users, {
    fields: [aiAlbums.userId],
    references: [users.id],
  }),
  invitation: one(invitations, {
    fields: [aiAlbums.invitationId],
    references: [invitations.id],
  }),
  generations: many(aiGenerations),
}));

export const aiThemesRelations = relations(aiThemes, ({ one }) => ({
  user: one(users, {
    fields: [aiThemes.userId],
    references: [users.id],
  }),
  invitation: one(invitations, {
    fields: [aiThemes.invitationId],
    references: [invitations.id],
  }),
}));

export const aiReferencePhotosRelations = relations(aiReferencePhotos, ({ one }) => ({
  user: one(users, {
    fields: [aiReferencePhotos.userId],
    references: [users.id],
  }),
}));

export const aiGenerationJobsRelations = relations(aiGenerationJobs, ({ one, many }) => ({
  user: one(users, {
    fields: [aiGenerationJobs.userId],
    references: [users.id],
  }),
  album: one(aiAlbums, {
    fields: [aiGenerationJobs.albumId],
    references: [aiAlbums.id],
  }),
  generations: many(aiGenerations),
}));

export const aiCreditTransactionsRelations = relations(aiCreditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [aiCreditTransactions.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
