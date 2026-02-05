'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { EDITOR_TABS, TAB_IDS } from '@/lib/editor/tabs';

interface StepNavigationProps {
  position: 'top' | 'bottom';
}

export function StepNavigation({ position }: StepNavigationProps) {
  const { activeTab, setActiveTab } = useInvitationEditor();

  const currentIndex = TAB_IDS.indexOf(activeTab);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TAB_IDS.length - 1;
  const currentTab = EDITOR_TABS[currentIndex];

  const goToPrev = () => {
    if (!isFirst) {
      setActiveTab(TAB_IDS[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (!isLast) {
      setActiveTab(TAB_IDS[currentIndex + 1]);
    }
  };

  if (position === 'top') {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={isFirst}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 단계"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-stone-600">
            <span className="font-medium text-stone-900">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{TAB_IDS.length}</span>
            <span className="ml-2 text-stone-500">{currentTab?.label}</span>
          </span>
          <button
            onClick={goToNext}
            disabled={isLast}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 단계"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // position === 'bottom'
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-200">
      {!isFirst ? (
        <button
          onClick={goToPrev}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전</span>
        </button>
      ) : (
        <div />
      )}

      {!isLast ? (
        <button
          onClick={goToNext}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
        >
          <span>다음</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
