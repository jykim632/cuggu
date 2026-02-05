'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PersonRole, AIStyle, AI_STYLES } from '@/types/ai';

interface GenerationProgressProps {
  role: PersonRole;
  style: AIStyle;
  isGenerating: boolean;
}

export function GenerationProgress({
  role,
  style,
  isGenerating,
}: GenerationProgressProps) {
  if (!isGenerating) return null;

  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const styleLabel = AI_STYLES.find((s) => s.value === style)?.label || style;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="space-y-4">
        {/* Spinner & Title */}
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
          <div>
            <h3 className="text-sm font-medium text-stone-900">
              {roleLabel} AI 사진 생성 중...
            </h3>
            <p className="text-xs text-stone-500">
              {styleLabel} 스타일로 4장의 사진을 만들고 있습니다
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 30,
                ease: 'linear',
              }}
              className="h-full bg-rose-500"
            />
          </div>
          <p className="text-xs text-stone-500">예상 소요 시간: 20-40초</p>
        </div>

        {/* Loading Steps */}
        <div className="space-y-2">
          {[
            { delay: 0, text: '얼굴 특징 분석 중...' },
            { delay: 5, text: '웨딩 스타일 적용 중...' },
            { delay: 15, text: 'AI 이미지 생성 중...' },
            { delay: 25, text: '최종 이미지 최적화 중...' },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-2 text-sm text-stone-500"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-stone-400" />
              {step.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
