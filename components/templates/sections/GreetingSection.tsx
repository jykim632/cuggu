"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { DecorationRenderer } from "../renderers/DecorationRenderer";

interface GreetingSectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

export function GreetingSection({ data, theme }: GreetingSectionProps) {
  if (!data.content.greeting) return null;

  const alignClass = resolveGreetingAlign(theme);
  const isQuote = theme.greetingLayout === 'quote-style';

  return (
    <section
      className={`flex items-center justify-center ${theme.sectionPadding}`}
    >
      <div className={theme.greetingMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={alignClass}
        >
          {theme.greetingDecorTop && (
            <div className="mb-8"><DecorationRenderer config={theme.greetingDecorTop} /></div>
          )}

          <div className="space-y-4 md:space-y-6">
            <p className={`${theme.bodyText} ${isQuote ? 'italic font-serif' : ''}`}>
              {isQuote ? '\u201C' : ''}{data.content.greeting}{isQuote ? '\u201D' : ''}
            </p>
          </div>

          {theme.greetingDecorBottom && (
            <div className="mt-8"><DecorationRenderer config={theme.greetingDecorBottom} /></div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function resolveGreetingAlign(theme: SerializableTheme): string {
  switch (theme.greetingLayout) {
    case 'left-aligned': return 'text-left';
    case 'quote-style': return 'text-center';
    case 'centered': return 'text-center';
    default: return theme.greetingAlign;
  }
}
