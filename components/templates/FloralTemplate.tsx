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

interface FloralTemplateProps {
  data: Invitation;
  isPreview?: boolean;
}

export function FloralTemplate({ data, isPreview = false }: FloralTemplateProps) {
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
      <section key="greeting" className="py-14 md:py-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            {/* 꽃 장식 */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-200" />
              <span className="text-rose-300 text-lg">&#x2740;</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-200" />
            </div>

            <p className="font-serif text-sm md:text-base text-rose-800/70 leading-relaxed whitespace-pre-line">
              {data.content.greeting}
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-200" />
              <span className="text-rose-300 text-lg">&#x2740;</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-200" />
            </div>
          </motion.div>
        </div>
      </section>
    ),

    parents: () => {
      if (!data.settings.showParents) return null;
      return (
        <section key="parents" className="py-14 md:py-16 px-6">
          <div className="max-w-lg mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* 신랑 측 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center bg-white/50 rounded-2xl p-6 border border-rose-100"
              >
                <p className="text-xs text-rose-400 mb-3">
                  {formatFamilyName(data.groom) || "신랑"}
                </p>
                <h3 className="font-serif text-2xl text-rose-900 mb-3">
                  {data.groom.name}
                </h3>
                {data.groom.phone && (
                  <a
                    href={`tel:${data.groom.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {data.groom.phone}
                  </a>
                )}
              </motion.div>

              {/* 신부 측 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center bg-white/50 rounded-2xl p-6 border border-rose-100"
              >
                <p className="text-xs text-rose-400 mb-3">
                  {formatFamilyName(data.bride) || "신부"}
                </p>
                <h3 className="font-serif text-2xl text-rose-900 mb-3">
                  {data.bride.name}
                </h3>
                {data.bride.phone && (
                  <a
                    href={`tel:${data.bride.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors py-2 min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
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
      <section key="ceremony" className="py-14 md:py-20 px-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {/* 날짜/시간 */}
            <div className="flex items-start gap-4 p-5 bg-white/60 rounded-2xl border border-rose-100">
              <Calendar className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-serif text-sm text-rose-800 mb-1">예식 일시</h4>
                <p className="text-sm text-rose-600/70">{fullDateStr}</p>
              </div>
            </div>

            {/* 장소 */}
            <div className="flex items-start gap-4 p-5 bg-white/60 rounded-2xl border border-rose-100">
              <MapPin className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-sm text-rose-800 mb-1">예식 장소</h4>
                <p className="text-sm text-rose-800 font-medium">
                  {data.wedding.venue.name}
                  {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
                </p>
                <p className="text-xs text-rose-500/70 mt-1">
                  {data.wedding.venue.address}
                </p>
                {data.wedding.venue.tel && (
                  <a
                    href={`tel:${data.wedding.venue.tel}`}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 mt-2 py-2 min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {data.wedding.venue.tel}
                  </a>
                )}
              </div>
            </div>

            {/* 안내사항 */}
            {data.content.notice && (
              <div className="p-5 bg-pink-50/60 rounded-2xl border border-rose-100">
                <p className="text-xs text-rose-500/70 whitespace-pre-line leading-relaxed">
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
        <section key="gallery" className="py-14 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-xl text-center text-rose-800 mb-10">
                Gallery
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.gallery.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="aspect-square overflow-hidden rounded-2xl shadow-sm cursor-pointer border border-rose-100"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
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
        <section key="accounts" className="py-14 md:py-20 px-6">
          <div className="max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-xl text-center text-rose-800 mb-10">
                마음 전하실 곳
              </h2>

              <div className="space-y-6">
                {/* 신랑 측 */}
                {(data.groom.account ||
                  (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
                  (data.groom.parentAccounts?.mother?.length ?? 0) > 0) && (
                  <div>
                    <p className="text-sm text-rose-600 mb-3 font-semibold text-center">
                      신랑 측
                    </p>
                    <div className="space-y-3">
                      {data.groom.account && (
                        <div className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">신랑 본인</p>
                          <p className="text-sm text-rose-900 font-medium">{data.groom.name}</p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {data.groom.account.bank} {data.groom.account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
                            예금주: {data.groom.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.groom.parentAccounts?.father?.map((account, idx) => (
                        <div key={`groom-father-${idx}`} className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">
                            아버지{' '}
                            {data.groom.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-rose-900 font-medium">
                            {data.groom.fatherName || '아버지'}
                          </p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.groom.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`groom-mother-${idx}`} className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">
                            어머니{' '}
                            {data.groom.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-rose-900 font-medium">
                            {data.groom.motherName || '어머니'}
                          </p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
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
                    <p className="text-sm text-rose-600 mb-3 font-semibold text-center">
                      신부 측
                    </p>
                    <div className="space-y-3">
                      {data.bride.account && (
                        <div className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">신부 본인</p>
                          <p className="text-sm text-rose-900 font-medium">{data.bride.name}</p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {data.bride.account.bank} {data.bride.account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
                            예금주: {data.bride.account.accountHolder}
                          </p>
                        </div>
                      )}

                      {data.bride.parentAccounts?.father?.map((account, idx) => (
                        <div key={`bride-father-${idx}`} className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">
                            아버지{' '}
                            {data.bride.parentAccounts!.father.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-rose-900 font-medium">
                            {data.bride.fatherName || '아버지'}
                          </p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
                            예금주: {account.accountHolder}
                          </p>
                        </div>
                      ))}

                      {data.bride.parentAccounts?.mother?.map((account, idx) => (
                        <div key={`bride-mother-${idx}`} className="p-4 bg-white/60 rounded-2xl border border-rose-100 text-center">
                          <p className="text-[10px] text-rose-400 mb-1">
                            어머니{' '}
                            {data.bride.parentAccounts!.mother.length > 1 && `(계좌 ${idx + 1})`}
                          </p>
                          <p className="text-sm text-rose-900 font-medium">
                            {data.bride.motherName || '어머니'}
                          </p>
                          <p className="text-xs text-rose-500/70 mt-1">
                            {account.bank} {account.accountNumber}
                          </p>
                          <p className="text-[10px] text-rose-400 mt-0.5">
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
        <section key="rsvp" className="py-14 md:py-20 px-6 bg-rose-50/30">
          <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} />
        </section>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50/30 to-rose-50">
      {/* 커버 섹션 - 항상 첫 번째 */}
      <section className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden py-16 md:py-12">
        {data.gallery.coverImage && (
          <div className="absolute inset-0">
            <img
              src={data.gallery.coverImage}
              alt="Wedding Cover"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 via-transparent to-rose-50" />
          </div>
        )}

        {/* 상단 꽃 장식 */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-3xl opacity-60">
          &#x1F33A;
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative z-10 text-center px-6"
        >
          <p className="font-serif text-xs tracking-[0.3em] text-rose-400 mb-8">
            Wedding Invitation
          </p>

          <div className="inline-block bg-white/60 backdrop-blur-sm rounded-3xl px-10 py-8 shadow-sm border border-rose-100">
            <div className="space-y-3 mb-0">
              <p className="font-serif text-3xl md:text-4xl text-rose-900">
                {data.groom.name}
              </p>
              <p className="text-rose-300 text-lg">&</p>
              <p className="font-serif text-3xl md:text-4xl text-rose-900">
                {data.bride.name}
              </p>
            </div>
          </div>

          <div className="space-y-1 mt-8">
            <p className="text-sm text-rose-500">{dateStr}</p>
            <p className="text-sm text-rose-500">{timeStr}</p>
            <p className="text-sm text-rose-400 mt-3">
              {data.wedding.venue.name}
              {data.wedding.venue.hall && ` ${data.wedding.venue.hall}`}
            </p>
          </div>
        </motion.div>

        {/* 하단 꽃 장식 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-3xl opacity-60">
          &#x1F338;
        </div>
      </section>

      {/* 동적 섹션 */}
      {sectionOrder.map((id) => (
        <Fragment key={id}>{sections[id]()}</Fragment>
      ))}

      {/* Footer - 항상 마지막 */}
      <footer className="py-10 md:py-14 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8 bg-rose-200" />
          <span className="text-rose-300 text-sm">&#x2740;</span>
          <div className="h-px w-8 bg-rose-200" />
        </div>
        <p className="text-xs text-rose-400">
          {data.groom.name} & {data.bride.name}
        </p>
        {!isPreview && (
          <p className="mt-2">
            <a
              href="https://cuggu.io"
              className="text-xs text-rose-300 hover:text-rose-500 transition-colors"
            >
              Cuggu
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
