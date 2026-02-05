"use client";

import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Phone } from "lucide-react";
import {
  Invitation,
  sanitizeSectionOrder,
  type SectionId,
} from "@/schemas/invitation";
import {
  formatWeddingDate,
  formatWeddingTime,
  formatWeddingDateTime,
} from "@/lib/utils/date";
import { GalleryLightbox } from "./GalleryLightbox";
import { formatFamilyName } from "@/lib/utils/family-display";
import { RSVPSection } from "@/components/rsvp/RSVPSection";

interface MinimalTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function MinimalTemplate({ data, isPreview = false }: MinimalTemplateProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const weddingDate = new Date(data.wedding.date);

  const dateStr = formatWeddingDate(weddingDate);
  const timeStr = formatWeddingTime(weddingDate);
  const fullDateStr = formatWeddingDateTime(weddingDate);

  // 섹션 순서
  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  // 계좌 데이터 존재 여부
  const hasAccounts =
    data.groom.account ||
    (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.groom.parentAccounts?.mother?.length ?? 0) > 0 ||
    data.bride.account ||
    (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.bride.parentAccounts?.mother?.length ?? 0) > 0;

  // 섹션 렌더러
  const sections: Record<SectionId, () => React.ReactNode> = {
    greeting: () => (
      <section key="greeting" className="py-16 md:py-24 px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-sm md:text-base text-stone-500 leading-loose whitespace-pre-line tracking-wide font-light">
              {data.content.greeting}
            </p>
          </motion.div>
        </div>
      </section>
    ),

    parents: () => {
      if (!data.settings.showParents) return null;
      return (
        <section key="parents" className="py-16 md:py-20 px-6">
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-12">
              {/* 신랑 측 */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4">
                  Groom
                </p>
                <p className="text-xs text-stone-400 mb-2">
                  {formatFamilyName(data.groom) || "신랑"}
                </p>
                <h3 className="text-xl font-light tracking-[0.1em] text-stone-900 mb-3">
                  {data.groom.name}
                </h3>
                {data.groom.phone && (
                  <a
                    href={`tel:${data.groom.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-3 h-3" />
                    {data.groom.phone}
                  </a>
                )}
              </motion.div>

              {/* 신부 측 */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center"
              >
                <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4">
                  Bride
                </p>
                <p className="text-xs text-stone-400 mb-2">
                  {formatFamilyName(data.bride) || "신부"}
                </p>
                <h3 className="text-xl font-light tracking-[0.1em] text-stone-900 mb-3">
                  {data.bride.name}
                </h3>
                {data.bride.phone && (
                  <a
                    href={`tel:${data.bride.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-3 h-3" />
                    {data.bride.phone}
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      );
    },

    ceremony: () => (
      <section key="ceremony" className="py-16 md:py-24 px-6">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-10"
          >
            {/* 날짜/시간 */}
            <div>
              <Calendar className="w-4 h-4 text-stone-300 mx-auto mb-4" />
              <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">
                Date & Time
              </p>
              <p className="text-sm text-stone-700 tracking-wide">{fullDateStr}</p>
            </div>

            {/* 장소 */}
            <div>
              <MapPin className="w-4 h-4 text-stone-300 mx-auto mb-4" />
              <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-3">
                Location
              </p>
              <p className="text-sm text-stone-800 font-medium tracking-wide">
                {data.wedding.venue.name}
                {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
              </p>
              <p className="text-xs text-stone-400 mt-2 tracking-wide">
                {data.wedding.venue.address}
              </p>
              {data.wedding.venue.tel && (
                <a
                  href={`tel:${data.wedding.venue.tel}`}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 mt-3 py-2 min-h-[44px]"
                >
                  <Phone className="w-3 h-3" />
                  {data.wedding.venue.tel}
                </a>
              )}
            </div>

            {/* 안내사항 */}
            {data.content.notice && (
              <div className="pt-6">
                <div className="h-px w-8 bg-stone-200 mx-auto mb-6" />
                <p className="text-xs text-stone-400 whitespace-pre-line leading-relaxed tracking-wide">
                  {data.content.notice}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    ),

    gallery: () => {
      if (data.gallery.images.length === 0) return null;
      return (
        <section key="gallery" className="py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase text-center mb-12">
                Gallery
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {data.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="aspect-square overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:opacity-80 transition-opacity duration-300"
                    />
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {lightboxIndex !== null && (
                  <GalleryLightbox
                    images={data.gallery.images}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      );
    },

    accounts: () => {
      if (!data.settings.showAccounts || !hasAccounts) return null;

      const hasGroomAccounts = data.groom.account ||
        (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
        (data.groom.parentAccounts?.mother?.length ?? 0) > 0;

      const hasBrideAccounts = data.bride.account ||
        (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
        (data.bride.parentAccounts?.mother?.length ?? 0) > 0;

      return (
        <section key="accounts" className="py-16 md:py-24 px-6">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-12">
                Account
              </p>

              <div className="space-y-10">
                {/* 신랑 측 */}
                {hasGroomAccounts && (
                  <div>
                    <p className="text-xs font-medium text-stone-700 mb-4 tracking-wide">
                      신랑 측
                    </p>
                    <div className="space-y-4">
                      {data.groom.account && (
                        <div className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">신랑 본인</p>
                          <p className="text-xs text-stone-700">{data.groom.name}</p>
                          <p className="text-xs text-stone-400 mt-1">
                            {data.groom.account.bank} {data.groom.account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {data.groom.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.groom.parentAccounts?.father?.map((account, idx) => (
                        <div key={`groom-father-${idx}`} className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">
                            아버지{' '}
                            {data.groom.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-xs text-stone-700">
                            {data.groom.fatherName || '아버지'}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.groom.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`groom-mother-${idx}`} className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">
                            어머니{' '}
                            {data.groom.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-xs text-stone-700">
                            {data.groom.motherName || '어머니'}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 구분선 */}
                {hasGroomAccounts && hasBrideAccounts && (
                  <div className="h-px w-8 bg-stone-200 mx-auto" />
                )}

                {/* 신부 측 */}
                {hasBrideAccounts && (
                  <div>
                    <p className="text-xs font-medium text-stone-700 mb-4 tracking-wide">
                      신부 측
                    </p>
                    <div className="space-y-4">
                      {data.bride.account && (
                        <div className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">신부 본인</p>
                          <p className="text-xs text-stone-700">{data.bride.name}</p>
                          <p className="text-xs text-stone-400 mt-1">
                            {data.bride.account.bank} {data.bride.account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {data.bride.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.bride.parentAccounts?.father?.map((account, idx) => (
                        <div key={`bride-father-${idx}`} className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">
                            아버지{' '}
                            {data.bride.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-xs text-stone-700">
                            {data.bride.fatherName || '아버지'}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.bride.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`bride-mother-${idx}`} className="py-3">
                          <p className="text-[10px] text-stone-400 mb-1">
                            어머니{' '}
                            {data.bride.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-xs text-stone-700">
                            {data.bride.motherName || '어머니'}
                          </p>
                          <p className="text-xs text-stone-400 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-stone-300 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      );
    },

    rsvp: () => {
      if (!data.settings.enableRsvp) return null;
      return (
        <section key="rsvp" className="py-12 md:py-16 px-6">
          <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} />
        </section>
      );
    },
  };

  // 동적 섹션 렌더링 (섹션 간 디바이더 포함)
  const renderSections = () => {
    const result: React.ReactNode[] = [];
    sectionOrder.forEach((id) => {
      const content = sections[id]();
      if (!content) return;
      if (result.length > 0) {
        result.push(
          <div key={`div-${id}`} className="flex justify-center py-4">
            <div className="h-12 w-px bg-stone-200" />
          </div>
        );
      }
      result.push(<Fragment key={id}>{content}</Fragment>);
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 커버 섹션 - 항상 첫 번째 */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-12">
        {data.gallery.coverImage && (
          <div className="absolute inset-0">
            <img
              src={data.gallery.coverImage}
              alt="Wedding Cover"
              className="w-full h-full object-cover opacity-20 grayscale"
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-[10px] tracking-[0.5em] text-stone-400 uppercase mb-16">
            Wedding Invitation
          </p>

          <div className="space-y-6 mb-16">
            <p className="text-3xl md:text-4xl font-light tracking-[0.15em] text-stone-900">
              {data.groom.name}
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="h-px w-16 bg-stone-300" />
              <div className="h-px w-16 bg-stone-300" />
            </div>
            <p className="text-3xl md:text-4xl font-light tracking-[0.15em] text-stone-900">
              {data.bride.name}
            </p>
          </div>

          <div className="space-y-2 text-stone-400">
            <p className="text-xs tracking-[0.2em]">{dateStr}</p>
            <p className="text-xs tracking-[0.2em]">{timeStr}</p>
            <p className="text-xs tracking-[0.2em] mt-4">
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
          </div>
        </motion.div>
      </section>

      {/* 커버 직후 디바이더 */}
      <div className="flex justify-center py-4">
        <div className="h-12 w-px bg-stone-200" />
      </div>

      {/* 동적 섹션 */}
      {renderSections()}

      {/* Footer - 항상 마지막 */}
      <footer className="py-12 md:py-16 px-6 text-center">
        <div className="h-px w-8 bg-stone-200 mx-auto mb-8" />
        <p className="text-[10px] tracking-[0.3em] text-stone-300">
          {data.groom.name} & {data.bride.name}
        </p>
        {!isPreview && (
          <p className="mt-3">
            <a
              href="https://cuggu.io"
              className="text-[10px] tracking-[0.2em] text-stone-300 hover:text-stone-500 transition-colors"
            >
              Cuggu
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
