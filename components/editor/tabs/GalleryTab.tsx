'use client';

import { useState, useRef } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import {
  Upload,
  ImageIcon,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { GALLERY_CONFIG } from '@/lib/ai/constants';
import { GalleryImageGrid } from './gallery/GalleryImageGrid';
import { AlbumPickerModal } from './gallery/AlbumPickerModal';

export function GalleryTab() {
  const { invitation, updateInvitation, toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const galleryEnabled = enabledSections.gallery !== false;
  const [error, setError] = useState<string | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = invitation.gallery?.images || [];
  const limit = GALLERY_CONFIG.FREE_LIMIT; // TODO: 유저 tier에 따라 동적으로
  const remaining = limit - images.length;

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_: string, i: number) => i !== index);
    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: updated,
      },
    });
  };

  // 기기 업로드 (인라인)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError(null);

    if (!invitation.id) {
      setError('청첩장을 먼저 저장해주세요');
      e.target.value = '';
      return;
    }

    if (files.length > GALLERY_CONFIG.MAX_BATCH) {
      setError(
        `한 번에 최대 ${GALLERY_CONFIG.MAX_BATCH}장까지 업로드 가능합니다`
      );
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

    const maxUpload = remaining;
    if (maxUpload <= 0) {
      setError('갤러리 한도에 도달했습니다');
      e.target.value = '';
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.slice(0, maxUpload).forEach((f) => formData.append('files', f));
      formData.append('invitationId', invitation.id);

      const res = await fetch('/api/upload/gallery', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || '업로드 실패');
      }

      const newUrls: string[] = json.data.urls;
      const existing = new Set(images);
      const deduped = newUrls.filter((u) => !existing.has(u));
      const toAdd = deduped.slice(0, remaining);

      if (toAdd.length > 0) {
        updateInvitation({
          gallery: {
            ...invitation.gallery,
            images: [...images, ...toAdd],
          },
        });
      }

      if (toAdd.length < files.length) {
        setError(
          `갤러리 한도(${limit}장)로 인해 ${toAdd.length}장만 추가되었습니다`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다'
      );
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 앨범 사진 추가
  const handleAlbumPhotosAdded = (urls: string[]) => {
    const existing = new Set(images);
    const newUrls = urls.filter((u) => !existing.has(u));
    if (!newUrls.length) {
      setShowAlbumPicker(false);
      return;
    }

    const toAdd = newUrls.slice(0, remaining);
    if (toAdd.length < newUrls.length) {
      setError(
        `갤러리 한도(${limit}장)로 인해 ${toAdd.length}장만 추가되었습니다`
      );
    } else {
      setError(null);
    }

    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: [...images, ...toAdd],
      },
    });
    setShowAlbumPicker(false);
  };

  const isFull = remaining <= 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1 flex items-center gap-2">
            갤러리
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${galleryEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
              {galleryEnabled ? '활성' : '비활성'}
            </span>
          </h2>
          <p className="text-sm text-stone-500">
            청첩장에 담을 사진을 추가하세요 ({images.length}/{limit})
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={galleryEnabled}
            onChange={(e) => toggleSection('gallery', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
        </label>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 업로드 진행률 (인라인) */}
      {uploading && (
        <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
          <span className="text-sm text-stone-600">업로드 중...</span>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading ? (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6 text-stone-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">
              소중한 순간을 담아보세요
            </p>
            <p className="text-xs text-stone-500 mt-1">
              사진을 업로드하거나 AI 앨범에서 추가해보세요
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Upload className="w-4 h-4" />
              사진 업로드
            </button>
            <button
              onClick={() => setShowAlbumPicker(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-stone-300 hover:border-pink-300 hover:bg-pink-50/30 text-stone-700 hover:text-pink-600 text-sm font-medium rounded-xl transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              앨범에서
            </button>
          </div>
        </div>
      ) : (
        /* 이미지 그리드 */
        <GalleryImageGrid images={images} onRemove={handleRemoveImage} />
      )}

      {/* 하단 액션 */}
      <div className="space-y-3">
        {images.length > 0 && (
          isFull ? (
            <div className="text-center py-3 text-sm text-stone-500">
              갤러리 한도에 도달했습니다 ({limit}장)
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 border-2 border-dashed border-stone-300 hover:border-pink-300 hover:bg-pink-50/30 rounded-xl text-sm font-medium text-stone-600 hover:text-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                사진 업로드
              </button>
              <button
                onClick={() => setShowAlbumPicker(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 border-2 border-dashed border-stone-300 hover:border-pink-300 hover:bg-pink-50/30 rounded-xl text-sm font-medium text-stone-600 hover:text-pink-600 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                앨범에서
              </button>
            </div>
          )
        )}

        {/* AI 포토 스튜디오 링크 */}
        <a
          href="/ai-photos"
          className="flex items-center justify-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI 포토 스튜디오 열기
        </a>
      </div>

      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        disabled={uploading || isFull}
        className="hidden"
      />

      {/* 앨범 피커 모달 */}
      <AlbumPickerModal
        isOpen={showAlbumPicker}
        existingUrls={images}
        remainingCapacity={remaining}
        onClose={() => setShowAlbumPicker(false)}
        onPhotosAdded={handleAlbumPhotosAdded}
      />
    </div>
  );
}
