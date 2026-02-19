'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Camera } from 'lucide-react';
import { GenerationWizard, type WizardConfig } from './GenerationWizard';
import { BatchGenerationView } from './BatchGenerationView';
import { CreditDisplay } from './CreditDisplay';
import type { ReferencePhoto, SnapType } from '@/types/ai';
import type { useAIGeneration } from '@/hooks/useAIGeneration';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  referencePhotos: ReferencePhoto[];
  snapType: SnapType | null;
  generation: ReturnType<typeof useAIGeneration>;
  isMinimized: boolean;
  onSetMinimized: (v: boolean) => void;
  showWizard: boolean;
  onSetShowWizard: (v: boolean) => void;
  selectedModel: string;
  onWizardGenerate: (config: WizardConfig) => void;
  onOpenRefSection: () => void;
}

export function AIGenerationModal({
  isOpen,
  onClose,
  credits,
  referencePhotos,
  snapType,
  generation,
  isMinimized,
  onSetMinimized,
  showWizard,
  onSetShowWizard,
  selectedModel,
  onWizardGenerate,
  onOpenRefSection,
}: AIGenerationModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasRefPhotos = referencePhotos.length > 0;
  const { isGenerating, completedUrls, failedIndices } = generation.state;
  const hasBatchView = (isGenerating || completedUrls.length > 0 || failedIndices.length > 0) && !isMinimized;

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isGenerating]); // eslint-disable-line react-hooks/exhaustive-deps

  // 생성 중 닫기 → 최소화
  const handleClose = () => {
    if (isGenerating) {
      onSetMinimized(true);
    }
    onClose();
  };

  const handleRefRegister = () => {
    onClose();
    onOpenRefSection();
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:flex sm:items-center sm:justify-center"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 top-4 rounded-t-2xl sm:static sm:w-[calc(100%-3rem)] sm:max-w-2xl lg:max-w-3xl sm:max-h-[90vh] sm:rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-stone-900">AI 사진 생성</h2>
              </div>
              <div className="flex items-center gap-3">
                <CreditDisplay balance={credits} />
                <button
                  onClick={handleClose}
                  className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {!hasRefPhotos ? (
                /* 참조 미등록 */
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="rounded-full bg-stone-100 p-4">
                    <Camera className="w-8 h-8 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">참조 사진을 먼저 등록하세요</p>
                    <p className="text-xs text-stone-500 mt-1">
                      AI가 얼굴을 학습하려면 신랑/신부 참조 사진이 필요합니다
                    </p>
                  </div>
                  <button
                    onClick={handleRefRegister}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
                  >
                    참조 사진 등록하기
                  </button>
                </div>
              ) : hasBatchView ? (
                /* 생성 중 / 완료 */
                <BatchGenerationView
                  totalImages={generation.state.totalImages}
                  completedUrls={generation.state.completedUrls}
                  failedIndices={generation.state.failedIndices}
                  currentIndex={generation.state.currentIndex}
                  statusMessage={generation.state.statusMessage}
                  error={generation.state.error}
                  isGenerating={generation.state.isGenerating}
                  jobResult={generation.state.jobResult}
                  onMinimize={handleClose}
                  onCancel={generation.cancel}
                  onDismiss={() => {
                    generation.reset();
                    onClose();
                  }}
                />
              ) : showWizard ? (
                /* Wizard */
                <GenerationWizard
                  credits={credits}
                  referencePhotos={referencePhotos.map((p) => ({ id: p.id, role: p.role }))}
                  snapType={snapType}
                  onGenerate={onWizardGenerate}
                  onCancel={() => onSetShowWizard(false)}
                  disabled={generation.state.isGenerating}
                />
              ) : (
                /* 준비 상태 */
                <div className="flex flex-col items-center gap-4 py-8">
                  <p className="text-xs text-stone-500">
                    참조 사진 {referencePhotos.length}장 등록됨 ({referencePhotos.map((p) => p.role === 'GROOM' ? '신랑' : '신부').join(', ')})
                  </p>
                  <button
                    onClick={() => onSetShowWizard(true)}
                    disabled={generation.state.isGenerating}
                    className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    촬영 설정
                  </button>
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
