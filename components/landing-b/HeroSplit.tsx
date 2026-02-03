"use client";

import { motion } from "framer-motion";

export function HeroSplit() {
  return (
    <section className="min-h-screen flex flex-col md:flex-row">
      {/* 좌측: 텍스트 */}
      <div className="flex-1 bg-black text-white flex items-center justify-center p-8 md:p-16">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block px-4 py-2 border border-[#D4AF37] text-[#D4AF37] text-sm mb-8 rounded">
              AI-POWERED WEDDING
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            The Future
            <br />
            of Wedding
            <br />
            <span className="text-[#D4AF37]">Invitations</span>
          </motion.h1>

          <motion.p
            className="text-xl text-gray-300 mb-12 leading-relaxed"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            증명사진 한 장으로 웨딩 화보 4장을 AI가 자동 생성합니다.
            <br />
            더 이상 비싼 웨딩 촬영이 필요 없습니다.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button className="bg-white text-black px-8 py-4 rounded font-semibold hover:bg-gray-100 transition-colors">
              무료로 시작하기
            </button>
            <button className="border border-white text-white px-8 py-4 rounded font-semibold hover:bg-white/10 transition-colors">
              템플릿 보기
            </button>
          </motion.div>

          <motion.div
            className="mt-16 flex gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div>
              <div className="text-4xl font-bold text-[#D4AF37] mb-2">4장</div>
              <div className="text-sm text-gray-400">AI 웨딩 사진</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#D4AF37] mb-2">5개</div>
              <div className="text-sm text-gray-400">프리미엄 템플릿</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#D4AF37] mb-2">무료</div>
              <div className="text-sm text-gray-400">시작 플랜</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 우측: 이미지/비디오 */}
      <motion.div
        className="flex-1 bg-gray-100 relative overflow-hidden min-h-[50vh] md:min-h-screen"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <img
          src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80"
          alt="Wedding couple"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* 플로팅 카드 */}
        <motion.div
          className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-black">
                AI가 자동으로 생성합니다
              </div>
              <div className="text-sm text-gray-600">
                평균 5분 안에 완성되는 웨딩 화보
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
