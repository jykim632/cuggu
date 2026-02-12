'use client';

import { Gem, AlertTriangle } from 'lucide-react';

interface CreditDisplayProps {
  balance: number;
  planned?: number;
}

export function CreditDisplay({ balance, planned = 0 }: CreditDisplayProps) {
  const isInsufficient = planned > balance;

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium
      ${isInsufficient ? 'bg-red-50 text-red-700' : 'bg-rose-50 text-rose-700'}
    `}>
      <Gem className="w-3 h-3" />
      <span>잔여 {balance}</span>
      {planned > 0 && (
        <>
          <span className="text-stone-300">|</span>
          <span className={isInsufficient ? 'text-red-600' : 'text-stone-500'}>
            이번 -{planned}
          </span>
          {isInsufficient && <AlertTriangle className="w-3 h-3 text-red-500" />}
        </>
      )}
    </div>
  );
}
