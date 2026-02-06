"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { TemplateTheme } from "@/lib/templates/themes";
import { GalleryLightbox } from "../GalleryLightbox";

interface GallerySectionProps {
  data: Invitation;
  theme: TemplateTheme;
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
}

export function GallerySection({ data, theme, lightboxIndex, setLightboxIndex }: GallerySectionProps) {
  if (data.gallery.images.length === 0) return null;

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.gallery ?? ''}`}>
      <div className={theme.galleryMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {theme.galleryHeading || (
            <h2 className={theme.headingClass}>Gallery</h2>
          )}

          <div className={`grid grid-cols-2 md:grid-cols-3 ${theme.galleryGap}`}>
            {data.gallery.images.map((image, index) => {
              const motionProps = theme.galleryItemMotion(index);
              return (
                <motion.div
                  key={index}
                  {...motionProps}
                  viewport={{ once: true }}
                  className={theme.galleryItemClass}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className={`w-full h-full object-cover ${theme.galleryHover}`}
                  />
                </motion.div>
              );
            })}
          </div>

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
