'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Check,
  X,
  Loader2,
  FolderPlus,
  Tag,
  ImagePlus,
} from 'lucide-react';
import { createId } from '@paralleldrive/cuid2';
import { AIStyle, PersonRole, SnapType, SNAP_TYPES, AlbumImage, AlbumGroup, AI_STYLES, ReferencePhoto } from '@/types/ai';
import { AlbumCuration } from './AlbumCuration';
import { GenerationCard } from './GenerationCard';
import { GenerationWizard, WizardConfig } from './GenerationWizard';
import { BatchGenerationView } from './BatchGenerationView';
import { GenerationFloatingBar } from './GenerationFloatingBar';
import { CreditDisplay } from './CreditDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [showGenerate, setShowGenerate] = useState(false);
  const [curatedImages, setCuratedImages] = useState<AlbumImage[]>(album.images ?? []);
  const [groups, setGroups] = useState<AlbumGroup[]>(album.groups ?? []);
  const [showLegacy, setShowLegacy] = useState(false);
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

  // 참조 사진
  const [referencePhotos, setReferencePhotos] = useState<ReferencePhoto[]>([]);
  const [refPhotosLoading, setRefPhotosLoading] = useState(true);

  // 생성 wizard
  const [showWizard, setShowWizard] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const snapType = album.snapType as SnapType | null;

  // ── useAIGeneration hook ──
  const generation = useAIGeneration({
    albumId: album.id,
    modelId: selectedModel,
    onCreditsChange,
    onComplete: onRefreshAlbum,
  });

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

  // Sync album data when album prop changes
  useEffect(() => {
    setCuratedImages(album.images ?? []);
    setGroups(album.groups ?? []);
    setNameInput(album.name);
  }, [album.id, album.images, album.groups, album.name]);

  // ── 앨범 이름 수정 ──
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      await fetch(`/api/ai/albums/${album.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      setEditingName(false);
      onRefreshAlbum();
    } catch {
      // 실패 시 무시
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

  // ── Wizard 생성 콜백 ──
  const handleWizardGenerate = useCallback(async (config: WizardConfig) => {
    setShowWizard(false);
    setIsMinimized(false);

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
    }
  }, [album.id, selectedModel, referencePhotos, generation]);

  // ── 레거시 기록 로드 ──
  const loadLegacy = async () => {
    if (legacyGenerations.length > 0) {
      setShowLegacy(!showLegacy);
      return;
    }
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
      setShowLegacy(true);
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

  // ── 스타일별 그룹핑 ──
  const generationsByStyle = album.generations.reduce((acc, gen) => {
    const key = gen.style;
    if (!acc[key]) acc[key] = [];
    acc[key].push(gen);
    return acc;
  }, {} as Record<string, Generation[]>);

  const snapTypeInfo = SNAP_TYPES.find((t) => t.value === snapType);
  const curatedCount = curatedImages.length;
  const totalGenerated = album.generations.reduce(
    (sum, g) => sum + (g.generatedUrls?.length ?? 0),
    0
  );

  // 태그 모음 (필터용)
  const allTags = Array.from(
    new Set(curatedImages.flatMap((img) => img.tags ?? []))
  );

  const hasRefPhotos = referencePhotos.length > 0;

  return (
    <div className="space-y-8">
      {/* ── 앨범 헤더 ── */}
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
            <span>{totalGenerated}장 생성</span>
            <span>{curatedCount}장 선택</span>
            {groups.length > 0 && <span>{groups.length}개 그룹</span>}
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

        {/* 적용 버튼 */}
        {curatedCount > 0 && (
          <button
            onClick={onShowApplyModal}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            <Sparkles className="w-4 h-4" />
            청첩장에 적용
          </button>
        )}
      </div>

      {/* ── 그룹 관리 ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-800">그룹</h3>
          {!showGroupInput && (
            <button
              onClick={() => setShowGroupInput(true)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              그룹 추가
            </button>
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

        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGroupFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activeGroupFilter === null ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              전체
            </button>
            {groups.map((g) => (
              <GroupChip
                key={g.id}
                group={g}
                isActive={activeGroupFilter === g.id}
                onSelect={(id) => setActiveGroupFilter(activeGroupFilter === id ? null : id)}
                onRename={handleRenameGroup}
                onDelete={handleDeleteGroup}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 태그 필터 ── */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-medium text-stone-500">태그 필터</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTagFilter === null ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              전체
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTagFilter === tag ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 큐레이션 섹션 ── */}
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
      />

      {/* ── 생성된 사진 (스타일별 그룹) ── */}
      {Object.keys(generationsByStyle).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-stone-800">생성된 사진</h3>

          {Object.entries(generationsByStyle).map(([style, gens]) => {
            const styleInfo = AI_STYLES.find((s) => s.value === style);

            return (
              <div key={style} className="space-y-3">
                <p className="text-xs font-medium text-stone-500">
                  {styleInfo?.label ?? style} ({gens.reduce((s, g) => s + (g.generatedUrls?.length ?? 0), 0)}장)
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {gens.flatMap((gen) =>
                    (gen.generatedUrls ?? []).map((url) => {
                      const isInAlbum = curatedImages.some((img) => img.url === url);

                      return (
                        <div
                          key={url}
                          onClick={() => handleToggleImageInAlbum(gen, url)}
                          className={`
                            group relative aspect-square overflow-hidden rounded-lg border-2 cursor-pointer transition-all
                            ${isInAlbum ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-stone-200 hover:border-stone-300'}
                          `}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          {isInAlbum && (
                            <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                              <div className="rounded-full bg-rose-500 p-1">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 추가 촬영 ── */}
      <div className="space-y-4">
        <button
          onClick={() => setShowGenerate(!showGenerate)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-rose-300 hover:text-rose-600 w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          추가 촬영
          {showGenerate ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGenerate && (
          <div className="space-y-4">
            {refPhotosLoading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">참조 사진 확인 중...</span>
              </div>
            ) : !hasRefPhotos ? (
              /* 참조 사진 없음 안내 */
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 py-10 px-6">
                <ImagePlus className="w-8 h-8 text-stone-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-700">참조 사진을 먼저 업로드하세요</p>
                  <p className="text-xs text-stone-500 mt-1">
                    AI가 얼굴을 학습하려면 신랑/신부 참조 사진이 필요합니다.
                  </p>
                </div>
                <a
                  href="/dashboard/ai-photos/reference"
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                >
                  <ImagePlus className="w-4 h-4" />
                  참조 사진 등록하기
                </a>
              </div>
            ) : generation.state.isGenerating && !isMinimized ? (
              /* 생성 진행 중 (확장 뷰) */
              <BatchGenerationView
                totalImages={generation.state.totalImages}
                completedUrls={generation.state.completedUrls}
                currentIndex={generation.state.currentIndex}
                statusMessage={generation.state.statusMessage}
                error={generation.state.error}
                onMinimize={() => setIsMinimized(true)}
              />
            ) : !showWizard ? (
              /* Wizard 시작 버튼 */
              <div className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 py-8 px-6">
                <CreditDisplay balance={credits} />
                <p className="text-xs text-stone-500">
                  참조 사진 {referencePhotos.length}장 등록됨 ({referencePhotos.map((p) => p.role === 'GROOM' ? '신랑' : '신부').join(', ')})
                </p>
                <button
                  onClick={() => setShowWizard(true)}
                  disabled={generation.state.isGenerating}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
                >
                  <Sparkles className="w-4 h-4" />
                  촬영 설정
                </button>
              </div>
            ) : (
              /* Wizard */
              <GenerationWizard
                credits={credits}
                referencePhotos={referencePhotos.map((p) => ({ id: p.id, role: p.role }))}
                snapType={snapType}
                onGenerate={handleWizardGenerate}
                onCancel={() => setShowWizard(false)}
                disabled={generation.state.isGenerating}
              />
            )}
          </div>
        )}
      </div>

      {/* ── 생성 중 최소화 바 ── */}
      {generation.state.isGenerating && isMinimized && (
        <GenerationFloatingBar
          completedCount={generation.state.completedUrls.length}
          totalImages={generation.state.totalImages}
          onExpand={() => {
            setIsMinimized(false);
            setShowGenerate(true);
          }}
        />
      )}

      {/* ── 레거시 섹션 ── */}
      <div className="space-y-3">
        <button
          onClick={loadLegacy}
          disabled={legacyLoading}
          className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          {legacyLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : showLegacy ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          이전 생성 기록
        </button>

        {showLegacy && legacyGenerations.length > 0 && (
          <div className="space-y-3 rounded-lg border border-stone-100 bg-stone-50 p-4">
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
          </div>
        )}

        {showLegacy && legacyGenerations.length === 0 && !legacyLoading && (
          <p className="text-xs text-stone-400 pl-5">이전 생성 기록이 없습니다</p>
        )}
      </div>

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

// ── Group Chip ──

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
      <div className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1">
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
      className={`group/chip flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
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
