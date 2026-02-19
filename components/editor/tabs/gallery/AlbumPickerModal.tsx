'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  Loader2,
  ImageIcon,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import type { AlbumImage } from '@/types/ai';

// ── Types ──

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  images: AlbumImage[];
  status: string;
}

type AlbumStep = 'list' | 'photos';

interface AlbumPickerModalProps {
  isOpen: boolean;
  existingUrls: string[];
  remainingCapacity: number;
  onClose: () => void;
  onPhotosAdded: (urls: string[]) => void;
}

// ── Component ──

export function AlbumPickerModal({
  isOpen,
  existingUrls,
  remainingCapacity,
  onClose,
  onPhotosAdded,
}: AlbumPickerModalProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumStep, setAlbumStep] = useState<AlbumStep>('list');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const existingSet = new Set(existingUrls);

  // 앨범 fetch
  const fetchAlbums = useCallback(async () => {
    setAlbumsLoading(true);
    try {
      const res = await fetch('/api/ai/albums');
      const data = await res.json();
      if (data.success) {
        setAlbums(data.data);
        // 앨범이 1개면 자동으로 사진 그리드
        if (data.data.length === 1) {
          setSelectedAlbumId(data.data[0].id);
          setAlbumStep('photos');
        }
      }
    } catch {
      // ignore
    } finally {
      setAlbumsLoading(false);
    }
  }, []);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setAlbumStep('list');
      setSelectedAlbumId(null);
      setSelectedUrls(new Set());
      fetchAlbums();
    }
  }, [isOpen, fetchAlbums]);

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId);

  const handleAlbumSelect = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setSelectedUrls(new Set());
    setAlbumStep('photos');
  };

  const handleTogglePhoto = (url: string) => {
    if (existingSet.has(url)) return;
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        if (next.size >= remainingCapacity) return prev;
        next.add(url);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onPhotosAdded([...selectedUrls]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full sm:max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-stone-900">
            앨범에서 가져오기
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AlbumContent
            albums={albums}
            loading={albumsLoading}
            step={albumStep}
            selectedAlbum={selectedAlbum ?? null}
            selectedUrls={selectedUrls}
            existingSet={existingSet}
            remainingCapacity={remainingCapacity}
            onAlbumSelect={handleAlbumSelect}
            onTogglePhoto={handleTogglePhoto}
            onBackToList={() => {
              setAlbumStep('list');
              setSelectedAlbumId(null);
              setSelectedUrls(new Set());
            }}
          />
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200 bg-stone-50">
          <span className="text-xs text-stone-500">
            남은 슬롯: {remainingCapacity}장
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedUrls.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:bg-stone-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {selectedUrls.size > 0
                ? `${selectedUrls.size}장 추가`
                : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Album Content ──

function AlbumContent({
  albums,
  loading,
  step,
  selectedAlbum,
  selectedUrls,
  existingSet,
  remainingCapacity,
  onAlbumSelect,
  onTogglePhoto,
  onBackToList,
}: {
  albums: Album[];
  loading: boolean;
  step: AlbumStep;
  selectedAlbum: Album | null;
  selectedUrls: Set<string>;
  existingSet: Set<string>;
  remainingCapacity: number;
  onAlbumSelect: (id: string) => void;
  onTogglePhoto: (url: string) => void;
  onBackToList: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        <p className="text-sm text-stone-500">앨범 불러오는 중...</p>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-stone-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-700">
            아직 앨범이 없어요
          </p>
          <p className="text-xs text-stone-500 mt-1">
            AI 포토 스튜디오에서 먼저 사진을 만들어보세요
          </p>
        </div>
        <a
          href="/ai-photos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 mt-1"
        >
          <Sparkles className="w-4 h-4" />
          AI 포토 스튜디오 열기
        </a>
      </div>
    );
  }

  // 앨범 목록
  if (step === 'list') {
    return (
      <div className="space-y-2">
        {albums.map((album) => {
          const imageCount = (album.images ?? []).length;
          const thumbUrl = album.images?.[0]?.url;
          return (
            <button
              key={album.id}
              onClick={() => onAlbumSelect(album.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-pink-200 hover:bg-pink-50/30 transition-colors text-left"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-stone-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {album.name}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {imageCount > 0 ? `사진 ${imageCount}장` : '사진 없음'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // 사진 그리드
  if (!selectedAlbum) return null;
  const images = selectedAlbum.images ?? [];

  return (
    <div className="space-y-3">
      {/* 뒤로가기 (앨범 2개 이상) */}
      {albums.length > 1 && (
        <button
          onClick={onBackToList}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          앨범 목록
        </button>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-800">
          {selectedAlbum.name}
        </p>
        <span className="text-xs text-stone-500">
          {selectedUrls.size}장 선택
          {remainingCapacity > 0 && ` / 최대 ${remainingCapacity}장`}
        </span>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-stone-500">이 앨범에 사진이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => {
            const isExisting = existingSet.has(img.url);
            const isSelected = selectedUrls.has(img.url);
            const isDisabled =
              isExisting ||
              (!isSelected && selectedUrls.size >= remainingCapacity);

            return (
              <button
                key={img.url}
                onClick={() => onTogglePhoto(img.url)}
                disabled={isDisabled}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  isExisting
                    ? 'border-stone-200 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-pink-500 ring-2 ring-pink-500/20'
                    : isDisabled
                    ? 'border-stone-200 opacity-40 cursor-not-allowed'
                    : 'border-transparent hover:border-stone-300'
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {isExisting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="text-[10px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-full">
                      추가됨
                    </span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20">
                    <div className="rounded-full bg-pink-500 p-1">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
