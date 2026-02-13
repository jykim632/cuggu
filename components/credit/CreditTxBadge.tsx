import type { CreditTxType } from "@/types/ai";

const TX_TYPE_MAP: Record<CreditTxType, { label: string; color: string }> = {
  DEDUCT: { label: "차감", color: "bg-red-100 text-red-700" },
  REFUND: { label: "환불", color: "bg-blue-100 text-blue-700" },
  PURCHASE: { label: "구매", color: "bg-green-100 text-green-700" },
  BONUS: { label: "보너스", color: "bg-purple-100 text-purple-700" },
};

export function CreditTxBadge({ type }: { type: CreditTxType }) {
  const { label, color } = TX_TYPE_MAP[type] ?? {
    label: type,
    color: "bg-stone-100 text-stone-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}
