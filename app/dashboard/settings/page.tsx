"use client";

import { useState } from "react";
import { User, CreditCard, Bell, Shield, ChevronRight, Sparkles } from "lucide-react";
import { ScrollFade } from "@/components/animations/ScrollFade";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);

  // TODO: 실제 데이터는 DB/API에서 가져오기
  const user = {
    email: "user@example.com",
    createdAt: "2026-01-15",
    isPremium: false,
    aiCredits: 2,
  };

  const paymentHistory = [
    // { id: "1", date: "2026-02-01", amount: 9900, description: "프리미엄 플랜" },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <ScrollFade>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-sm text-gray-600 mt-2">
            계정 정보와 플랜을 관리하세요
          </p>
        </div>
      </ScrollFade>

      {/* 계정 정보 */}
      <ScrollFade delay={0.1}>
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">계정 정보</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">이메일</p>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">가입일</p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">플랜</p>
                <p className="text-sm text-gray-600 mt-1">
                  {user.isPremium ? (
                    <span className="inline-flex items-center gap-1 text-purple-600 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      프리미엄
                    </span>
                  ) : (
                    "무료"
                  )}
                </p>
              </div>
              {!user.isPremium && (
                <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg transition-all">
                  프리미엄 업그레이드
                </button>
              )}
            </div>
          </div>
        </section>
      </ScrollFade>

      {/* AI 크레딧 */}
      <ScrollFade delay={0.2}>
        <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl border border-pink-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AI 크레딧</h2>
          </div>

          <div className="bg-white/60 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">남은 크레딧</p>
              <p className="text-2xl font-bold text-pink-600">
                {user.aiCredits}회
              </p>
            </div>
            <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${(user.aiCredits / 10) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg">
              크레딧 구매하기
            </button>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <p className="text-gray-600">1회</p>
                <p className="text-lg font-bold text-gray-900 mt-1">1,000원</p>
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-center border-2 border-pink-300">
                <p className="text-gray-600">10회 패키지</p>
                <p className="text-lg font-bold text-pink-600 mt-1">
                  8,000원
                  <span className="text-xs text-pink-500 ml-1">20% 할인</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScrollFade>

      {/* 알림 설정 */}
      <ScrollFade delay={0.3}>
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">알림 설정</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">이메일 알림</p>
                <p className="text-sm text-gray-600 mt-1">
                  RSVP 응답 시 이메일로 알림을 받습니다
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-200
                  ${emailNotifications ? "bg-pink-600" : "bg-gray-300"}
                `}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{ x: emailNotifications ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 opacity-50 cursor-not-allowed">
              <div>
                <p className="text-sm font-semibold text-gray-900">카카오톡 알림</p>
                <p className="text-sm text-gray-600 mt-1">
                  곧 제공 예정입니다
                </p>
              </div>
              <div className="w-12 h-6 rounded-full bg-gray-200" />
            </div>
          </div>
        </section>
      </ScrollFade>

      {/* 결제 내역 */}
      <ScrollFade delay={0.4}>
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">결제 내역</h2>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">결제 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {payment.description}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(payment.date).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </p>
                    <button className="text-xs text-pink-600 hover:text-pink-700 mt-1">
                      영수증
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollFade>

      {/* 계정 관리 */}
      <ScrollFade delay={0.5}>
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">계정 관리</h2>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left">
              <div>
                <p className="text-sm font-semibold text-gray-900">비밀번호 변경</p>
                <p className="text-xs text-gray-600 mt-1">
                  보안을 위해 주기적으로 변경해주세요
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left">
              <div>
                <p className="text-sm font-semibold text-red-600">계정 삭제</p>
                <p className="text-xs text-red-500 mt-1">
                  모든 데이터가 영구적으로 삭제됩니다
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </section>
      </ScrollFade>
    </div>
  );
}
