'use client';

import { useState } from 'react';
import { Check, RefreshCw, ZoomIn } from 'lucide-react';
import { PersonRole } from '@/types/ai';
import { ImageModal } from '@/components/ai/ImageModal';

interface AIResultGalleryProps {
  role: PersonRole;
  images: string[];
  selectedImages: string[];
  onToggleImage: (url: string) => void;
  onRegenerate: () => void;
  remainingCredits: number;
  disabled?: boolean;
}

export function AIResultGallery({
  role,
  images,
  selectedImages,
  onToggleImage,
  onRegenerate,
  remainingCredits,
  disabled = false,
}: AIResultGalleryProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const selectedCount = selectedImages.filter((url) => images.includes(url)).length;

  return (
    <>
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-900">
              {roleLabel} AI 사진 ({images.length}장)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              갤러리에 추가할 사진을 선택하세요
            </p>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={onRegenerate}
            disabled={remainingCredits === 0 || disabled}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            재생성 ({remainingCredits})
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, index) => {
            const isSelected = selectedImages.includes(url);

            return (
              <div
                key={url}
                className={`
                  relative aspect-square overflow-hidden rounded-lg border-3 transition-all group
                  ${disabled ? 'opacity-60' : ''}
                  ${
                    isSelected
                      ? 'border-pink-500 ring-2 ring-pink-500/20'
                      : 'border-transparent hover:border-stone-300'
                  }
                `}
              >
                {/* Image */}
                <img
                  src={url}
                  alt={`Generated ${index + 1}`}
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => !disabled && onToggleImage(url)}
                />

                {/* Selected Overlay */}
                {isSelected && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-pink-500/20 pointer-events-none"
                  >
                    <div className="rounded-full bg-pink-500 p-1.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Image Number */}
                <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                  {index + 1}
                </div>

                {/* Zoom Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalImage(url);
                  }}
                  className="absolute right-2 top-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Selection Status */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            {selectedCount}장 선택됨
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}
