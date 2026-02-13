import type { CreditTxType } from "@/types/ai";

const AMOUNT_COLOR: Record<CreditTxType, string> = {
  DEDUCT: "text-red-600",
  REFUND: "text-blue-600",
  PURCHASE: "text-green-600",
  BONUS: "text-purple-600",
};

export function CreditTxAmount({
  type,
  amount,
}: {
  type: CreditTxType;
  amount: number;
}) {
  const color = AMOUNT_COLOR[type] ?? "text-stone-600";
  const sign = type === "DEDUCT" ? "-" : "+";

  return (
    <span className={`font-medium tabular-nums ${color}`}>
      {sign}
      {amount}
    </span>
  );
}
