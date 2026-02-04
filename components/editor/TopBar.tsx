'use client';

import Link from 'next/link';
import { Loader2, Eye, Share2, ArrowLeft } from 'lucide-react';

interface TopBarProps {
  invitation: any; // TODO: Invitation 타입
  isSaving: boolean;
  lastSaved: Date | null;
}

/**
 * 편집기 상단 메뉴바 (모던 스타일)
 *
 * - 텍스트 로고
 * - 저장 상태 표시
 * - 일관된 버튼 디자인
 */
export function TopBar({ invitation, isSaving, lastSaved }: TopBarProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/inv/${invitation.id}`;
    navigator.clipboard.writeText(url);
    alert('링크가 복사되었습니다!'); // TODO: 토스트로 교체
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
    <header className="h-14 bg-gradient-to-r from-pink-50 via-white to-pink-50 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      {/* 좌측: 로고 + 제목 */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-slate-900 hover:text-pink-600 transition-colors"
        >
          Cuggu
        </Link>

        <div className="h-5 w-px bg-slate-200" />

        <div className="text-sm text-slate-600">
          {getTitle()}
        </div>
      </div>

      {/* 우측: 상태 + 액션 버튼 */}
      <div className="flex items-center gap-2">
        {/* 저장 상태 */}
        <div className="text-xs text-slate-500 mr-2">
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
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          대시보드
        </Link>

        {/* 미리보기 */}
        <button
          onClick={() => window.open(`/inv/${invitation.id}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          미리보기
        </button>

        {/* 공유 (주요 액션) */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          공유
        </button>
      </div>
    </header>
  );
}
