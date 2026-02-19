'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-media-query';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function SlidePanel({
  isOpen,
  onClose,
  title,
  headerRight,
  children,
  footer,
}: SlidePanelProps) {
  const { isMobile } = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              fixed z-50 bg-white flex flex-col
              ${isMobile
                ? 'inset-0'
                : 'top-0 right-0 h-full w-[480px] max-w-full shadow-2xl'
              }
            `}
          >
            {/* Header */}
            {(title || headerRight) && (
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 shrink-0">
                <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
                <div className="flex items-center gap-2">
                  {headerRight}
                  <button
                    onClick={onClose}
                    className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                    aria-label="닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-stone-200 shrink-0">{footer}</div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
