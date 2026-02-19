'use client';

import { useState } from 'react';
import { Star, ZoomIn, Check } from 'lucide-react';
import { AI_STYLES } from '@/types/ai';
import { ImageModal } from '@/components/ai/ImageModal';

interface GenerationCardProps {
  generation: {
    id: string;
    style: string;
    role: string | null;
    generatedUrls: string[] | null;
    isFavorited: boolean;
    createdAt: string;
  };
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onToggleFavorite: (id: string, isFavorited: boolean) => void;
}

export function GenerationCard({
  generation,
  isSelected = false,
  onToggleSelect,
  onToggleFavorite,
}: GenerationCardProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const thumbnail = generation.generatedUrls?.[0];
  const styleInfo = AI_STYLES.find((s) => s.value === generation.style);
  const roleLabel = generation.role === 'GROOM' ? '신랑' : generation.role === 'BRIDE' ? '신부' : null;
  const imageCount = generation.generatedUrls?.length ?? 0;

  const timeAgo = getTimeAgo(generation.createdAt);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteLoading(true);
    try {
      await onToggleFavorite(generation.id, !generation.isFavorited);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <>
      <div
        className={`
          group relative overflow-hidden rounded-xl border-2 bg-white transition-all
          ${isSelected ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-stone-200 hover:border-stone-300'}
          ${onToggleSelect ? 'cursor-pointer' : ''}
        `}
        onClick={() => onToggleSelect?.(generation.id)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={styleInfo?.label ?? generation.style}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-300">
              No image
            </div>
          )}

          {/* Overlay buttons */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Zoom */}
          {thumbnail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalImage(thumbnail);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          )}

          {/* Favorite */}
          <button
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className={`
              absolute left-2 top-2 rounded-full p-1.5 transition-all
              ${generation.isFavorited
                ? 'bg-amber-500 text-white'
                : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70'
              }
              ${favoriteLoading ? 'opacity-50' : ''}
            `}
          >
            <Star className={`w-4 h-4 ${generation.isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Selected check */}
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
              <div className="rounded-full bg-rose-500 p-2">
                <Check className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Image count badge */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              {imageCount}장
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-700">
              {styleInfo?.label ?? generation.style}
            </span>
            {roleLabel && (
              <span className={`
                rounded-full px-2 py-0.5 text-[10px] font-medium
                ${generation.role === 'GROOM' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}
              `}>
                {roleLabel}
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400">{timeAgo}</p>
        </div>
      </div>

      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;

  return new Date(dateStr).toLocaleDateString('ko-KR');
}
