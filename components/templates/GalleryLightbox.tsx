"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  /** 하단 액션 버튼 렌더 (현재 이미지 URL 전달) */
  actions?: (currentUrl: string, currentIndex: number) => ReactNode;
}

const SWIPE_THRESHOLD = 50;

export function GalleryLightbox({
  images,
  initialIndex,
  onClose,
  actions,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const goTo = useCallback(
    (direction: "prev" | "next") => {
      setCurrentIndex((prev) => {
        if (direction === "prev") return prev > 0 ? prev - 1 : prev;
        return prev < images.length - 1 ? prev + 1 : prev;
      });
    },
    [images.length],
  );

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo("prev");
      if (e.key === "ArrowRight") goTo("next");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goTo]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) goTo("prev");
    else if (info.offset.x < -SWIPE_THRESHOLD) goTo("next");
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="닫기"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 이미지 카운터 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 이전 버튼 */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goTo("prev");
          }}
          className="absolute left-2 z-10 p-2 text-white/70 hover:text-white transition-colors min-h-[44px] min-w-[44px] hidden md:flex items-center justify-center"
          aria-label="이전 사진"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* 다음 버튼 */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goTo("next");
          }}
          className="absolute right-2 z-10 p-2 text-white/70 hover:text-white transition-colors min-h-[44px] min-w-[44px] hidden md:flex items-center justify-center"
          aria-label="다음 사진"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* 이미지 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          onClick={(e) => e.stopPropagation()}
          className="w-screen h-[calc(100dvh-80px)] md:w-auto md:max-w-[90vw] md:max-h-[85vh] px-2 md:px-0 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
        >
          <img
            src={images[currentIndex]}
            alt={`Gallery ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* 액션 바 (선택적) */}
      {actions && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {actions(images[currentIndex], currentIndex)}
        </div>
      )}
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
