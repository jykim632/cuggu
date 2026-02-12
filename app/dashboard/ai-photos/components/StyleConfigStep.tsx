'use client';

import { AIStyle, SnapType, SNAP_TYPES } from '@/types/ai';
import { StyleSelector } from './StyleSelector';

interface StyleConfigStepProps {
  mode: 'SINGLE' | 'BATCH';
  selectedStyles: AIStyle[];
  snapType?: SnapType | null;
  batchCount: number;
  onStylesChange: (styles: AIStyle[]) => void;
  onBatchCountChange: (count: number) => void;
}

const BATCH_OPTIONS = [
  { count: 5, label: '라이트', desc: '5장' },
  { count: 10, label: '에센셜', desc: '10장' },
  { count: 20, label: '프리미엄', desc: '20장' },
];

export function StyleConfigStep({
  mode,
  selectedStyles,
  snapType,
  batchCount,
  onStylesChange,
  onBatchCountChange,
}: StyleConfigStepProps) {
  if (mode === 'BATCH') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <h3 className="text-base font-semibold text-stone-900">촬영 설정</h3>
          <p className="text-xs text-stone-500 mt-1">장수를 선택하면 스타일이 자동 배분됩니다</p>
        </div>

        {/* Snap type filter (optional) */}
        {!snapType && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-600">스냅 타입</p>
            <div className="flex gap-2">
              {SNAP_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onStylesChange(t.styles)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    selectedStyles.some(s => t.styles.includes(s))
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Batch count */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-600">촬영 장수</p>
          <div className="grid grid-cols-3 gap-2">
            {BATCH_OPTIONS.map((opt) => (
              <button
                key={opt.count}
                onClick={() => onBatchCountChange(opt.count)}
                className={`rounded-xl border-2 px-4 py-3 text-center transition-all ${
                  batchCount === opt.count
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <p className="text-lg font-bold text-stone-900">{opt.count}</p>
                <p className="text-[10px] text-stone-500">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SINGLE mode — multi-select styles
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-stone-900">스타일 선택</h3>
        <p className="text-xs text-stone-500 mt-1">
          촬영할 스타일을 선택하세요 (복수 가능)
          {selectedStyles.length > 0 && (
            <span className="text-rose-600 font-medium ml-1">
              · {selectedStyles.length}개 선택
            </span>
          )}
        </p>
      </div>

      <StyleSelector
        multiSelect
        selectedStyles={selectedStyles}
        onStylesChange={onStylesChange}
        snapType={snapType}
      />
    </div>
  );
}
