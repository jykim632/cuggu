# Cuggu Database ERD (Mermaid)

> 렌더링: GitHub `.md`, VSCode Mermaid 확장, [mermaid.live](https://mermaid.live)
> Mermaid 10+ 권장

```mermaid
erDiagram
    users {
        varchar id PK
        varchar email UK
        timestamp email_verified
        varchar name
        varchar image
        varchar role
        varchar premium_plan
        int ai_credits
        boolean email_notifications
        timestamp created_at
        timestamp updated_at
    }

    templates {
        varchar id PK
        varchar name
        varchar category
        varchar tier
        varchar thumbnail
        text config
        boolean is_active
        timestamp created_at
    }

    invitations {
        varchar id PK
        varchar user_id FK
        varchar template_id FK
        varchar groom_name
        varchar bride_name
        timestamp wedding_date
        varchar venue_name
        varchar venue_address
        text intro_message
        text gallery_images
        varchar ai_photo_url
        jsonb extended_data
        boolean is_password_protected
        varchar password_hash
        int view_count
        varchar status
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    rsvps {
        varchar id PK
        varchar invitation_id FK
        varchar guest_name
        varchar guest_phone
        varchar guest_email
        varchar attendance
        int guest_count
        varchar meal_option
        text message
        timestamp submitted_at
    }

    ai_generations {
        varchar id PK
        varchar user_id FK
        varchar original_url
        varchar style
        text generated_urls
        varchar selected_url
        varchar status
        int credits_used
        real cost
        varchar replicate_id
        varchar provider_job_id
        varchar provider_type
        timestamp created_at
        timestamp completed_at
    }

    payments {
        varchar id PK
        varchar user_id FK
        varchar type
        varchar method
        int amount
        int credits_granted
        varchar status
        varchar order_id UK
        varchar payment_key
        timestamp created_at
    }

    ai_model_settings {
        varchar model_id PK
        boolean enabled
        boolean is_recommended
        int sort_order
        timestamp updated_at
    }

    app_settings {
        varchar key PK
        jsonb value
        varchar category
        varchar label
        text description
        timestamp updated_at
    }

    accounts {
        varchar id PK
        varchar user_id FK
        varchar type
        varchar provider
        varchar provider_account_id
        text refresh_token
        text access_token
        int expires_at
        varchar token_type
        varchar scope
        text id_token
        varchar session_state
    }

    sessions {
        varchar session_token PK
        varchar user_id FK
        timestamp expires
    }

    users ||--o{ invitations : creates
    users ||--o{ ai_generations : generates
    users ||--o{ payments : pays
    users ||--o{ accounts : authenticates
    users ||--o{ sessions : has
    templates ||--o{ invitations : uses
    invitations ||--o{ rsvps : receives
```

## 관계 요약

| 관계 | 카디널리티 | onDelete |
|------|-----------|----------|
| users → invitations | 1:N | CASCADE |
| users → ai_generations | 1:N | CASCADE |
| users → payments | 1:N | CASCADE |
| users → accounts | 1:N | CASCADE |
| users → sessions | 1:N | CASCADE |
| templates → invitations | 1:N | - |
| invitations → rsvps | 1:N | CASCADE |

`ai_model_settings`, `app_settings`는 독립 테이블 (FK 없음)
