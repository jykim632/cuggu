'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Loader2,
  FolderPlus,
  Images,
} from 'lucide-react';
import { createId } from '@paralleldrive/cuid2';
import { AIStyle, PersonRole, SnapType, SNAP_TYPES, AlbumImage, AlbumGroup, ReferencePhoto } from '@/types/ai';
import { AlbumCuration } from './AlbumCuration';
import { GeneratedPhotosDrawer } from './GeneratedPhotosDrawer';
import { GenerationCard } from './GenerationCard';
import { type WizardConfig } from './GenerationWizard';
import { GenerationFloatingBar } from './GenerationFloatingBar';
import { ReferencePhotoSection } from './ReferencePhotoSection';
import { AIGenerationModal } from './AIGenerationModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { useAIGeneration } from '@/hooks/useAIGeneration';

// ── Types ──

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  images: AlbumImage[];
  groups: AlbumGroup[];
  status: string;
  generations: Generation[];
}

interface Generation {
  id: string;
  style: string;
  role: string | null;
  generatedUrls: string[] | null;
  isFavorited?: boolean;
  createdAt: string;
}

interface AlbumDashboardProps {
  album: Album;
  credits: number;
  selectedModel: string;
  onCreditsChange: (credits: number) => void;
  onRefreshAlbum: () => void;
  onShowApplyModal: () => void;
}

export function AlbumDashboard({
  album,
  credits,
  selectedModel,
  onCreditsChange,
  onRefreshAlbum,
  onShowApplyModal,
}: AlbumDashboardProps) {
  // ── State ──
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(album.name);
  const [curatedImages, setCuratedImages] = useState<AlbumImage[]>(album.images ?? []);
  const [groups, setGroups] = useState<AlbumGroup[]>(album.groups ?? []);
  const [legacyGenerations, setLegacyGenerations] = useState<Generation[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [savingCuration, setSavingCuration] = useState<'idle' | 'saving' | 'done'>('idle');
  const [saveAction, setSaveAction] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [tagEditingUrl, setTagEditingUrl] = useState<string | null>(null);

  // 그룹 추가 UI
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);
  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm: onConfirm, handleCancel: onCancel } = useConfirm();
  const { showToast } = useToast();

  // 참조 사진
  const [referencePhotos, setReferencePhotos] = useState<ReferencePhoto[]>([]);
  const [refPhotosLoading, setRefPhotosLoading] = useState(true);

  // 생성 wizard
  const [showWizard, setShowWizard] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // AI 생성 모달
  const [showAiModal, setShowAiModal] = useState(false);

  // Drawer
  const [showDrawer, setShowDrawer] = useState(false);

  // Tool section open states
  const [refSectionOpen, setRefSectionOpen] = useState(false);
  const [legacySectionOpen, setLegacySectionOpen] = useState(false);

  // Scroll refs
  const refSectionRef = useRef<HTMLDivElement>(null);

  const snapType = album.snapType as SnapType | null;

  // ── Derived values ──
  const hasRefPhotos = referencePhotos.length > 0;
  const curatedCount = curatedImages.length;
  const totalGenerated = album.generations.reduce(
    (sum, g) => sum + (g.generatedUrls?.length ?? 0),
    0
  );
  const isEmpty = curatedCount === 0;
  const hasGenerations = totalGenerated > 0;
  const snapTypeInfo = SNAP_TYPES.find((t) => t.value === snapType);
  const allTags = Array.from(
    new Set(curatedImages.flatMap((img) => img.tags ?? []))
  );

  // ── useAIGeneration hook ──
  const generation = useAIGeneration({
    albumId: album.id,
    modelId: selectedModel,
    onCreditsChange,
    onComplete: onRefreshAlbum,
  });

  // ── AI 생성 모달 열기 ──
  const handleOpenAiModal = useCallback(() => {
    if (!hasRefPhotos) {
      setRefSectionOpen(true);
      setTimeout(() => {
        refSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      showToast('먼저 참조 사진을 등록하세요', 'info');
      return;
    }
    setShowAiModal(true);
    setIsMinimized(false);
  }, [hasRefPhotos, showToast]);

  // ── 생성 완료 시 toast 피드백 ──
  const wasGeneratingRef = useRef(false);

  useEffect(() => {
    const wasGenerating = wasGeneratingRef.current;
    wasGeneratingRef.current = generation.state.isGenerating;

    if (!wasGenerating || generation.state.isGenerating) return;

    // isGenerating: true → false 전환 감지
    const { error, jobResult, completedUrls } = generation.state;

    if (error) {
      showToast(error, 'error');
    } else if (jobResult) {
      // 배치 생성
      if (jobResult.failedImages > 0) {
        const msg = `${jobResult.completedImages}/${jobResult.totalImages}장 완료 (${jobResult.failedImages}장 실패${jobResult.creditsRefunded > 0 ? `, ${jobResult.creditsRefunded} 크레딧 환불` : ''})`;
        showToast(msg, 'info');
      } else {
        showToast(`${jobResult.completedImages}장 생성 완료!`, 'success');
      }
    } else if (completedUrls.length > 0) {
      // 단건 생성
      showToast(`${completedUrls.length}장 생성 완료!`, 'success');
    }
  }, [generation.state.isGenerating, generation.state.error, generation.state.jobResult, generation.state.completedUrls, showToast]);

  // ── 생성 완료 시 자동 큐레이션 ──
  const autoAddUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (generation.state.isGenerating) {
      generation.state.completedUrls.forEach((url) => autoAddUrlsRef.current.add(url));
    }
  }, [generation.state.completedUrls, generation.state.isGenerating]);

  // ── 참조 사진 로드 ──
  useEffect(() => {
    const fetchRefPhotos = async () => {
      try {
        setRefPhotosLoading(true);
        const res = await fetch('/api/ai/reference-photos');
        const data = await res.json();
        if (data.success) {
          setReferencePhotos(data.data);
        }
      } catch {
        // 실패 시 무시
      } finally {
        setRefPhotosLoading(false);
      }
    };
    fetchRefPhotos();
  }, []);

  // ── 참조 사진 로드 완료 시 도구 섹션 초기 상태 ──
  useEffect(() => {
    if (refPhotosLoading) return;
    const empty = (album.images ?? []).length === 0;
    const hasRef = referencePhotos.length > 0;
    setRefSectionOpen(!hasRef && empty);
  }, [refPhotosLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync album data when album prop changes
  useEffect(() => {
    const albumImages = album.images ?? [];
    const pendingUrls = autoAddUrlsRef.current;

    if (pendingUrls.size > 0) {
      // 생성 완료 후 album 갱신됨 — 새 사진 자동 큐레이션
      const curatedUrlSet = new Set(albumImages.map((img) => img.url));
      const newImages: AlbumImage[] = [];

      for (const gen of album.generations) {
        for (const url of gen.generatedUrls ?? []) {
          if (pendingUrls.has(url) && !curatedUrlSet.has(url)) {
            newImages.push({
              url,
              generationId: gen.id,
              style: gen.style as AIStyle,
              role: (gen.role ?? 'GROOM') as PersonRole,
              sortOrder: albumImages.length + newImages.length,
            });
          }
        }
      }
      pendingUrls.clear();

      if (newImages.length > 0) {
        const updated = [...albumImages, ...newImages];
        setCuratedImages(updated);
        setGroups(album.groups ?? []);
        setNameInput(album.name);
        // 서버에 저장 — 실패 시 롤백
        fetch(`/api/ai/albums/${album.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: updated }),
        }).then((res) => {
          if (!res.ok) {
            setCuratedImages(albumImages);
            showToast('자동 큐레이션 저장에 실패했습니다', 'error');
          }
        }).catch(() => {
          setCuratedImages(albumImages);
          showToast('자동 큐레이션 저장에 실패했습니다', 'error');
        });
        return;
      }
    }

    setCuratedImages(albumImages);
    setGroups(album.groups ?? []);
    setNameInput(album.name);
  }, [album.id, album.images, album.groups, album.name, album.generations]);

  // ── 앨범 이름 수정 ──
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      const res = await fetch(`/api/ai/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (!res.ok) {
        showToast('앨범 이름 저장에 실패했습니다', 'error');
        return;
      }
      setEditingName(false);
      onRefreshAlbum();
    } catch {
      showToast('앨범 이름 저장에 실패했습니다', 'error');
    }
  };

  // ── 큐레이션 저장 (images + groups) ──
  const saveCuration = useCallback(async (images: AlbumImage[], grps?: AlbumGroup[], action?: string) => {
    setSaveAction(action ?? '저장');
    setSavingCuration('saving');
    try {
      const body: Record<string, unknown> = { images };
      if (grps !== undefined) body.groups = grps;
      await fetch(`/api/ai/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSavingCuration('done');
      setTimeout(() => setSavingCuration('idle'), 1500);
    } catch {
      setSavingCuration('idle');
    }
  }, [album.id]);

  const handleCurationChange = useCallback((images: AlbumImage[], action?: string) => {
    setCuratedImages(images);
    saveCuration(images, groups, action ?? '수정');
  }, [saveCuration, groups]);

  // ── 그룹 관리 ──
  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) return;
    const newGroup: AlbumGroup = {
      id: createId(),
      name: newGroupName.trim(),
      sortOrder: groups.length,
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setNewGroupName('');
    setShowGroupInput(false);
    saveCuration(curatedImages, updated, '그룹 추가');
  }, [newGroupName, groups, curatedImages, saveCuration]);

  const handleRenameGroup = useCallback((groupId: string, name: string) => {
    const updated = groups.map((g) => g.id === groupId ? { ...g, name } : g);
    setGroups(updated);
    saveCuration(curatedImages, updated, '그룹 수정');
  }, [groups, curatedImages, saveCuration]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.isDefault) return;

    const imagesInGroup = curatedImages.filter((img) => img.groupId === groupId);
    const confirmed = await confirm({
      title: `"${group.name}" 그룹을 삭제하시겠습니까?`,
      description: imagesInGroup.length > 0
        ? `그룹 내 ${imagesInGroup.length}장의 사진은 미분류로 이동됩니다.`
        : '빈 그룹이 삭제됩니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'warning',
    });

    if (!confirmed) return;

    const updated = groups
      .filter((g) => g.id !== groupId)
      .map((g, i) => ({ ...g, sortOrder: i }));
    const updatedImages = curatedImages.map((img) =>
      img.groupId === groupId ? { ...img, groupId: undefined } : img
    );
    setGroups(updated);
    setCuratedImages(updatedImages);
    saveCuration(updatedImages, updated, '그룹 삭제');
  }, [groups, curatedImages, saveCuration, confirm]);

  // ── 태그 관리 ──
  const handleToggleTag = useCallback((url: string, tag: string) => {
    const updated = curatedImages.map((img) => {
      if (img.url !== url) return img;
      const tags = img.tags ?? [];
      const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
      return { ...img, tags: newTags };
    });
    setCuratedImages(updated);
    saveCuration(updated, groups, '태그 수정');
  }, [curatedImages, groups, saveCuration]);

  const handleAddCustomTag = useCallback((url: string, tag: string) => {
    if (!tag.trim()) return;
    const trimmed = tag.trim().slice(0, 30);
    const updated = curatedImages.map((img) => {
      if (img.url !== url) return img;
      const tags = img.tags ?? [];
      if (tags.includes(trimmed) || tags.length >= 10) return img;
      return { ...img, tags: [...tags, trimmed] };
    });
    setCuratedImages(updated);
    saveCuration(updated, groups, '태그 추가');
  }, [curatedImages, groups, saveCuration]);

  // ── 이미지 큐레이션 토글 ──
  const handleToggleImageInAlbum = useCallback((gen: Generation, url: string) => {
    const exists = curatedImages.some((img) => img.url === url);
    let updated: AlbumImage[];

    if (exists) {
      updated = curatedImages
        .filter((img) => img.url !== url)
        .map((img, i) => ({ ...img, sortOrder: i }));
    } else {
      const newImg: AlbumImage = {
        url,
        generationId: gen.id,
        style: gen.style as AIStyle,
        role: (gen.role ?? 'GROOM') as PersonRole,
        sortOrder: curatedImages.length,
      };
      updated = [...curatedImages, newImg];
    }

    setCuratedImages(updated);
    saveCuration(updated, groups, exists ? '사진 삭제' : '사진 추가');
  }, [curatedImages, groups, saveCuration]);

  // ── 다중 이미지 앨범 추가 (Drawer용) ──
  const handleAddMultipleToAlbum = useCallback((items: { gen: Generation; url: string }[]) => {
    const curatedUrlSet = new Set(curatedImages.map((img) => img.url));
    const newImages: AlbumImage[] = items
      .filter(({ url }) => !curatedUrlSet.has(url))
      .map(({ gen, url }, i) => ({
        url,
        generationId: gen.id,
        style: gen.style as AIStyle,
        role: (gen.role ?? 'GROOM') as PersonRole,
        sortOrder: curatedImages.length + i,
      }));

    if (newImages.length === 0) return;

    const updated = [...curatedImages, ...newImages];
    setCuratedImages(updated);
    saveCuration(updated, groups, `${newImages.length}장 추가`);
    showToast(`${newImages.length}장을 앨범에 추가했습니다`, 'success');
  }, [curatedImages, groups, saveCuration, showToast]);

  // ── Wizard 생성 콜백 ──
  const handleWizardGenerate = useCallback(async (config: WizardConfig) => {
    setShowWizard(false);
    generation.prepare(config.totalImages);

    try {
      const res = await fetch('/api/ai/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: album.id,
          mode: config.mode,
          styles: config.styles,
          roles: config.roles,
          modelId: selectedModel,
          totalImages: config.totalImages,
          referencePhotoIds: referencePhotos.map((p) => p.id),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '작업 생성에 실패했습니다');
      }

      const { data } = await res.json();
      generation.generateBatch(data.jobId, data.tasks);
    } catch (err) {
      console.error('Job creation failed:', err);
      generation.reset();
    }
  }, [album.id, selectedModel, referencePhotos, generation]);

  // ── 레거시 기록 로드 ──
  const loadLegacy = async () => {
    if (legacyGenerations.length > 0) return;
    setLegacyLoading(true);
    try {
      const res = await fetch('/api/ai/generations?noAlbum=true&limit=50');
      const data = await res.json();
      if (data.success) {
        setLegacyGenerations(data.data);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setLegacyLoading(false);
    }
  };

  // ── 레거시 이미지를 앨범에 추가 ──
  const handleAddLegacyToAlbum = async (gen: Generation) => {
    if (!gen.generatedUrls?.length) return;

    try {
      await fetch(`/api/ai/generations/${gen.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: album.id }),
      });

      setLegacyGenerations((prev) => prev.filter((g) => g.id !== gen.id));
      onRefreshAlbum();
    } catch {
      // 실패 시 무시
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. 앨범 헤더 ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {/* 앨범 이름 */}
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="rounded-lg border border-stone-200 px-3 py-1 text-lg font-semibold text-stone-900 focus:border-rose-400 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <button onClick={handleSaveName} className="text-rose-500 hover:text-rose-600">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-stone-900">{album.name}</h2>
                <button
                  onClick={() => { setNameInput(album.name); setEditingName(true); }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* 메타 */}
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {snapTypeInfo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 font-medium text-stone-600">
                <Camera className="w-3 h-3" />
                {snapTypeInfo.label}
              </span>
            )}
            {hasGenerations && <span>{totalGenerated}장 생성</span>}
            {curatedCount > 0 && <span>{curatedCount}장 선택</span>}
            {savingCuration === 'saving' && (
              <span className="text-rose-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> {saveAction} 중...
              </span>
            )}
            {savingCuration === 'done' && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> {saveAction} 완료!
              </span>
            )}
          </div>
        </div>

        {/* CTA 버튼들 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI 사진 생성 — 항상 노출 */}
          <button
            onClick={handleOpenAiModal}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI 사진 생성
          </button>

          {/* 청첩장에 적용 — 큐레이션 있을 때만 */}
          {curatedCount > 0 && (
            <div className="group/apply relative">
              <button
                onClick={onShowApplyModal}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                청첩장에 적용
              </button>
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-lg bg-stone-800 px-2.5 py-1.5 text-[11px] text-stone-200 opacity-0 transition-opacity group-hover/apply:opacity-100">
                선택한 {curatedCount}장을 갤러리에 추가
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. 빈 앨범 가이드 ── */}
      {isEmpty && !hasGenerations && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-8 text-center">
          <Camera className="mx-auto mb-3 w-10 h-10 text-stone-300" />
          <p className="text-base font-medium text-stone-700 mb-1">앨범이 비어있어요</p>
          <p className="text-sm text-stone-500 mb-5">AI로 웨딩 사진을 생성해보세요</p>
          <div className="mx-auto max-w-xs space-y-2 text-left text-sm text-stone-600">
            <div className="flex items-center gap-2">
              {hasRefPhotos ? (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
              )}
              <span className={hasRefPhotos ? 'text-stone-400 line-through' : ''}>참조 사진 등록</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
              <span>AI 촬영으로 사진 생성</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
              <span>마음에 드는 사진을 앨범에 추가</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-stone-300 shrink-0" />
              <span>청첩장에 적용</span>
            </div>
          </div>
        </div>
      )}

      {isEmpty && hasGenerations && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-6 py-6 text-center">
          <p className="text-sm font-medium text-stone-700 mb-1">
            {totalGenerated}장의 사진이 생성되었습니다
          </p>
          <p className="text-sm text-stone-500 mb-3">마음에 드는 사진을 앨범에 추가하세요</p>
          <button
            onClick={() => setShowDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
          >
            생성된 사진 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 3. 필터 바 (그룹+태그 통합, 사진 있을 때만) ── */}
      {!isEmpty && (groups.length > 0 || allTags.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => { setActiveGroupFilter(null); setActiveTagFilter(null); }}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activeGroupFilter === null && activeTagFilter === null
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              전체
            </button>
            {groups.map((g) => (
              <GroupChip
                key={g.id}
                group={g}
                isActive={activeGroupFilter === g.id}
                onSelect={(id) => { setActiveGroupFilter(activeGroupFilter === id ? null : id); setActiveTagFilter(null); }}
                onRename={handleRenameGroup}
                onDelete={handleDeleteGroup}
              />
            ))}
            <button
              onClick={() => setShowGroupInput(true)}
              className="shrink-0 flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            {allTags.length > 0 && (
              <>
                <div className="w-px h-4 bg-stone-200 shrink-0" />
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTagFilter(activeTagFilter === tag ? null : tag); setActiveGroupFilter(null); }}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      activeTagFilter === tag ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </>
            )}
          </div>

          {showGroupInput && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="그룹 이름 (예: 스튜디오 베스트)"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700 focus:border-rose-400 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGroup();
                  if (e.key === 'Escape') { setShowGroupInput(false); setNewGroupName(''); }
                }}
              />
              <button onClick={handleAddGroup} disabled={!newGroupName.trim()} className="text-rose-500 hover:text-rose-600 disabled:text-stone-300">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowGroupInput(false); setNewGroupName(''); }} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 4. 큐레이션 갤러리 (사진 있을 때만) ── */}
      {!isEmpty && (
        <AlbumCuration
          images={curatedImages}
          groups={groups}
          activeGroupFilter={activeGroupFilter}
          activeTagFilter={activeTagFilter}
          tagEditingUrl={tagEditingUrl}
          onTagEditRequest={setTagEditingUrl}
          onToggleTag={handleToggleTag}
          onAddCustomTag={handleAddCustomTag}
          onImagesChange={handleCurationChange}
          onConfirm={confirm}
        />
      )}

      {/* ── 5. Drawer 트리거 ── */}
      {hasGenerations && (
        <button
          onClick={() => setShowDrawer(true)}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 transition-colors hover:bg-stone-100"
        >
          <div className="flex items-center gap-2.5">
            <Images className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">
              생성된 사진 보기 ({totalGenerated}장)
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      )}

      <GeneratedPhotosDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        generations={album.generations}
        curatedImages={curatedImages}
        onAddToAlbum={handleToggleImageInAlbum}
        onAddMultipleToAlbum={handleAddMultipleToAlbum}
      />

      {/* ── 6. 도구 영역 (접이식 아코디언) ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider">도구</h4>

        {/* 참조 사진 */}
        <div ref={refSectionRef}>
          <ToolSection
            title="참조 사진"
            open={refSectionOpen}
            onToggle={() => setRefSectionOpen(!refSectionOpen)}
            summary={
              refPhotosLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
              ) : hasRefPhotos ? (
                <div className="flex items-center gap-2">
                  {referencePhotos.map((p) => (
                    <img
                      key={p.id}
                      src={p.originalUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ))}
                  <span className="text-xs text-stone-500">
                    {referencePhotos.map((p) => p.role === 'GROOM' ? '신랑' : '신부').join(', ')} 등록됨
                  </span>
                </div>
              ) : (
                <span className="text-xs text-stone-400">미등록</span>
              )
            }
          >
            {refPhotosLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">참조 사진 확인 중...</span>
              </div>
            ) : (
              <ReferencePhotoSection
                referencePhotos={referencePhotos}
                onPhotosChange={setReferencePhotos}
                compact={hasRefPhotos}
              />
            )}
          </ToolSection>
        </div>

        {/* 이전 생성 기록 */}
        <ToolSection
          title="이전 생성 기록"
          open={legacySectionOpen}
          onToggle={() => {
            const willOpen = !legacySectionOpen;
            setLegacySectionOpen(willOpen);
            if (willOpen) loadLegacy();
          }}
        >
          {legacyLoading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-stone-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">불러오는 중...</span>
            </div>
          ) : legacyGenerations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {legacyGenerations.map((gen) => (
                <div key={gen.id} className="space-y-2">
                  <GenerationCard
                    generation={{ ...gen, isFavorited: gen.isFavorited ?? false }}
                    onToggleFavorite={() => {}}
                  />
                  <button
                    onClick={() => handleAddLegacyToAlbum(gen)}
                    className="w-full text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    앨범에 추가
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 py-2">이전 생성 기록이 없습니다</p>
          )}
        </ToolSection>
      </div>

      {/* ── 7. FloatingBar (생성 중 또는 완료 후 최소화) ── */}
      {isMinimized && (generation.state.isGenerating || generation.state.completedUrls.length > 0 || generation.state.failedIndices.length > 0) && (
        <GenerationFloatingBar
          completedCount={generation.state.completedUrls.length}
          failedCount={generation.state.failedIndices.length}
          totalImages={generation.state.totalImages}
          isComplete={!generation.state.isGenerating && (generation.state.completedUrls.length > 0 || generation.state.failedIndices.length > 0)}
          onExpand={() => {
            setIsMinimized(false);
            setShowAiModal(true);
          }}
          onDismiss={() => {
            setIsMinimized(false);
            generation.reset();
          }}
        />
      )}

      {/* AI 생성 모달 */}
      <AIGenerationModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        credits={credits}
        referencePhotos={referencePhotos}
        snapType={snapType}
        generation={generation}
        isMinimized={isMinimized}
        onSetMinimized={setIsMinimized}
        showWizard={showWizard}
        onSetShowWizard={setShowWizard}
        selectedModel={selectedModel}
        onWizardGenerate={handleWizardGenerate}
        onOpenRefSection={() => {
          setRefSectionOpen(true);
          setTimeout(() => {
            refSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={onCancel}
        onConfirm={onConfirm}
        title={confirmOptions.title}
        description={confirmOptions.description}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        variant={confirmOptions.variant}
      />
    </div>
  );
}

// ── ToolSection (collapsible accordion) ──

function ToolSection({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-stone-700">{title}</span>
          {!open && summary}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 pb-4 border-t border-stone-100">{children}</div>}
    </div>
  );
}

// ── GroupChip ──

function GroupChip({
  group,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  group: AlbumGroup;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 shrink-0">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-20 bg-transparent text-xs text-stone-700 focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onRename(group.id, name); setEditing(false); }
            if (e.key === 'Escape') { setName(group.name); setEditing(false); }
          }}
          onBlur={() => { onRename(group.id, name); setEditing(false); }}
        />
      </div>
    );
  }

  return (
    <div
      className={`group/chip shrink-0 flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
        isActive ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      <button onClick={() => onSelect(group.id)} className="hover:text-stone-900">
        {group.name}
      </button>
      <div className="flex items-center gap-0.5 max-w-0 opacity-0 overflow-hidden transition-all duration-200 ease-out group-hover/chip:max-w-[3rem] group-hover/chip:opacity-100 group-hover/chip:ml-1">
        <button
          onClick={(e) => { e.stopPropagation(); setName(group.name); setEditing(true); }}
          className="text-stone-400 hover:text-stone-700"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        {!group.isDefault && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
            className="text-stone-400 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
