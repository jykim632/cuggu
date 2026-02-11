'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { HistoryFilters, type HistoryFilterState } from './HistoryFilters';
import { GenerationCard } from './GenerationCard';

interface Generation {
  id: string;
  originalUrl: string;
  style: string;
  role: string | null;
  generatedUrls: string[] | null;
  selectedUrl: string | null;
  isFavorited: boolean;
  modelId: string | null;
  cost: number;
  createdAt: string;
}

interface HistoryTabProps {
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onGenerationsLoaded?: (generations: Generation[]) => void;
}

export function HistoryTab({ selectedIds, onToggleSelect, onGenerationsLoaded }: HistoryTabProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<HistoryFilterState>({ role: null, style: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchGenerations = useCallback(async (pageNum: number, append = false) => {
    const isFirst = !append;
    if (isFirst) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '20');
      if (filters.role) params.set('role', filters.role);
      if (filters.style) params.set('style', filters.style);

      const res = await fetch(`/api/ai/generations?${params}`);
      const data = await res.json();

      if (data.success) {
        const newGenerations = append
          ? [...generations, ...data.data]
          : data.data;
        setGenerations(newGenerations);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        onGenerationsLoaded?.(newGenerations);
      }
    } catch {
      // fetch 실패 시 무시
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, generations, onGenerationsLoaded]);

  useEffect(() => {
    setPage(1);
    fetchGenerations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGenerations(nextPage, true);
  };

  const handleToggleFavorite = async (id: string, isFavorited: boolean) => {
    try {
      const res = await fetch(`/api/ai/generations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorited }),
      });

      if (res.ok) {
        setGenerations((prev) =>
          prev.map((g) => (g.id === id ? { ...g, isFavorited } : g))
        );
      }
    } catch {
      // 실패 시 무시
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <p className="text-sm text-stone-500">히스토리 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HistoryFilters filters={filters} onFilterChange={setFilters} />

      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Clock className="w-10 h-10 text-stone-300" />
          <p className="text-sm font-medium text-stone-700">생성 기록이 없습니다</p>
          <p className="text-xs text-stone-500">AI 사진을 생성하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-stone-500">
            총 {total}건
            {selectedIds.size > 0 && ` · ${selectedIds.size}건 선택됨`}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {generations.map((gen) => (
              <GenerationCard
                key={gen.id}
                generation={gen}
                isSelected={selectedIds.has(gen.id)}
                onToggleSelect={onToggleSelect}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  '더 보기'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
