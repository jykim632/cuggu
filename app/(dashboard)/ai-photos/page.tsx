'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Gem, Loader2, Plus, ChevronLeft, ImageIcon, LayoutGrid, List, GalleryHorizontalEnd } from 'lucide-react';
import { AlbumImage, AlbumGroup } from '@/types/ai';
import { AlbumOnboarding } from './components/AlbumOnboarding';

const IS_DEV = process.env.NODE_ENV === 'development';
const MAX_ALBUMS = 3;

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  status: string;
  images: AlbumImage[];
  groups: AlbumGroup[];
  createdAt: string;
}

type ViewMode = 'card' | 'list' | 'gallery';

export default function AIPhotosPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('album-view-mode') as ViewMode) || 'card';
    }
    return 'card';
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('album-view-mode', mode);
  };

  useEffect(() => {
    fetchAlbums();
    fetchCredits();
  }, []);

  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/albums');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAlbums(data.data);
        setShowOnboarding(false);
      } else {
        setAlbums([]);
      }
    } catch {
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCredits(data.credits);
    } catch {
      // ignore
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const canCreateAlbum = albums.length < MAX_ALBUMS;

  const handleAlbumCreated = (albumId: string) => {
    router.push(`/ai-photos/${albumId}`);
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-semibold text-stone-900">AI 웨딩 앨범</h1>
          </div>
          <p className="text-sm text-stone-500">
            AI로 특별한 웨딩 화보를 만들어보세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
            {([
              { mode: 'card' as const, icon: LayoutGrid, label: '카드 뷰' },
              { mode: 'list' as const, icon: List, label: '리스트 뷰' },
              { mode: 'gallery' as const, icon: GalleryHorizontalEnd, label: '갤러리 뷰' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                title={label}
                className={`rounded-md p-1.5 transition-colors ${
                  viewMode === mode
                    ? 'bg-stone-200 text-stone-900'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
            <Gem className="w-3 h-3" />
            {isLoadingCredits ? '...' : IS_DEV ? '∞ DEV' : `${credits} 크레딧`}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-500">로딩 중...</p>
        </div>
      ) : albums.length === 0 || showOnboarding ? (
        <div className="space-y-4">
          {albums.length > 0 && (
            <button
              onClick={() => setShowOnboarding(false)}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
            >
              <ChevronLeft className="w-4 h-4" />
              앨범 리스트로 돌아가기
            </button>
          )}
          <AlbumOnboarding onAlbumCreated={handleAlbumCreated} />
        </div>
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((a) => {
                const imageCount = (a.images ?? []).length;
                const thumbUrl = a.images?.[0]?.url;
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/ai-photos/${a.id}`)}
                    className="group relative flex flex-col rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-rose-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-stone-50 overflow-hidden">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={a.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-stone-300" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-900">{a.name}</span>
                    <span className="text-xs text-stone-500 mt-0.5">
                      {imageCount > 0 ? `사진 ${imageCount}장` : '사진 없음'}
                    </span>
                  </button>
                );
              })}
              {canCreateAlbum && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 p-4 text-stone-500 transition-colors hover:border-rose-300 hover:text-rose-600 min-h-[180px]"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">새 앨범 만들기</span>
                </button>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="flex flex-col gap-2">
              {albums.map((a) => {
                const imageCount = (a.images ?? []).length;
                const thumbUrl = a.images?.[0]?.url;
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/ai-photos/${a.id}`)}
                    className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition-all hover:bg-stone-50 hover:border-rose-200"
                  >
                    <div className="flex w-16 h-12 flex-shrink-0 items-center justify-center rounded-lg bg-stone-50 overflow-hidden">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={a.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-stone-300" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-900 min-w-0 truncate flex-1">{a.name}</span>
                    {a.snapType && (
                      <span className="flex-shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">
                        {a.snapType}
                      </span>
                    )}
                    <span className="flex-shrink-0 text-xs text-stone-500">
                      {imageCount > 0 ? `${imageCount}장` : '비어있음'}
                    </span>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {a.status === 'active' ? '활성' : a.status}
                    </span>
                    <span className="flex-shrink-0 text-xs text-stone-400">
                      {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </button>
                );
              })}
              {canCreateAlbum && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-stone-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">새 앨범 만들기</span>
                </button>
              )}
            </div>
          )}

          {/* Gallery View */}
          {viewMode === 'gallery' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {albums.map((a) => {
                const imageCount = (a.images ?? []).length;
                const previewImages = (a.images ?? []).slice(0, 4);
                return (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/ai-photos/${a.id}`)}
                    className="group relative flex flex-col rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-rose-200 hover:shadow-md"
                  >
                    <div className="mb-3 h-48 rounded-lg bg-stone-50 overflow-hidden">
                      {previewImages.length > 0 ? (
                        <div className={`grid h-full w-full ${
                          previewImages.length === 1 ? 'grid-cols-1' :
                          previewImages.length === 2 ? 'grid-cols-2' :
                          'grid-cols-2 grid-rows-2'
                        } gap-0.5`}>
                          {previewImages.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={`${a.name} ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-900">{a.name}</span>
                    <span className="text-xs text-stone-500 mt-0.5">
                      {imageCount > 0 ? `사진 ${imageCount}장` : '사진 없음'}
                    </span>
                  </button>
                );
              })}
              {canCreateAlbum && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 p-4 text-stone-500 transition-colors hover:border-rose-300 hover:text-rose-600 min-h-[256px]"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-sm font-medium">새 앨범 만들기</span>
                </button>
              )}
            </div>
          )}
          {!canCreateAlbum && (
            <p className="text-center text-xs text-stone-400 pt-2">
              앨범은 최대 {MAX_ALBUMS}개까지 만들 수 있습니다
            </p>
          )}
        </>
      )}
    </div>
  );
}
