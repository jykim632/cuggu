"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { TemplateTheme } from "@/lib/templates/themes";

interface GreetingSectionProps {
  data: Invitation;
  theme: TemplateTheme;
}

export function GreetingSection({ data, theme }: GreetingSectionProps) {
  return (
    <section
      className={`flex items-center justify-center ${theme.sectionPadding}`}
      style={{ minHeight: 'var(--screen-height, 100vh)' }}
    >
      <div className={theme.greetingMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={theme.greetingAlign}
        >
          {theme.greetingDecorTop && (
            <div className="mb-8">{theme.greetingDecorTop}</div>
          )}

          <div className="space-y-4 md:space-y-6">
            <p className={theme.bodyText}>
              {data.content.greeting}
            </p>
          </div>

          {theme.greetingDecorBottom && (
            <div className="mt-8">{theme.greetingDecorBottom}</div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
