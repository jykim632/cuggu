'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { Check, AlertCircle } from 'lucide-react';
import { EDITOR_TABS } from '@/lib/editor/tabs';

interface SidebarProps {
  activeTab: string;
  invitation: any; // TODO: Invitation 타입
}

/**
 * 좌측 축소형 아이콘 사이드바 (Figma 스타일)
 *
 * - 다크 모드 (slate-900)
 * - 아이콘만 표시
 * - 활성 탭은 왼쪽 border accent
 * - 호버 시 툴팁 (title)
 */
export function Sidebar({ activeTab, invitation }: SidebarProps) {
  const { setActiveTab } = useInvitationEditor();

  const getTabStatus = (tabId: string) => {
    if (tabId === 'template') {
      return invitation.templateId ? 'completed' : 'incomplete';
    }

    if (tabId === 'basic') {
      const hasGroom = invitation.groom?.name;
      const hasBride = invitation.bride?.name;
      return hasGroom && hasBride ? 'completed' : 'incomplete';
    }

    if (tabId === 'venue') {
      const hasDate = invitation.wedding?.date;
      const hasVenue = invitation.wedding?.venue?.name;
      return hasDate && hasVenue ? 'completed' : 'incomplete';
    }

    if (tabId === 'greeting') {
      return invitation.content?.greeting ? 'completed' : 'optional';
    }

    if (tabId === 'gallery') {
      const hasImages = invitation.gallery?.images?.length > 0;
      return hasImages ? 'completed' : 'optional';
    }

    if (tabId === 'account') {
      const hasGroomAccount =
        invitation.groom?.account?.bank &&
        invitation.groom?.account?.accountNumber;
      const hasBrideAccount =
        invitation.bride?.account?.bank &&
        invitation.bride?.account?.accountNumber;
      return hasGroomAccount || hasBrideAccount ? 'completed' : 'optional';
    }

    if (tabId === 'rsvp') {
      return invitation.settings?.enableRsvp !== false ? 'completed' : 'optional';
    }

    return 'optional';
  };

  return (
    <aside className="w-16 bg-stone-50 border-r border-stone-200 flex-shrink-0 flex flex-col">
      <nav className="flex-1 py-4">
        {EDITOR_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const status = getTabStatus(tab.id);
          const isCompleted = status === 'completed';
          const hasError = status === 'incomplete' && tab.required;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`
                relative w-full flex items-center justify-center h-14 transition-all group
                ${isActive ? 'text-stone-900 bg-white' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}
              `}
            >
              {/* 활성 탭 왼쪽 accent bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-pink-400 rounded-r-full" />
              )}

              <div className="relative">
                <Icon className="w-6 h-6" />

                {/* 상태 표시 - 우측 하단 작은 뱃지 */}
                {isCompleted && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" strokeWidth={3} />
                  </div>
                )}
                {hasError && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-2 h-2 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* 호버 시 툴팁 */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
