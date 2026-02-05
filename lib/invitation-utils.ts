import type { Invitation, ExtendedData } from '@/schemas/invitation';
import { ExtendedDataSchema } from '@/schemas/invitation';

/**
 * DB row 타입 (Drizzle query 결과)
 * invitations 테이블의 실제 컬럼 구조
 */
type DbInvitationRow = {
  id: string;
  userId: string;
  templateId: string;
  groomName: string;
  brideName: string;
  weddingDate: Date;
  venueName: string;
  venueAddress: string | null;
  introMessage: string | null;
  galleryImages: string[] | null;
  aiPhotoUrl: string | null;
  extendedData: unknown;
  isPasswordProtected: boolean;
  passwordHash: string | null;
  viewCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'DELETED';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  template?: {
    id: string;
    name: string;
    category: string;
  } | null;
};

/**
 * DB flat row + extendedData JSONB → 프론트엔드 nested Invitation 타입 변환
 *
 * - 기존 개별 컬럼 (groomName 등) + extendedData JSONB를 합쳐서
 *   템플릿이 기대하는 nested 구조로 변환
 * - extendedData가 깨져 있어도 safeParse로 방어
 */
export function dbRecordToInvitation(row: DbInvitationRow): Invitation {
  // extendedData JSONB를 안전하게 파싱
  const extResult = ExtendedDataSchema.safeParse(row.extendedData ?? {});
  const ext: ExtendedData = extResult.success ? extResult.data : {};

  return {
    id: row.id,
    userId: row.userId,
    templateId: resolveTemplateId(row),

    groom: {
      name: row.groomName,
      fatherName: ext.groom?.fatherName,
      motherName: ext.groom?.motherName,
      isDeceased: ext.groom?.isDeceased,
      phone: ext.groom?.phone,
      relation: ext.groom?.relation,
      displayMode: ext.groom?.displayMode,
      account: ext.groom?.account,
      parentAccounts: ext.groom?.parentAccounts,
    },

    bride: {
      name: row.brideName,
      fatherName: ext.bride?.fatherName,
      motherName: ext.bride?.motherName,
      isDeceased: ext.bride?.isDeceased,
      phone: ext.bride?.phone,
      relation: ext.bride?.relation,
      displayMode: ext.bride?.displayMode,
      account: ext.bride?.account,
      parentAccounts: ext.bride?.parentAccounts,
    },

    wedding: {
      date: row.weddingDate.toISOString(),
      venue: {
        name: row.venueName,
        address: row.venueAddress || '',
        hall: ext.venue?.hall,
        lat: ext.venue?.lat,
        lng: ext.venue?.lng,
        tel: ext.venue?.tel,
        transportation: ext.venue?.transportation,
      },
    },

    content: {
      greeting: row.introMessage || undefined,
      notice: ext.content?.notice,
    },

    gallery: {
      coverImage: ext.gallery?.coverImage,
      images: row.galleryImages || [],
    },

    settings: {
      showParents: ext.settings?.showParents ?? true,
      showAccounts: ext.settings?.showAccounts ?? true,
      showMap: ext.settings?.showMap ?? true,
      enableRsvp: ext.settings?.enableRsvp ?? true,
      backgroundColor: ext.settings?.backgroundColor,
      fontFamily: ext.settings?.fontFamily,
      sectionOrder: ext.settings?.sectionOrder,
    },

    aiPhotoUrl: row.aiPhotoUrl || undefined,
    isPasswordProtected: row.isPasswordProtected,
    status: row.status,
    viewCount: row.viewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
  };
}

/**
 * 프론트엔드 nested Invitation → DB 업데이트용 flat 구조 + extendedData 분리
 *
 * PUT API에서 사용. 기존 컬럼에 해당하는 값은 flat으로,
 * 나머지는 extendedData JSONB로 분리.
 */
export function invitationToDbUpdate(data: Record<string, any>) {
  const updateData: Record<string, unknown> = {};
  const extendedData: Record<string, unknown> = {};

  // 기존 flat 컬럼 매핑
  // templateId는 FK이므로 단순 문자열(classic, floral 등)이면 제외
  // 실제 templates 테이블의 UUID인 경우에만 업데이트
  if (data.templateId !== undefined) {
    const simpleTemplateIds = ['classic', 'modern', 'vintage', 'floral', 'minimal'];
    if (!simpleTemplateIds.includes(data.templateId)) {
      updateData.templateId = data.templateId;
    }
  }
  if (data.groom?.name !== undefined) updateData.groomName = data.groom.name;
  if (data.bride?.name !== undefined) updateData.brideName = data.bride.name;
  if (data.wedding?.date !== undefined) {
    updateData.weddingDate = new Date(data.wedding.date);
    updateData.expiresAt = new Date(
      new Date(data.wedding.date).getTime() + 90 * 24 * 60 * 60 * 1000
    );
  }
  if (data.wedding?.venue?.name !== undefined) updateData.venueName = data.wedding.venue.name;
  if (data.wedding?.venue?.address !== undefined) updateData.venueAddress = data.wedding.venue.address;
  if (data.content?.greeting !== undefined) updateData.introMessage = data.content.greeting;
  if (data.gallery?.images !== undefined) updateData.galleryImages = data.gallery.images;
  if (data.aiPhotoUrl !== undefined) updateData.aiPhotoUrl = data.aiPhotoUrl;
  if (data.isPasswordProtected !== undefined) updateData.isPasswordProtected = data.isPasswordProtected;
  if (data.status !== undefined) updateData.status = data.status;

  // extendedData 매핑 (기존 컬럼에 없는 필드들)
  if (data.groom) {
    const { name, ...groomExtended } = data.groom;
    if (Object.keys(groomExtended).length > 0) extendedData.groom = groomExtended;
  }
  if (data.bride) {
    const { name, ...brideExtended } = data.bride;
    if (Object.keys(brideExtended).length > 0) extendedData.bride = brideExtended;
  }
  if (data.wedding?.venue) {
    const { name, address, ...venueExtended } = data.wedding.venue;
    if (Object.keys(venueExtended).length > 0) extendedData.venue = venueExtended;
  }
  if (data.content?.notice !== undefined) {
    extendedData.content = { notice: data.content.notice };
  }
  if (data.gallery?.coverImage !== undefined) {
    extendedData.gallery = { coverImage: data.gallery.coverImage };
  }
  if (data.settings) {
    extendedData.settings = data.settings;
  }

  if (Object.keys(extendedData).length > 0) {
    updateData.extendedData = extendedData;
  }

  return updateData;
}

/**
 * templateId 해석
 * DB의 templateId가 단순 문자열('classic')이면 그대로,
 * cuid2 ID면 template relation의 category 사용
 */
function resolveTemplateId(row: DbInvitationRow): string {
  const simpleIds = ['classic', 'modern', 'vintage', 'floral', 'minimal'];
  if (simpleIds.includes(row.templateId)) return row.templateId;

  // template relation이 있으면 category 기반으로 매핑
  if (row.template?.category) {
    return row.template.category.toLowerCase();
  }

  return 'classic';
}
