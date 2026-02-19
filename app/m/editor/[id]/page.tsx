'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { MobileTopBar } from '@/components/editor/mobile/MobileTopBar';
import { MobileTabBar } from '@/components/editor/mobile/MobileTabBar';
import { MobileEditorShell } from '@/components/editor/mobile/MobileEditorShell';
import { MobilePreviewOverlay, MobilePreviewFAB } from '@/components/editor/mobile/MobilePreviewOverlay';

/**
 * 모바일 청첩장 편집기
 *
 * 모바일 전용 UI: MobileTopBar + MobileTabBar + MobileEditorShell + 미리보기 FAB/오버레이
 */
export default function MobileEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const {
    invitation,
    setInvitation,
    reset,
  } = useInvitationEditor();

  // 청첩장 데이터 로드
  useEffect(() => {
    async function loadInvitation() {
      try {
        const response = await fetch(`/api/invitations/${id}`);

        if (!response.ok) {
          throw new Error('청첩장을 불러올 수 없습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setInvitation(result.data);
        }
      } catch (error) {
        console.error('청첩장 로드 실패:', error);

        // API 없을 때 기본값으로 초기화 (임시)
        setInvitation({
          id: id,
          userId: 'temp-user',
          templateId: 'classic',
          groom: { name: '' },
          bride: { name: '' },
          wedding: { date: '', venue: { name: '', address: '' } },
          content: {},
          gallery: { images: [] },
          settings: { showParents: false, showAccounts: false, showMap: false, enableRsvp: false, calendarStyle: 'none' as const },
          status: 'DRAFT',
          viewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (id) {
      loadInvitation();
    }

    // 컴포넌트 언마운트 시 store 초기화
    return () => {
      reset();
    };
  }, [id, setInvitation, reset]);

  // 로딩 중
  if (!invitation.id) {
    return (
      <div className="h-screen h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">청첩장을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col">
      <MobileTopBar />
      <MobileTabBar />
      <MobileEditorShell />
      <MobilePreviewFAB onOpen={() => setShowMobilePreview(true)} />
      <MobilePreviewOverlay
        invitation={invitation}
        isOpen={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
      />
    </div>
  );
}
