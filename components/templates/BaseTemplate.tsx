"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { Invitation, SectionId } from "@/schemas/invitation";
import { sanitizeSectionOrder } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { GreetingSection } from "./sections/GreetingSection";
import { ParentsSection } from "./sections/ParentsSection";
import { CeremonySection } from "./sections/CeremonySection";
import { MapInfoSection } from "./sections/MapInfoSection";
import { GallerySection } from "./sections/GallerySection";
import { AccountsSection } from "./sections/AccountsSection";
import { RsvpSectionWrapper } from "./sections/RsvpSectionWrapper";
import { GuestbookSectionWrapper } from "./sections/GuestbookSectionWrapper";
import { CoverSection } from "./CoverSection";
import { EndingSection } from "./sections/EndingSection";
import { FooterSection } from "./FooterSection";
import { DividerRenderer } from "./renderers/DividerRenderer";
import { buildFontStyle } from "@/lib/fonts/registry";

interface BaseTemplateProps {
  data: Invitation;
  theme: SerializableTheme;
  isPreview?: boolean;
}

export function BaseTemplate({ data, theme, isPreview }: BaseTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  // 사용자 폰트 & 텍스트 크기 적용
  const fontStyle = buildFontStyle(data.settings?.fontFamily, data.settings?.textScale);

  // 섹션 활성화 상태 (enabledSections 없으면 전부 활성)
  const enabledSections = (data.extendedData?.enabledSections as Record<string, boolean>) ?? {};

  // sectionId → enabledSections key 매핑 (account ↔ accounts)
  const isSectionEnabled = (sectionId: SectionId): boolean => {
    const key = sectionId === 'accounts' ? 'account' : sectionId;
    return enabledSections[key] !== false;
  };

  const sections: Record<SectionId, () => ReactNode> = {
    greeting: () => isSectionEnabled('greeting') ? <GreetingSection data={data} theme={theme} /> : null,
    parents: () => <ParentsSection data={data} theme={theme} />,
    ceremony: () => <CeremonySection data={data} theme={theme} />,
    map: () => <MapInfoSection data={data} theme={theme} />,
    gallery: () => isSectionEnabled('gallery') ? (
      <GallerySection
        data={data}
        theme={theme}
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
      />
    ) : null,
    accounts: () => isSectionEnabled('accounts') ? <AccountsSection data={data} theme={theme} /> : null,
    rsvp: () => <RsvpSectionWrapper data={data} theme={theme} />,
    guestbook: () => <GuestbookSectionWrapper data={data} theme={theme} />,
  };

  // 렌더 가능한 섹션만 필터링
  const renderedSections = sectionOrder
    .map((id) => ({ id, node: sections[id]() }))
    .filter(({ node }) => node !== null);

  return (
    <div className={theme.containerBg} style={fontStyle}>
      <CoverSection data={data} config={theme.cover} />
      <DividerRenderer config={theme.postCoverDivider} />

      {renderedSections.map(({ id, node }, idx) => (
        <Fragment key={id}>
          {idx > 0 && <DividerRenderer config={theme.sectionDivider} />}
          {node}
        </Fragment>
      ))}

      {/* 엔딩 섹션 (고정 위치 — 항상 푸터 바로 위) */}
      {enabledSections.ending === true && (() => {
        const ending = (data.extendedData as Record<string, unknown>)?.ending as
          | { imageUrl?: string; message?: string }
          | undefined;
        return ending?.imageUrl || ending?.message;
      })() && (
        <>
          <DividerRenderer config={theme.sectionDivider} />
          <EndingSection data={data} theme={theme} />
        </>
      )}

      <FooterSection data={data} config={theme.footer} isPreview={isPreview} />
    </div>
  );
}
