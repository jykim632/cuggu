"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const templates = [
  {
    id: 1,
    name: "클래식",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80",
  },
  {
    id: 2,
    name: "모던",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  },
  {
    id: 3,
    name: "빈티지",
    image: "https://images.unsplash.com/photo-1484863137850-59afcfe05386?w=600&q=80",
  },
  {
    id: 4,
    name: "플로럴",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
  },
  {
    id: 5,
    name: "미니멀",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80",
  },
];

export function TemplateCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  return (
    <section className="py-20 bg-[#FFF8E7]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#D4AF37] mb-4">
            우아한 템플릿 컬렉션
          </h2>
          <p className="text-gray-600 text-lg">
            5가지 스타일로 당신만의 청첩장을 완성하세요
          </p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* 캐러셀 */}
          <div className="relative h-[500px] md:h-[600px] overflow-hidden rounded-lg shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={templates[currentIndex].image}
                  alt={templates[currentIndex].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <h3 className="font-serif text-3xl font-bold text-white mb-2">
                    {templates[currentIndex].name}
                  </h3>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 네비게이션 버튼 */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-colors"
            aria-label="이전 템플릿"
          >
            <svg
              className="w-6 h-6 text-[#D4AF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-colors"
            aria-label="다음 템플릿"
          >
            <svg
              className="w-6 h-6 text-[#D4AF37]"
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
          </button>

          {/* 인디케이터 */}
          <div className="flex justify-center gap-2 mt-6">
            {templates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-[#D4AF37]"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`템플릿 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
