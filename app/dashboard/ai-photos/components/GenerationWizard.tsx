'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ModeSelectStep } from './ModeSelectStep';
import { StyleConfigStep } from './StyleConfigStep';
import { CreditConfirmStep } from './CreditConfirmStep';
import type { AIStyle, PersonRole, SnapType } from '@/types/ai';

// The wizard is a 3-step flow, NOT 4 steps (reference photo is handled separately)
type WizardStep = 'mode' | 'style' | 'confirm';

export interface WizardConfig {
  mode: 'SINGLE' | 'BATCH';
  styles: AIStyle[];
  roles: PersonRole[];
  snapType?: SnapType;
  totalImages: number;
}

interface GenerationWizardProps {
  credits: number;
  referencePhotos: { id: string; role: string }[];
  snapType?: SnapType | null;
  onGenerate: (config: WizardConfig) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const STEPS: WizardStep[] = ['mode', 'style', 'confirm'];

export function GenerationWizard({
  credits,
  referencePhotos,
  snapType,
  onGenerate,
  onCancel,
  disabled = false,
}: GenerationWizardProps) {
  const [step, setStep] = useState<WizardStep>('mode');
  const [direction, setDirection] = useState(1);
  const [config, setConfig] = useState<Partial<WizardConfig>>({
    mode: undefined,
    styles: [],
    roles: referencePhotos.map(p => p.role as PersonRole),
    totalImages: 0,
  });

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setDirection(1);
      setStep(STEPS[stepIndex + 1]);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStep(STEPS[stepIndex - 1]);
    } else {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (config.mode && config.styles?.length && computedTotal > 0) {
      onGenerate({ ...config, totalImages: computedTotal } as WizardConfig);
    }
  };

  // Compute total images for SINGLE mode based on styles x roles
  const computedTotal = config.mode === 'SINGLE'
    ? (config.styles?.length ?? 0) * (config.roles?.length ?? 0)
    : config.totalImages ?? 0;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              i <= stepIndex ? 'w-8 bg-rose-500' : 'w-4 bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {step === 'mode' && (
            <ModeSelectStep
              selectedMode={config.mode}
              onModeSelect={(mode) => setConfig(prev => ({ ...prev, mode }))}
            />
          )}
          {step === 'style' && (
            <StyleConfigStep
              mode={config.mode!}
              selectedStyles={config.styles ?? []}
              snapType={snapType}
              batchCount={config.totalImages ?? 5}
              onStylesChange={(styles) => setConfig(prev => ({ ...prev, styles }))}
              onBatchCountChange={(n) => setConfig(prev => ({ ...prev, totalImages: n }))}
            />
          )}
          {step === 'confirm' && (
            <CreditConfirmStep
              mode={config.mode!}
              styles={config.styles ?? []}
              roles={config.roles ?? []}
              totalImages={computedTotal}
              credits={credits}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <ChevronLeft className="w-4 h-4" />
          {stepIndex === 0 ? '취소' : '이전'}
        </button>

        {step === 'confirm' ? (
          <button
            onClick={handleConfirm}
            disabled={disabled || computedTotal > credits || computedTotal === 0}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
          >
            촬영 시작
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={
              (step === 'mode' && !config.mode) ||
              (step === 'style' && (!config.styles?.length || computedTotal === 0))
            }
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
