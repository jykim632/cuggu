"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { minimalTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface MinimalTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function MinimalTemplate({ data, isPreview = false }: MinimalTemplateProps) {
  const weddingDate = new Date(data.wedding.date);
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);

  const cover = (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      {data.gallery.coverImage && (
        <div className="absolute inset-0">
          <img
            src={data.gallery.coverImage}
            alt="Wedding Cover"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="relative z-10 text-center px-6"
      >
        <p className="text-[10px] tracking-[0.5em] text-stone-400 uppercase mb-16">
          Wedding Invitation
        </p>

        <div className="space-y-6 mb-16">
          <p className="text-3xl md:text-4xl font-light tracking-[0.15em] text-stone-900">
            {data.groom.name}
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-stone-300" />
            <div className="h-px w-16 bg-stone-300" />
          </div>
          <p className="text-3xl md:text-4xl font-light tracking-[0.15em] text-stone-900">
            {data.bride.name}
          </p>
        </div>

        <div className="space-y-2 text-stone-400">
          <p className="text-xs tracking-[0.2em]">{dateStr}</p>
          <p className="text-xs tracking-[0.2em]">{timeStr}</p>
          <p className="text-xs tracking-[0.2em] mt-4">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-12 md:py-16 px-6 text-center">
      <div className="h-px w-8 bg-stone-200 mx-auto mb-8" />
      <p className="text-[10px] tracking-[0.3em] text-stone-300">
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPreview && (
        <p className="mt-3">
          <a
            href="https://cuggu.io"
            className="text-[10px] tracking-[0.2em] text-stone-300 hover:text-stone-500 transition-colors"
          >
            Cuggu
          </a>
        </p>
      )}
    </footer>
  );

  return (
    <BaseTemplate
      data={data}
      theme={minimalTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
