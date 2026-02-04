'use client';

import { motion } from 'framer-motion';
import { PersonRole } from '@/types/ai';

interface ResultGalleryProps {
  role: PersonRole;
  images: string[];
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onRegenerate: () => void;
  remainingCredits: number;
}

export function ResultGallery({
  role,
  images,
  selectedImage,
  onSelectImage,
  onRegenerate,
  remainingCredits,
}: ResultGalleryProps) {
  const roleLabel = role === 'GROOM' ? '신랑' : '신부';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {roleLabel} AI 사진 (4장)
          </h3>
          <p className="text-sm text-gray-500">
            마음에 드는 사진 1장을 선택해주세요
          </p>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={onRegenerate}
          disabled={remainingCredits === 0}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          재생성 ({remainingCredits} 크레딧)
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-4">
        {images.map((url, index) => {
          const isSelected = selectedImage === url;

          return (
            <motion.button
              key={url}
              onClick={() => onSelectImage(url)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative aspect-square overflow-hidden rounded-lg border-4 transition-all
                ${
                  isSelected
                    ? 'border-pink-500 shadow-lg'
                    : 'border-transparent hover:border-gray-300'
                }
              `}
            >
              {/* Image */}
              <img
                src={url}
                alt={`Generated ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Selected Overlay */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-pink-500 bg-opacity-20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="rounded-full bg-pink-500 p-2"
                  >
                    <svg
                      className="h-8 w-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                </motion.div>
              )}

              {/* Image Number */}
              <div className="absolute left-2 top-2 rounded-full bg-black bg-opacity-50 px-2 py-1 text-xs font-bold text-white">
                {index + 1}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selection Status */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-green-600"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          ✅ 1장 선택됨
        </motion.div>
      )}
    </motion.div>
  );
}
