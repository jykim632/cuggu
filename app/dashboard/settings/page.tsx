"use client";

import { useState, useEffect } from "react";
import { CreditCard, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  premiumPlan: string;
  aiCredits: number;
  emailNotifications: boolean;
  createdAt: string;
  isPremium: boolean;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  method: string;
  orderId: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, paymentsRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/payments/history"),
      ]);

      const profileResult = await profileRes.json();
      const paymentsResult = await paymentsRes.json();

      if (profileResult.success) {
        setUser(profileResult.data);
      }

      if (paymentsResult.success) {
        setPaymentHistory(paymentsResult.data);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!user) return;

    setIsSaving(true);
    const newValue = !user.emailNotifications;

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: newValue }),
      });

      const result = await response.json();

      if (result.success) {
        setUser({ ...user, emailNotifications: newValue });
      } else {
        alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("설정 업데이트 실패:", error);
      alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-stone-500">사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-stone-900">설정</h1>
        <p className="text-sm text-stone-500 mt-1">
          계정 정보와 플랜을 관리하세요
        </p>
      </div>

      {/* 계정 정보 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">계정 정보</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-700">이메일</p>
              <p className="text-sm text-stone-500 mt-1">{user.email}</p>
            </div>
          </div>

          {user.name && (
            <div className="flex items-center justify-between py-3 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-700">이름</p>
                <p className="text-sm text-stone-500 mt-1">{user.name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-700">가입일</p>
              <p className="text-sm text-stone-500 mt-1">
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
              <p className="text-sm font-medium text-stone-700">플랜</p>
              <p className="text-sm text-stone-500 mt-1">
                {user.isPremium ? (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                    <Sparkles className="w-4 h-4" />
                    프리미엄
                  </span>
                ) : (
                  "무료"
                )}
              </p>
            </div>
            {!user.isPremium && (
              <button className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
                프리미엄 업그레이드
              </button>
            )}
          </div>
        </div>
      </section>

      {/* AI 크레딧 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">AI 크레딧</h2>

        <div className="rounded-lg border border-stone-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-stone-700">남은 크레딧</p>
            <p className="text-2xl font-semibold text-stone-900">
              {user.aiCredits}회
            </p>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${Math.min((user.aiCredits / 10) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full px-5 py-3 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors">
            크레딧 구매하기
          </button>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-stone-200 p-3 text-center">
              <p className="text-stone-500">1회</p>
              <p className="text-lg font-semibold text-stone-900 mt-1">1,000원</p>
            </div>
            <div className="rounded-lg border-2 border-rose-200 p-3 text-center">
              <p className="text-stone-500">10회 패키지</p>
              <p className="text-lg font-semibold text-rose-600 mt-1">
                8,000원
                <span className="text-xs text-rose-500 ml-1">20% 할인</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 알림 설정 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">알림 설정</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-stone-100">
            <div>
              <p className="text-sm font-medium text-stone-900">이메일 알림</p>
              <p className="text-sm text-stone-500 mt-1">
                RSVP 응답 시 이메일로 알림을 받습니다
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              disabled={isSaving}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${user.emailNotifications ? "bg-rose-600" : "bg-stone-300"}
                ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                animate={{ x: user.emailNotifications ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 opacity-50 cursor-not-allowed">
            <div>
              <p className="text-sm font-medium text-stone-900">카카오톡 알림</p>
              <p className="text-sm text-stone-500 mt-1">
                곧 제공 예정입니다
              </p>
            </div>
            <div className="w-12 h-6 rounded-full bg-stone-200" />
          </div>
        </div>
      </section>

      {/* 결제 내역 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">결제 내역</h2>

        {paymentHistory.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">결제 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900">
                      {payment.description}
                    </p>
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full
                        ${
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {payment.status === "COMPLETED"
                        ? "완료"
                        : payment.status === "PENDING"
                        ? "대기중"
                        : "실패"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {new Date(payment.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-900">
                    {payment.amount.toLocaleString()}원
                  </p>
                  <button className="text-xs text-rose-600 hover:text-rose-700 mt-1">
                    영수증
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 계정 관리 */}
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">계정 관리</h2>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-stone-900">비밀번호 변경</p>
              <p className="text-xs text-stone-500 mt-1">
                보안을 위해 주기적으로 변경해주세요
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-red-600">계정 삭제</p>
              <p className="text-xs text-red-500 mt-1">
                모든 데이터가 영구적으로 삭제됩니다
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </section>
    </div>
  );
}
