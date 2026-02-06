"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import type { Invitation } from "@/schemas/invitation";
import type { TemplateTheme } from "@/lib/templates/themes";
import { MapSection } from "../MapSection";
import { NavigationButtons } from "../NavigationButtons";

interface MapInfoSectionProps {
  data: Invitation;
  theme: TemplateTheme;
}

export function MapInfoSection({ data, theme }: MapInfoSectionProps) {
  if (!data.settings.showMap || !data.wedding.venue.lat || !data.wedding.venue.lng) {
    return null;
  }

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.map ?? ''}`}>
      <div className={theme.contentMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={theme.ceremonyCentered ? 'text-center' : ''}
        >
          {theme.mapHeading || (
            <h2 className={theme.headingClass}>오시는 길</h2>
          )}

          <MapSection
            lat={data.wedding.venue.lat}
            lng={data.wedding.venue.lng}
            venueName={data.wedding.venue.name}
          />

          {/* 장소 정보 */}
          <div className={theme.mapInfoBg}>
            <p className={theme.mapVenueNameClass}>
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
            <p className={theme.mapAddressClass}>
              {data.wedding.venue.address}
            </p>
            {/* Classic만 tel 표시 */}
            {theme.id === 'classic' && data.wedding.venue.tel && (
              <a
                href={`tel:${data.wedding.venue.tel}`}
                className={`inline-flex items-center gap-1 text-xs ${theme.accentColor} mt-2 min-h-[44px]`}
              >
                <Phone className="w-3.5 h-3.5" />
                {data.wedding.venue.tel}
              </a>
            )}
          </div>

          {/* 길찾기 버튼 */}
          <NavigationButtons
            lat={data.wedding.venue.lat}
            lng={data.wedding.venue.lng}
            venueName={data.wedding.venue.name}
          />

          {/* 교통편 안내 */}
          {data.wedding.venue.transportation && (
            <div className={theme.transportCard}>
              {theme.transportLabelClass && (
                <p className={theme.transportLabelClass}>교통편 안내</p>
              )}
              {theme.id === 'minimal' && <div className="h-px w-8 bg-stone-200 mx-auto mb-6" />}
              <p className={theme.transportTextClass}>
                {data.wedding.venue.transportation}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
