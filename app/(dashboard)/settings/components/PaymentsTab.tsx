"use client";

import { useState, useEffect } from "react";
import { CreditCard, Loader2 } from "lucide-react";

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  method: string;
  channel: string;
  orderId: string | null;
}

export function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/payments/history");
        const result = await res.json();
        if (result.success) {
          setPayments(result.data);
        }
      } catch (error) {
        console.error("결제 내역 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPayments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg border border-stone-200 p-6">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-6">결제 내역</h2>

        {payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500">결제 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900">
                      {payment.description}
                    </p>
                    {payment.channel === 'SMARTSTORE' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        스마트스토어
                      </span>
                    )}
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
    </div>
  );
}
