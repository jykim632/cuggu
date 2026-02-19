'use client';

import { Loader2, Check, AlertCircle, Minimize2, Square, X, RefreshCcw, Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import type { JobResult } from '@/hooks/useAIGeneration';

interface BatchGenerationViewProps {
  totalImages: number;
  completedUrls: string[];
  currentIndex: number;
  statusMessage: string;
  error: string | null;
  isGenerating?: boolean;
  jobResult?: JobResult | null;
  onMinimize?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export function BatchGenerationView({
  totalImages,
  completedUrls,
  currentIndex,
  statusMessage,
  error,
  isGenerating = true,
  jobResult,
  onMinimize,
  onCancel,
  onDismiss,
}: BatchGenerationViewProps) {
  const completedCount = completedUrls.length;
  const progress = totalImages > 0 ? (completedCount / totalImages) * 100 : 0;
  const isComplete = !isGenerating && completedCount > 0;
  const hasFailures = jobResult && jobResult.failedImages > 0;

  // Estimate remaining time: ~25s per image
  const remainingImages = totalImages - completedCount;
  const estimatedSeconds = remainingImages * 25;
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;

  return (
    <div className={`space-y-4 rounded-xl border p-5 ${
      isComplete
        ? hasFailures ? 'border-amber-200 bg-amber-50/30' : 'border-green-200 bg-green-50/30'
        : 'border-stone-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            {isComplete
              ? hasFailures ? 'AI 촬영 부분 완료' : 'AI 촬영 완료'
              : 'AI 촬영 중...'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">{statusMessage}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-600">
            {completedCount}/{totalImages}장
          </span>
          {isGenerating && onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Square className="w-3 h-3" />
              중지
            </button>
          )}
          {isComplete && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <X className="w-3 h-3" />
              닫기
            </button>
          )}
          {isGenerating && onMinimize && (
            <button
              onClick={onMinimize}
              className="rounded-lg border border-stone-200 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-stone-100">
          <motion.div
            className="h-full bg-rose-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {remainingImages > 0 && (
          <p className="text-[10px] text-stone-400 text-right">
            약 {minutes > 0 ? `${minutes}분 ` : ''}{seconds}초 남음
          </p>
        )}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {Array.from({ length: totalImages }).map((_, index) => {
          const url = completedUrls[index];
          const isCurrentlyGenerating = index === completedCount && !error;
          const isWaiting = index > completedCount;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-50"
            >
              {url ? (
                // Completed
                <motion.div
                  initial={{ filter: 'blur(10px)', scale: 0.8 }}
                  animate={{ filter: 'blur(0px)', scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="h-full w-full"
                >
                  <img src={url} alt={`Generated ${index + 1}`} className="h-full w-full object-cover" />
                  <div className="absolute top-1 right-1 rounded-full bg-green-500 p-0.5">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                </motion.div>
              ) : isCurrentlyGenerating ? (
                // Currently generating
                <div className="h-full w-full flex flex-col items-center justify-center gap-1.5">
                  <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
                  <span className="text-[10px] text-stone-400">생성 중</span>
                </div>
              ) : (
                // Waiting
                <div className="h-full w-full flex flex-col items-center justify-center gap-1.5">
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-stone-300" />
                  <span className="text-[10px] text-stone-300">대기</span>
                </div>
              )}

              {/* Index label */}
              <div className="absolute left-1 top-1 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {index + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 배치 결과 요약 — 실패 + 환불 */}
      {isComplete && jobResult && jobResult.failedImages > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {jobResult.totalImages}장 중 <strong>{jobResult.failedImages}장</strong>이 생성에 실패했습니다.
            </span>
          </div>
          {jobResult.creditsRefunded > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <Gem className="w-4 h-4 shrink-0" />
              <span>
                미사용 크레딧 <strong>{jobResult.creditsRefunded}장</strong>이 자동 환불되었습니다.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
