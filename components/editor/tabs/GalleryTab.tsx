'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import { GalleryImageGrid } from './gallery/GalleryImageGrid';
import { AIPhotoSection } from './gallery/AIPhotoSection';

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

  const handleAddAIPhotos = (selectedUrls: string[]) => {
    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: [...images, ...selectedUrls],
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

      {/* 일반 사진 업로드 섹션 */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-stone-700">일반 사진</h3>

        {/* 업로드 버튼 */}
        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <label
            className={`flex flex-col items-center justify-center w-full h-24 md:h-36 border-2 border-dashed rounded-xl transition-colors group ${
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
        <GalleryImageGrid images={images} onRemove={handleRemoveImage} />
      </section>

      {/* AI 웨딩 사진 섹션 */}
      <AIPhotoSection
        invitationId={invitation.id ?? null}
        onAddToGallery={handleAddAIPhotos}
      />
    </div>
  );
}
