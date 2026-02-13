import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { cookies } from 'next/headers';
import { dbRecordToInvitation } from '@/lib/invitation-utils';
import {
  getInvitationCached,
  getInvitationMetaCached,
  incrementViewCount,
} from '@/lib/invitation-cache';
import { InvitationView } from './InvitationView';
import { PasswordGate } from './PasswordGate';

// ============================================================
// OG 메타태그 (카카오톡 공유 미리보기용)
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const invitation = await getInvitationMetaCached(id);

  if (!invitation || invitation.status === 'DELETED') {
    return { title: '청첩장을 찾을 수 없습니다 | Cuggu' };
  }

  if (invitation.status !== 'PUBLISHED') {
    return { title: '청첩장 | Cuggu' };
  }

  const title = `${invitation.groomName} ♥ ${invitation.brideName} 결혼합니다`;
  const description = invitation.introMessage
    ? invitation.introMessage.slice(0, 100)
    : `${invitation.groomName}님과 ${invitation.brideName}님의 결혼식에 초대합니다`;

  const ogImage =
    invitation.galleryImages?.[0] ||
    invitation.aiPhotoUrl ||
    `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cuggu.com'}/og-default.png`;

  return {
    title: `${title} | Cuggu`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogImage }],
    },
  };
}

// ============================================================
// 공개 청첩장 페이지
// ============================================================

export default async function InvitationPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 청첩장 조회 (Redis 캐시 → DB fallback)
  const invitation = await getInvitationCached(id);

  // 존재하지 않거나 삭제됨
  if (!invitation || invitation.status === 'DELETED') {
    notFound();
  }

  // 만료됨
  if (invitation.status === 'EXPIRED') {
    return <StatusPage type="expired" />;
  }

  // DRAFT → 본인만 미리보기 가능
  if (invitation.status === 'DRAFT') {
    const session = await auth();
    const isOwner = session?.user?.id === invitation.userId;

    if (!isOwner) {
      return <StatusPage type="draft" />;
    }
    // 본인이면 아래로 fall through → 렌더링
  }

  // 비밀번호 보호 (PUBLISHED만)
  if (invitation.isPasswordProtected && invitation.status === 'PUBLISHED') {
    const cookieStore = await cookies();
    const verified = cookieStore.get(`invitation_${id}_verified`);

    if (!verified) {
      return <PasswordGate invitationId={id} />;
    }
  }

  // 조회수 증가 (PUBLISHED만, Redis 배치 → lazy DB flush)
  if (invitation.status === 'PUBLISHED') {
    incrementViewCount(id);
  }

  // DB row → Invitation 타입 변환
  const data = dbRecordToInvitation(invitation);
  const isPremium = invitation.user?.premiumPlan === 'PREMIUM';

  return <InvitationView data={data} isPremium={isPremium} />;
}

// ============================================================
// 상태별 안내 페이지
// ============================================================

function StatusPage({ type }: { type: 'draft' | 'expired' }) {
  const config = {
    draft: {
      title: '아직 준비 중인 청첩장입니다',
      description: '청첩장이 발행되면 이 링크에서 확인하실 수 있습니다.',
    },
    expired: {
      title: '만료된 청첩장입니다',
      description: '이 청첩장은 더 이상 열람할 수 없습니다.',
    },
  }[type];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">{type === 'draft' ? '💌' : '⏰'}</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">{config.title}</h1>
        <p className="text-sm text-gray-500">{config.description}</p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
        >
          Cuggu 홈으로
        </a>
      </div>
    </div>
  );
}
