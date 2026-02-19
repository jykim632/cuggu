'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import type { ReferencePhoto, PersonRole } from '@/types/ai';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/types/ai';

interface AlbumOnboardingProps {
  onAlbumCreated: (albumId: string) => void;
}

type Step = 'name' | 'photos';

const STEPS: Step[] = ['name', 'photos'];

interface UploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  error: string | null;
  existing: ReferencePhoto | null;
}

const initialUploadState: UploadState = {
  file: null,
  preview: null,
  uploading: false,
  error: null,
  existing: null,
};

export function AlbumOnboarding({ onAlbumCreated }: AlbumOnboardingProps) {
  const [step, setStep] = useState<Step>('name');
  const [direction, setDirection] = useState(1);

  // Step 1: album name
  const [albumName, setAlbumName] = useState('나의 웨딩 앨범');

  // Step 2: reference photos
  const [groom, setGroom] = useState<UploadState>({ ...initialUploadState });
  const [bride, setBride] = useState<UploadState>({ ...initialUploadState });
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Album creation
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groomInputRef = useRef<HTMLInputElement>(null);
  const brideInputRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEPS.indexOf(step);
  const canProceedFromName = albumName.trim().length > 0;

  // ── Fetch existing reference photos on mount ──
  const fetchReferencePhotos = useCallback(async () => {
    try {
      setLoadingPhotos(true);
      const res = await fetch('/api/ai/reference-photos');
      const data = await res.json();
      if (res.ok && data.success) {
        const photos: ReferencePhoto[] = data.data;
        const groomPhoto = photos.find((p) => p.role === 'GROOM');
        const bridePhoto = photos.find((p) => p.role === 'BRIDE');
        if (groomPhoto) {
          setGroom((prev) => ({ ...prev, existing: groomPhoto }));
        }
        if (bridePhoto) {
          setBride((prev) => ({ ...prev, existing: bridePhoto }));
        }
      }
    } catch {
      // non-critical; user can still upload
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    fetchReferencePhotos();
  }, [fetchReferencePhotos]);

  // ── Navigation ──
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
    }
  };

  // ── File validation ──
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'JPG, PNG, WebP 파일만 업로드 가능합니다';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기는 10MB 이하여야 합니다';
    }
    return null;
  };

  // ── 파일 선택 (프리뷰만, 서버 업로드 안 함) ──
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    role: PersonRole
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setter = role === 'GROOM' ? setGroom : setBride;
    const validationError = validateFile(file);
    if (validationError) {
      setter((prev) => ({ ...prev, error: validationError }));
      return;
    }

    const preview = URL.createObjectURL(file);
    setter((prev) => {
      if (prev.preview) URL.revokeObjectURL(prev.preview);
      return { ...prev, file, preview, error: null };
    });
  };

  // ── 확인 후 실제 업로드 ──
  const handleConfirmUpload = async (role: PersonRole) => {
    const state = role === 'GROOM' ? groom : bride;
    const setter = role === 'GROOM' ? setGroom : setBride;
    if (!state.file) return;

    setter((prev) => ({ ...prev, uploading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('image', state.file);
      formData.append('role', role);

      const res = await fetch('/api/ai/reference-photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');

      setter((prev) => ({
        ...prev,
        uploading: false,
        file: null,
        existing: data.data,
      }));
    } catch (err) {
      setter((prev) => ({
        ...prev,
        uploading: false,
        error: err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다',
      }));
    }
  };

  // ── 프리뷰/기존 사진 제거 ──
  const handleRemove = async (role: PersonRole) => {
    const state = role === 'GROOM' ? groom : bride;
    const setter = role === 'GROOM' ? setGroom : setBride;
    const inputRef = role === 'GROOM' ? groomInputRef : brideInputRef;

    if (state.existing) {
      try {
        await fetch(`/api/ai/reference-photos/${state.existing.id}`, {
          method: 'DELETE',
        });
      } catch {
        // best-effort
      }
    }

    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }

    setter({ ...initialUploadState });
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // ── Album creation ──
  const handleCreateAlbum = async () => {
    if (!canProceedFromName) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: albumName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.albumId) {
          onAlbumCreated(data.albumId);
          return;
        }
        throw new Error(data.error || '앨범 생성 실패');
      }

      onAlbumCreated(data.data.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '앨범 생성 중 오류가 발생했습니다'
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Animation variants ──
  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  // ── Helpers ──
  const hasAnyUpload = !!(groom.existing || bride.existing);
  const isAnyUploading = groom.uploading || bride.uploading;

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
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
          {step === 'name' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50">
                  <Camera className="w-7 h-7 text-rose-500" />
                </div>
                <h2 className="text-lg font-semibold text-stone-900">
                  AI 웨딩 앨범 만들기
                </h2>
                <p className="text-sm text-stone-500">
                  앨범 이름을 정하고, 참조 사진을 등록해보세요
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">
                  앨범 이름
                </label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="나의 웨딩 앨범"
                  className="w-full rounded-lg border border-stone-200 px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>
          )}

          {step === 'photos' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50">
                  <Upload className="w-7 h-7 text-rose-500" />
                </div>
                <h2 className="text-lg font-semibold text-stone-900">
                  참조 사진 등록
                </h2>
                <p className="text-sm text-stone-500">
                  AI가 얼굴을 학습할 사진을 등록해주세요 (최소 1명)
                </p>
              </div>

              {loadingPhotos ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                  <p className="text-sm text-stone-500">기존 사진 확인 중...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <PhotoUploadCard
                    role="GROOM"
                    label="신랑"
                    state={groom}
                    inputRef={groomInputRef}
                    onFileSelect={(e) => handleFileSelect(e, 'GROOM')}
                    onRemove={() => handleRemove('GROOM')}
                    onConfirmUpload={() => handleConfirmUpload('GROOM')}
                  />
                  <PhotoUploadCard
                    role="BRIDE"
                    label="신부"
                    state={bride}
                    inputRef={brideInputRef}
                    onFileSelect={(e) => handleFileSelect(e, 'BRIDE')}
                    onRemove={() => handleRemove('BRIDE')}
                    onConfirmUpload={() => handleConfirmUpload('BRIDE')}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        {step === 'name' ? (
          <div /> /* spacer */
        ) : (
          <button
            onClick={goBack}
            disabled={creating}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
        )}

        {step === 'name' && (
          <button
            onClick={goNext}
            disabled={!canProceedFromName}
            className="flex items-center gap-1 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {step === 'photos' && (
          <div className="flex items-center gap-2">
            {!hasAnyUpload && (
              <button
                onClick={handleCreateAlbum}
                disabled={creating || isAnyUploading}
                className="text-sm text-stone-500 hover:text-stone-700 disabled:opacity-50"
              >
                나중에 할게요
              </button>
            )}
            <button
              onClick={handleCreateAlbum}
              disabled={creating || isAnyUploading}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  앨범 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  앨범 만들기
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PhotoUploadCard ──

interface PhotoUploadCardProps {
  role: PersonRole;
  label: string;
  state: UploadState;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onConfirmUpload: () => void;
}

function PhotoUploadCard({
  role,
  label,
  state,
  inputRef,
  onFileSelect,
  onRemove,
  onConfirmUpload,
}: PhotoUploadCardProps) {
  const hasPhoto = !!(state.existing || state.preview);
  const imageUrl = state.existing?.originalUrl ?? state.preview;
  const isUploaded = !!state.existing;
  const hasPendingPreview = !!state.preview && !state.existing;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-sm font-medium text-stone-700">{label}</span>
        {isUploaded && (
          <span className="ml-auto inline-flex items-center gap-0.5 text-xs text-emerald-600">
            <Check className="w-3 h-3" />
            등록됨
          </span>
        )}
      </div>

      <div
        onClick={() => !state.uploading && !hasPhoto && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          aspect-[3/4] overflow-hidden transition-colors
          ${hasPhoto ? 'border-transparent' : 'border-stone-200 hover:border-rose-300 cursor-pointer'}
          ${state.uploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={onFileSelect}
          className="hidden"
        />

        {state.uploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            <span className="text-xs text-stone-500">업로드 중...</span>
          </div>
        )}

        {hasPhoto && imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`${label} 참조 사진`}
              className="h-full w-full object-cover rounded-xl"
            />
            {/* Remove / X button */}
            {!isUploaded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {/* 다른 사진 / 변경 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="absolute bottom-2 inset-x-2 z-10 rounded-lg bg-black/50 py-1.5 text-xs font-medium text-white hover:bg-black/70 transition-colors"
            >
              {isUploaded ? '변경' : '다른 사진'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
              <Camera className="w-5 h-5 text-stone-400" />
            </div>
            <p className="text-xs text-stone-500">
              탭하여 {label} 사진 선택
            </p>
          </div>
        )}
      </div>

      {/* 업로드 버튼 (프리뷰만 있고 서버에 안 올린 상태) */}
      {hasPendingPreview && (
        <button
          onClick={onConfirmUpload}
          disabled={state.uploading}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
        >
          <Upload className="w-3.5 h-3.5" />
          업로드하기
        </button>
      )}

      {/* Error */}
      {state.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
    </div>
  );
}
