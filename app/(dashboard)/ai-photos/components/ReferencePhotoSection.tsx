'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Camera,
  Check,
  X,
  Loader2,
  Upload,
  User,
  Trash2,
  AlertTriangle,
  Plus,
  Pencil,
} from 'lucide-react';
import { PersonRole, ReferencePhoto, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/types/ai';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';

interface ReferencePhotoSectionProps {
  referencePhotos: ReferencePhoto[];
  onPhotosChange: (photos: ReferencePhoto[]) => void;
  compact?: boolean;
}

const ROLES: PersonRole[] = ['GROOM', 'BRIDE'];
const ROLE_LABELS: Record<PersonRole, string> = { GROOM: '신랑', BRIDE: '신부', COUPLE: '커플' };

export function ReferencePhotoSection({
  referencePhotos,
  onPhotosChange,
  compact = false,
}: ReferencePhotoSectionProps) {
  const [uploading, setUploading] = useState<PersonRole | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, { file: File; preview: string }>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<PersonRole | null>(null);
  const [activeRole, setActiveRole] = useState<PersonRole | null>(null);

  const groomInputRef = useRef<HTMLInputElement>(null);
  const brideInputRef = useRef<HTMLInputElement>(null);

  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm: onConfirm, handleCancel: onCancel } = useConfirm();

  const getInputRef = (role: PersonRole) => role === 'GROOM' ? groomInputRef : brideInputRef;
  const getExisting = (role: PersonRole) => referencePhotos.find((p) => p.role === role);

  const getWarning = (role: PersonRole): string | null => {
    if (warnings[role]) return warnings[role];
    const existing = getExisting(role);
    if (existing && !existing.faceDetected) {
      return '얼굴이 감지되지 않았습니다. AI 결과 품질이 떨어질 수 있습니다.';
    }
    return null;
  };

  // ── 파일 선택 (프리뷰만) ──
  const handleFileSelect = useCallback((file: File, role: PersonRole) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError('JPG, PNG, WebP 파일만 업로드 가능합니다');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('파일 크기는 10MB 이하여야 합니다');
      return;
    }
    setUploadError(null);
    setPendingFiles((prev) => {
      if (prev[role]?.preview) URL.revokeObjectURL(prev[role].preview);
      return { ...prev, [role]: { file, preview: URL.createObjectURL(file) } };
    });
  }, []);

  // ── 프리뷰 제거 ──
  const handleFileRemove = useCallback((role: PersonRole) => {
    setPendingFiles((prev) => {
      if (prev[role]?.preview) URL.revokeObjectURL(prev[role].preview);
      const next = { ...prev };
      delete next[role];
      return next;
    });
    const inputRef = getInputRef(role);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  // ── 확인 후 업로드 ──
  const handleConfirmUpload = useCallback(async (role: PersonRole) => {
    const pending = pendingFiles[role];
    if (!pending) return;

    const label = ROLE_LABELS[role];
    const confirmed = await confirm({
      title: `${label} 참조 사진 업로드`,
      description: '이 사진을 참조 사진으로 등록하시겠습니까?',
      confirmText: '업로드',
      cancelText: '취소',
    });
    if (!confirmed) return;

    setUploading(role);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('image', pending.file);
      formData.append('role', role);

      const res = await fetch('/api/ai/reference-photos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');

      const updated = referencePhotos.filter((p) => p.role !== role);
      onPhotosChange([...updated, data.data]);

      if (data.warning) {
        setWarnings((prev) => ({ ...prev, [role]: data.warning }));
      } else {
        setWarnings((prev) => {
          const next = { ...prev };
          delete next[role];
          return next;
        });
      }

      handleFileRemove(role);
      setActiveRole(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '업로드 중 오류');
    } finally {
      setUploading(null);
    }
  }, [pendingFiles, confirm, referencePhotos, onPhotosChange, handleFileRemove]);

  // ── 삭제 ──
  const handleDelete = useCallback(async (role: PersonRole) => {
    const photo = getExisting(role);
    if (!photo) return;

    const label = ROLE_LABELS[role];
    const confirmed = await confirm({
      title: `${label} 참조 사진 삭제`,
      description: '삭제하면 새로 등록해야 합니다. 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'warning',
    });
    if (!confirmed) return;

    setDeleting(role);
    try {
      const res = await fetch(`/api/ai/reference-photos/${photo.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');

      onPhotosChange(referencePhotos.filter((p) => p.id !== photo.id));
      setWarnings((prev) => {
        const next = { ...prev };
        delete next[role];
        return next;
      });
      setActiveRole(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '삭제 중 오류');
    } finally {
      setDeleting(null);
    }
  }, [referencePhotos, onPhotosChange, confirm]);

  // ── 컴팩트 모드 ──
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          {ROLES.map((role) => {
            const existing = getExisting(role);
            const pending = pendingFiles[role];
            const isUploading = uploading === role;
            const isDeleting = deleting === role;
            const label = ROLE_LABELS[role];
            const inputRef = getInputRef(role);
            const warning = getWarning(role);
            const isActive = activeRole === role;

            return (
              <div key={role} className="flex-1 space-y-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, role);
                  }}
                  className="hidden"
                />

                {pending ? (
                  /* 펜딩 프리뷰 (신규 또는 교체) */
                  <div className="space-y-1.5">
                    <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-rose-300">
                      <img src={pending.preview} alt={label} className="h-full w-full object-cover" />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                          <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                        </div>
                      )}
                      <button
                        onClick={() => handleFileRemove(role)}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleConfirmUpload(role)}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-1 rounded-md bg-rose-600 py-1.5 text-[10px] font-medium text-white hover:bg-rose-700 disabled:bg-stone-300 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      업로드
                    </button>
                  </div>
                ) : existing ? (
                  /* 등록된 사진 */
                  <div className="space-y-1.5">
                    <div
                      className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 cursor-pointer"
                      onClick={() => setActiveRole(isActive ? null : role)}
                    >
                      <img src={existing.originalUrl} alt={label} className="h-full w-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <span className="text-[10px] font-medium text-white flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> {label}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => inputRef.current?.click()}
                          disabled={isUploading || isDeleting}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-stone-100 py-1.5 text-[10px] font-medium text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          변경
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          disabled={isUploading || isDeleting}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md bg-red-50 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                          삭제
                        </button>
                      </div>
                    )}

                    {warning && (
                      <div className="flex items-start gap-1 rounded-md bg-amber-50 border border-amber-200 p-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 leading-tight">{warning}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 미등록 — 등록 버튼 */
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 aspect-square rounded-lg border-2 border-dashed border-stone-200 hover:border-rose-300 transition-colors bg-white"
                  >
                    <Plus className="w-4 h-4 text-stone-400" />
                    <span className="text-[10px] font-medium text-stone-500">{label} 등록</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {uploadError && (
          <p className="text-xs text-red-500 text-center mt-2">{uploadError}</p>
        )}

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={onCancel}
          onConfirm={onConfirm}
          title={confirmOptions.title}
          description={confirmOptions.description}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
          variant={confirmOptions.variant}
        />
      </div>
    );
  }

  // ── 풀 모드 (사진 0장) ──
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-stone-700">참조 사진을 먼저 업로드하세요</p>
        <p className="text-xs text-stone-500 mt-1">
          AI가 얼굴을 학습하려면 신랑/신부 참조 사진이 필요합니다 (최소 1명)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {ROLES.map((role) => {
          const existing = getExisting(role);
          const pending = pendingFiles[role];
          const isUploading = uploading === role;
          const label = ROLE_LABELS[role];
          const inputRef = getInputRef(role);
          const imageUrl = pending?.preview ?? existing?.originalUrl;
          const warning = getWarning(role);

          return (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs font-medium text-stone-600">{label}</span>
                {existing && !pending && (
                  <span className="ml-auto text-xs text-emerald-600 flex items-center gap-0.5">
                    <Check className="w-3 h-3" />
                    등록됨
                  </span>
                )}
              </div>

              <div
                onClick={() => !isUploading && !imageUrl && inputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                  aspect-[3/4] overflow-hidden transition-colors
                  ${imageUrl ? 'border-transparent' : 'border-stone-200 hover:border-rose-300 cursor-pointer bg-white'}
                  ${isUploading ? 'pointer-events-none' : ''}
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, role);
                  }}
                  className="hidden"
                />

                {isUploading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    <span className="text-xs text-stone-500">업로드 중...</span>
                  </div>
                )}

                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt={`${label} 참조`} className="h-full w-full object-cover rounded-xl" />
                    {!existing && pending && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFileRemove(role); }}
                        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {pending && existing && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleFileRemove(role); }}
                        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                      className="absolute bottom-2 inset-x-2 z-10 rounded-lg bg-black/50 py-1.5 text-xs font-medium text-white hover:bg-black/70 transition-colors"
                    >
                      {existing && !pending ? '변경' : '다른 사진'}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
                      <Camera className="w-5 h-5 text-stone-400" />
                    </div>
                    <p className="text-xs text-stone-500">탭하여 {label} 사진 선택</p>
                  </div>
                )}
              </div>

              {/* 업로드 버튼 (펜딩 파일이 있을 때) */}
              {pending && (
                <button
                  onClick={() => handleConfirmUpload(role)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
                >
                  <Upload className="w-3.5 h-3.5" />
                  업로드하기
                </button>
              )}

              {/* 얼굴 미감지 경고 */}
              {warning && !pending && (
                <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{warning}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {uploadError && (
        <p className="text-xs text-red-500 text-center">{uploadError}</p>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={onCancel}
        onConfirm={onConfirm}
        title={confirmOptions.title}
        description={confirmOptions.description}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        variant={confirmOptions.variant}
      />
    </div>
  );
}
