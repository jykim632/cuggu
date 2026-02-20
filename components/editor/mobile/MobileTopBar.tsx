'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, Share2 } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { useToast } from '@/components/ui/Toast';
import { validateInvitation } from '@/lib/editor/validation';

/**
 * 모바일 에디터 상단바
 *
 * 44px 높이, 고정 상단
 * 좌: 뒤로가기, 중앙: 제목, 우: 저장상태 + 발행/공유
 */
export function MobileTopBar() {
  const { invitation, isSaving, lastSaved, updateInvitation } = useInvitationEditor();
  const [isPublishing, setIsPublishing] = useState(false);
  const { showToast } = useToast();

  const isPublished = invitation.status === 'PUBLISHED';

  const getTitle = () => {
    const groomName = invitation.groom?.name || '신랑';
    const brideName = invitation.bride?.name || '신부';
    return `${groomName} \u2665 ${brideName}`;
  };

  const validation = validateInvitation(invitation);

  const handlePublish = async () => {
    if (!validation.isReady) {
      showToast(`조금만 더 채워주세요 — ${validation.missing.join(', ')}`, 'error');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });

      if (!response.ok) throw new Error('발행 실패');

      updateInvitation({ status: 'PUBLISHED' });

      const url = `${window.location.origin}/inv/${invitation.id}`;
      await navigator.clipboard.writeText(url);

      showToast('청첩장이 완성되었어요! 링크를 복사했습니다');
    } catch {
      showToast('발행에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/inv/${invitation.id}`;
    await navigator.clipboard.writeText(url);
    showToast('링크가 복사되었습니다!');
  };

  return (
    <header className="h-11 bg-white border-b border-stone-200 flex items-center justify-between px-3 flex-shrink-0">
      {/* 좌: 뒤로가기 */}
      <Link
        href="/dashboard"
        className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-600 active:text-stone-900 transition-colors"
        aria-label="대시보드로 돌아가기"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* 중앙: 제목 */}
      <div className="flex-1 text-center min-w-0 px-2">
        <span className="text-sm font-medium text-stone-900 truncate block">
          {getTitle()}
        </span>
      </div>

      {/* 우: 저장 상태 + 발행/공유 */}
      <div className="flex items-center gap-2">
        {/* 저장 상태 */}
        {isSaving ? (
          <span className="text-[11px] text-stone-400">저장 중...</span>
        ) : lastSaved ? (
          <span className="text-[11px] text-stone-400">저장됨</span>
        ) : null}

        {/* 발행 / 공유 버튼 */}
        {isPublished ? (
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-2.5 py-1 min-h-[44px] text-xs font-medium text-white bg-pink-500 active:bg-pink-600 rounded-md transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            공유
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="relative flex items-center gap-1 px-2.5 py-1 min-h-[44px] text-xs font-medium text-white bg-pink-500 active:bg-pink-600 disabled:bg-pink-200 rounded-md transition-colors"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            발행
            {!isPublishing && validation.missing.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center px-0.5 text-[9px] font-bold text-white bg-red-500 rounded-full leading-none">
                {validation.missing.length}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
