import { z } from "zod";

// ============================================================
// Enums
// ============================================================

export const FamilyDisplayModeSchema = z.enum([
  'full_names',           // 양부모 실명 (기본)
  'single_parent_father', // 아버지만
  'single_parent_mother', // 어머니만
]);

export const TemplateCategorySchema = z.enum([
  "CLASSIC",
  "MODERN",
  "VINTAGE",
  "FLORAL",
  "MINIMAL",
]);

export const InvitationStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "EXPIRED",
  "DELETED",
]);

// ============================================================
// Sub-schemas (청첩장 내부 데이터)
// ============================================================

// 인물 정보 (신랑/신부)
export const PersonSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  isDeceased: z
    .object({
      father: z.boolean().optional(),
      mother: z.boolean().optional(),
    })
    .optional(),
  phone: z.string().optional(),
  relation: z.string().optional(), // "장남", "차남", "장녀", "차녀" 등
  displayMode: FamilyDisplayModeSchema.optional(),
});

// 계좌 정보
export const AccountSchema = z.object({
  bank: z.string().min(1, "은행을 선택해주세요"),
  accountNumber: z.string().min(1, "계좌번호를 입력해주세요"),
  accountHolder: z.string().min(1, "예금주를 입력해주세요"),
});

// 부모님 계좌 (각 부모님별 복수 계좌 허용)
export const ParentAccountsSchema = z.object({
  father: z.array(AccountSchema).default([]),
  mother: z.array(AccountSchema).default([]),
}).optional();

// 예식 장소
export const VenueSchema = z.object({
  name: z.string().min(1, "예식장 이름을 입력해주세요"),
  hall: z.string().optional(),
  address: z.string().min(1, "주소를 입력해주세요"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tel: z.string().optional(),
  transportation: z.string().optional(), // 교통편 안내
});

// 콘텐츠
export const ContentSchema = z.object({
  greeting: z.string().optional(), // 인사말
  notice: z.string().optional(), // 안내사항
});

// 갤러리
export const GallerySchema = z.object({
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
});

// 설정
export const SettingsSchema = z.object({
  showParents: z.boolean().default(true),
  showAccounts: z.boolean().default(true),
  showMap: z.boolean().default(true),
  enableRsvp: z.boolean().default(true),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().optional(),
});

// ============================================================
// 확장 데이터 스키마 (JSONB 저장용)
// DB에 개별 컬럼이 없는 필드들을 한 덩어리로 저장
// ============================================================

const ExtendedPersonSchema = z.object({
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  isDeceased: z.object({
    father: z.boolean().optional(),
    mother: z.boolean().optional(),
  }).optional(),
  phone: z.string().optional(),
  relation: z.string().optional(),
  displayMode: FamilyDisplayModeSchema.optional(),
  account: AccountSchema.optional(),
  parentAccounts: ParentAccountsSchema,
}).partial();

export const ExtendedDataSchema = z.object({
  groom: ExtendedPersonSchema.optional(),
  bride: ExtendedPersonSchema.optional(),
  venue: z.object({
    hall: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    tel: z.string().optional(),
    transportation: z.string().optional(),
  }).optional(),
  content: z.object({
    notice: z.string().optional(),
  }).optional(),
  gallery: z.object({
    coverImage: z.string().url().optional(),
  }).optional(),
  settings: SettingsSchema.partial().optional(),
}).default({});

export type ExtendedData = z.infer<typeof ExtendedDataSchema>;

// ============================================================
// Main Invitation Schema
// ============================================================

export const InvitationSchema = z.object({
  // 기본 정보 (DB 필드)
  id: z.string(),
  userId: z.string(),
  templateId: z.string(),

  // 신랑/신부 (확장된 정보)
  groom: PersonSchema.extend({
    account: AccountSchema.optional(),
    parentAccounts: ParentAccountsSchema,
  }),
  bride: PersonSchema.extend({
    account: AccountSchema.optional(),
    parentAccounts: ParentAccountsSchema,
  }),

  // 예식 정보
  wedding: z.object({
    date: z.string().datetime(), // ISO 8601
    venue: VenueSchema,
  }),

  // 콘텐츠
  content: ContentSchema,

  // 갤러리
  gallery: GallerySchema,

  // AI 생성 사진
  aiPhotoUrl: z.string().url().optional(),

  // 설정
  settings: SettingsSchema,

  // 보안
  isPasswordProtected: z.boolean().default(false),

  // 메타데이터 (DB 필드)
  status: InvitationStatusSchema.default("DRAFT"),
  viewCount: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

// ============================================================
// 청첩장 생성 시 입력 스키마 (필수 필드만)
// ============================================================

export const CreateInvitationSchema = z.object({
  templateId: z.string().min(1, "템플릿을 선택해주세요"),

  groom: z.object({
    name: z.string().min(1, "신랑 이름을 입력해주세요"),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    isDeceased: z.object({
      father: z.boolean().optional(),
      mother: z.boolean().optional(),
    }).optional(),
    phone: z.string().optional(),
    relation: z.string().optional(),
    displayMode: FamilyDisplayModeSchema.optional(),
    account: AccountSchema.optional(),
    parentAccounts: ParentAccountsSchema,
  }),

  bride: z.object({
    name: z.string().min(1, "신부 이름을 입력해주세요"),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    isDeceased: z.object({
      father: z.boolean().optional(),
      mother: z.boolean().optional(),
    }).optional(),
    phone: z.string().optional(),
    relation: z.string().optional(),
    displayMode: FamilyDisplayModeSchema.optional(),
    account: AccountSchema.optional(),
    parentAccounts: ParentAccountsSchema,
  }),

  wedding: z.object({
    date: z.string().datetime("올바른 날짜 형식을 입력해주세요"),
    venue: VenueSchema,
  }),

  content: z.object({
    greeting: z.string().optional(),
  }),
});

// ============================================================
// 청첩장 업데이트 스키마
// ============================================================

export const UpdateInvitationSchema = InvitationSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

// ============================================================
// Types (Zod에서 자동 추론)
// ============================================================

export type FamilyDisplayMode = z.infer<typeof FamilyDisplayModeSchema>;
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type Gallery = z.infer<typeof GallerySchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Invitation = z.infer<typeof InvitationSchema>;
export type CreateInvitation = z.infer<typeof CreateInvitationSchema>;
export type UpdateInvitation = z.infer<typeof UpdateInvitationSchema>;

// ============================================================
// 샘플 데이터
// ============================================================

export const SAMPLE_INVITATION: Invitation = {
  id: "sample-123",
  userId: "user-123",
  templateId: "classic-001",

  groom: {
    name: "김민수",
    fatherName: "김철수",
    motherName: "박영희",
    phone: "010-1234-5678",
    relation: "장남",
    account: {
      bank: "신한은행",
      accountNumber: "110-123-456789",
      accountHolder: "김민수",
    },
  },

  bride: {
    name: "이지은",
    fatherName: "이성호",
    motherName: "최미영",
    phone: "010-9876-5432",
    relation: "장녀",
    account: {
      bank: "국민은행",
      accountNumber: "123-456-789012",
      accountHolder: "이지은",
    },
  },

  wedding: {
    date: "2024-05-18T14:00:00+09:00",
    venue: {
      name: "서울 웨딩홀",
      hall: "그랜드홀",
      address: "서울특별시 강남구 테헤란로 123",
      tel: "02-1234-5678",
      lat: 37.5665,
      lng: 126.978,
    },
  },

  content: {
    greeting:
      "서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n\n저희 두 사람이 사랑의 이름으로 지켜나갈 수 있게\n앞날을 축복해 주시면 감사하겠습니다.",
    notice:
      "※ 주차 공간이 협소하오니 가급적 대중교통을 이용해주시기 바랍니다.\n※ 식사는 1층 뷔페에서 준비되어 있습니다.",
  },

  gallery: {
    images: [],
  },

  settings: {
    showParents: true,
    showAccounts: true,
    showMap: true,
    enableRsvp: true,
  },

  isPasswordProtected: false,
  status: "DRAFT",
  viewCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
