'use client';

import { Check } from 'lucide-react';
import { AI_MODELS, AIModel } from '@/lib/ai/models';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  disabled?: boolean;
  batchSize?: number;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  disabled = false,
  batchSize = 4,
}: ModelSelectorProps) {
  const models = Object.values(AI_MODELS);

  const getFacePreservationColor = (level: AIModel['facePreservation']) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
    }
  };

  const getSpeedColor = (speed: AIModel['speed']) => {
    switch (speed) {
      case 'fast':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'slow':
        return 'text-red-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-700">AI 모델 선택 (개발 모드)</h3>
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
          DEV ONLY
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          const totalCost = (model.costPerImage * batchSize).toFixed(4);

          return (
            <button
              key={model.id}
              onClick={() => !disabled && onModelSelect(model.id)}
              disabled={disabled}
              className={`
                relative rounded-lg border-2 p-4 text-left transition-colors
                ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <Check className="w-5 h-5 text-rose-500" />
                </div>
              )}

              <div className="space-y-2">
                {/* Model Name */}
                <div>
                  <h4 className="font-medium text-stone-900">{model.name}</h4>
                  <p className="text-xs text-stone-500">{model.provider}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-stone-600">{model.description}</p>

                {/* Stats */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`rounded-full bg-stone-100 px-2 py-1 ${getFacePreservationColor(model.facePreservation)}`}
                  >
                    얼굴: {model.facePreservation}
                  </span>
                  <span
                    className={`rounded-full bg-stone-100 px-2 py-1 ${getSpeedColor(model.speed)}`}
                  >
                    속도: {model.speed}
                  </span>
                </div>

                {/* Cost */}
                <div className="border-t border-stone-200 pt-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-stone-500">
                      ${model.costPerImage.toFixed(4)}/장
                    </span>
                    <span className="text-sm font-medium text-stone-900">
                      총 ${totalCost} ({batchSize}장)
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
