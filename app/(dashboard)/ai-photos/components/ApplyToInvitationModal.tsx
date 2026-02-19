'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  FileHeart,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { AlbumImage, AlbumGroup } from '@/types/ai';
import { useMultiSelect } from '@/hooks/useMultiSelect';

interface Invitation {
  id: string;
  groomName: string;
  brideName: string;
}

interface ApplyToInvitationModalProps {
  isOpen: boolean;
  images: AlbumImage[];
  groups: AlbumGroup[];
  onClose: () => void;
  onApplied: (invitationName: string, count: number) => void;
}

type ModalStep = 'select' | 'invitation';

const UNGROUPED_ID = '__ungrouped__';

export function ApplyToInvitationModal({
  isOpen,
  images,
  groups,
  onClose,
  onApplied,
}: ApplyToInvitationModalProps) {
  const [step, setStep] = useState<ModalStep>('select');

  // 청첩장 목록
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사진 선택
  const allUrls = useMemo(() => images.map((img) => img.url), [images]);
  const selection = useMultiSelect(allUrls);

  // 그룹별 이미지 분류
  const imagesByGroup = useMemo(() => {
    const result: Record<string, AlbumImage[]> = {};
    for (const g of [...groups].sort((a, b) => a.sortOrder - b.sortOrder)) {
      result[g.id] = [];
    }
    result[UNGROUPED_ID] = [];
    for (const img of images) {
      const gid = img.groupId && result[img.groupId] ? img.groupId : UNGROUPED_ID;
      result[gid].push(img);
    }
    return result;
  }, [images, groups]);

  // 그룹 칩에 보여줄 그룹 목록 (이미지 있는 그룹만)
  const visibleGroups = useMemo(() => {
    const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
    const result: Array<{ id: string; name: string }> = [];
    for (const g of sorted) {
      if ((imagesByGroup[g.id] ?? []).length > 0) {
        result.push({ id: g.id, name: g.name });
      }
    }
    if ((imagesByGroup[UNGROUPED_ID] ?? []).length > 0) {
      result.push({ id: UNGROUPED_ID, name: '미분류' });
    }
    return result;
  }, [groups, imagesByGroup]);

  const hasGroups = visibleGroups.length > 1;

  // 모달 열릴 때: 전체 선택 + step 초기화
  useEffect(() => {
    if (!isOpen) return;
    setStep('select');
    setError(null);
    setSelectedId(null);
    selection.selectAll();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2에 진입할 때 청첩장 목록 fetch
  useEffect(() => {
    if (step !== 'invitation') return;
    setLoading(true);
    setError(null);
    setSelectedId(null);

    fetch('/api/invitations')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.success ? data.data : null;
        const list: Invitation[] = Array.isArray(raw) ? raw : (raw?.invitations ?? []);
        setInvitations(list);
        if (list.length === 1) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => setError('청첩장 목록을 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, [step]);

  const toggleGroup = (groupId: string) => {
    const groupUrls = (imagesByGroup[groupId] ?? []).map((img) => img.url);
    const allSelected = groupUrls.every((url) => selection.isSelected(url));
    selection.setSelected((prev) => {
      const next = new Set(prev);
      groupUrls.forEach((url) => (allSelected ? next.delete(url) : next.add(url)));
      return next;
    });
  };

  const getGroupChipStyle = (groupId: string) => {
    const groupUrls = (imagesByGroup[groupId] ?? []).map((img) => img.url);
    if (groupUrls.length === 0) return 'bg-stone-100 text-stone-400';
    const selectedCount = groupUrls.filter((url) => selection.isSelected(url)).length;
    if (selectedCount === groupUrls.length) {
      return 'bg-rose-100 text-rose-700 border-rose-200';
    }
    if (selectedCount > 0) {
      return 'border-dashed border-rose-300 text-rose-600 bg-rose-50/50';
    }
    return 'bg-stone-100 text-stone-500 border-stone-200';
  };

  const handleApply = async () => {
    if (!selectedId) return;

    setApplying(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: selectedId,
          imageUrls: selection.selectedArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '적용 실패');

      onApplied(data.data.invitationName, selection.selectedCount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '적용 중 오류가 발생했습니다');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">
            {step === 'select' ? '청첩장에 적용할 사진 선택' : '청첩장에 적용'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {step === 'select' ? (
          <div className="px-6 py-5 space-y-4">
            {/* 그룹 칩 */}
            {hasGroups && (
              <div className="flex flex-wrap gap-2">
                {visibleGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${getGroupChipStyle(g.id)}`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* 선택 카운트 + 전체 선택/해제 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">
                {selection.selectedCount}장 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selection.selectAll}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  전체선택
                </button>
                <span className="text-xs text-stone-300">|</span>
                <button
                  onClick={selection.deselectAll}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  전체해제
                </button>
              </div>
            </div>

            {/* 사진 그리드 */}
            <div className="grid grid-cols-4 gap-2 max-h-[360px] overflow-y-auto sm:grid-cols-5">
              {images.map((img) => {
                const checked = selection.isSelected(img.url);
                return (
                  <button
                    key={img.url}
                    onClick={() => selection.toggle(img.url)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      checked
                        ? 'border-rose-500 ring-1 ring-rose-500/30'
                        : 'border-transparent hover:border-stone-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {checked && (
                      <div className="absolute inset-0 bg-rose-500/10 flex items-start justify-end p-1">
                        <div className="rounded-full bg-rose-500 p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* 선택된 사진 프리뷰 */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selection.selectedArray.slice(0, 6).map((url, i) => (
                <div
                  key={i}
                  className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200"
                >
                  <img
                    src={url}
                    alt={`선택 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {selection.selectedCount > 6 && (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-500">
                  +{selection.selectedCount - 6}
                </div>
              )}
            </div>

            <p className="text-sm text-stone-600">
              {selection.selectedCount}장의 사진을 추가할 청첩장을 선택하세요
            </p>

            {/* 청첩장 목록 */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              </div>
            ) : invitations.length === 0 ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center">
                <FileHeart className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                <p className="text-sm font-medium text-stone-700">청첩장이 없습니다</p>
                <p className="mt-1 text-xs text-stone-500">먼저 청첩장을 만들어주세요</p>
                <a
                  href="/invitations"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                >
                  청첩장 만들기 <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {invitations.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                      selectedId === inv.id
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <FileHeart
                      className={`h-5 w-5 flex-shrink-0 ${
                        selectedId === inv.id ? 'text-rose-500' : 'text-stone-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-stone-700">
                      {inv.groomName} ♥ {inv.brideName}
                    </span>
                    {selectedId === inv.id && (
                      <Check className="ml-auto h-4 w-4 text-rose-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
          {step === 'select' ? (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
              >
                취소
              </button>
              <button
                onClick={() => setStep('invitation')}
                disabled={selection.selectedCount === 0}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                다음 ({selection.selectedCount}장)
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setStep('select');
                  setError(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
              >
                <ChevronLeft className="h-4 w-4" />
                뒤로
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedId || applying || invitations.length === 0}
                className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    적용 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    적용하기
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
