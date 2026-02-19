'use client';

import { Camera, Palette } from 'lucide-react';

interface ModeSelectStepProps {
  selectedMode?: 'SINGLE' | 'BATCH';
  onModeSelect: (mode: 'SINGLE' | 'BATCH') => void;
}

export function ModeSelectStep({ selectedMode, onModeSelect }: ModeSelectStepProps) {
  const modes = [
    {
      value: 'BATCH' as const,
      icon: Camera,
      label: '묶음 촬영',
      description: '스냅타입 선택 후 자동으로 다양한 스타일 촬영',
      detail: '5/10/20장 · 장수 × 1 크레딧',
    },
    {
      value: 'SINGLE' as const,
      icon: Palette,
      label: '개별 촬영',
      description: '원하는 스타일을 직접 선택하여 촬영',
      detail: '스타일당 1장 · 1 크레딧',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-base font-semibold text-stone-900">촬영 모드 선택</h3>
        <p className="text-xs text-stone-500 mt-1">원하는 촬영 방식을 선택하세요</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.value;

          return (
            <button
              key={mode.value}
              onClick={() => onModeSelect(mode.value)}
              className={`
                relative rounded-xl border-2 p-5 text-left transition-all
                ${isSelected
                  ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20'
                  : 'border-stone-200 bg-white hover:border-stone-300'}
              `}
            >
              <div className="space-y-2">
                <div className={`inline-flex rounded-lg p-2 ${isSelected ? 'bg-rose-100' : 'bg-stone-100'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-rose-600' : 'text-stone-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{mode.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{mode.description}</p>
                </div>
                <p className="text-[10px] text-stone-400">{mode.detail}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
