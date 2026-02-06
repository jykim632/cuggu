"use client";

import type { Invitation } from "@/schemas/invitation";
import type { TemplateTheme } from "@/lib/templates/themes";
import { RSVPSection } from "@/components/rsvp/RSVPSection";

interface RsvpSectionWrapperProps {
  data: Invitation;
  theme: TemplateTheme;
}

export function RsvpSectionWrapper({ data, theme }: RsvpSectionWrapperProps) {
  if (!data.settings.enableRsvp) return null;

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.rsvp ?? ''}`}>
      <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} />
    </section>
  );
}
