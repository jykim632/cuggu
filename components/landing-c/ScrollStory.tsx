"use client";

import { motion } from "framer-motion";
import { ScrollFade } from "@/components/animations/ScrollFade";

export function ScrollStory() {
  return (
    <div className="bg-white">
      {/* 섹션 1: 문제 제기 */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFE4E1] to-[#FFF8E7] px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollFade direction="up">
            <div className="inline-block px-6 py-3 bg-white/80 rounded-full text-sm text-gray-600 mb-8 shadow-sm">
              결혼 준비의 고민
            </div>
          </ScrollFade>

          <ScrollFade direction="up" delay={0.2}>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              웨딩 화보 촬영,
              <br />
              <span className="text-[#FF6B9D]">꼭 해야 할까요?</span>
            </h1>
          </ScrollFade>

          <ScrollFade direction="up" delay={0.4}>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              평균 50만원 ~ 200만원의 촬영 비용
              <br />
              스케줄 맞추기도 어렵고, 시간도 오래 걸리고...
            </p>
          </ScrollFade>

          <ScrollFade direction="up" delay={0.6}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { icon: "💸", text: "비싼 비용" },
                { icon: "⏰", text: "시간 부족" },
                { icon: "😰", text: "촬영 부담" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-md text-center"
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="text-gray-700 font-medium">{item.text}</div>
                </div>
              ))}
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* 섹션 2: 해결책 */}
      <section className="min-h-screen flex items-center justify-center bg-white px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <ScrollFade direction="up">
            <div className="text-center mb-16">
              <div className="inline-block px-6 py-3 bg-[#E6E6FA] rounded-full text-sm text-gray-700 mb-8">
                Cuggu의 해결책
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                AI가 <span className="text-[#9370DB]">해결합니다</span>
              </h2>
              <p className="text-xl text-gray-600">
                증명사진 한 장이면 충분합니다
              </p>
            </div>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <ScrollFade direction="left" delay={0.2}>
              <div className="space-y-6">
                {[
                  {
                    title: "무료로 시작",
                    description: "AI 사진 생성 2회 무료 제공",
                    color: "bg-green-100 text-green-600",
                  },
                  {
                    title: "5분 안에 완성",
                    description: "긴 촬영 시간 필요 없음",
                    color: "bg-blue-100 text-blue-600",
                  },
                  {
                    title: "4장의 웨딩 화보",
                    description: "다양한 스타일로 자동 생성",
                    color: "bg-purple-100 text-purple-600",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div
                      className={`flex-shrink-0 w-12 h-12 ${item.color} rounded-lg flex items-center justify-center font-bold text-xl`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollFade>

            <ScrollFade direction="right" delay={0.4}>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80"
                  alt="AI Generated Wedding Photo"
                  className="rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                  <div className="text-sm text-gray-600 mb-1">AI 생성 완료</div>
                  <div className="text-2xl font-bold text-[#9370DB]">
                    5분 12초
                  </div>
                </div>
              </div>
            </ScrollFade>
          </div>
        </div>
      </section>

      {/* 섹션 3: 프로세스 */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6E6FA] to-[#FFE4E1] px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <ScrollFade direction="up">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                <span className="text-[#FF6B9D]">3단계</span>로 완성
              </h2>
              <p className="text-xl text-gray-600">
                복잡한 과정 없이, 누구나 쉽게 만들 수 있습니다
              </p>
            </div>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "사진 업로드",
                description: "증명사진 또는 일상 사진 1장만 준비하세요",
                icon: "📸",
                color: "from-pink-400 to-pink-500",
              },
              {
                step: "2",
                title: "템플릿 선택",
                description: "5가지 스타일 중 마음에 드는 것을 고르세요",
                icon: "🎨",
                color: "from-purple-400 to-purple-500",
              },
              {
                step: "3",
                title: "AI 생성 & 공유",
                description: "AI가 웨딩 화보를 생성하고, 바로 공유하세요",
                icon: "✨",
                color: "from-blue-400 to-blue-500",
              },
            ].map((item, index) => (
              <ScrollFade key={index} direction="up" delay={index * 0.2}>
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6`}
                  >
                    {item.step}
                  </div>
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollFade>
            ))}
          </div>

          <ScrollFade direction="up" delay={0.6}>
            <div className="text-center mt-16">
              <button className="bg-gradient-to-r from-[#FF6B9D] to-[#9370DB] text-white px-12 py-5 rounded-full text-lg font-semibold hover:shadow-xl transition-shadow">
                지금 무료로 시작하기
              </button>
            </div>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
