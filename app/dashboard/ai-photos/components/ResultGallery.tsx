'use client';

import { Check, RefreshCw } from 'lucide-react';
import { PersonRole } from '@/types/ai';

interface ResultGalleryProps {
  role: PersonRole;
  images: string[];
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onRegenerate: () => void;
  remainingCredits: number;
}

export function ResultGallery({
  role,
  images,
  selectedImage,
  onSelectImage,
  onRegenerate,
  remainingCredits,
}: ResultGalleryProps) {
  const roleLabel = role === 'GROOM' ? '신랑' : '신부';

  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-stone-900">
            {roleLabel} AI 사진 (4장)
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            마음에 드는 사진 1장을 선택해주세요
          </p>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={onRegenerate}
          disabled={remainingCredits === 0}
          className="flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          재생성 ({remainingCredits} 크레딧)
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-4">
        {images.map((url, index) => {
          const isSelected = selectedImage === url;

          return (
            <button
              key={url}
              onClick={() => onSelectImage(url)}
              className={`
                relative aspect-square overflow-hidden rounded-lg border-4 transition-colors
                ${
                  isSelected
                    ? 'border-rose-500'
                    : 'border-transparent hover:border-stone-300'
                }
              `}
            >
              {/* Image */}
              <img
                src={url}
                alt={`Generated ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Selected Overlay */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20">
                  <div className="rounded-full bg-rose-500 p-2">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}

              {/* Image Number */}
              <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
                {index + 1}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Status */}
      {selectedImage && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          1장 선택됨
        </div>
      )}
    </div>
  );
}
