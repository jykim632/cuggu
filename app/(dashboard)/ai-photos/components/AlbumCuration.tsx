'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Tag, Plus, CheckSquare, Square } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { GalleryLightbox } from '@/components/templates/GalleryLightbox';
import { CurationActionBar } from './CurationActionBar';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import type { AlbumImage, AlbumGroup } from '@/types/ai';
import { PRESET_TAGS } from '@/types/ai';

const UNGROUPED_ID = '__ungrouped__';

interface AlbumCurationProps {
  images: AlbumImage[];
  groups: AlbumGroup[];
  activeGroupFilter: string | null;
  activeTagFilter: string | null;
  tagEditingUrl: string | null;
  onTagEditRequest: (url: string | null) => void;
  onToggleTag: (url: string, tag: string) => void;
  onAddCustomTag: (url: string, tag: string) => void;
  onImagesChange: (images: AlbumImage[], action?: string) => void;
}

export function AlbumCuration({
  images,
  groups,
  activeGroupFilter,
  activeTagFilter,
  tagEditingUrl,
  onTagEditRequest,
  onToggleTag,
  onAddCustomTag,
  onImagesChange,
}: AlbumCurationProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allUrls = useMemo(() => images.map((img) => img.url), [images]);
  const selection = useMultiSelect(allUrls);

  // 그룹별 이미지 분류
  const imagesByGroup = useMemo(() => {
    const result: Record<string, AlbumImage[]> = {};
    const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const g of sortedGroups) {
      result[g.id] = [];
    }
    result[UNGROUPED_ID] = [];

    for (const img of images) {
      const gid = img.groupId && result[img.groupId] !== undefined ? img.groupId : UNGROUPED_ID;
      result[gid].push(img);
    }

    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return result;
  }, [images, groups]);

  // 필터 적용된 이미지 (lightbox 용)
  const allFilteredUrls = useMemo(() => {
    let filtered = images;
    if (activeTagFilter) {
      filtered = filtered.filter((img) => img.tags?.includes(activeTagFilter));
    }
    if (activeGroupFilter) {
      filtered = filtered.filter((img) => {
        const gid = img.groupId ?? UNGROUPED_ID;
        return gid === activeGroupFilter;
      });
    }
    return filtered.map((img) => img.url);
  }, [images, activeTagFilter, activeGroupFilter]);

  const filterImages = useCallback((imgs: AlbumImage[]) => {
    if (!activeTagFilter) return imgs;
    return imgs.filter((img) => img.tags?.includes(activeTagFilter));
  }, [activeTagFilter]);

  const toggleCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemove = useCallback((url: string) => {
    const filtered = images
      .filter((img) => img.url !== url)
      .map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(filtered, '사진 삭제');
  }, [images, onImagesChange]);

  const handleImageClick = useCallback((url: string) => {
    if (selectionMode) {
      selection.toggle(url);
    } else {
      const index = allFilteredUrls.indexOf(url);
      if (index !== -1) setLightboxIndex(index);
    }
  }, [selectionMode, selection, allFilteredUrls]);

  // 벌크 그룹 이동
  const handleBulkMoveToGroup = useCallback((targetGroupId: string) => {
    const newGroupId = targetGroupId === UNGROUPED_ID ? undefined : targetGroupId;
    const updated = images.map((img) =>
      selection.isSelected(img.url) ? { ...img, groupId: newGroupId } : img
    );
    onImagesChange(updated, '그룹 이동');
    selection.deselectAll();
    setSelectionMode(false);
  }, [images, selection, onImagesChange]);

  // 벌크 삭제
  const handleBulkDelete = useCallback(() => {
    const filtered = images
      .filter((img) => !selection.isSelected(img.url))
      .map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(filtered, `${selection.selectedCount}장 삭제`);
    selection.deselectAll();
    setSelectionMode(false);
  }, [images, selection, onImagesChange]);

  const handleToggleMode = useCallback(() => {
    if (selectionMode) {
      selection.deselectAll();
      setSelectionMode(false);
    } else {
      setSelectionMode(true);
    }
  }, [selectionMode, selection]);

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center">
        <p className="text-sm text-stone-500">선택된 이미지가 없습니다</p>
        <p className="text-xs text-stone-400 mt-1">생성된 사진에서 이미지를 선택하세요</p>
      </div>
    );
  }

  const hasGroups = groups.length > 0;
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const sectionKeys = activeGroupFilter
    ? [activeGroupFilter]
    : hasGroups
      ? [...sortedGroups.map((g) => g.id), UNGROUPED_ID]
      : [UNGROUPED_ID];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">
          내 앨범 ({images.length}장)
        </h3>
        <button
          onClick={handleToggleMode}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            selectionMode
              ? 'bg-rose-100 text-rose-700'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {selectionMode ? '완료' : '선택'}
        </button>
      </div>

      <div className="space-y-4">
        {sectionKeys.map((sectionId) => {
          const sectionImages = imagesByGroup[sectionId] ?? [];
          const filteredImages = filterImages(sectionImages);
          const isUngrouped = sectionId === UNGROUPED_ID;
          const group = sortedGroups.find((g) => g.id === sectionId);
          const isCollapsed = collapsedGroups.has(sectionId);
          const sectionLabel = isUngrouped
            ? (hasGroups ? '미분류' : undefined)
            : group?.name;

          if (filteredImages.length === 0 && activeTagFilter) return null;

          return (
            <div key={sectionId} className="space-y-2">
              {sectionLabel && (
                <button
                  onClick={() => toggleCollapse(sectionId)}
                  className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors"
                >
                  {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                  {sectionLabel} ({sectionImages.length})
                </button>
              )}

              {!isCollapsed && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {filteredImages.map((img, index) => (
                    <ImageCard
                      key={img.url}
                      image={img}
                      index={index}
                      selectionMode={selectionMode}
                      isSelected={selection.isSelected(img.url)}
                      isTagEditing={tagEditingUrl === img.url}
                      groups={groups}
                      currentGroupId={sectionId}
                      onClick={() => handleImageClick(img.url)}
                      onRemove={handleRemove}
                      onTagEditRequest={onTagEditRequest}
                      onToggleTag={onToggleTag}
                      onAddCustomTag={onAddCustomTag}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택 모드 액션바 */}
      {selectionMode && (
        <CurationActionBar
          selectedCount={selection.selectedCount}
          groups={groups}
          onMoveToGroup={handleBulkMoveToGroup}
          onDelete={handleBulkDelete}
          onDeselectAll={() => { selection.deselectAll(); setSelectionMode(false); }}
        />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <GalleryLightbox
            images={allFilteredUrls}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Image Card ──

interface ImageCardProps {
  image: AlbumImage;
  index: number;
  selectionMode: boolean;
  isSelected: boolean;
  isTagEditing: boolean;
  groups: AlbumGroup[];
  currentGroupId: string;
  onClick: () => void;
  onRemove: (url: string) => void;
  onTagEditRequest: (url: string | null) => void;
  onToggleTag: (url: string, tag: string) => void;
  onAddCustomTag: (url: string, tag: string) => void;
}

function ImageCard({
  image,
  index,
  selectionMode,
  isSelected,
  isTagEditing,
  groups,
  currentGroupId,
  onClick,
  onRemove,
  onTagEditRequest,
  onToggleTag,
  onAddCustomTag,
}: ImageCardProps) {
  const [customTag, setCustomTag] = useState('');
  const tags = image.tags ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={`
          group relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all
          ${selectionMode && isSelected
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : 'border-stone-200 hover:border-stone-300'
          }
        `}
      >
        <img
          src={image.url}
          alt={`앨범 이미지 ${index + 1}`}
          className="h-full w-full object-cover"
        />

        {/* 순서 번호 */}
        {!selectionMode && (
          <div className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {index + 1}
          </div>
        )}

        {/* 선택 모드 체크박스 */}
        {selectionMode && (
          <div className="absolute top-1 right-1">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-rose-500 drop-shadow" />
            ) : (
              <Square className="w-5 h-5 text-white/80 drop-shadow" />
            )}
          </div>
        )}

        {/* 태그 표시 */}
        {tags.length > 0 && !selectionMode && (
          <div className="absolute bottom-1 left-1 right-8 flex flex-wrap gap-0.5">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded bg-black/50 px-1 py-0.5 text-[8px] text-white truncate max-w-[60px]">
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="rounded bg-black/50 px-1 py-0.5 text-[8px] text-white">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 태그 버튼 (탐색 모드만) */}
        {!selectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onTagEditRequest(isTagEditing ? null : image.url);
            }}
            className="absolute right-1 bottom-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 cursor-pointer"
          >
            <Tag className="w-3 h-3" />
          </div>
        )}

        {/* 제거 버튼 (탐색 모드만) */}
        {!selectionMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onRemove(image.url);
            }}
            className="absolute left-1 bottom-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </div>
        )}
      </button>

      {/* 태그 편집 Popover */}
      {isTagEditing && (
        <TagPopover
          image={image}
          tags={tags}
          customTag={customTag}
          onCustomTagChange={setCustomTag}
          groups={groups}
          currentGroupId={currentGroupId}
          onToggleTag={onToggleTag}
          onAddCustomTag={(url, tag) => {
            onAddCustomTag(url, tag);
            setCustomTag('');
          }}
          onClose={() => onTagEditRequest(null)}
        />
      )}
    </div>
  );
}

// ── Tag Popover ──

function TagPopover({
  image,
  tags,
  customTag,
  onCustomTagChange,
  groups,
  currentGroupId,
  onToggleTag,
  onAddCustomTag,
  onClose,
}: {
  image: AlbumImage;
  tags: string[];
  customTag: string;
  onCustomTagChange: (v: string) => void;
  groups: AlbumGroup[];
  currentGroupId: string;
  onToggleTag: (url: string, tag: string) => void;
  onAddCustomTag: (url: string, tag: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-20 top-full left-0 mt-1 w-56 rounded-lg border border-stone-200 bg-white p-3 shadow-lg space-y-2">
      <p className="text-xs font-medium text-stone-600">태그</p>

      {/* 프리셋 태그 */}
      <div className="flex flex-wrap gap-1">
        {PRESET_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => onToggleTag(image.url, tag)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              tags.includes(tag)
                ? 'bg-rose-100 text-rose-700'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 커스텀 태그 입력 */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={customTag}
          onChange={(e) => onCustomTagChange(e.target.value)}
          placeholder="커스텀 태그"
          className="flex-1 rounded border border-stone-200 px-2 py-1 text-[11px] text-stone-700 focus:border-rose-300 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customTag.trim()) {
              onAddCustomTag(image.url, customTag);
            }
          }}
        />
        <button
          onClick={() => {
            if (customTag.trim()) {
              onAddCustomTag(image.url, customTag);
            }
          }}
          className="text-rose-500 hover:text-rose-600"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 현재 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600"
            >
              {tag}
              <button onClick={() => onToggleTag(image.url, tag)} className="hover:text-red-500">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 닫기 */}
      <button
        onClick={onClose}
        className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 pt-1"
      >
        닫기
      </button>
    </div>
  );
}
