'use client';

import { useState, useCallback } from 'react';
import { GripVertical, X, ChevronDown, ChevronUp, Tag, Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // 그룹별 이미지 분류
  const imagesByGroup: Record<string, AlbumImage[]> = {};
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);

  // 그룹별 초기화
  for (const g of sortedGroups) {
    imagesByGroup[g.id] = [];
  }
  imagesByGroup[UNGROUPED_ID] = [];

  // 이미지 분류
  for (const img of images) {
    const gid = img.groupId && imagesByGroup[img.groupId] !== undefined ? img.groupId : UNGROUPED_ID;
    imagesByGroup[gid].push(img);
  }

  // 각 그룹 내 정렬
  for (const key of Object.keys(imagesByGroup)) {
    imagesByGroup[key].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // 필터 적용
  const filterImages = (imgs: AlbumImage[]) => {
    if (!activeTagFilter) return imgs;
    return imgs.filter((img) => img.tags?.includes(activeTagFilter));
  };

  const toggleCollapse = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeUrl = active.id as string;
    const overUrl = over.id as string;

    const activeImg = images.find((img) => img.url === activeUrl);
    const overImg = images.find((img) => img.url === overUrl);

    if (!activeImg || !overImg) return;

    const activeGroupId = activeImg.groupId ?? UNGROUPED_ID;
    const overGroupId = overImg.groupId ?? UNGROUPED_ID;

    // 다른 그룹 간 이동
    if (activeGroupId !== overGroupId) {
      const newGroupId = overGroupId === UNGROUPED_ID ? undefined : overGroupId;
      const updated = images.map((img) =>
        img.url === activeUrl ? { ...img, groupId: newGroupId } : img
      );
      onImagesChange(updated, '그룹 이동');
    }
  }, [images, onImagesChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeUrl = active.id as string;
    const overUrl = over.id as string;

    // 같은 그룹 내 순서 변경
    const activeImg = images.find((img) => img.url === activeUrl);
    const overImg = images.find((img) => img.url === overUrl);
    if (!activeImg || !overImg) return;

    const groupId = activeImg.groupId ?? UNGROUPED_ID;
    const groupImages = imagesByGroup[groupId] ?? [];
    const oldIndex = groupImages.findIndex((img) => img.url === activeUrl);
    const newIndex = groupImages.findIndex((img) => img.url === overUrl);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedGroup = arrayMove(groupImages, oldIndex, newIndex).map((img, i) => ({
      ...img,
      sortOrder: i,
    }));

    // 전체 이미지에 반영
    const groupUrls = new Set(groupImages.map((img) => img.url));
    const otherImages = images.filter((img) => !groupUrls.has(img.url));
    const updated = [...otherImages, ...reorderedGroup];

    onImagesChange(updated, '순서 변경');
  }, [images, imagesByGroup, onImagesChange]);

  const handleRemove = useCallback((url: string) => {
    const filtered = images
      .filter((img) => img.url !== url)
      .map((img, i) => ({ ...img, sortOrder: i }));
    onImagesChange(filtered, '사진 삭제');
  }, [images, onImagesChange]);

  // 이미지를 특정 그룹으로 이동
  const handleMoveToGroup = useCallback((url: string, targetGroupId: string) => {
    const newGroupId = targetGroupId === UNGROUPED_ID ? undefined : targetGroupId;
    const updated = images.map((img) =>
      img.url === url ? { ...img, groupId: newGroupId } : img
    );
    onImagesChange(updated, '그룹 이동');
  }, [images, onImagesChange]);

  const activeImage = activeId ? images.find((img) => img.url === activeId) : null;

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center">
        <p className="text-sm text-stone-500">선택된 이미지가 없습니다</p>
        <p className="text-xs text-stone-400 mt-1">아래 갤러리에서 이미지를 선택하세요</p>
      </div>
    );
  }

  // 그룹 필터 적용
  const hasGroups = groups.length > 0;
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
        <p className="text-xs text-stone-400">드래그하여 순서 변경</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={hasGroups ? handleDragOver : undefined}
        onDragEnd={handleDragEnd}
      >
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
                  <SortableContext
                    items={filteredImages.map((img) => img.url)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {filteredImages.map((img, index) => (
                        <SortableImageCard
                          key={img.url}
                          image={img}
                          index={index}
                          groups={groups}
                          currentGroupId={sectionId}
                          isTagEditing={tagEditingUrl === img.url}
                          onRemove={handleRemove}
                          onTagEditRequest={onTagEditRequest}
                          onToggleTag={onToggleTag}
                          onAddCustomTag={onAddCustomTag}
                          onMoveToGroup={handleMoveToGroup}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeImage && (
            <div className="aspect-square w-24 overflow-hidden rounded-lg border-2 border-rose-400 shadow-xl opacity-90">
              <img src={activeImage.url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ── Sortable Image Card ──

interface SortableImageCardProps {
  image: AlbumImage;
  index: number;
  groups: AlbumGroup[];
  currentGroupId: string;
  isTagEditing: boolean;
  onRemove: (url: string) => void;
  onTagEditRequest: (url: string | null) => void;
  onToggleTag: (url: string, tag: string) => void;
  onAddCustomTag: (url: string, tag: string) => void;
  onMoveToGroup: (url: string, groupId: string) => void;
}

function SortableImageCard({
  image,
  index,
  groups,
  currentGroupId,
  isTagEditing,
  onRemove,
  onTagEditRequest,
  onToggleTag,
  onAddCustomTag,
  onMoveToGroup,
}: SortableImageCardProps) {
  const [customTag, setCustomTag] = useState('');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tags = image.tags ?? [];

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group relative aspect-square overflow-hidden rounded-lg border-2
          ${isDragging ? 'border-rose-400 shadow-lg z-10 opacity-80' : 'border-stone-200'}
        `}
      >
        <img
          src={image.url}
          alt={`앨범 이미지 ${index + 1}`}
          className="h-full w-full object-cover"
        />

        {/* 순서 번호 */}
        <div className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {index + 1}
        </div>

        {/* 태그 표시 */}
        {tags.length > 0 && (
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

        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="absolute right-1 top-1 cursor-grab rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* 태그 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTagEditRequest(isTagEditing ? null : image.url);
          }}
          className="absolute right-1 bottom-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
        >
          <Tag className="w-3 h-3" />
        </button>

        {/* 제거 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.url);
          }}
          className="absolute left-1 bottom-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* 태그 편집 Popover */}
      {isTagEditing && (
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
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="커스텀 태그"
              className="flex-1 rounded border border-stone-200 px-2 py-1 text-[11px] text-stone-700 focus:border-rose-300 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customTag.trim()) {
                  onAddCustomTag(image.url, customTag);
                  setCustomTag('');
                }
              }}
            />
            <button
              onClick={() => {
                if (customTag.trim()) {
                  onAddCustomTag(image.url, customTag);
                  setCustomTag('');
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

          {/* 그룹 이동 */}
          {groups.length > 0 && (
            <div className="border-t border-stone-100 pt-2 space-y-1">
              <p className="text-[10px] font-medium text-stone-400">그룹 이동</p>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => onMoveToGroup(image.url, UNGROUPED_ID)}
                  className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                    currentGroupId === UNGROUPED_ID
                      ? 'bg-stone-200 text-stone-700'
                      : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  미분류
                </button>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onMoveToGroup(image.url, g.id)}
                    className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                      currentGroupId === g.id
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 닫기 */}
          <button
            onClick={() => onTagEditRequest(null)}
            className="w-full text-center text-[10px] text-stone-400 hover:text-stone-600 pt-1"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
