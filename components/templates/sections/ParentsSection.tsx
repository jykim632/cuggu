"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { resolveAnimation } from "@/lib/templates/resolvers";
import { formatFamilyName } from "@/lib/utils/family-display";
import { HeadingRenderer } from "../renderers/HeadingRenderer";

interface ParentsSectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

function resolveParentsGrid(theme: SerializableTheme): string {
  switch (theme.parentsLayout) {
    case 'stacked': return 'flex flex-col items-center space-y-8';
    case 'compact': return 'grid grid-cols-2 gap-4';
    case 'cards':
    case 'side-by-side':
    default: return theme.parentsGrid;
  }
}

function PersonCard({
  person,
  side,
  theme,
  motionProps,
  forceCardWrapper,
}: {
  person: Invitation['groom'] | Invitation['bride'];
  side: 'groom' | 'bride';
  theme: SerializableTheme;
  motionProps: object;
  forceCardWrapper?: boolean;
}) {
  const roleLabel = side === 'groom' ? 'Groom' : 'Bride';
  const familyNameClass = theme.parentsRoleLabel
    ? (theme.parentsFamilyNameClass ?? theme.labelClass)
    : theme.labelClass;

  const content = (
    <>
      {theme.parentsRoleLabel && (
        <p className={theme.labelClass}>{roleLabel}</p>
      )}
      <p className={familyNameClass}>
        {formatFamilyName(person) || (side === 'groom' ? '신랑' : '신부')}
      </p>
      <h3 className={theme.nameClass}>{person.name}</h3>
      {person.phone && (
        <a href={`tel:${person.phone}`} className={theme.phoneLinkClass}>
          <Phone className="w-4 h-4" />
          {person.phone}
        </a>
      )}
    </>
  );

  const showCard = theme.parentsCardWrapper != null || forceCardWrapper;
  const cardClass = theme.parentsCardWrapper ?? 'text-center p-6 bg-white/50 rounded-2xl';

  return (
    <motion.div {...motionProps} viewport={{ once: true }} className="text-center">
      {showCard ? (
        <div className={cardClass}>{content}</div>
      ) : (
        content
      )}
    </motion.div>
  );
}

export function ParentsSection({ data, theme }: ParentsSectionProps) {
  if (!data.settings.showParents) return null;

  const groomMotion = resolveAnimation(theme.groomAnimation);
  const brideMotion = resolveAnimation(theme.brideAnimation);

  const fullHeight = theme.parentsLayout === 'compact'
    ? false
    : (theme.parentsFullHeight !== false);

  const gridClass = resolveParentsGrid(theme);

  return (
    <section
      className={`${fullHeight ? 'flex items-center justify-center' : ''} ${theme.sectionPadding} ${theme.sectionBg.parents ?? ''}`}
      style={fullHeight ? { minHeight: 'var(--screen-height, 100vh)' } : undefined}
    >
      <div className={`${theme.contentMaxWidth} w-full`}>
        {theme.parentsHeading && (
          <HeadingRenderer config={theme.parentsHeading} fallbackClass={theme.headingClass}>
            Bride &amp; Groom
          </HeadingRenderer>
        )}
        <div className={gridClass}>
          <PersonCard
            person={data.groom}
            side="groom"
            theme={theme}
            motionProps={groomMotion}
            forceCardWrapper={theme.parentsLayout === 'cards'}
          />
          <PersonCard
            person={data.bride}
            side="bride"
            theme={theme}
            motionProps={brideMotion}
            forceCardWrapper={theme.parentsLayout === 'cards'}
          />
        </div>
      </div>
    </section>
  );
}
