'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Eye, Share2, ArrowLeft, Send, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface TopBarProps {
  invitation: any; // TODO: Invitation 타입
  isSaving: boolean;
  lastSaved: Date | null;
  onUpdateInvitation?: (data: Record<string, unknown>) => void;
}

/**
 * 편집기 상단 메뉴바
 *
 * - 텍스트 로고 + 저장 상태
 * - 미리보기 / 발행하기 / 공유 버튼
 */
export function TopBar({ invitation, isSaving, lastSaved, onUpdateInvitation }: TopBarProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { showToast } = useToast();

  const isPublished = invitation.status === 'PUBLISHED';

  // 발행하기
  const handlePublish = async () => {
    // 필수 필드 검증
    const missing: string[] = [];
    if (!invitation.groom?.name || invitation.groom.name === '신랑') missing.push('신랑 이름');
    if (!invitation.bride?.name || invitation.bride.name === '신부') missing.push('신부 이름');
    if (!invitation.wedding?.date) missing.push('예식 날짜');
    if (!invitation.wedding?.venue?.name || invitation.wedding.venue.name === '예식장') missing.push('예식장 이름');

    if (missing.length > 0) {
      showToast(`필수 정보를 입력해주세요: ${missing.join(', ')}`, 'error');
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

      // 로컬 상태 업데이트
      onUpdateInvitation?.({ status: 'PUBLISHED' });

      // URL 복사
      const url = `${window.location.origin}/inv/${invitation.id}`;
      await navigator.clipboard.writeText(url);

      showToast('청첩장이 발행되었습니다! 링크가 복사되었습니다.');
    } catch {
      showToast('발행에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // 공유 (링크 복사)
  const handleShare = async () => {
    const url = `${window.location.origin}/inv/${invitation.id}`;
    await navigator.clipboard.writeText(url);
    showToast('링크가 복사되었습니다!');
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
  };

  const getTitle = () => {
    const groomName = invitation.groom?.name || '신랑';
    const brideName = invitation.bride?.name || '신부';
    return `${groomName} ♥ ${brideName}`;
  };

  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* 좌측: 로고 + 제목 */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-stone-900 hover:text-stone-600 transition-colors"
        >
          Cuggu
        </Link>

        <div className="h-5 w-px bg-stone-200" />

        <div className="text-sm text-stone-600">
          {getTitle()}
        </div>

        {/* 발행 상태 뱃지 */}
        {isPublished && (
          <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
            발행됨
          </span>
        )}
      </div>

      {/* 우측: 상태 + 액션 버튼 */}
      <div className="flex items-center gap-2">
        {/* 저장 상태 */}
        <div className="text-xs text-stone-500 mr-2">
          {isSaving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              저장 중
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              {formatTimeAgo(lastSaved)}
            </span>
          ) : null}
        </div>

        {/* 대시보드로 */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          대시보드
        </Link>

        {/* 미리보기 */}
        <button
          onClick={() => window.open(`/inv/${invitation.id}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          미리보기
        </button>

        {/* 발행하기 / 공유 */}
        {isPublished ? (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            공유
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:bg-pink-200 rounded-lg transition-colors"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            발행하기
          </button>
        )}
      </div>
    </header>
  );
}
