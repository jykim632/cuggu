'use client';

import { Check } from 'lucide-react';
import { AIStyle, AI_STYLES, SnapType, SNAP_TYPES } from '@/types/ai';

interface StyleSelectorProps {
  selectedStyle?: AIStyle | null;
  onStyleSelect?: (style: AIStyle) => void;
  disabled?: boolean;
  snapType?: SnapType | null;
  /** 멀티셀렉트 모드 */
  multiSelect?: boolean;
  selectedStyles?: AIStyle[];
  onStylesChange?: (styles: AIStyle[]) => void;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
  disabled = false,
  snapType,
  multiSelect = false,
  selectedStyles = [],
  onStylesChange,
}: StyleSelectorProps) {
  // snapType이 지정되면 해당 타입의 스타일만 필터링
  const filteredStyles = snapType
    ? AI_STYLES.filter((s) => {
        const snap = SNAP_TYPES.find((t) => t.value === snapType);
        return snap?.styles.includes(s.value);
      })
    : AI_STYLES;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-stone-700">웨딩 스타일 선택</h3>

      <div className="grid grid-cols-2 gap-2">
        {filteredStyles.map((style) => {
          const isSelected = multiSelect
            ? selectedStyles.includes(style.value)
            : selectedStyle === style.value;

          const handleClick = () => {
            if (disabled) return;
            if (multiSelect && onStylesChange) {
              const next = isSelected
                ? selectedStyles.filter((s) => s !== style.value)
                : [...selectedStyles, style.value];
              onStylesChange(next);
            } else if (onStyleSelect) {
              onStyleSelect(style.value);
            }
          };

          return (
            <button
              key={style.value}
              onClick={handleClick}
              disabled={disabled}
              className={`
                relative rounded-lg border-2 px-3 py-2.5 text-left transition-colors
                ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-medium">{style.label}</p>
                <p className="text-[10px] text-stone-500 line-clamp-1">{style.description}</p>
              </div>

              {isSelected && (
                <div className="absolute right-1.5 top-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
