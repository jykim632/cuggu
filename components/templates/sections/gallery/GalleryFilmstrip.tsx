'use client';

import type { SerializableTheme } from '@/lib/templates/types';

interface GalleryFilmstripProps {
  images: string[];
  theme: SerializableTheme;
  onImageClick: (index: number) => void;
}

export function GalleryFilmstrip({ images, theme, onImageClick }: GalleryFilmstripProps) {
  return (
    <div
      className="flex gap-3 overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-hide -mx-6 px-6"
      role="list"
    >
      {images.map((src, i) => (
        <div
          key={i}
          role="listitem"
          className={`flex-shrink-0 w-[75vw] max-w-[320px] snap-center cursor-pointer ${theme.galleryItemClass}`}
          onClick={() => onImageClick(i)}
        >
          <img
            src={src}
            alt={`Gallery ${i + 1}`}
            className={`w-full aspect-[4/3] object-cover rounded-lg ${theme.galleryHover}`}
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
