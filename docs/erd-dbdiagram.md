# Cuggu Database ERD (DBML - dbdiagram.io)

> [dbdiagram.io](https://dbdiagram.io)에 아래 DBML 코드를 붙여넣으면 ERD 렌더링됨
> Export: PNG, PDF, SQL(PostgreSQL/MySQL) 지원

```dbml
// ============================================================
// Cuggu - 모바일 청첩장 플랫폼 DB Schema
// ============================================================

// --- Core Domain ---

Table users {
  id varchar [pk, note: 'CUID2']
  email varchar [unique]
  email_verified timestamp
  name varchar
  image varchar
  role user_role [default: 'USER', note: 'USER | ADMIN']
  premium_plan premium_plan [default: 'FREE', note: 'FREE | PREMIUM']
  ai_credits int [default: 2]
  email_notifications boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table templates {
  id varchar [pk, note: 'CUID2']
  name varchar
  category template_category [note: 'CLASSIC | MODERN | VINTAGE | FLORAL | MINIMAL']
  tier template_tier [default: 'FREE', note: 'FREE | PREMIUM']
  thumbnail varchar
  config text [note: 'JSON string']
  is_active boolean [default: true]
  created_at timestamp

  indexes {
    (tier, is_active) [name: 'templates_tier_active_idx']
  }
}

Table invitations {
  id varchar [pk, note: 'CUID2']
  user_id varchar [ref: > users.id]
  template_id varchar [ref: > templates.id]
  groom_name varchar
  bride_name varchar
  wedding_date timestamp
  venue_name varchar
  venue_address varchar
  intro_message text
  gallery_images text[]
  ai_photo_url varchar
  extended_data jsonb [note: '부모님/계좌/설정 등']
  is_password_protected boolean [default: false]
  password_hash varchar
  view_count int [default: 0]
  status invitation_status [default: 'DRAFT', note: 'DRAFT | PUBLISHED | EXPIRED | DELETED']
  expires_at timestamp
  created_at timestamp
  updated_at timestamp

  indexes {
    user_id [name: 'invitations_user_id_idx']
    (status, expires_at) [name: 'invitations_status_expires_idx']
  }
}

Table rsvps {
  id varchar [pk, note: 'CUID2']
  invitation_id varchar [ref: > invitations.id]
  guest_name varchar
  guest_phone varchar [note: 'encrypted']
  guest_email varchar [note: 'encrypted']
  attendance attendance_status [note: 'ATTENDING | NOT_ATTENDING | MAYBE']
  guest_count int [default: 1]
  meal_option meal_option [note: 'ADULT | CHILD | VEGETARIAN | NONE']
  message text
  submitted_at timestamp

  indexes {
    invitation_id [name: 'rsvps_invitation_id_idx']
  }
}

// --- AI ---

Table ai_generations {
  id varchar [pk, note: 'CUID2']
  user_id varchar [ref: > users.id]
  original_url varchar
  style ai_style [note: '15 styles']
  generated_urls text[]
  selected_url varchar
  status ai_generation_status [default: 'PENDING', note: 'PENDING | PROCESSING | COMPLETED | FAILED']
  credits_used int [default: 1]
  cost real [note: 'USD']
  replicate_id varchar [note: 'deprecated']
  provider_job_id varchar
  provider_type varchar [note: 'replicate | openai | gemini']
  created_at timestamp
  completed_at timestamp

  indexes {
    (user_id, status) [name: 'ai_generations_user_status_idx']
  }
}

Table ai_model_settings {
  model_id varchar [pk]
  enabled boolean [default: true]
  is_recommended boolean [default: false]
  sort_order int [default: 0]
  updated_at timestamp
}

// --- Payment ---

Table payments {
  id varchar [pk, note: 'CUID2']
  user_id varchar [ref: > users.id]
  type payment_type [note: 'PREMIUM_UPGRADE | AI_CREDITS | AI_CREDITS_BUNDLE']
  method payment_method [note: 'TOSS | KAKAO_PAY | CARD']
  amount int [note: 'KRW']
  credits_granted int
  status payment_status [default: 'PENDING', note: 'PENDING | COMPLETED | FAILED | REFUNDED']
  order_id varchar [unique]
  payment_key varchar
  created_at timestamp

  indexes {
    (user_id, status) [name: 'payments_user_status_idx']
  }
}

// --- App Config ---

Table app_settings {
  key varchar [pk]
  value jsonb
  category varchar
  label varchar
  description text
  updated_at timestamp

  indexes {
    category [name: 'app_settings_category_idx']
  }
}

// --- NextAuth.js ---

Table accounts {
  id varchar [pk, note: 'CUID2']
  user_id varchar [ref: > users.id]
  type varchar
  provider varchar
  provider_account_id varchar
  refresh_token text
  access_token text
  expires_at int
  token_type varchar
  scope varchar
  id_token text
  session_state varchar

  indexes {
    (provider, provider_account_id) [unique, name: 'accounts_provider_account_idx']
    user_id [name: 'accounts_user_id_idx']
  }
}

Table sessions {
  session_token varchar [pk]
  user_id varchar [ref: > users.id]
  expires timestamp

  indexes {
    user_id [name: 'sessions_user_id_idx']
  }
}
```

## 관계 요약

| 부모 | 자식 | 카디널리티 | onDelete |
|------|------|-----------|----------|
| users | invitations | 1:N | CASCADE |
| users | ai_generations | 1:N | CASCADE |
| users | payments | 1:N | CASCADE |
| users | accounts | 1:N | CASCADE |
| users | sessions | 1:N | CASCADE |
| templates | invitations | 1:N | - |
| invitations | rsvps | 1:N | CASCADE |

## 사용법

1. [dbdiagram.io](https://dbdiagram.io) 접속
2. 위 DBML 코드블록 내용 복사
3. 에디터에 붙여넣기
4. 우측에 ERD 자동 렌더링
5. Export → PNG / PDF / SQL(PostgreSQL) 가능
