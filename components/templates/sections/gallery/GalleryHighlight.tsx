'use client';

import { motion } from 'framer-motion';
import type { SerializableTheme } from '@/lib/templates/types';
import { resolveAnimation } from '@/lib/templates/resolvers';

interface GalleryHighlightProps {
  images: string[];
  theme: SerializableTheme;
  onImageClick: (index: number) => void;
}

export function GalleryHighlight({ images, theme, onImageClick }: GalleryHighlightProps) {
  const [hero, ...rest] = images;

  return (
    <div className="space-y-3">
      {/* Hero image */}
      <motion.div
        {...resolveAnimation(theme.galleryItemAnimation, 0)}
        viewport={{ once: true }}
        className={`${theme.galleryItemClass} cursor-pointer`}
        onClick={() => onImageClick(0)}
      >
        <img
          src={hero}
          alt="Gallery highlight"
          className={`w-full aspect-[4/3] object-cover ${theme.galleryHover}`}
          loading="lazy"
        />
      </motion.div>

      {/* Remaining images in 2-col grid */}
      {rest.length > 0 && (
        <div className={`grid grid-cols-2 ${theme.galleryGap}`}>
          {rest.map((src, i) => {
            const motionProps = resolveAnimation(theme.galleryItemAnimation, i + 1);
            return (
              <motion.div
                key={i + 1}
                {...motionProps}
                viewport={{ once: true }}
                className={`${theme.galleryItemClass} cursor-pointer`}
                onClick={() => onImageClick(i + 1)}
              >
                <img
                  src={src}
                  alt={`Gallery ${i + 2}`}
                  className={`w-full h-full object-cover ${theme.galleryHover}`}
                  loading="lazy"
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
