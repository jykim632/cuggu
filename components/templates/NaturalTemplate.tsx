"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { naturalTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface NaturalTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function NaturalTemplate({ data, isPreview = false }: NaturalTemplateProps) {
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
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-50/50 via-transparent to-stone-50" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 text-center px-6"
      >
        {/* 잎사귀 장식 (상단) */}
        <div className="text-4xl opacity-40 mb-4">&#x1F343;</div>

        <p className="text-xs tracking-[0.4em] text-emerald-600/80 uppercase mb-8">
          Wedding Invitation
        </p>

        <div className="space-y-4 mb-8">
          <p className="font-light text-4xl md:text-5xl text-stone-800 tracking-wide">
            {data.groom.name}
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-emerald-400/50" />
            <span className="text-emerald-500/70 text-lg">&</span>
            <div className="h-px w-8 bg-emerald-400/50" />
          </div>
          <p className="font-light text-4xl md:text-5xl text-stone-800 tracking-wide">
            {data.bride.name}
          </p>
        </div>

        <div className="space-y-1 text-stone-500">
          <p className="text-sm">{dateStr}</p>
          <p className="text-sm">{timeStr}</p>
          <p className="text-sm mt-4">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>

        {/* 잎사귀 장식 (하단) */}
        <div className="text-4xl opacity-40 mt-8">&#x1F33F;</div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-10 md:py-14 px-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-lg opacity-40">&#x1F33F;</span>
      </div>
      <p className="text-sm text-stone-500">
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPreview && (
        <p className="mt-2">
          <a
            href="https://cuggu.io"
            className="text-xs text-stone-400 hover:text-emerald-600 transition-colors"
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
      theme={naturalTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
