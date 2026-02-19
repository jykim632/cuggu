'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { TopBar } from '@/components/editor/TopBar';
import { SectionPanel } from '@/components/editor/SectionPanel';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { PreviewPanel } from '@/components/editor/PreviewPanel';

/**
 * Figma 스타일 청첩장 편집기
 *
 * 레이아웃:
 * - 상단: TopBar (로고, 저장 상태, 액션 버튼)
 * - 좌측: Sidebar (탭 메뉴)
 * - 중앙: EditorPanel (편집 폼)
 * - 우측: PreviewPanel (실시간 미리보기)
 */
export default function InvitationEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const {
    invitation,
    setInvitation,
    updateInvitation,
    activeTab,
    isSaving,
    lastSaved,
    saveError,
    retrySave,
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
          console.log('[Editor] loaded invitation:', result.data);
          console.log('[Editor] templateId:', result.data.templateId);
          console.log('[Editor] venue:', result.data.wedding?.venue);
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
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">청첩장을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 상단 메뉴바 */}
      <TopBar
        invitation={invitation}
        isSaving={isSaving}
        lastSaved={lastSaved}
        saveError={saveError}
        onRetrySave={retrySave}
        onUpdateInvitation={updateInvitation}
      />

      {/* 3-패널 레이아웃 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 섹션 패널 */}
        <SectionPanel activeTab={activeTab} invitation={invitation} />

        {/* 중앙: 편집 영역 */}
        <EditorPanel activeTab={activeTab} invitation={invitation} />

        {/* 우측: 실시간 미리보기 */}
        <PreviewPanel invitation={invitation} />
      </div>
    </>
  );
}
