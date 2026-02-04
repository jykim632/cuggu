'use client';

import { useState, useMemo } from 'react';
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ZoomIn, ZoomOut, Smartphone, Monitor, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  invitation: any; // TODO: Invitation 타입
}

/**
 * 우측 실시간 미리보기 패널
 *
 * - 모바일/데스크톱 뷰 전환
 * - 줌 컨트롤 (50% ~ 150%)
 * - 실시간 템플릿 렌더링
 */
export function PreviewPanel({ invitation }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(100);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [phoneModel, setPhoneModel] = useState<'iphone' | 'galaxy'>('iphone');

  // 미리보기용 데이터 변환 (기본값 채우기)
  const previewData = useMemo(() => {
    return {
      id: invitation.id || 'preview',
      userId: invitation.userId || 'user',
      templateId: invitation.templateId || 'classic',

      groom: invitation.groom || { name: '신랑' },
      bride: invitation.bride || { name: '신부' },

      wedding: invitation.wedding || {
        date: new Date().toISOString(),
        venue: {
          name: '예식장',
          address: '주소를 입력하세요',
        },
      },

      content: invitation.content || { greeting: '' },
      gallery: invitation.gallery || { images: [] },
      settings: invitation.settings || {},

      isPasswordProtected: invitation.isPasswordProtected || false,
      status: 'DRAFT' as const,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [invitation]);

  // 템플릿 컴포넌트 선택
  const getTemplateComponent = (templateId: string) => {
    switch (templateId) {
      case 'classic':
        return ClassicTemplate;
      // case 'modern':
      //   return ModernTemplate;
      // case 'vintage':
      //   return VintageTemplate;
      default:
        return ClassicTemplate;
    }
  };

  const TemplateComponent = getTemplateComponent(invitation.templateId || 'classic');

  return (
    <aside className="w-[420px] bg-gradient-to-br from-pink-50/30 via-white to-rose-50/30 flex flex-col flex-shrink-0 shadow-sm">
      {/* 컨트롤 */}
      <div className="p-4 bg-white/60 backdrop-blur-md">
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Preview</span>

            {/* 디바이스 전환 */}
            <div className="flex gap-1 bg-slate-200 rounded-md p-0.5">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded transition-all ${
                  device === 'mobile'
                    ? 'bg-white shadow-sm text-pink-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="모바일"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded transition-all ${
                  device === 'desktop'
                    ? 'bg-white shadow-sm text-pink-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="데스크톱"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 폰 모델 선택 (모바일일 때만) */}
          {device === 'mobile' && (
            <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
              <button
                onClick={() => setPhoneModel('iphone')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                  phoneModel === 'iphone'
                    ? 'bg-white shadow-sm text-pink-600 font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                iPhone
              </button>
              <button
                onClick={() => setPhoneModel('galaxy')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                  phoneModel === 'galaxy'
                    ? 'bg-white shadow-sm text-pink-600 font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Galaxy
              </button>
            </div>
          )}
        </div>

        {/* 줌 조절 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <input
            type="range"
            min="50"
            max="150"
            step="25"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-600 [&::-webkit-slider-thumb]:cursor-pointer"
          />

          <button
            onClick={() => setZoom(Math.min(150, zoom + 25))}
            className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-30"
            disabled={zoom >= 150}
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <span className="text-xs text-slate-500 font-mono w-10 text-right">
            {zoom}%
          </span>
        </div>
      </div>

      {/* 미리보기 영역 - 폰 프레임 */}
      <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
        <div
          className="relative transition-transform origin-top"
          style={{
            transform: `scale(${zoom / 100})`,
          }}
        >
          {/* 폰 프레임 */}
          {device === 'mobile' && (
            <div className="absolute inset-0 -m-3">
              {phoneModel === 'iphone' ? (
                /* iPhone 프레임 */
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[3rem] shadow-2xl">
                  {/* 내부 베젤 */}
                  <div className="absolute inset-[3px] bg-black rounded-[2.8rem]" />

                  {/* Dynamic Island */}
                  <div className="absolute top-[25px] left-1/2 -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-full z-10" />

                  {/* 측면 버튼들 */}
                  <div className="absolute left-[-3px] top-[100px] w-[3px] h-[28px] bg-slate-700 rounded-l-sm" />
                  <div className="absolute left-[-3px] top-[150px] w-[3px] h-[50px] bg-slate-700 rounded-l-sm" />
                  <div className="absolute left-[-3px] top-[210px] w-[3px] h-[50px] bg-slate-700 rounded-l-sm" />
                  <div className="absolute right-[-3px] top-[180px] w-[3px] h-[70px] bg-slate-700 rounded-r-sm" />

                  {/* 하단 스피커 & 충전 포트 */}
                  <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <div className="flex gap-[3px]">
                      {[...Array(6)].map((_, i) => (
                        <div key={`left-${i}`} className="w-[3px] h-[3px] bg-slate-700 rounded-full" />
                      ))}
                    </div>
                    <div className="w-[30px] h-[4px] bg-slate-700 rounded-full" />
                    <div className="flex gap-[3px]">
                      {[...Array(6)].map((_, i) => (
                        <div key={`right-${i}`} className="w-[3px] h-[3px] bg-slate-700 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Galaxy 프레임 */
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl">
                  {/* 내부 베젤 */}
                  <div className="absolute inset-[3px] bg-black rounded-[2.3rem]" />

                  {/* 펀치홀 카메라 (중앙 상단) */}
                  <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-black rounded-full z-10 ring-[1px] ring-slate-700" />

                  {/* 측면 버튼들 */}
                  {/* 왼쪽 - 볼륨 업/다운 */}
                  <div className="absolute left-[-3px] top-[120px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
                  <div className="absolute left-[-3px] top-[180px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
                  {/* 오른쪽 - 전원 버튼 */}
                  <div className="absolute right-[-3px] top-[150px] w-[3px] h-[60px] bg-slate-600 rounded-r-sm" />

                  {/* 하단 스피커 & 충전 포트 */}
                  <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex items-center gap-4">
                    {/* 왼쪽 스피커 그릴 */}
                    <div className="flex gap-[2px]">
                      {[...Array(8)].map((_, i) => (
                        <div key={`left-${i}`} className="w-[2px] h-[2px] bg-slate-600 rounded-full" />
                      ))}
                    </div>
                    {/* USB-C 포트 */}
                    <div className="w-[35px] h-[5px] bg-slate-600 rounded-sm" />
                    {/* 오른쪽 스피커 그릴 */}
                    <div className="flex gap-[2px]">
                      {[...Array(8)].map((_, i) => (
                        <div key={`right-${i}`} className="w-[2px] h-[2px] bg-slate-600 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 실제 콘텐츠 */}
          <div
            className={`relative bg-white ${
              device === 'mobile'
                ? `w-[375px] h-[812px] overflow-y-auto shadow-inner ${
                    phoneModel === 'iphone' ? 'rounded-[2.75rem]' : 'rounded-[2.25rem]'
                  }`
                : 'w-full rounded-lg overflow-hidden shadow-xl'
            }`}
          >
            <TemplateComponent data={previewData} isPreview />
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 bg-white/60 backdrop-blur-md">
        <button
          onClick={() => window.open(`/inv/${invitation.id}`, '_blank')}
          disabled={!invitation.id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          새 탭에서 보기
        </button>
      </div>
    </aside>
  );
}
