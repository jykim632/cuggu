'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Eye, Share2, ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useCredits } from '@/hooks/useCredits';
import { ShareModal } from './ShareModal';

interface TopBarProps {
  invitation: any; // TODO: Invitation 타입
  isSaving: boolean;
  lastSaved: Date | null;
  saveError?: string | null;
  onRetrySave?: () => void;
  onUpdateInvitation?: (data: Record<string, unknown>) => void;
}

/**
 * 편집기 상단 메뉴바
 *
 * - 텍스트 로고 + 저장 상태
 * - 미리보기 / 발행하기 / 공유 버튼
 */
export function TopBar({ invitation, isSaving, lastSaved, saveError, onRetrySave, onUpdateInvitation }: TopBarProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isJustPublished, setIsJustPublished] = useState(false);
  const { showToast } = useToast();
  const { credits, isLoading: creditsLoading } = useCredits();

  const isPublished = invitation.status === 'PUBLISHED';

  // 발행하기
  const handlePublish = async () => {
    // 필수 필드 검증
    const missing: string[] = [];
    if (!invitation.groom?.name) missing.push('신랑 이름');
    if (!invitation.bride?.name) missing.push('신부 이름');
    if (!invitation.wedding?.date) missing.push('예식 날짜');
    if (!invitation.wedding?.venue?.name) missing.push('예식장 이름');

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

      // 공유 모달 열기
      setIsJustPublished(true);
      setShowShareModal(true);
    } catch {
      showToast('발행에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // 공유 모달 열기
  const handleShare = () => {
    setIsJustPublished(false);
    setShowShareModal(true);
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
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-3 md:px-6 flex-shrink-0">
      {/* 좌측: 로고 + 제목 */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-stone-900 hover:text-stone-600 transition-colors flex-shrink-0"
        >
          Cuggu
        </Link>

        <div className="h-5 w-px bg-stone-200 hidden md:block" />

        <div className="text-sm text-stone-600 truncate">
          {getTitle()}
        </div>

        {/* 발행 상태 뱃지 */}
        {isPublished && (
          <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full flex-shrink-0">
            발행됨
          </span>
        )}
      </div>

      {/* 우측: 상태 + 액션 버튼 */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* AI 크레딧 - 모바일 숨김 */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-md mr-1">
          <Sparkles className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-medium text-stone-600">
            {creditsLoading ? '...' : credits ?? 0}
          </span>
        </div>

        {/* 저장 상태 */}
        <div className="text-xs mr-1 md:mr-2">
          {saveError ? (
            <button
              onClick={onRetrySave}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors"
              title="클릭하여 재시도"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">저장 실패</span>
            </button>
          ) : isSaving ? (
            <span className="flex items-center gap-1.5 text-stone-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden md:inline">저장 중</span>
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 text-stone-500">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="hidden md:inline">{formatTimeAgo(lastSaved)}</span>
            </span>
          ) : null}
        </div>

        {/* 대시보드로 */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">대시보드</span>
        </Link>

        {/* 미리보기 - 데스크톱만 (모바일은 FAB로 대체) */}
        <button
          onClick={() => window.open(`/preview/${invitation.id}`, '_blank')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          미리보기
        </button>

        {/* 발행하기 / 공유 */}
        {isPublished ? (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 p-2 md:px-4 md:py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">공유</span>
          </button>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 p-2 md:px-4 md:py-1.5 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:bg-pink-200 rounded-lg transition-colors"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden md:inline">발행하기</span>
          </button>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        invitation={invitation}
        isJustPublished={isJustPublished}
      />
    </header>
  );
}
