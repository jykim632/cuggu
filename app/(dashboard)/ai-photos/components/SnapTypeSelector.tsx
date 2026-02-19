'use client';

import { Check } from 'lucide-react';
import { SnapType, SNAP_TYPES } from '@/types/ai';

interface SnapTypeSelectorProps {
  selectedType: SnapType | null;
  onSelect: (type: SnapType) => void;
  disabled?: boolean;
}

export function SnapTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: SnapTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-700">스냅 타입 선택</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SNAP_TYPES.map((snap) => {
          const isSelected = selectedType === snap.value;

          return (
            <button
              key={snap.value}
              onClick={() => !disabled && onSelect(snap.value)}
              disabled={disabled}
              className={`
                relative rounded-xl border-2 px-4 py-4 text-left transition-all
                ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-800">{snap.label}</p>
                <p className="text-xs text-stone-500">{snap.description}</p>
                <p className="text-[10px] text-stone-400">
                  {snap.styles.length}개 스타일
                </p>
              </div>

              {isSelected && (
                <div className="absolute right-3 top-3">
                  <div className="rounded-full bg-rose-500 p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
