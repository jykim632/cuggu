'use client';

import { Loader2, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GenerationFloatingBarProps {
  completedCount: number;
  totalImages: number;
  onExpand: () => void;
}

export function GenerationFloatingBar({
  completedCount,
  totalImages,
  onExpand,
}: GenerationFloatingBarProps) {
  const progress = totalImages > 0 ? (completedCount / totalImages) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <button
        onClick={onExpand}
        className="flex items-center gap-3 rounded-xl bg-stone-900 px-5 py-3 shadow-lg hover:bg-stone-800 transition-colors"
      >
        <Loader2 className="w-4 h-4 text-rose-400 animate-spin" />
        <div className="text-left">
          <p className="text-sm font-medium text-white">
            AI 촬영 중 {completedCount}/{totalImages}장
          </p>
          <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-stone-700">
            <motion.div
              className="h-full bg-rose-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <Maximize2 className="w-4 h-4 text-stone-400" />
      </button>
    </motion.div>
  );
}
