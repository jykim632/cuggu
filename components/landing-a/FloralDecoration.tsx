"use client";

import { motion } from "framer-motion";

export function FloralDecoration() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-10">
        <svg viewBox="0 0 200 200" fill="currentColor" className="text-[#FFB3D4]">
          <circle cx="100" cy="100" r="80" />
          <circle cx="60" cy="60" r="40" />
          <circle cx="140" cy="60" r="40" />
          <circle cx="60" cy="140" r="40" />
          <circle cx="140" cy="140" r="40" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
        <svg viewBox="0 0 200 200" fill="currentColor" className="text-[#D4AF37]">
          <circle cx="100" cy="100" r="80" />
          <circle cx="60" cy="60" r="40" />
          <circle cx="140" cy="60" r="40" />
          <circle cx="60" cy="140" r="40" />
          <circle cx="140" cy="140" r="40" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* 헤딩 */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
              완벽한 하루를 위한 준비
            </h2>
            <p className="text-gray-600 text-lg">
              Cuggu와 함께라면 모든 것이 완벽해집니다
            </p>
          </motion.div>

          {/* 기능 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "✨",
                title: "AI 웨딩 사진",
                description: "증명사진만으로 4장의 웨딩 화보를 생성해드립니다",
              },
              {
                icon: "💌",
                title: "우아한 디자인",
                description: "전통과 현대가 조화를 이룬 5가지 템플릿",
              },
              {
                icon: "📱",
                title: "간편한 공유",
                description: "카카오톡 한 번으로 하객들에게 전달하세요",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="text-center p-8 rounded-lg bg-[#FFF8E7] hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-serif text-xl font-bold text-[#D4AF37] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button className="bg-[#FFB3D4] text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-[#FF9EC9] transition-colors shadow-lg">
              지금 시작하기
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
