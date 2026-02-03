"use client";

import { motion } from "framer-motion";
import { FallingPetals } from "@/components/animations/FallingPetals";

export function HeroElegant() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 (플레이스홀더) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80)",
          filter: "brightness(0.7)",
        }}
      />

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-white/90" />

      {/* 꽃잎 애니메이션 */}
      <FallingPetals />

      {/* 콘텐츠 */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* 장식 요소 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <svg
            className="mx-auto h-16 w-16 text-[#D4AF37]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </motion.div>

        {/* 메인 타이틀 */}
        <motion.h1
          className="font-serif text-4xl md:text-6xl font-bold text-[#D4AF37] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          AI로 만드는
          <br />
          특별한 웨딩 청첩장
        </motion.h1>

        {/* 서브 카피 */}
        <motion.p
          className="text-lg md:text-xl text-gray-700 mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          증명사진만으로 웨딩 화보 4장을 무료로 생성하세요.
          <br />
          전통과 우아함이 담긴 완벽한 청첩장을 경험해보세요.
        </motion.p>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button className="bg-[#D4AF37] text-white px-12 py-4 rounded-full text-lg font-semibold hover:bg-[#C19A2E] transition-colors shadow-lg">
            무료로 시작하기
          </button>
        </motion.div>

        {/* 하단 장식 */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="flex justify-center gap-4">
            <div className="h-px w-16 bg-[#FFB3D4] mt-3" />
            <svg
              className="h-6 w-6 text-[#FFB3D4]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <div className="h-px w-16 bg-[#FFB3D4] mt-3" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
