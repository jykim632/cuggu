"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import { formatWeddingDate, formatWeddingTime } from "@/lib/utils/date";
import { classicTheme } from "@/lib/templates/themes";
import { BaseTemplate } from "./BaseTemplate";

interface ClassicTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ClassicTemplate({ data, isPreview = false }: ClassicTemplateProps) {
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 text-center px-6"
      >
        <div className="text-5xl md:text-6xl mb-6">✨</div>
        <h1 className="font-serif text-xs md:text-sm tracking-[0.3em] text-amber-800 mb-6 md:mb-8 uppercase">
          Wedding Invitation
        </h1>
        <div className="space-y-3 md:space-y-4 mb-8 md:mb-12">
          <p className="font-serif text-3xl md:text-4xl text-gray-800">
            {data.groom.name}
          </p>
          <p className="text-xl md:text-2xl text-amber-600">&</p>
          <p className="font-serif text-3xl md:text-4xl text-gray-800">
            {data.bride.name}
          </p>
        </div>
        <div className="space-y-1 md:space-y-2">
          <p className="text-base md:text-lg text-gray-600">{dateStr}</p>
          <p className="text-base md:text-lg text-gray-600">{timeStr}</p>
          <p className="text-base md:text-lg text-gray-600 mt-3 md:mt-4">
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>
      </motion.div>
    </section>
  );

  const footer = (
    <footer className="py-8 md:py-12 px-6 text-center text-xs md:text-sm text-gray-500 border-t border-amber-100">
      <p>© {new Date().getFullYear()} {data.groom.name} & {data.bride.name}</p>
      {!isPreview && (
        <p className="mt-2">
          Made with{" "}
          <a href="https://cuggu.io" className="text-amber-600 hover:text-amber-700">
            Cuggu
          </a>
        </p>
      )}
    </footer>
  );

  return (
    <BaseTemplate
      data={data}
      theme={classicTheme}
      isPreview={isPreview}
      coverSection={cover}
      footerSection={footer}
    />
  );
}
