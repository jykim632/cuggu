"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { CreditTxBadge } from "@/components/credit/CreditTxBadge";
import { CreditTxAmount } from "@/components/credit/CreditTxAmount";
import type { CreditTxType } from "@/types/ai";

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
import type { PaginationMeta } from "@/schemas/admin";

// ── Types ──

interface TxItem {
  id: string;
  type: CreditTxType;
  amount: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string;
}

interface Stats {
  totalCount: number;
  totalDeducted: number;
  totalRefunded: number;
}

// ── Page ──

export default function CreditAuditPage() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (type) params.set("type", type);
    if (userId.trim()) params.set("userId", userId.trim());

    try {
      const res = await fetch(`/api/admin/credit-transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, type, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">토큰 감사</h1>
        <p className="mt-1 text-stone-500">
          크레딧 변동 내역을 모니터링하세요
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">총 거래 수</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {stats.totalCount.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">총 차감</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              -{stats.totalDeducted.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-sm text-stone-500">총 환불</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              +{stats.totalRefunded.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-4">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        >
          <option value="">전체 타입</option>
          <option value="DEDUCT">차감</option>
          <option value="REFUND">환불</option>
          <option value="PURCHASE">구매</option>
          <option value="BONUS">보너스</option>
        </select>

        <input
          type="text"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPage(1);
          }}
          placeholder="유저 ID 필터"
          className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
      </div>

      {/* 리스트 */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            로딩 중...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            데이터가 없습니다
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-stretch rounded-lg border border-stone-100 hover:border-stone-200 transition-colors overflow-hidden">
                {/* 악센트 바 */}
                <div className={`w-1 shrink-0 ${ACCENT_COLOR[tx.type] ?? "bg-stone-300"}`} />

                <div className="flex-1 px-4 py-3.5 flex items-center justify-between gap-4 min-w-0">
                  {/* 좌측 */}
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

                    {/* 2행: 유저 + 뱃지 + 설명 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-900 shrink-0">
                        {tx.userName || tx.userEmail.split("@")[0]}
                      </span>
                      <CreditTxBadge type={tx.type} />
                      <span className="text-sm text-stone-600 truncate">
                        {tx.description || "-"}
                      </span>
                    </div>

                    {/* 3행: 이메일 + 참조 정보 */}
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span className="truncate max-w-[160px]">{tx.userEmail}</span>
                      {tx.referenceType && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span>{tx.referenceType}</span>
                        </>
                      )}
                      {tx.referenceId && (
                        <span className="inline-flex items-center gap-1 font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">
                          {tx.referenceId.slice(0, 8)}
                          <CopyButton text={tx.referenceId} />
                        </span>
                      )}
                    </div>
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
        )}

        <Pagination pagination={pagination} page={page} setPage={setPage} />
      </div>
    </div>
  );
}

// ── Pagination ──

function Pagination({
  pagination,
  page,
  setPage,
}: {
  pagination: PaginationMeta | null;
  page: number;
  setPage: (p: number | ((prev: number) => number)) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200">
      <div className="text-sm text-stone-500">
        총 {pagination.total}건 중{" "}
        {(pagination.page - 1) * pagination.pageSize + 1}-
        {Math.min(pagination.page * pagination.pageSize, pagination.total)}
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 hover:bg-stone-100 rounded disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 text-sm">
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          disabled={page === pagination.totalPages}
          className="p-2 hover:bg-stone-100 rounded disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
