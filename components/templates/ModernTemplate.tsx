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

interface ModernTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function ModernTemplate({ data, isPreview = false }: ModernTemplateProps) {
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
      <section key="greeting" className="py-16 md:py-24 px-8 md:px-12">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6">
              Greeting
            </p>
            <p className="text-base md:text-lg text-zinc-600 leading-relaxed whitespace-pre-line">
              {data.content.greeting}
            </p>
          </motion.div>
        </div>
      </section>
    ),

    parents: () => {
      if (!data.settings.showParents) return null;
      return (
        <section key="parents" className="py-16 md:py-20 px-8 md:px-12">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">
              Bride & Groom
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              {/* 신랑 측 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs text-zinc-400 mb-2">
                  {formatFamilyName(data.groom) || "신랑"}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
                  {data.groom.name}
                </h3>
                {data.groom.phone && (
                  <a
                    href={`tel:${data.groom.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.groom.phone}
                  </a>
                )}
              </motion.div>

              {/* 신부 측 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs text-zinc-400 mb-2">
                  {formatFamilyName(data.bride) || "신부"}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
                  {data.bride.name}
                </h3>
                {data.bride.phone && (
                  <a
                    href={`tel:${data.bride.phone}`}
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-emerald-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
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
      <section key="ceremony" className="py-16 md:py-24 px-8 md:px-12">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-6">
              Ceremony
            </p>

            {/* 날짜/시간 */}
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Date & Time</p>
                <p className="text-base text-zinc-800">{fullDateStr}</p>
              </div>
            </div>

            {/* 장소 */}
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Location</p>
                <p className="text-base text-zinc-800 font-medium">
                  {data.wedding.venue.name}
                  {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {data.wedding.venue.address}
                </p>
                {data.wedding.venue.tel && (
                  <a
                    href={`tel:${data.wedding.venue.tel}`}
                    className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 mt-2 py-2 min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    {data.wedding.venue.tel}
                  </a>
                )}
              </div>
            </div>

            {/* 안내사항 */}
            {data.content.notice && (
              <div className="border-l-2 border-emerald-400 pl-4">
                <p className="text-sm text-zinc-500 whitespace-pre-line leading-relaxed">
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
        <section key="gallery" className="py-16 md:py-24 px-8 md:px-12 bg-zinc-100">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">
                Gallery
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="aspect-square overflow-hidden cursor-pointer"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
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
      return (
        <section key="accounts" className="py-16 md:py-24 px-8 md:px-12">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.3em] text-emerald-600 uppercase mb-10">
                Account
              </p>

              <div className="space-y-8">
                {/* 신랑 측 */}
                {(data.groom.account ||
                  (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
                  (data.groom.parentAccounts?.mother?.length ?? 0) > 0) && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 mb-4">
                      신랑 측
                    </p>
                    <div className="space-y-3">
                      {data.groom.account && (
                        <div className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">신랑 본인</p>
                          <p className="text-sm text-zinc-800 font-medium">{data.groom.name}</p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {data.groom.account.bank} {data.groom.account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            예금주: {data.groom.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.groom.parentAccounts?.father?.map((account, idx) => (
                        <div key={`groom-father-${idx}`} className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">
                            아버지{' '}
                            {data.groom.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-zinc-800 font-medium">
                            {data.groom.fatherName || '아버지'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.groom.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`groom-mother-${idx}`} className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">
                            어머니{' '}
                            {data.groom.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-zinc-800 font-medium">
                            {data.groom.motherName || '어머니'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 신부 측 */}
                {(data.bride.account ||
                  (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
                  (data.bride.parentAccounts?.mother?.length ?? 0) > 0) && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 mb-4">
                      신부 측
                    </p>
                    <div className="space-y-3">
                      {data.bride.account && (
                        <div className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">신부 본인</p>
                          <p className="text-sm text-zinc-800 font-medium">{data.bride.name}</p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {data.bride.account.bank} {data.bride.account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            예금주: {data.bride.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.bride.parentAccounts?.father?.map((account, idx) => (
                        <div key={`bride-father-${idx}`} className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">
                            아버지{' '}
                            {data.bride.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-zinc-800 font-medium">
                            {data.bride.fatherName || '아버지'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.bride.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`bride-mother-${idx}`} className="py-4 border-b border-zinc-200">
                          <p className="text-xs text-zinc-400 mb-1">
                            어머니{' '}
                            {data.bride.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-zinc-800 font-medium">
                            {data.bride.motherName || '어머니'}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
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
        <section key="rsvp" className="py-16 md:py-24 px-8 md:px-12">
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
          <div key={`div-${id}`} className="h-px bg-zinc-200 mx-8 md:mx-12" />
        );
      }
      result.push(<Fragment key={id}>{content}</Fragment>);
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* 커버 섹션 - 항상 첫 번째 */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-end overflow-hidden pb-16 md:pb-20">
        {data.gallery.coverImage && (
          <div className="absolute inset-0">
            <img
              src={data.gallery.coverImage}
              alt="Wedding Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/30 to-transparent" />
          </div>
        )}

        {!data.gallery.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 px-8 md:px-12 w-full"
        >
          <p className="text-xs tracking-[0.4em] text-emerald-400 uppercase mb-4">
            Wedding Invitation
          </p>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-2">
            {data.groom.name}
          </h1>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px w-12 bg-emerald-400" />
            <span className="text-emerald-400 text-lg">&</span>
            <div className="h-px w-12 bg-emerald-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
            {data.bride.name}
          </h1>

          <div className="text-sm text-zinc-300 space-y-1">
            <p>{dateStr}</p>
            <p>{timeStr}</p>
            <p className="text-zinc-400">
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
          </div>
        </motion.div>
      </section>

      {/* 커버 직후 gradient 디바이더 */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* 동적 섹션 */}
      {renderSections()}

      {/* Footer - 항상 마지막 */}
      <footer className="py-10 md:py-14 px-8 md:px-12 border-t border-zinc-200">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <p>{data.groom.name} & {data.bride.name}</p>
          {!isPreview && (
            <a
              href="https://cuggu.io"
              className="hover:text-emerald-600 transition-colors"
            >
              Cuggu
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
