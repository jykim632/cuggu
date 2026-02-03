"use client";

import { motion } from "framer-motion";

const templates = [
  {
    id: 1,
    name: "Classic Black",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
  },
  {
    id: 2,
    name: "Modern White",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  },
  {
    id: 3,
    name: "Gold Luxury",
    image: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?w=600&q=80",
  },
  {
    id: 4,
    name: "Minimal Chic",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
  },
  {
    id: 5,
    name: "Elegant Gray",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80",
  },
  {
    id: 6,
    name: "Premium Dark",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  },
];

export function TemplateGrid() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-4">
        {/* 헤딩 */}
        <div className="max-w-3xl mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              모든 스타일을
              <br />
              <span className="text-[#D4AF37]">완벽하게</span>
            </h2>
            <p className="text-xl text-gray-600">
              미니멀부터 럭셔리까지, 당신의 스타일에 맞는 템플릿을 찾아보세요.
            </p>
          </motion.div>
        </div>

        {/* 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              className="group relative overflow-hidden rounded-lg aspect-[3/4] bg-gray-100 cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* 이미지 */}
              <img
                src={template.image}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300" />

              {/* 텍스트 */}
              <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div>
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-sm">자세히 보기</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 상단 배지 */}
              {index < 3 && (
                <div className="absolute top-4 right-4 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full">
                  인기
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button className="bg-black text-white px-12 py-4 rounded font-semibold hover:bg-gray-900 transition-colors">
            모든 템플릿 보기
          </button>
        </motion.div>
      </div>
    </section>
  );
}
