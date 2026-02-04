'use client';

import { motion } from 'framer-motion';
import { AIStyle, AI_STYLES } from '@/types/ai';

interface StyleSelectorProps {
  selectedStyle: AIStyle | null;
  onStyleSelect: (style: AIStyle) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onStyleSelect,
  disabled = false,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">웨딩 스타일 선택</h3>

      <div className="flex flex-wrap gap-3">
        {AI_STYLES.map((style) => {
          const isSelected = selectedStyle === style.value;

          return (
            <motion.button
              key={style.value}
              onClick={() => !disabled && onStyleSelect(style.value)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.05 } : undefined}
              whileTap={!disabled ? { scale: 0.95 } : undefined}
              className={`
                relative overflow-hidden rounded-lg border-2 px-6 py-3 transition-all
                ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="selected-style"
                  className="absolute inset-0 bg-pink-100"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Content */}
              <div className="relative space-y-1">
                <p className="text-sm font-bold">{style.label}</p>
                <p className="text-xs opacity-75">{style.description}</p>
              </div>

              {/* Check Icon */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2"
                >
                  <svg
                    className="h-5 w-5 text-pink-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
