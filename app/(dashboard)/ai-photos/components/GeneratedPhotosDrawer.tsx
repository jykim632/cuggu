'use client';

import { useState, useMemo, useCallback } from 'react';
import { Check, CheckSquare, Download, Loader2, Plus, Square } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { GalleryLightbox } from '@/components/templates/GalleryLightbox';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useImageDownload } from '@/hooks/useImageDownload';
import { AI_STYLES, type AIStyle, type AlbumImage } from '@/types/ai';

interface Generation {
  id: string;
  style: string;
  role: string | null;
  generatedUrls: string[] | null;
  createdAt: string;
}

interface GeneratedPhotosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  generations: Generation[];
  curatedImages: AlbumImage[];
  onAddToAlbum: (gen: Generation, url: string) => void;
  onAddMultipleToAlbum: (urls: { gen: Generation; url: string }[]) => void;
}

export function GeneratedPhotosDrawer({
  isOpen,
  onClose,
  generations,
  curatedImages,
  onAddToAlbum,
  onAddMultipleToAlbum,
}: GeneratedPhotosDrawerProps) {
  const [mode, setMode] = useState<'browse' | 'select'>('browse');
  const [styleFilter, setStyleFilter] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 스타일별 그룹핑
  const generationsByStyle = useMemo(() => {
    return generations.reduce((acc, gen) => {
      const key = gen.style;
      if (!acc[key]) acc[key] = [];
      acc[key].push(gen);
      return acc;
    }, {} as Record<string, Generation[]>);
  }, [generations]);

  // 필터된 스타일 목록
  const filteredStyles = useMemo(() => {
    const styles = Object.keys(generationsByStyle);
    if (!styleFilter) return styles;
    return styles.filter((s) => s === styleFilter);
  }, [generationsByStyle, styleFilter]);

  // 모든 URL (필터 후) — lightbox용
  const allFilteredUrls = useMemo(() => {
    const urls: string[] = [];
    for (const style of filteredStyles) {
      for (const gen of generationsByStyle[style]) {
        for (const url of gen.generatedUrls ?? []) {
          urls.push(url);
        }
      }
    }
    return urls;
  }, [filteredStyles, generationsByStyle]);

  const curatedUrlSet = useMemo(
    () => new Set(curatedImages.map((img) => img.url)),
    [curatedImages],
  );

  const selection = useMultiSelect(allFilteredUrls);
  const { downloadSingle, downloadMultiple, isDownloading, progress } = useImageDownload();

  // URL → Generation 매핑
  const urlToGen = useMemo(() => {
    const map = new Map<string, Generation>();
    for (const gen of generations) {
      for (const url of gen.generatedUrls ?? []) {
        map.set(url, gen);
      }
    }
    return map;
  }, [generations]);

  const handleImageClick = useCallback((url: string) => {
    if (mode === 'select') {
      selection.toggle(url);
    } else {
      const index = allFilteredUrls.indexOf(url);
      if (index !== -1) setLightboxIndex(index);
    }
  }, [mode, selection, allFilteredUrls]);

  const handleAddSelected = useCallback(() => {
    const items = selection.selectedArray
      .filter((url) => !curatedUrlSet.has(url))
      .map((url) => ({ gen: urlToGen.get(url)!, url }))
      .filter((item) => item.gen);
    if (items.length > 0) onAddMultipleToAlbum(items);
    selection.deselectAll();
    setMode('browse');
  }, [selection, curatedUrlSet, urlToGen, onAddMultipleToAlbum]);

  const handleDownloadSelected = useCallback(async () => {
    if (selection.selectedCount === 0) return;
    await downloadMultiple(selection.selectedArray, 'ai-photos.zip');
  }, [selection, downloadMultiple]);

  const handleToggleMode = useCallback(() => {
    if (mode === 'select') {
      selection.deselectAll();
      setMode('browse');
    } else {
      setMode('select');
    }
  }, [mode, selection]);

  const totalCount = generations.reduce(
    (sum, g) => sum + (g.generatedUrls?.length ?? 0), 0
  );

  // 스타일 칩 목록
  const availableStyles = Object.keys(generationsByStyle);

  return (
    <>
      <SlidePanel
        isOpen={isOpen}
        onClose={onClose}
        title={`생성된 사진 (${totalCount}장)`}
        headerRight={
          <button
            onClick={handleToggleMode}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === 'select'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {mode === 'select' ? '완료' : '선택'}
          </button>
        }
        footer={mode === 'select' && selection.selectedCount > 0 ? (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-700">
                {selection.selectedCount}장 선택
              </span>
              <button
                onClick={selection.selectedCount === allFilteredUrls.length ? selection.deselectAll : selection.selectAll}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                {selection.selectedCount === allFilteredUrls.length ? '선택 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSelected}
                disabled={selection.selectedArray.every((url) => curatedUrlSet.has(url))}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:bg-stone-300"
              >
                <Plus className="w-3.5 h-3.5" />
                앨범에 추가
              </button>
              <button
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    다운로드
                  </>
                )}
              </button>
            </div>
          </div>
        ) : undefined}
      >
        <div className="space-y-4 p-4">
          {/* 스타일 필터 칩 */}
          {availableStyles.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setStyleFilter(null)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  styleFilter === null
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                전체
              </button>
              {availableStyles.map((style) => {
                const info = AI_STYLES.find((s) => s.value === style);
                return (
                  <button
                    key={style}
                    onClick={() => setStyleFilter(styleFilter === style ? null : style)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      styleFilter === style
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {info?.label ?? style}
                  </button>
                );
              })}
            </div>
          )}

          {/* 선택 모드: 전체 선택 바 */}
          {mode === 'select' && allFilteredUrls.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
              <span className="text-xs text-stone-500">
                {selection.selectedCount > 0
                  ? `${selection.selectedCount} / ${allFilteredUrls.length}장 선택됨`
                  : `${allFilteredUrls.length}장`
                }
              </span>
              <button
                onClick={selection.selectedCount === allFilteredUrls.length ? selection.deselectAll : selection.selectAll}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                {selection.selectedCount === allFilteredUrls.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
          )}

          {/* 스타일별 사진 그리드 */}
          {filteredStyles.map((style) => {
            const gens = generationsByStyle[style];
            const info = AI_STYLES.find((s) => s.value === style);
            const styleUrls = gens.flatMap((g) => g.generatedUrls ?? []);

            return (
              <div key={style} className="space-y-2">
                <p className="text-xs font-medium text-stone-500">
                  {info?.label ?? style} ({styleUrls.length}장)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {gens.flatMap((gen) =>
                    (gen.generatedUrls ?? []).map((url) => {
                      const isInAlbum = curatedUrlSet.has(url);
                      const isChecked = selection.isSelected(url);

                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => handleImageClick(url)}
                          className={`
                            group relative aspect-square overflow-hidden rounded-lg border-2 transition-all
                            ${mode === 'select' && isChecked
                              ? 'border-rose-500 ring-2 ring-rose-500/20'
                              : 'border-stone-200 hover:border-stone-300'
                            }
                          `}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />

                          {/* 앨범 포함 badge */}
                          {isInAlbum && (
                            <div className="absolute top-1 left-1 rounded-full bg-rose-500 p-0.5">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}

                          {/* 선택 모드 체크박스 */}
                          {mode === 'select' && (
                            <div className="absolute top-1 right-1">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-rose-500 drop-shadow" />
                              ) : (
                                <Square className="w-5 h-5 text-white/80 drop-shadow" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {allFilteredUrls.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-stone-500">생성된 사진이 없습니다</p>
            </div>
          )}
        </div>
      </SlidePanel>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <GalleryLightbox
            images={allFilteredUrls}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            actions={(currentUrl) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSingle(currentUrl);
                  }}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const gen = urlToGen.get(currentUrl);
                    if (gen) {
                      if (curatedUrlSet.has(currentUrl)) {
                        // 이미 있으면 제거 (toggle)
                        onAddToAlbum(gen, currentUrl);
                      } else {
                        onAddToAlbum(gen, currentUrl);
                      }
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    curatedUrlSet.has(currentUrl)
                      ? 'bg-rose-500/80 text-white hover:bg-rose-600/80'
                      : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'
                  }`}
                >
                  {curatedUrlSet.has(currentUrl) ? (
                    <>
                      <Check className="w-4 h-4" />
                      앨범에서 제거
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      앨범에 추가
                    </>
                  )}
                </button>
              </div>
            )}
          />
        )}
      </AnimatePresence>
    </>
  );
}
