'use client';

import { TemplateTab } from './tabs/TemplateTab';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { VenueTab } from './tabs/VenueTab';
import { GreetingTab } from './tabs/GreetingTab';
import { GalleryTab } from './tabs/GalleryTab';
import { AccountTab } from './tabs/AccountTab';
import { SettingsTab } from './tabs/SettingsTab';

interface EditorPanelProps {
  activeTab: string;
  invitation: any; // TODO: Invitation 타입
}

/**
 * 중앙 편집 영역
 *
 * activeTab에 따라 해당하는 탭 컴포넌트를 렌더링
 */
export function EditorPanel({ activeTab, invitation }: EditorPanelProps) {
  const renderTab = () => {
    switch (activeTab) {
      case 'template':
        return <TemplateTab />;
      case 'basic':
        return <BasicInfoTab />;
      case 'venue':
        return <VenueTab />;
      case 'greeting':
        return <GreetingTab />;
      case 'gallery':
        return <GalleryTab />;
      case 'account':
        return <AccountTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return (
          <div className="text-center text-gray-500">
            탭을 선택하세요
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50/50">
      <div className="max-w-3xl mx-auto px-8 py-6">
        {renderTab()}
      </div>
    </div>
  );
}
