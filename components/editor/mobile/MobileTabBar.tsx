'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { EDITOR_TABS, TAB_IDS } from '@/lib/editor/tabs';

/**
 * 모바일 상단 가로 스크롤 탭바
 *
 * BottomNav + StepIndicator 대체. 8개 탭을 1줄로 표시.
 * 토스/네이버 패턴: 가로 스크롤 + active underline animation.
 */
export function MobileTabBar() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeTab = useInvitationEditor((s) => s.activeTab);
  const setActiveTab = useInvitationEditor((s) => s.setActiveTab);
  const getEnabledSections = useInvitationEditor((s) => s.getEnabledSections);
  const invitation = useInvitationEditor((s) => s.invitation);

  const enabledSections = getEnabledSections();

  // 활성화된 탭만 필터링
  const visibleTabs = EDITOR_TABS.filter((tab) => {
    if (!tab.toggleable) return true;
    return enabledSections[tab.id] !== false;
  });

  const isTabCompleted = useCallback((tabId: string): boolean => {
    switch (tabId) {
      case 'template':
        return !!invitation.templateId;
      case 'basic':
        return !!(invitation.groom?.name && invitation.bride?.name);
      case 'venue':
        return !!(invitation.wedding?.date && invitation.wedding?.venue?.name);
      case 'greeting':
        return !!invitation.content?.greeting;
      case 'gallery':
        return (invitation.gallery?.images?.length ?? 0) > 0;
      case 'account': {
        const hasGroom = invitation.groom?.account?.bank && invitation.groom?.account?.accountNumber;
        const hasBride = invitation.bride?.account?.bank && invitation.bride?.account?.accountNumber;
        return !!(hasGroom || hasBride);
      }
      case 'rsvp':
        return invitation.settings?.enableRsvp !== false;
      default:
        return false;
    }
  }, [invitation]);

  // activeTab 변경 시 해당 탭으로 자동 스크롤
  useEffect(() => {
    const el = tabRefs.current.get(activeTab);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div className="flex-shrink-0 border-b border-stone-200 bg-white">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide relative"
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const completed = isTabCompleted(tab.id);

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1 px-3 py-3 text-[13px] whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive
                  ? 'text-stone-900 font-semibold'
                  : 'text-stone-400 font-medium'
              }`}
            >
              {/* 완료 dot */}
              {completed && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              )}
              {tab.label}
              {/* 뱃지 (갤러리 "AI") */}
              {tab.badge && (
                <span className="text-[10px] font-bold text-pink-500 leading-none">
                  {tab.badge}
                </span>
              )}
              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-stone-900 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
