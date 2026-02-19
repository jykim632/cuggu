'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { ImageModal } from '@/components/ai/ImageModal';

interface GalleryImageGridProps {
  images: string[];
  onRemove: (index: number) => void;
}

export function GalleryImageGrid({ images, onRemove }: GalleryImageGridProps) {
  const [modalImage, setModalImage] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-xl p-6 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-4">
          갤러리 사진 ({images.length}장)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative aspect-square bg-stone-100 rounded-lg overflow-hidden group"
            >
              <img
                src={image}
                alt={`갤러리 ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setModalImage(image)}
              />
              {/* Zoom Button */}
              <button
                onClick={() => setModalImage(image)}
                className="absolute left-2 top-2 p-1.5 bg-black/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {/* Delete Button */}
              <button
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
    </>
  );
}
