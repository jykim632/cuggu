'use client';

import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-4">
        {/* Spinner & Title */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-8 w-8"
          >
            <svg
              className="h-full w-full text-pink-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              🔄 {roleLabel} AI 사진 생성 중...
            </h3>
            <p className="text-sm text-gray-600">
              {styleLabel} 스타일로 4장의 사진을 만들고 있습니다
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 30,
                ease: 'linear',
              }}
              className="h-full bg-gradient-to-r from-pink-400 to-pink-600"
            />
          </div>
          <p className="text-xs text-gray-500">예상 소요 시간: 20-40초</p>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: step.delay,
                }}
                className="h-2 w-2 rounded-full bg-pink-500"
              />
              {step.text}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
