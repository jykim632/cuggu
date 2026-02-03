"use client";

import { motion } from "framer-motion";

export function StepGuide() {
  return (
    <section className="py-32 bg-gradient-to-br from-[#E6E6FA] to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* 헤딩 */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              간단한 <span className="text-[#FF6B9D]">3단계</span> 프로세스
            </h2>
            <p className="text-xl text-gray-600">
              누구나 쉽게 따라할 수 있습니다
            </p>
          </motion.div>

          {/* 단계 */}
          <div className="space-y-24">
            {[
              {
                step: "01",
                title: "사진 업로드",
                description:
                  "증명사진 또는 일상 사진 1장을 업로드하세요. 얼굴이 정면으로 보이는 사진이면 충분합니다.",
                image:
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
                tips: ["정면 얼굴 사진 권장", "JPG, PNG 파일 지원", "최대 10MB"],
                color: "from-pink-400 to-pink-500",
              },
              {
                step: "02",
                title: "스타일 & 템플릿 선택",
                description:
                  "웨딩 사진 스타일(클래식/모던/빈티지)과 청첩장 템플릿을 선택하세요.",
                image:
                  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
                tips: ["5가지 템플릿", "3가지 AI 스타일", "언제든 변경 가능"],
                color: "from-purple-400 to-purple-500",
              },
              {
                step: "03",
                title: "AI 생성 & 공유",
                description:
                  "AI가 웨딩 화보 4장을 자동으로 생성합니다. 마음에 드는 사진을 선택하고, 카카오톡으로 바로 공유하세요.",
                image:
                  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80",
                tips: ["5분 안에 완성", "4장 중 선택", "카카오톡 공유"],
                color: "from-blue-400 to-blue-500",
              },
            ].map((step, index) => (
              <motion.div
                key={step.step}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* 이미지 */}
                <div
                  className={`relative ${index % 2 === 1 ? "lg:order-2" : ""}`}
                >
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
                  >
                    {step.step}
                  </div>
                </div>

                {/* 텍스트 */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    {step.description}
                  </p>

                  {/* 팁 */}
                  <div className="space-y-3">
                    {step.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <button className="bg-gradient-to-r from-[#FF6B9D] to-[#9370DB] text-white px-16 py-5 rounded-full text-lg font-semibold hover:shadow-2xl transition-shadow">
              무료로 시작하기
            </button>
            <p className="text-sm text-gray-500 mt-4">
              신용카드 등록 없이 바로 시작 가능
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
