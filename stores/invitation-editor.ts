import { create } from 'zustand';
import { EDITOR_TABS, TAB_IDS, DEFAULT_ENABLED_SECTIONS } from '@/lib/editor/tabs';
import { validateInvitation, type ValidationResult } from '@/lib/editor/validation';

import type { Invitation, ExtendedData } from '@/schemas/invitation';

type DeepPartial<T> = T extends object
  ? T extends (infer U)[]
    ? DeepPartial<U>[]
    : { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

interface ValidationStatus {
  completed: boolean;
  hasError: boolean;
}

const MAX_RETRY = 3;
const RETRY_DELAY = 5000; // 5초

interface InvitationEditorStore {
  // 상태
  invitation: DeepPartial<Invitation>;
  activeTab: string;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  retryCount: number;
  validation: Record<string, ValidationStatus>;
  validationResult: ValidationResult;

  // 액션
  setInvitation: (data: DeepPartial<Invitation>) => void;
  updateInvitation: (data: DeepPartial<Invitation>) => void;
  setActiveTab: (tab: string) => void;
  toggleSection: (sectionId: string, enabled: boolean) => void;
  getEnabledSections: () => Record<string, boolean>;
  save: () => Promise<void>;
  retrySave: () => void;
  reset: () => void;
  setValidation: (tabId: string, status: ValidationStatus) => void;
}

// 자동 저장 타이머
let autoSaveTimer: NodeJS.Timeout | null = null;
let retryTimer: NodeJS.Timeout | null = null;

export const useInvitationEditor = create<InvitationEditorStore>((set, get) => ({
  // 초기 상태
  invitation: {},
  activeTab: 'template',
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  saveError: null,
  retryCount: 0,
  validation: {},
  validationResult: { isReady: false, missing: [], tabStatus: {} },

  // 전체 교체 (초기 로드 시)
  setInvitation: (data) => {
    set({
      invitation: data,
      hasUnsavedChanges: false,
      lastSaved: null,
      saveError: null,
      retryCount: 0,
      validationResult: validateInvitation(data),
    });
  },

  // 부분 업데이트 (편집 시 - 자동 저장 트리거)
  updateInvitation: (data) => {
    const updated = { ...get().invitation, ...data };
    set({
      invitation: updated,
      hasUnsavedChanges: true,
      validationResult: validateInvitation(updated),
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
      extendedData: { ...extendedData, enabledSections: updated as ExtendedData['enabledSections'] },
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

      set({
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isSaving: false,
        saveError: null,
        retryCount: 0,
      });

      // 재시도 타이머 취소
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    } catch (error) {
      console.error('저장 실패:', error);
      const currentRetry = get().retryCount;

      set({
        isSaving: false,
        saveError: '저장에 실패했습니다',
        retryCount: currentRetry + 1,
      });

      // 로컬 스토리지에 백업
      try {
        localStorage.setItem(
          `invitation_${invitation.id}_backup`,
          JSON.stringify(invitation)
        );
      } catch {
        // 백업 실패는 무시
      }

      // 재시도 가능하면 자동 재시도
      if (currentRetry + 1 < MAX_RETRY) {
        retryTimer = setTimeout(() => {
          get().save();
        }, RETRY_DELAY);
      }
    }
  },

  // 수동 재시도
  retrySave: () => {
    set({ saveError: null, retryCount: 0 });
    get().save();
  },

  // 초기화
  reset: () => {
    // 타이머 취소
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    set({
      invitation: {},
      activeTab: 'template',
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      saveError: null,
      retryCount: 0,
      validation: {},
      validationResult: { isReady: false, missing: [], tabStatus: {} },
    });
  },
}));
