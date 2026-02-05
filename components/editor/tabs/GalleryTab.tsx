'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { GALLERY_CONFIG } from '@/lib/ai/constants';

export function GalleryTab() {
  const { invitation, updateInvitation } = useInvitationEditor();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const images = invitation.gallery?.images || [];
  const limit = GALLERY_CONFIG.FREE_LIMIT; // TODO: 유저 tier에 따라 동적으로

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError(null);

    if (!invitation.id) {
      setError('청첩장을 먼저 저장해주세요');
      return;
    }

    // 프론트 검증
    if (files.length > GALLERY_CONFIG.MAX_BATCH) {
      setError(`한 번에 최대 ${GALLERY_CONFIG.MAX_BATCH}장까지 업로드 가능합니다`);
      e.target.value = '';
      return;
    }

    const oversized = files.filter(
      (f) => f.size > GALLERY_CONFIG.MAX_FILE_SIZE
    );
    if (oversized.length) {
      setError(
        `${oversized.map((f) => f.name).join(', ')} 파일이 10MB를 초과합니다`
      );
      e.target.value = '';
      return;
    }

    const remaining = limit - images.length;
    if (remaining <= 0) {
      setError(`갤러리 한도에 도달했습니다 (${limit}장)`);
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.slice(0, remaining).forEach((f) => formData.append('files', f));
      formData.append('invitationId', invitation.id);

      const res = await fetch('/api/upload/gallery', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || '업로드 실패');
      }

      // Store 업데이트 → 자동 저장 트리거
      updateInvitation({
        gallery: {
          ...invitation.gallery,
          images: [...images, ...json.data.urls],
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_: string, i: number) => i !== index);
    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: updated,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">갤러리</h2>
        <p className="text-sm text-stone-500">
          청첩장에 담을 사진을 업로드하세요
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 업로드 버튼 */}
      <div className="bg-white rounded-xl p-6 border border-stone-200">
        <label
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl transition-colors group ${
            uploading
              ? 'border-stone-300 bg-stone-50 cursor-wait'
              : 'bg-white border-stone-300 cursor-pointer hover:border-pink-300 hover:bg-pink-50/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-stone-500 mb-2 animate-spin" />
                <p className="text-sm text-stone-600 font-medium mb-1">
                  업로드 중...
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-stone-400 group-hover:text-pink-400 mb-2 transition-colors" />
                <p className="text-sm text-stone-700 font-medium mb-1">
                  클릭하여 사진 업로드
                </p>
              </>
            )}
            <p className="text-xs text-stone-500">
              {images.length}/{limit}장 ・ 최대 10MB/장
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* 이미지 그리드 */}
      {images.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <h3 className="text-sm font-medium text-stone-700 mb-4">
            업로드된 사진 ({images.length}장)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {images.map((image: string, index: number) => (
              <div
                key={`${image}-${index}`}
                className="relative aspect-square bg-stone-100 rounded-lg overflow-hidden group"
              >
                <img
                  src={image}
                  alt={`갤러리 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 생성 사진 안내 */}
      <div className="bg-pink-50/30 rounded-xl p-5 border border-stone-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-stone-900 mb-1 text-sm">
                AI 웨딩 사진 생성
              </h4>
              <p className="text-xs text-stone-600 mb-3">
                증명 사진만 있으면 AI가 웨딩 화보를 만들어드립니다
              </p>

              <button className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                AI 사진 생성하기
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}
