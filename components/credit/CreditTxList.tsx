"use client";

import { useState } from "react";
import { Receipt, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { CreditTxBadge } from "./CreditTxBadge";
import { CreditTxAmount } from "./CreditTxAmount";
import type { CreditTransaction, CreditTxType } from "@/types/ai";

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const ACCENT_COLOR: Record<CreditTxType, string> = {
  DEDUCT: "bg-red-400",
  REFUND: "bg-blue-400",
  PURCHASE: "bg-green-400",
  BONUS: "bg-purple-400",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-0.5 rounded hover:bg-stone-200 transition-colors"
      title="ID 복사"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 text-stone-400" />
      )}
    </button>
  );
}

export function CreditTxList({
  transactions,
  pagination,
  onPageChange,
}: {
  transactions: CreditTransaction[];
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
}) {
  if (transactions.length === 0 && (!pagination || pagination.total === 0)) {
    return (
      <div className="text-center py-8">
        <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="text-sm text-stone-500">크레딧 이력이 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-stretch rounded-lg border border-stone-100 bg-white overflow-hidden"
          >
            {/* 악센트 바 */}
            <div className={`w-1 shrink-0 ${ACCENT_COLOR[tx.type] ?? "bg-stone-300"}`} />

            {/* 메인 콘텐츠 */}
            <div className="flex-1 px-4 py-3.5 flex items-center justify-between gap-4 min-w-0">
              <div className="min-w-0 space-y-1.5">
                {/* 1행: 날짜 */}
                <p className="text-xs text-stone-400">
                  {new Date(tx.createdAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* 2행: 뱃지 + 설명 */}
                <div className="flex items-center gap-2">
                  <CreditTxBadge type={tx.type} />
                  <span className="text-sm text-stone-800 truncate">
                    {tx.description || "-"}
                  </span>
                </div>

                {/* 3행: 참조 정보 */}
                {(tx.referenceType || tx.referenceId) && (
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    {tx.referenceType && <span>{tx.referenceType}</span>}
                    {tx.referenceId && (
                      <span className="inline-flex items-center gap-1 font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                        {tx.referenceId.slice(0, 8)}
                        <CopyButton text={tx.referenceId} />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 우측: 수량 + 잔액 */}
              <div className="text-right shrink-0">
                <div className="text-base">
                  <CreditTxAmount type={tx.type} amount={tx.amount} />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  잔액 {tx.balanceAfter}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <div className="text-xs text-stone-400">
            총 {pagination.total}건
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="p-1.5 hover:bg-stone-100 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs text-stone-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="p-1.5 hover:bg-stone-100 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
