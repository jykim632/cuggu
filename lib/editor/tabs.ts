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

export interface EditorTab {
  id: string;
  label: string;
  icon: LucideIcon;
  required?: boolean;
}

export const EDITOR_TABS: EditorTab[] = [
  { id: 'template', label: '템플릿', icon: LayoutTemplate },
  { id: 'basic', label: '기본 정보', icon: Users, required: true },
  { id: 'venue', label: '예식장', icon: MapPin, required: true },
  { id: 'greeting', label: '인사말', icon: MessageSquare },
  { id: 'gallery', label: '갤러리', icon: Images },
  { id: 'account', label: '계좌', icon: CreditCard },
  { id: 'settings', label: '설정', icon: Settings },
];

export const TAB_IDS = EDITOR_TABS.map((t) => t.id);
