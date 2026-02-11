'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Gem, Check, ExternalLink } from 'lucide-react';
import { AIStyle, PersonRole } from '@/types/ai';
import { AIPhotoUploader } from './components/AIPhotoUploader';
import { StyleSelector } from './components/StyleSelector';
import { AIStreamingGallery } from '@/components/ai/AIStreamingGallery';
import { AIResultGallery } from '@/components/ai/AIResultGallery';
import { AIStudioTabs, type StudioTab } from './components/AIStudioTabs';
import { HistoryTab } from './components/HistoryTab';
import { FavoritesTab } from './components/FavoritesTab';
import { ApplyToInvitationModal } from './components/ApplyToInvitationModal';
import { DEFAULT_MODEL } from '@/lib/ai/models';

const IS_DEV = process.env.NODE_ENV === 'development';

// ── State Types ──

interface RoleState {
  image: File | null;
  style: AIStyle | null;
  generating: boolean;
  streamingUrls: (string | null)[];
  statusMessage: string;
  resultId: string | null;
  resultUrls: string[];
  selectedUrls: string[];
  error: string | null;
}

const initialRoleState: RoleState = {
  image: null,
  style: null,
  generating: false,
  streamingUrls: [null, null],
  statusMessage: '',
  resultId: null,
  resultUrls: [],
  selectedUrls: [],
  error: null,
};

interface AvailableModel {
  id: string;
  name: string;
  description: string;
  costPerImage: number;
  isRecommended: boolean;
}

// ── Main Page ──

export default function AIPhotosPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  const [groom, setGroom] = useState<RoleState>(initialRoleState);
  const [bride, setBride] = useState<RoleState>(initialRoleState);

  // 모델 선택
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  // 적용 모달
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyToast, setApplyToast] = useState<string | null>(null);

  // 히스토리/즐겨찾기 선택 (카드 멀티셀렉트)
  const [historySelectedIds, setHistorySelectedIds] = useState<Set<string>>(new Set());
  const [favoritesSelectedIds, setFavoritesSelectedIds] = useState<Set<string>>(new Set());

  // generations 참조 (선택된 ID → URL 매핑용)
  const historyGenerationsRef = useRef<any[]>([]);
  const favoritesGenerationsRef = useRef<any[]>([]);

  useEffect(() => {
    fetchCredits();
    fetchModels();
  }, []);

  // Toast 자동 닫기
  useEffect(() => {
    if (!applyToast) return;
    const timer = setTimeout(() => setApplyToast(null), 5000);
    return () => clearTimeout(timer);
  }, [applyToast]);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch credits');
      setCredits(data.credits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data.success && data.data.models.length > 0) {
        setAvailableModels(data.data.models);
        const ids = data.data.models.map((m: AvailableModel) => m.id);
        if (!ids.includes(selectedModel)) {
          setSelectedModel(data.data.defaultModel || ids[0]);
        }
      }
    } catch {
      // fetch 실패 시 기본값 유지
    }
  };

  const setState = (role: PersonRole) => (role === 'GROOM' ? setGroom : setBride);

  const handleGenerate = useCallback(async (role: PersonRole) => {
    const state = role === 'GROOM' ? groom : bride;
    const update = role === 'GROOM' ? setGroom : setBride;

    if (!state.image || !state.style) return;
    if (!IS_DEV && credits === 0) {
      update((prev) => ({ ...prev, error: '크레딧이 부족합니다. 추가 구매가 필요합니다.' }));
      return;
    }

    update((prev) => ({
      ...prev,
      generating: true,
      error: null,
      streamingUrls: [null, null],
      statusMessage: '준비 중...',
      resultId: null,
      resultUrls: [],
      selectedUrls: [],
    }));

    try {
      const formData = new FormData();
      formData.append('image', state.image);
      formData.append('style', state.style);
      formData.append('role', role);
      formData.append('modelId', selectedModel);

      const res = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) throw new Error('크레딧이 부족합니다');
        if (res.status === 400) throw new Error(errorData.error || '얼굴을 감지할 수 없습니다');
        if (res.status === 429) throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
        throw new Error(errorData.error || '스트리밍 연결 실패');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'status':
                update((prev) => ({ ...prev, statusMessage: data.message }));
                break;
              case 'image':
                update((prev) => {
                  const next = [...prev.streamingUrls];
                  next[data.index] = data.url;
                  return { ...prev, streamingUrls: next, statusMessage: `${data.progress}/${data.total}장 생성 완료` };
                });
                break;
              case 'done':
                update((prev) => ({
                  ...prev,
                  generating: false,
                  resultId: data.id,
                  resultUrls: data.generatedUrls,
                }));
                setCredits(data.remainingCredits);
                break;
              case 'error':
                throw new Error(data.error);
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } catch (err) {
      update((prev) => ({
        ...prev,
        generating: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, [groom, bride, credits, selectedModel]);

  const handleRegenerate = async (role: PersonRole) => {
    const update = setState(role);
    update((prev) => ({ ...prev, resultId: null, resultUrls: [], selectedUrls: [] }));
    await handleGenerate(role);
  };

  const handleToggleImage = (role: PersonRole, url: string) => {
    const update = setState(role);
    update((prev) => {
      const selected = prev.selectedUrls.includes(url)
        ? prev.selectedUrls.filter((u) => u !== url)
        : [...prev.selectedUrls, url];
      return { ...prev, selectedUrls: selected };
    });
  };

  const handleHistoryToggleSelect = (id: string) => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFavoritesToggleSelect = (id: string) => {
    setFavoritesSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 적용할 이미지 URL 수집
  const getApplyImageUrls = (): string[] => {
    if (activeTab === 'generate') {
      return [...groom.selectedUrls, ...bride.selectedUrls];
    }
    if (activeTab === 'history') {
      return getUrlsFromIds(historySelectedIds, historyGenerationsRef.current);
    }
    if (activeTab === 'favorites') {
      return getUrlsFromIds(favoritesSelectedIds, favoritesGenerationsRef.current);
    }
    return [];
  };

  const applyImageUrls = getApplyImageUrls();
  const canApply = applyImageUrls.length > 0;
  const anyGenerating = groom.generating || bride.generating;

  const selectedCount =
    activeTab === 'generate'
      ? groom.selectedUrls.length + bride.selectedUrls.length
      : activeTab === 'history'
        ? historySelectedIds.size
        : favoritesSelectedIds.size;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-semibold text-stone-900">AI 포토 스튜디오</h1>
          </div>
          <p className="text-sm text-stone-500">
            증명 사진으로 웨딩 화보를 만들어보세요
          </p>
        </div>

        <div className="flex items-center gap-3">
          {availableModels.length > 1 && activeTab === 'generate' && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={anyGenerating}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition-colors hover:border-stone-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{model.isRecommended ? ' ✦' : ''}
                </option>
              ))}
            </select>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
            <Gem className="w-3 h-3" />
            {isLoadingCredits ? (
              '...'
            ) : IS_DEV ? (
              '∞ DEV'
            ) : (
              `${credits} 크레딧`
            )}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <AIStudioTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PersonSection
            role="GROOM"
            state={groom}
            onImageChange={(file) => setGroom((prev) => ({ ...prev, image: file }))}
            onStyleSelect={(style) => setGroom((prev) => ({ ...prev, style }))}
            onGenerate={() => handleGenerate('GROOM')}
            onRegenerate={() => handleRegenerate('GROOM')}
            onToggleImage={(url) => handleToggleImage('GROOM', url)}
            credits={credits}
            anyGenerating={anyGenerating}
          />
          <PersonSection
            role="BRIDE"
            state={bride}
            onImageChange={(file) => setBride((prev) => ({ ...prev, image: file }))}
            onStyleSelect={(style) => setBride((prev) => ({ ...prev, style }))}
            onGenerate={() => handleGenerate('BRIDE')}
            onRegenerate={() => handleRegenerate('BRIDE')}
            onToggleImage={(url) => handleToggleImage('BRIDE', url)}
            credits={credits}
            anyGenerating={anyGenerating}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <HistoryTab
          selectedIds={historySelectedIds}
          onToggleSelect={handleHistoryToggleSelect}
          onGenerationsLoaded={(gens) => { historyGenerationsRef.current = gens; }}
        />
      )}

      {activeTab === 'favorites' && (
        <FavoritesTab
          selectedIds={favoritesSelectedIds}
          onToggleSelect={handleFavoritesToggleSelect}
          onGenerationsLoaded={(gens) => { favoritesGenerationsRef.current = gens; }}
        />
      )}

      {/* 적용 바 (sticky bottom) */}
      {canApply && (
        <div className="sticky bottom-6 z-10">
          <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-white px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">
                {selectedCount}장 선택됨
              </span>
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                <Sparkles className="w-4 h-4" />
                청첩장에 적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 적용 모달 */}
      <ApplyToInvitationModal
        isOpen={showApplyModal}
        imageUrls={applyImageUrls}
        onClose={() => setShowApplyModal(false)}
        onApplied={(name) => {
          setApplyToast(`${selectedCount}장이 ${name}에 추가됨`);
          // 선택 초기화
          if (activeTab === 'generate') {
            setGroom((prev) => ({ ...prev, selectedUrls: [] }));
            setBride((prev) => ({ ...prev, selectedUrls: [] }));
          } else if (activeTab === 'history') {
            setHistorySelectedIds(new Set());
          } else {
            setFavoritesSelectedIds(new Set());
          }
        }}
      />

      {/* 적용 완료 토스트 */}
      {applyToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl bg-stone-900 px-5 py-3 text-sm text-white shadow-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span>{applyToast}</span>
            <a
              href="/dashboard/invitations"
              className="flex items-center gap-1 text-rose-300 hover:text-rose-200"
            >
              에디터 열기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper ──

function getUrlsFromIds(ids: Set<string>, generations: any[]): string[] {
  const urls: string[] = [];
  for (const gen of generations) {
    if (ids.has(gen.id) && gen.generatedUrls) {
      urls.push(...gen.generatedUrls);
    }
  }
  return urls;
}

// ── PersonSection ──

interface PersonSectionProps {
  role: PersonRole;
  state: RoleState;
  onImageChange: (file: File | null) => void;
  onStyleSelect: (style: AIStyle) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onToggleImage: (url: string) => void;
  credits: number;
  anyGenerating: boolean;
}

function PersonSection({
  role,
  state,
  onImageChange,
  onStyleSelect,
  onGenerate,
  onRegenerate,
  onToggleImage,
  credits,
  anyGenerating,
}: PersonSectionProps) {
  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const canGenerate = state.image && state.style && !state.generating && state.resultUrls.length === 0;

  // 생성 중 (스트리밍)
  if (state.generating) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-800">{roleLabel}</h2>
        <AIStreamingGallery
          role={role}
          images={state.streamingUrls}
          statusMessage={state.statusMessage}
          originalImage={state.image}
        />
      </section>
    );
  }

  // 결과 있음
  if (state.resultUrls.length > 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-800">{roleLabel}</h2>
        <AIResultGallery
          role={role}
          images={state.resultUrls}
          selectedImages={state.selectedUrls}
          onToggleImage={onToggleImage}
          onRegenerate={onRegenerate}
          remainingCredits={credits}
          disabled={anyGenerating}
        />
      </section>
    );
  }

  // 업로드 & 스타일 선택
  return (
    <section className="space-y-6 rounded-lg border border-stone-200 bg-stone-50 p-6">
      <AIPhotoUploader
        role={role}
        image={state.image}
        onImageChange={onImageChange}
        disabled={anyGenerating}
      />

      {state.image && (
        <StyleSelector
          selectedStyle={state.style}
          onStyleSelect={onStyleSelect}
          disabled={anyGenerating}
        />
      )}

      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {state.error}
        </div>
      )}

      {canGenerate && (
        <button
          onClick={onGenerate}
          disabled={anyGenerating || (!IS_DEV && credits === 0)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-stone-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {roleLabel} AI 사진 생성 (1 크레딧)
        </button>
      )}

      {!IS_DEV && credits === 0 && state.image && state.style && (
        <p className="text-xs text-amber-600 text-center">
          크레딧이 부족합니다. 크레딧을 충전해주세요.
        </p>
      )}
    </section>
  );
}
