# AI 사진 생성 프로세스 Flow

```mermaid
flowchart TD
    subgraph Frontend["Frontend"]
        A[사용자 사진 업로드<br/>JPG/PNG/WebP, max 10MB] --> B[파일 타입 및 크기 검증]
        B --> C[스타일 선택<br/>클래식/모던/빈티지/로맨틱/시네마틱]
        C --> D[역할 선택<br/>신랑 / 신부]
        D --> E[POST /api/ai/generate]
    end

    subgraph API["API Route - generate"]
        E --> F{인증 확인<br/>NextAuth 세션}
        F -->|실패| F1[401 Unauthorized]
        F -->|성공| G{Rate Limiting<br/>Redis 10분/5회}
        G -->|초과| G1[429 Too Many Requests]
        G -->|통과| H[FormData 파싱<br/>image, style, role, model]
        H --> I{파일 시그니처 검증<br/>PNG: 0x89504E47<br/>JPEG: 0xFFD8FF}
        I -->|실패| I1[400 Invalid File]
    end

    subgraph FaceDetect["Azure Face API"]
        I -->|통과| J[얼굴 감지 요청]
        J --> K{얼굴 수 확인}
        K -->|0개| K1[얼굴 없음]
        K -->|2개+| K2[1명만 가능]
        K -->|1개| L[통과]
    end

    subgraph Credits["크레딧 관리"]
        L --> M{크레딧 잔액 확인}
        M -->|부족| M1[402 크레딧 부족]
        M -->|충분| N[1크레딧 차감<br/>Atomic SQL UPDATE]
    end

    subgraph Storage["AWS S3"]
        N --> O[원본 이미지 업로드<br/>ai-originals/uuid.png]
    end

    subgraph AI["Replicate API"]
        O --> P[스타일별 프롬프트 조합]
        P --> Q[성별별 프롬프트 추가]
        Q --> R[4장 병렬 생성<br/>Promise.all]
        R --> S1[이미지 1]
        R --> S2[이미지 2]
        R --> S3[이미지 3]
        R --> S4[이미지 4]
    end

    subgraph Result["결과 처리"]
        S1 & S2 & S3 & S4 --> T[DB 저장<br/>aiGenerations 테이블]
        T --> U[응답 반환<br/>4장 URL + 잔여 크레딧]
    end

    subgraph Select["결과 선택 - Frontend"]
        U --> V[2x2 그리드 표시]
        V --> W{사용자 선택}
        W -->|1장 선택| X[POST /api/ai/select<br/>selectedUrl 저장]
        W -->|재생성| E
    end

    O -->|실패| REF[크레딧 환불]
    R -->|실패| REF
    REF --> M1
```

## 관련 파일

| 영역 | 파일 |
|------|------|
| API 메인 | `app/api/ai/generate/route.ts` |
| 얼굴 감지 | `lib/ai/face-detection.ts` |
| AI 생성 | `lib/ai/replicate.ts` |
| 크레딧 | `lib/ai/credits.ts` |
| Rate Limit | `lib/ai/rate-limit.ts` |
| S3 업로드 | `lib/ai/s3.ts` |
| 모델 정의 | `lib/ai/models.ts` |
| 상수/설정 | `lib/ai/constants.ts` |
| 프론트 메인 | `app/dashboard/ai-photos/page.tsx` |
| 업로더 | `app/dashboard/ai-photos/components/AIPhotoUploader.tsx` |
| 스타일 선택 | `app/dashboard/ai-photos/components/StyleSelector.tsx` |
| 결과 갤러리 | `app/dashboard/ai-photos/components/ResultGallery.tsx` |
