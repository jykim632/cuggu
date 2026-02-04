'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { Upload, X } from 'lucide-react';

/**
 * 갤러리 탭
 *
 * TODO:
 * - 이미지 업로드
 * - 드래그 앤 드롭 정렬
 * - 이미지 삭제
 * - AI 생성 사진 추가
 */
export function GalleryTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: 실제 업로드 구현
    console.log('이미지 업로드:', e.target.files);
  };

  const handleRemoveImage = (index: number) => {
    const images = invitation.gallery?.images || [];
    const updated = images.filter((_, i) => i !== index);
    updateInvitation({
      gallery: {
        ...invitation.gallery,
        images: updated,
      },
    });
  };

  const images = invitation.gallery?.images || [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">갤러리</h2>
        <p className="text-sm text-slate-500">청첩장에 담을 사진을 업로드하세요</p>
      </div>

      {/* 업로드 버튼 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-pink-100/50">
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-pink-200/50 rounded-xl cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all group bg-gradient-to-br from-white to-pink-50/20">
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-pink-500 mb-2 transition-colors" />
            <p className="text-sm text-slate-700 font-medium mb-1">
              클릭하여 사진 업로드
            </p>
            <p className="text-xs text-slate-500">
              최대 20장 (무료) • 100장 (프리미엄)
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* 이미지 그리드 */}
      {images.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-pink-100/50">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            업로드된 사진 ({images.length}장)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {images.map((image: any, index: number) => (
              <div
                key={index}
                className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden group"
              >
                <img
                  src={image.url}
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
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition-opacity" />
        <div className="relative bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1 text-sm">
                AI 웨딩 사진 생성
              </h4>
              <p className="text-xs text-slate-600 mb-3">
                증명 사진만 있으면 AI가 웨딩 화보를 만들어드립니다
              </p>

              <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                AI 사진 생성하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
