'use client';

import { Camera, Clock, Star } from 'lucide-react';

export type StudioTab = 'generate' | 'history' | 'favorites';

interface AIStudioTabsProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
}

const TABS = [
  { id: 'generate' as const, label: '생성', icon: Camera },
  { id: 'history' as const, label: '히스토리', icon: Clock },
  { id: 'favorites' as const, label: '즐겨찾기', icon: Star },
];

export function AIStudioTabs({ activeTab, onTabChange }: AIStudioTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
