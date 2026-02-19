'use client';

import { AlertCircle, Gem, Info } from 'lucide-react';
import { AI_STYLES } from '@/types/ai';

interface CreditConfirmStepProps {
  mode: 'SINGLE' | 'BATCH';
  styles: string[];
  roles: string[];
  totalImages: number;
  credits: number;
}

const ROLE_LABELS: Record<string, string> = {
  GROOM: '신랑',
  BRIDE: '신부',
};

export function CreditConfirmStep({
  mode,
  styles,
  roles,
  totalImages,
  credits,
}: CreditConfirmStepProps) {
  const creditsNeeded = totalImages;
  const remaining = credits - creditsNeeded;
  const isInsufficient = remaining < 0;

  const isCouple = roles.length > 1;
  const roleText = isCouple
    ? '커플 (신랑+신부)'
    : roles.map(r => ROLE_LABELS[r] ?? r).join(', ');

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-base font-semibold text-stone-900">촬영 확인</h3>
      </div>

      {/* Summary */}
      <div className="space-y-3 rounded-lg bg-stone-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">모드</span>
          <span className="font-medium text-stone-900">
            {mode === 'BATCH' ? '묶음 촬영' : '개별 촬영'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">스타일</span>
          <span className="font-medium text-stone-900">
            {styles.map(s => AI_STYLES.find(as => as.value === s)?.label ?? s).join(', ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">장수</span>
          <span className="font-medium text-stone-900">{totalImages}장</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">역할</span>
          <span className="font-medium text-stone-900">{roleText}</span>
        </div>
      </div>

      {/* Credit bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-stone-600">
            <Gem className="w-3.5 h-3.5" />
            크레딧
          </span>
          <span className={isInsufficient ? 'text-red-600 font-medium' : 'text-stone-900 font-medium'}>
            {credits} → {remaining}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full transition-all duration-500 ${isInsufficient ? 'bg-red-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.max(0, Math.min(100, (remaining / credits) * 100))}%` }}
          />
        </div>
      </div>

      {/* Warnings / Info */}
      {isInsufficient ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">크레딧이 부족합니다</p>
            <p className="text-xs mt-0.5">
              {Math.abs(remaining)}크레딧이 더 필요합니다.{' '}
              <a href="/dashboard/credits" className="underline hover:no-underline">충전하기 →</a>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>생성된 사진은 앨범에 자동 저장됩니다</span>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>실패 시 크레딧이 자동 환불됩니다</span>
          </div>
        </div>
      )}
    </div>
  );
}
