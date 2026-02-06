import { create } from 'zustand';
import { EDITOR_TABS, TAB_IDS, DEFAULT_ENABLED_SECTIONS } from '@/lib/editor/tabs';

// Invitation 타입 임포트 (추후 schemas에서 가져올 예정)
type Invitation = any; // TODO: schemas/invitation.ts에서 타입 임포트

interface ValidationStatus {
  completed: boolean;
  hasError: boolean;
}

interface InvitationEditorStore {
  // 상태
  invitation: Partial<Invitation>;
  activeTab: string;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  validation: Record<string, ValidationStatus>;

  // 액션
  setInvitation: (data: Partial<Invitation>) => void;
  updateInvitation: (data: Partial<Invitation>) => void;
  setActiveTab: (tab: string) => void;
  toggleSection: (sectionId: string, enabled: boolean) => void;
  getEnabledSections: () => Record<string, boolean>;
  save: () => Promise<void>;
  reset: () => void;
  setValidation: (tabId: string, status: ValidationStatus) => void;
}

// 자동 저장 타이머
let autoSaveTimer: NodeJS.Timeout | null = null;

export const useInvitationEditor = create<InvitationEditorStore>((set, get) => ({
  // 초기 상태
  invitation: {},
  activeTab: 'template',
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  validation: {},

  // 전체 교체 (초기 로드 시)
  setInvitation: (data) => {
    set({
      invitation: data,
      hasUnsavedChanges: false,
      lastSaved: null,
    });
  },

  // 부분 업데이트 (편집 시 - 자동 저장 트리거)
  updateInvitation: (data) => {
    const updated = { ...get().invitation, ...data };
    set({
      invitation: updated,
      hasUnsavedChanges: true,
    });

    // 기존 타이머 취소
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // 2초 후 자동 저장
    autoSaveTimer = setTimeout(() => {
      get().save();
    }, 2000);
  },

  // 탭 전환
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // 섹션 토글
  toggleSection: (sectionId, enabled) => {
    const current = get().invitation;
    const extendedData = (current.extendedData as Record<string, unknown>) || {};
    const enabledSections = (extendedData.enabledSections as Record<string, boolean>) || { ...DEFAULT_ENABLED_SECTIONS };

    const updated = { ...enabledSections, [sectionId]: enabled };

    get().updateInvitation({
      extendedData: { ...extendedData, enabledSections: updated },
    });

    // 토글 off한 섹션이 현재 activeTab이면 다음 활성 탭으로 이동
    if (!enabled && get().activeTab === sectionId) {
      const nextTab = TAB_IDS.find((id) => {
        const tab = EDITOR_TABS.find((t) => t.id === id);
        if (!tab?.toggleable) return true;
        return id === sectionId ? false : updated[id] !== false;
      });
      if (nextTab) set({ activeTab: nextTab });
    }
  },

  // enabledSections 헬퍼
  getEnabledSections: () => {
    const extendedData = (get().invitation.extendedData as Record<string, unknown>) || {};
    return (extendedData.enabledSections as Record<string, boolean>) || { ...DEFAULT_ENABLED_SECTIONS };
  },

  // 검증 상태 업데이트
  setValidation: (tabId, status) => {
    set((state) => ({
      validation: {
        ...state.validation,
        [tabId]: status,
      },
    }));
  },

  // 저장
  save: async () => {
    const { invitation, isSaving } = get();

    // 이미 저장 중이면 무시
    if (isSaving) return;

    // ID가 없으면 저장 불가 (생성 후에만 자동 저장 가능)
    if (!invitation.id) {
      console.warn('청첩장 ID가 없어서 저장할 수 없습니다.');
      return;
    }

    set({ isSaving: true });

    try {
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
      });

      if (!response.ok) {
        throw new Error('저장 실패');
      }

      const result = await response.json();

      set({
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isSaving: false,
      });

      console.log('✅ 자동 저장 완료:', result);
    } catch (error) {
      console.error('❌ 저장 실패:', error);

      // 로컬 스토리지에 백업
      try {
        localStorage.setItem(
          `invitation_${invitation.id}_backup`,
          JSON.stringify(invitation)
        );
        console.log('💾 로컬 스토리지에 백업됨');
      } catch (backupError) {
        console.error('백업 실패:', backupError);
      }

      set({ isSaving: false });
    }
  },

  // 초기화
  reset: () => {
    // 타이머 취소
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }

    set({
      invitation: {},
      activeTab: 'template',
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      validation: {},
    });
  },
}));
