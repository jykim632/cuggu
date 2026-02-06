import {
  LayoutTemplate,
  Users,
  MapPin,
  MessageSquare,
  Images,
  CreditCard,
  Settings,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type TabGroup = 'template' | 'required' | 'optional' | 'settings';

export interface EditorTab {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  required?: boolean;
  toggleable?: boolean;
  group: TabGroup;
}

export const EDITOR_TABS: EditorTab[] = [
  { id: 'template', label: '템플릿', description: '청첩장 디자인 선택', icon: LayoutTemplate, group: 'template' },
  { id: 'basic', label: '기본 정보', description: '신랑·신부 정보와 가족 설정', icon: Users, required: true, group: 'required' },
  { id: 'venue', label: '예식장', description: '날짜·장소·오시는 길', icon: MapPin, required: true, group: 'required' },
  { id: 'greeting', label: '인사말', description: '하객들께 전하는 메시지', icon: MessageSquare, toggleable: true, group: 'optional' },
  { id: 'gallery', label: '갤러리', description: '사진 업로드 및 관리', icon: Images, toggleable: true, group: 'optional' },
  { id: 'account', label: '계좌', description: '축의금 계좌 안내', icon: CreditCard, toggleable: true, group: 'optional' },
  { id: 'settings', label: '설정', description: '추가 옵션 및 공개 설정', icon: Settings, group: 'settings' },
];

export const TAB_IDS = EDITOR_TABS.map((t) => t.id);

export const DEFAULT_ENABLED_SECTIONS: Record<string, boolean> = {
  greeting: true,
  gallery: true,
  account: true,
};
