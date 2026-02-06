"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { floralTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface FloralTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function FloralTemplate({ data, isPreview = false }: FloralTemplateProps) {
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
          <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 via-transparent to-rose-50" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 text-center px-6"
      >
        {/* 상단 꽃 장식 */}
        <div className="text-3xl opacity-60 mb-4">&#x1F33A;</div>

        <p className="font-serif text-xs tracking-[0.3em] text-rose-400 mb-8">
          Wedding Invitation
        </p>

        <div className="inline-block bg-white/60 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-sm border border-rose-100">
          <div className="space-y-3 mb-0">
            <p className="font-serif text-3xl md:text-4xl text-rose-900">
              {data.groom.name}
            </p>
            <p className="text-rose-300 text-lg">&</p>
            <p className="font-serif text-3xl md:text-4xl text-rose-900">
              {data.bride.name}
            </p>
          </div>
        </div>

        <div className="space-y-1 mt-8">
          <p className="text-sm text-rose-500">{dateStr}</p>
          <p className="text-sm text-rose-500">{timeStr}</p>
          <p className="text-sm text-rose-400 mt-3">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>

        {/* 하단 꽃 장식 */}
        <div className="text-3xl opacity-60 mt-8">&#x1F338;</div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-10 md:py-14 px-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-8 bg-rose-200" />
        <span className="text-rose-300 text-sm">&#x2740;</span>
        <div className="h-px w-8 bg-rose-200" />
      </div>
      <p className="text-xs text-rose-400">
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPreview && (
        <p className="mt-2">
          <a
            href="https://cuggu.io"
            className="text-xs text-rose-300 hover:text-rose-500 transition-colors"
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
      theme={floralTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
