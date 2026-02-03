"use client";

import { motion } from "framer-motion";

export function VideoSection() {
  return (
    <section className="py-32 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 좌측: 비디오/이미지 */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-800">
              <img
                src="https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800&q=80"
                alt="AI Wedding Photo Generation"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 플로팅 스탯 카드 */}
            <motion.div
              className="absolute -bottom-8 -right-8 bg-white text-black p-6 rounded-lg shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-[#D4AF37] mb-1">98%</div>
              <div className="text-sm text-gray-600">만족도</div>
            </motion.div>
          </motion.div>

          {/* 우측: 텍스트 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-block px-4 py-2 border border-[#D4AF37] text-[#D4AF37] text-sm mb-6 rounded">
              HOW IT WORKS
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              증명사진 한 장이면
              <br />
              <span className="text-[#D4AF37]">충분합니다</span>
            </h2>

            <div className="space-y-6 mb-12">
              {[
                {
                  step: "01",
                  title: "사진 업로드",
                  description: "증명사진 또는 일상 사진 1장을 업로드하세요",
                },
                {
                  step: "02",
                  title: "스타일 선택",
                  description: "클래식, 모던, 빈티지 중 원하는 스타일을 고르세요",
                },
                {
                  step: "03",
                  title: "AI 생성",
                  description: "5분 안에 4장의 웨딩 화보가 자동으로 완성됩니다",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="flex gap-6 items-start"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#D4AF37] text-black font-bold rounded flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="bg-white text-black px-10 py-4 rounded font-semibold hover:bg-gray-100 transition-colors">
              지금 시도해보기
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
