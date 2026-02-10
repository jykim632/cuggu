'use client';

import { useState } from 'react';
import { Loader2, ZoomIn } from 'lucide-react';
import { PersonRole } from '@/types/ai';
import { ImageModal } from './ImageModal';

interface AIStreamingGalleryProps {
  role: PersonRole;
  images: (string | null)[];
  statusMessage: string;
  originalImage?: File | null;
}

export function AIStreamingGallery({
  role,
  images,
  statusMessage,
  originalImage,
}: AIStreamingGalleryProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const completedCount = images.filter(Boolean).length;

  return (
    <>
      <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        {/* Header with Original Image */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* 원본 이미지 */}
          {originalImage && (
            <div className="flex-shrink-0">
              <div
                className="w-16 h-16 rounded-lg overflow-hidden border-2 border-stone-200 cursor-pointer hover:border-pink-300 transition-colors"
                onClick={() => setModalImage(URL.createObjectURL(originalImage))}
              >
                <img
                  src={URL.createObjectURL(originalImage)}
                  alt="원본"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-stone-400 text-center mt-1">원본</p>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">
                  {roleLabel} AI 사진 생성 중...
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {statusMessage}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                {completedCount}/4
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-50 group"
            >
              {url ? (
                // 생성된 이미지
                <>
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="h-full w-full object-cover transition-opacity cursor-pointer"
                    onClick={() => setModalImage(url)}
                  />
                  {/* Zoom Button */}
                  <button
                    onClick={() => setModalImage(url)}
                    className="absolute right-2 top-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </>
              ) : (
                // 로딩 슬롯
                <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                  {index === completedCount ? (
                    // 현재 생성 중
                    <>
                      <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                      <span className="text-xs text-stone-400">생성 중...</span>
                    </>
                  ) : (
                    // 대기 중
                    <>
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-stone-300" />
                      <span className="text-xs text-stone-300">대기 중</span>
                    </>
                  )}
                </div>
              )}

              {/* Image Number */}
              <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-pink-500 transition-all duration-500"
              style={{ width: `${(completedCount / 4) * 100}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 text-center">
            각 이미지 생성에 20-30초 소요
          </p>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}
