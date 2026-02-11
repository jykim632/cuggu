'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
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

interface FavoritesTabProps {
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onGenerationsLoaded?: (generations: Generation[]) => void;
}

export function FavoritesTab({ selectedIds, onToggleSelect, onGenerationsLoaded }: FavoritesTabProps) {
  const [favorites, setFavorites] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generations?favorites=true&limit=50');
      const data = await res.json();
      if (data.success) {
        setFavorites(data.data);
        onGenerationsLoaded?.(data.data);
      }
    } catch {
      // 실패 시 무시
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorited: boolean) => {
    try {
      const res = await fetch(`/api/ai/generations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorited }),
      });

      if (res.ok) {
        if (!isFavorited) {
          // 즐겨찾기 해제 → 목록에서 제거
          setFavorites((prev) => prev.filter((g) => g.id !== id));
        } else {
          setFavorites((prev) =>
            prev.map((g) => (g.id === id ? { ...g, isFavorited } : g))
          );
        }
      }
    } catch {
      // 실패 시 무시
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <p className="text-sm text-stone-500">즐겨찾기 불러오는 중...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Star className="w-10 h-10 text-stone-300" />
        <p className="text-sm font-medium text-stone-700">즐겨찾기가 없습니다</p>
        <p className="text-xs text-stone-500">
          히스토리에서 ★ 버튼으로 즐겨찾기에 추가하세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-stone-500">
        {favorites.length}개의 즐겨찾기
        {selectedIds.size > 0 && ` · ${selectedIds.size}건 선택됨`}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((gen) => (
          <GenerationCard
            key={gen.id}
            generation={gen}
            isSelected={selectedIds.has(gen.id)}
            onToggleSelect={onToggleSelect}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}
