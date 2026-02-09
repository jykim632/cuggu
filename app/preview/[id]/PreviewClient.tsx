'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Invitation } from '@/schemas/invitation';
import { getTemplateComponent } from '@/lib/templates/get-template';
import { BaseTemplate } from '@/components/templates/BaseTemplate';
import { PreviewViewport } from '@/components/preview/PreviewViewport';
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type ViewMode = 'desktop' | 'mobile' | 'phone';

interface PreviewClientProps {
  data: Invitation;
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch {}
  }, [key]);

  const setAndPersist = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };

  return [value, setAndPersist];
}

export function PreviewClient({ data }: PreviewClientProps) {
  const [mode, setMode] = useLocalStorage<ViewMode>('cuggu-preview-mode', 'mobile');
  const [phoneModel, setPhoneModel] = useLocalStorage<'iphone' | 'galaxy'>('cuggu-preview-phone', 'iphone');
  const [zoom, setZoom] = useLocalStorage<number>('cuggu-preview-zoom', 100);

  const isCustom = data.templateId === 'custom' && (data as any).customTheme;
  const TemplateComponent = getTemplateComponent(data.templateId);

  const modeButtons: { value: ViewMode; label: string; icon: typeof Monitor }[] = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'mobile', label: 'Mobile', icon: Tablet },
    { value: 'phone', label: 'Phone', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen bg-stone-100">
      {/* 고정 상단 툴바 */}
      <header className="h-14 fixed top-0 inset-x-0 z-50 bg-white border-b border-stone-200 grid grid-cols-[1fr_auto_1fr] items-center px-4">
        {/* 좌측: 편집기로 돌아가기 */}
        <div className="flex items-center">
          <Link
            href={`/editor/${data.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            편집기
          </Link>
        </div>

        {/* 중앙: 뷰 모드 선택 */}
        <div className="flex gap-1 bg-stone-200 rounded-lg p-0.5">
          {modeButtons.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                mode === value
                  ? 'bg-white shadow-sm text-stone-900 font-medium'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* 우측: Phone 모드 전용 컨트롤 */}
        <div className="flex items-center justify-end gap-3">
          {mode === 'phone' && (
            <>
              {/* 폰 모델 선택 */}
              <div className="flex gap-1 bg-stone-100 rounded-md p-0.5">
                <button
                  onClick={() => setPhoneModel('iphone')}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    phoneModel === 'iphone'
                      ? 'bg-white shadow-sm text-stone-900 font-medium'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  iPhone
                </button>
                <button
                  onClick={() => setPhoneModel('galaxy')}
                  className={`px-2 py-1 text-xs rounded transition-all ${
                    phoneModel === 'galaxy'
                      ? 'bg-white shadow-sm text-stone-900 font-medium'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  Galaxy
                </button>
              </div>

              {/* 줌 컨트롤 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1 hover:bg-stone-100 rounded transition-colors disabled:opacity-30"
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-4 h-4 text-stone-600" />
                </button>
                <span className="text-xs text-stone-500 font-mono w-8 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="p-1 hover:bg-stone-100 rounded transition-colors disabled:opacity-30"
                  disabled={zoom >= 150}
                >
                  <ZoomIn className="w-4 h-4 text-stone-600" />
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 뷰포트 */}
      <div className="pt-14 min-h-screen flex justify-center">
        <div className={`${mode === 'phone' ? 'py-8' : mode === 'mobile' ? 'py-8' : 'w-full'}`}>
          <PreviewViewport
            mode={mode}
            phoneModel={phoneModel}
            zoom={mode === 'phone' ? zoom : 100}
          >
            {isCustom ? (
              <BaseTemplate data={data} theme={(data as any).customTheme} isPreview={mode === 'phone'} />
            ) : (
              <TemplateComponent data={data} isPreview={mode === 'phone'} />
            )}
          </PreviewViewport>
        </div>
      </div>
    </div>
  );
}
