"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { resolveAnimation } from "@/lib/templates/resolvers";
import { GalleryLightbox } from "../GalleryLightbox";
import { HeadingRenderer } from "../renderers/HeadingRenderer";
import { GalleryCarousel } from "./gallery/GalleryCarousel";
import { GalleryFilmstrip } from "./gallery/GalleryFilmstrip";
import { GalleryHighlight } from "./gallery/GalleryHighlight";

function resolveGalleryGrid(layout?: SerializableTheme['galleryLayout']): string {
  switch (layout) {
    case 'grid-2': return 'grid-cols-2';
    case 'grid-3': return 'grid-cols-3';
    case 'grid-2-1': return 'grid-cols-2';
    case 'single-column': return 'grid-cols-1';
    default: return 'grid-cols-2 md:grid-cols-3';
  }
}

interface GallerySectionProps {
  data: Invitation;
  theme: SerializableTheme;
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
}

export function GallerySection({ data, theme, lightboxIndex, setLightboxIndex }: GallerySectionProps) {
  if (data.gallery.images.length === 0) return null;

  // 사용자 설정 > 테마 기본값 우선순위
  const effectiveLayout = data.settings?.galleryLayout ?? theme.galleryLayout;

  const handleImageClick = (index: number) => setLightboxIndex(index);

  function renderLayout() {
    switch (effectiveLayout) {
      case 'carousel':
        return (
          <GalleryCarousel
            images={data.gallery.images}
            theme={theme}
            onImageClick={handleImageClick}
          />
        );
      case 'filmstrip':
        return (
          <GalleryFilmstrip
            images={data.gallery.images}
            theme={theme}
            onImageClick={handleImageClick}
          />
        );
      case 'highlight':
        return (
          <GalleryHighlight
            images={data.gallery.images}
            theme={theme}
            onImageClick={handleImageClick}
          />
        );
      case 'masonry':
        return (
          <div className={`columns-2 md:columns-3 ${theme.galleryGap}`}>
            {data.gallery.images.map((image, index) => {
              const motionProps = resolveAnimation(theme.galleryItemAnimation, index);
              return (
                <motion.div
                  key={index}
                  {...motionProps}
                  viewport={{ once: true }}
                  className="break-inside-avoid mb-3 overflow-hidden rounded-lg shadow-md cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className={`w-full h-auto object-cover ${theme.galleryHover}`}
                    loading="lazy"
                  />
                </motion.div>
              );
            })}
          </div>
        );
      default:
        return (
          <div className={`grid ${resolveGalleryGrid(effectiveLayout)} ${theme.galleryGap}`}>
            {data.gallery.images.map((image, index) => {
              const motionProps = resolveAnimation(theme.galleryItemAnimation, index);
              const spanClass = effectiveLayout === 'grid-2-1' && index % 3 === 2 ? 'col-span-2' : '';
              const aspectClass = effectiveLayout === 'single-column' ? 'aspect-video' : '';
              return (
                <motion.div
                  key={index}
                  {...motionProps}
                  viewport={{ once: true }}
                  className={`${theme.galleryItemClass} ${spanClass} ${aspectClass}`}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className={`w-full h-full object-cover ${theme.galleryHover}`}
                    loading="lazy"
                  />
                </motion.div>
              );
            })}
          </div>
        );
    }
  }

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.gallery ?? ''}`}>
      <div className={theme.galleryMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {theme.galleryHeading ? (
            <HeadingRenderer config={theme.galleryHeading} fallbackClass={theme.headingClass}>
              Gallery
            </HeadingRenderer>
          ) : (
            <h2 className={theme.headingClass}>Gallery</h2>
          )}

          {renderLayout()}

          <AnimatePresence>
            {lightboxIndex !== null && (
              <GalleryLightbox
                images={data.gallery.images}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
