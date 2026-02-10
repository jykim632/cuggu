'use client';

import { RotateCcw, Lock, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useInvitationEditor } from '@/stores/invitation-editor';
import {
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
  type SectionId,
} from '@/schemas/invitation';

interface SortableItemProps {
  id: SectionId;
  index: number;
  isActive: boolean;
  note: string | null;
}

function SortableItem({ id, index, isActive, note }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isDragging
          ? 'bg-pink-50 border-pink-200 shadow-lg z-10'
          : isActive
            ? 'bg-white border-stone-200'
            : 'bg-stone-50 border-stone-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium w-5 ${isActive ? 'text-stone-400' : 'text-stone-300'}`}>
          {index + 2}.
        </span>
        <span className={`text-sm ${isActive ? 'text-stone-700' : 'text-stone-400'}`}>
          {SECTION_LABELS[id]}
        </span>
        {note && (
          <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-400 rounded">
            {note}
          </span>
        )}
      </div>

      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded cursor-grab active:cursor-grabbing transition-colors"
        aria-label="드래그하여 이동"
      >
        <GripVertical className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * 설정 탭
 *
 * - 섹션 순서 변경 (드래그앤드롭)
 * - 비밀번호 보호
 * - 삭제 예정일
 */
export function SettingsTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSettingsChange = (field: string, value: any) => {
    updateInvitation({
      settings: {
        ...invitation.settings,
        [field]: value,
      },
    });
  };

  // 섹션 순서 (기본값 fallback)
  const sectionOrder: SectionId[] = (invitation.settings?.sectionOrder as SectionId[] | undefined) ?? [...DEFAULT_SECTION_ORDER];

  // 섹션 활성 상태 확인
  const isSectionActive = (id: SectionId): boolean => {
    if (id === 'parents') return invitation.settings?.showParents !== false;
    if (id === 'accounts') return invitation.settings?.showAccounts !== false;
    if (id === 'gallery') return (invitation.gallery?.images?.length ?? 0) > 0;
    if (id === 'rsvp') return invitation.settings?.enableRsvp !== false;
    return true;
  };

  // 비활성 섹션 상태 노트
  const getSectionNote = (id: SectionId): string | null => {
    if (id === 'parents' && !isSectionActive(id)) return '숨김';
    if (id === 'accounts' && !isSectionActive(id)) return '숨김';
    if (id === 'gallery' && !isSectionActive(id)) return '사진 없음';
    if (id === 'rsvp' && !isSectionActive(id)) return '비활성';
    return null;
  };

  // 드래그 종료 시 순서 업데이트
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionId);
      const newIndex = sectionOrder.indexOf(over.id as SectionId);
      const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
      handleSettingsChange('sectionOrder', newOrder);
    }
  };

  // 기본 순서로 리셋
  const resetOrder = () => {
    handleSettingsChange('sectionOrder', [...DEFAULT_SECTION_ORDER]);
  };

  // 현재 순서가 기본 순서와 같은지 확인
  const isDefaultOrder = sectionOrder.every((id, i) => id === DEFAULT_SECTION_ORDER[i]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">설정</h2>
        <p className="text-sm text-stone-500">청첩장 공개 설정을 관리하세요</p>
      </div>

      {/* 섹션 순서 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">섹션 순서</h3>
            <p className="text-xs text-stone-500 mt-1">
              드래그하여 섹션 순서를 변경하세요
            </p>
          </div>
          <button
            onClick={resetOrder}
            disabled={isDefaultOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>

        <div className="space-y-1">
          {/* 커버 섹션 (고정) */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-stone-50 border-stone-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium w-5 text-stone-400">1.</span>
              <span className="text-sm text-stone-700">커버</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-500 rounded">
                고정
              </span>
            </div>
            <div className="p-1.5 text-stone-300">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          {/* 이동 가능한 섹션들 */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sectionOrder}
              strategy={verticalListSortingStrategy}
            >
              {sectionOrder.map((id, index) => (
                <SortableItem
                  key={id}
                  id={id}
                  index={index}
                  isActive={isSectionActive(id)}
                  note={getSectionNote(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* D-Day 달력 스타일 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div>
          <h3 className="text-sm font-medium text-stone-700">D-Day 달력</h3>
          <p className="text-xs text-stone-500 mt-1">
            예식 정보 섹션에 표시되는 D-Day 위젯 스타일
          </p>
        </div>
        <select
          value={invitation.settings?.calendarStyle ?? 'calendar'}
          onChange={(e) => handleSettingsChange('calendarStyle', e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors"
        >
          <option value="none">없음</option>
          <option value="calendar">미니 달력</option>
          <option value="countdown">카운트다운</option>
          <option value="minimal">미니멀</option>
        </select>
      </div>

      {/* 비밀번호 보호 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">비밀번호 보호</h3>
            <p className="text-xs text-stone-500 mt-1">
              청첩장에 비밀번호를 설정합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={invitation.settings?.requirePassword || false}
              onChange={(e) => handleSettingsChange('requirePassword', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
          </label>
        </div>

        {invitation.settings?.requirePassword && (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              비밀번호
            </label>
            <input
              type="text"
              value={invitation.settings?.password || ''}
              onChange={(e) => handleSettingsChange('password', e.target.value)}
              placeholder="4자리 숫자"
              maxLength={4}
              className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
            />
            <p className="text-xs text-stone-500 mt-1.5">
              비밀번호는 4자리 숫자로 설정하세요
            </p>
          </div>
        )}
      </div>

      {/* 자동 삭제 */}
      <div className="bg-white rounded-xl p-6 space-y-3 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">자동 삭제</h3>
        <p className="text-xs text-stone-600">
          결혼식 후 90일이 지나면 자동으로 삭제됩니다
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            개인정보 보호를 위해 결혼식 후 90일이 지나면 청첩장이 자동으로 삭제됩니다
          </p>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">통계</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500 mb-1">조회수</p>
            <p className="text-2xl font-bold text-stone-900">
              {invitation.viewCount || 0}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500 mb-1">생성일</p>
            <p className="text-xs font-medium text-stone-900">
              {invitation.createdAt
                ? new Date(invitation.createdAt).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
