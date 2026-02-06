"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { modernTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ModernTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ModernTemplate({ data, isPreview = false }: ModernTemplateProps) {
  const weddingDate = new Date(data.wedding.date);
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);

  const cover = (
    <section
      className="relative flex flex-col items-end justify-end overflow-hidden pb-16 md:pb-20"
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      {data.gallery.coverImage && (
        <div className="absolute inset-0">
          <img
            src={data.gallery.coverImage}
            alt="Wedding Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/30 to-transparent" />
        </div>
      )}

      {!data.gallery.coverImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
      )}

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 px-8 md:px-12 w-full"
      >
        <p className="text-xs tracking-[0.4em] text-emerald-400 uppercase mb-4">
          Wedding Invitation
        </p>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-2">
          {data.groom.name}
        </h1>
        <div className="flex items-center gap-4 mb-2">
          <div className="h-px w-12 bg-emerald-400" />
          <span className="text-emerald-400 text-lg">&</span>
          <div className="h-px w-12 bg-emerald-400" />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
          {data.bride.name}
        </h1>

        <div className="text-sm text-zinc-300 space-y-1">
          <p>{dateStr}</p>
          <p>{timeStr}</p>
          <p className="text-zinc-400">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-10 md:py-14 px-8 md:px-12 border-t border-zinc-200">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <p>{data.groom.name} & {data.bride.name}</p>
        {!isPreview && (
          <a href="https://cuggu.io" className="hover:text-emerald-600 transition-colors">
            Cuggu
          </a>
        )}
      </div>
    </footer>
  );

  return (
    <BaseTemplate
      data={data}
      theme={modernTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
