"use client";

import type { AdminPaymentItem } from "@/schemas/admin";

interface PaymentTableProps {
  payments: AdminPaymentItem[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "대기",
    className: "bg-yellow-100 text-yellow-700",
  },
  COMPLETED: {
    label: "완료",
    className: "bg-green-100 text-green-700",
  },
  FAILED: {
    label: "실패",
    className: "bg-red-100 text-red-700",
  },
  REFUNDED: {
    label: "환불",
    className: "bg-stone-100 text-stone-600",
  },
};

const typeLabels: Record<string, string> = {
  PREMIUM_UPGRADE: "프리미엄 업그레이드",
  AI_CREDITS: "AI 크레딧",
  AI_CREDITS_BUNDLE: "AI 크레딧 번들",
};

const methodLabels: Record<string, string> = {
  TOSS: "토스",
  KAKAO_PAY: "카카오페이",
  CARD: "카드",
  NAVER_PAY: "네이버페이",
};

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
            <th className="pb-3 font-medium">유저</th>
            <th className="pb-3 font-medium">타입</th>
            <th className="pb-3 font-medium">결제수단</th>
            <th className="pb-3 font-medium text-right">금액</th>
            <th className="pb-3 font-medium text-right">크레딧</th>
            <th className="pb-3 font-medium">상태</th>
            <th className="pb-3 font-medium">일시</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {payments.map((payment) => {
            const status = statusLabels[payment.status] || {
              label: payment.status,
              className: "bg-stone-100 text-stone-600",
            };

            return (
              <tr key={payment.id} className="border-b border-stone-100">
                <td className="py-3">
                  <div>
                    <div className="font-medium text-stone-900">
                      {payment.user.name || "(이름 없음)"}
                    </div>
                    <div className="text-stone-500 text-xs">
                      {payment.user.email}
                    </div>
                  </div>
                </td>
                <td className="py-3 text-stone-700">
                  {typeLabels[payment.type] || payment.type}
                </td>
                <td className="py-3 text-stone-600">
                  {methodLabels[payment.method] || payment.method}
                </td>
                <td className="py-3 text-right tabular-nums font-medium">
                  {payment.amount.toLocaleString()}원
                </td>
                <td className="py-3 text-right tabular-nums text-stone-600">
                  {payment.creditsGranted ? `+${payment.creditsGranted}` : "-"}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="py-3 text-stone-500">
                  {new Date(payment.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
