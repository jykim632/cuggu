"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { elegantTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ElegantTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ElegantTemplate({ data, isPreview = false }: ElegantTemplateProps) {
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
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-white" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 text-center px-6"
      >
        {/* 상단 장식 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
          <div className="w-3 h-3 rotate-45 border-2 border-amber-400" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        <p className="text-xs tracking-[0.4em] text-amber-600 uppercase mb-8">
          Wedding Invitation
        </p>

        <div className="space-y-4 mb-10">
          <p className="font-serif text-4xl md:text-5xl text-slate-800">
            {data.groom.name}
          </p>
          <p className="text-2xl text-amber-500 font-light">&</p>
          <p className="font-serif text-4xl md:text-5xl text-slate-800">
            {data.bride.name}
          </p>
        </div>

        {/* 하단 장식 */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
          <div className="w-3 h-3 rotate-45 border-2 border-amber-400" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        <div className="space-y-1 text-slate-600">
          <p className="text-sm tracking-wide">{dateStr}</p>
          <p className="text-sm tracking-wide">{timeStr}</p>
          <p className="text-sm tracking-wide mt-4">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-10 md:py-14 px-6 text-center bg-slate-800">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px w-8 bg-amber-400/40" />
        <div className="w-2 h-2 rotate-45 border border-amber-400/40" />
        <div className="h-px w-8 bg-amber-400/40" />
      </div>
      <p className="text-sm text-slate-400">
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPreview && (
        <p className="mt-2">
          <a
            href="https://cuggu.io"
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
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
      theme={elegantTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
