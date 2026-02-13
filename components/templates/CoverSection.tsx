'use client';

import { motion } from 'framer-motion';
import type { Invitation } from '@/schemas/invitation';
import type { CoverConfig, DecorationConfig } from '@/lib/templates/types';
import { resolveEnterAnimation } from '@/lib/templates/resolvers';
import { formatWeddingDate, formatWeddingTime } from '@/lib/utils/date';
import { DecorationRenderer } from './renderers/DecorationRenderer';

interface CoverSectionProps {
  data: Invitation;
  config: CoverConfig;
}

function CoverDecoration({ config }: { config?: DecorationConfig }) {
  if (!config || config.type === 'none') return null;
  return <DecorationRenderer config={config} />;
}

function NameDivider({ config }: { config: CoverConfig }) {
  switch (config.nameDivider ?? 'ampersand') {
    case 'ampersand':
      return <p className={config.ampersandClass ?? 'text-xl md:text-2xl text-amber-600'}>&</p>;

    case 'lines-only':
      return (
        <div className="flex items-center justify-center gap-6">
          <div className={`h-px ${config.nameDividerLineClass ?? 'w-16 bg-stone-300'}`} />
          <div className={`h-px ${config.nameDividerLineClass ?? 'w-16 bg-stone-300'}`} />
        </div>
      );

    case 'lines-with-ampersand':
      return (
        <div className="flex items-center gap-4">
          <div className={`h-px ${config.nameDividerLineClass ?? 'w-12 bg-emerald-400'}`} />
          <span className={config.ampersandClass ?? 'text-emerald-400 text-lg'}>&</span>
          <div className={`h-px ${config.nameDividerLineClass ?? 'w-12 bg-emerald-400'}`} />
        </div>
      );
  }
}

function CoverCenter({ data, config }: CoverSectionProps) {
  const weddingDate = new Date(data.wedding.date);
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);
  const motionProps = config.animation
    ? resolveEnterAnimation(config.animation)
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1, delay: 0.2 } };

  const nameContent = (
    <div className={`space-y-3 ${config.nameWrapperClass ? '' : 'mb-8 md:mb-12'}`}>
      <p className={config.nameClass ?? 'font-serif text-3xl md:text-4xl text-gray-800'}>
        {data.groom.name}
      </p>
      <NameDivider config={config} />
      <p className={config.nameClass ?? 'font-serif text-3xl md:text-4xl text-gray-800'}>
        {data.bride.name}
      </p>
    </div>
  );

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      {data.gallery.coverImage && (
        <div className="absolute inset-0">
          <img
            src={data.gallery.coverImage}
            alt="Wedding Cover"
            className={`w-full h-full object-cover ${config.imageClass ?? 'opacity-40'}`}
          />
          {config.imageOverlay && (
            <div className={`absolute inset-0 ${config.imageOverlay}`} />
          )}
        </div>
      )}

      <motion.div
        {...motionProps}
        className={config.motionClass ?? 'relative z-10 text-center px-6'}
      >
        <CoverDecoration config={config.topDecoration} />

        {config.labelText !== undefined && (
          <p className={config.labelClass ?? 'font-serif text-xs md:text-sm tracking-[0.3em] text-amber-800 mb-6 md:mb-8 uppercase'}>
            {config.labelText || 'Wedding Invitation'}
          </p>
        )}

        {config.nameWrapperClass ? (
          <>
            <div className={config.nameWrapperClass}>
              {nameContent}
            </div>
            <div className={`space-y-1 mt-8`}>
              <p className={config.dateClass ?? 'text-base md:text-lg text-gray-600'}>{dateStr}</p>
              <p className={config.dateClass ?? 'text-base md:text-lg text-gray-600'}>{timeStr}</p>
              <p className={`${config.venueClass ?? config.dateClass ?? 'text-base md:text-lg text-gray-600'} mt-3`}>
                {data.wedding.venue.name}
                {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
              </p>
            </div>
          </>
        ) : (
          <>
            {nameContent}
            <div className="space-y-1 md:space-y-2">
              <p className={config.dateClass ?? 'text-base md:text-lg text-gray-600'}>{dateStr}</p>
              <p className={config.dateClass ?? 'text-base md:text-lg text-gray-600'}>{timeStr}</p>
              <p className={`${config.venueClass ?? config.dateClass ?? 'text-base md:text-lg text-gray-600'} mt-3 md:mt-4`}>
                {data.wedding.venue.name}
                {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
              </p>
            </div>
          </>
        )}

        <CoverDecoration config={config.bottomDecoration} />
      </motion.div>
    </section>
  );
}

function CoverBottomLeft({ data, config }: CoverSectionProps) {
  const weddingDate = new Date(data.wedding.date);
  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);
  const motionProps = config.animation
    ? resolveEnterAnimation(config.animation)
    : { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay: 0.2 } };

  return (
    <section
      className="relative flex flex-col items-end justify-end overflow-hidden pb-16 md:pb-20"
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      {data.gallery.coverImage && (
        <div className="absolute inset-0">
          <img
            src={data.gallery.coverImage}
            alt="Wedding Cover"
            className={`w-full h-full object-cover ${config.imageClass ?? ''}`}
          />
          {config.imageOverlay && (
            <div className={`absolute inset-0 ${config.imageOverlay}`} />
          )}
        </div>
      )}

      {!data.gallery.coverImage && config.fallbackBg && (
        <div className={`absolute inset-0 ${config.fallbackBg}`} />
      )}

      <motion.div
        {...motionProps}
        className={config.motionClass ?? 'relative z-10 px-8 md:px-12 w-full'}
      >
        {config.labelText !== undefined && (
          <p className={config.labelClass ?? 'text-xs tracking-[0.4em] text-emerald-400 uppercase mb-4'}>
            {config.labelText || 'Wedding Invitation'}
          </p>
        )}

        <h1 className={config.nameClass ?? 'text-5xl md:text-7xl font-bold text-white leading-tight mb-2'}>
          {data.groom.name}
        </h1>
        <NameDivider config={config} />
        <h1 className={config.nameClass ?? 'text-5xl md:text-7xl font-bold text-white leading-tight mb-8'}>
          {data.bride.name}
        </h1>

        <div className={config.dateClass ?? 'text-sm text-zinc-300 space-y-1'}>
          <p>{dateStr}</p>
          <p>{timeStr}</p>
          <p className={config.venueClass ?? 'text-zinc-400'}>
            {data.wedding.venue.name}
            {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export function CoverSection({ data, config }: CoverSectionProps) {
  if (!data.groom.name && !data.bride.name) return null;

  if (config.layout === 'bottom-left') {
    return <CoverBottomLeft data={data} config={config} />;
  }
  return <CoverCenter data={data} config={config} />;
}
