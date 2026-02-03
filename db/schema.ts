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
  'CLASSIC',
  'MODERN',
  'VINTAGE',
  'ROMANTIC',
  'CINEMATIC',
]);
export const aiGenerationStatusEnum = pgEnum('ai_generation_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
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
  aiCredits: integer('ai_credits').default(2).notNull(),
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
    generatedUrls: text('generated_urls').array(), // 4 URLs
    selectedUrl: varchar('selected_url', { length: 500 }),
    status: aiGenerationStatusEnum('status').default('PENDING').notNull(),
    creditsUsed: integer('credits_used').default(1).notNull(),
    cost: real('cost').notNull(), // USD
    replicateId: varchar('replicate_id', { length: 255 }),

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

// 6. Payment
export const payments = pgTable(
  'payments',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

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

// 7-8. NextAuth.js tables
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
