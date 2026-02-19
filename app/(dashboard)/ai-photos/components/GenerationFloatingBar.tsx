'use client';

import { CheckCircle2, Loader2, Maximize2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface GenerationFloatingBarProps {
  completedCount: number;
  failedCount: number;
  totalImages: number;
  isComplete: boolean;
  onExpand: () => void;
  onDismiss?: () => void;
}

export function GenerationFloatingBar({
  completedCount,
  failedCount,
  totalImages,
  isComplete,
  onExpand,
  onDismiss,
}: GenerationFloatingBarProps) {
  const processedCount = completedCount + failedCount;
  const progress = totalImages > 0 ? (processedCount / totalImages) * 100 : 0;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onExpand}
          className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg transition-colors ${
            isComplete
              ? failedCount > 0
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-stone-900 hover:bg-stone-800'
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          ) : (
            <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {isComplete
                ? failedCount > 0
                  ? `AI 촬영 완료 — ${completedCount}장 생성 (${failedCount}장 실패)`
                  : `AI 촬영 완료 — ${completedCount}장 생성됨`
                : `AI 촬영 중 ${processedCount}/${totalImages}장`}
            </p>
            {!isComplete && (
              <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-stone-700">
                <motion.div
                  className="h-full bg-rose-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
          {isComplete ? null : (
            <Maximize2 className="w-4 h-4 text-stone-400" />
          )}
        </button>
        {isComplete && onDismiss && (
          <button
            onClick={onDismiss}
            className="rounded-full bg-stone-900 p-2 text-stone-400 hover:bg-stone-800 hover:text-white shadow-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
