'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { Check, Lock, Sparkles } from 'lucide-react';

/** 각 템플릿의 색상/레이아웃 특성을 보여주는 미니 프리뷰 */
function TemplateMiniPreview({ templateId }: { templateId: string }) {
  switch (templateId) {
    case 'classic':
      return (
        <div className="w-full h-full bg-gradient-to-b from-amber-50 via-white to-amber-50 flex flex-col items-center justify-center p-3 gap-2">
          <div className="text-amber-300 text-lg">&#x2728;</div>
          <div className="text-[6px] tracking-[0.2em] text-amber-700 uppercase">Wedding</div>
          <div className="w-6 h-px bg-amber-200" />
          <div className="space-y-0.5 text-center">
            <div className="h-1.5 w-8 bg-amber-800/40 rounded-full mx-auto" />
            <div className="text-[5px] text-amber-500">&</div>
            <div className="h-1.5 w-8 bg-amber-800/40 rounded-full mx-auto" />
          </div>
          <div className="w-6 h-px bg-amber-200 mt-1" />
          <div className="space-y-0.5 mt-1">
            <div className="h-1 w-10 bg-amber-200 rounded-full mx-auto" />
            <div className="h-1 w-8 bg-amber-200 rounded-full mx-auto" />
          </div>
        </div>
      );

    case 'modern':
      return (
        <div className="w-full h-full bg-zinc-900 flex flex-col justify-end p-3 gap-1.5">
          <div className="text-[5px] tracking-[0.3em] text-emerald-400 uppercase">Wedding</div>
          <div className="h-2.5 w-12 bg-white/90 rounded-sm" />
          <div className="flex items-center gap-1.5">
            <div className="h-px w-3 bg-emerald-400" />
            <div className="text-[5px] text-emerald-400">&</div>
            <div className="h-px w-3 bg-emerald-400" />
          </div>
          <div className="h-2.5 w-10 bg-white/90 rounded-sm" />
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-8 bg-zinc-600 rounded-full" />
            <div className="h-0.5 w-6 bg-zinc-600 rounded-full" />
          </div>
        </div>
      );

    case 'minimal':
      return (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3 gap-2">
          <div className="text-[5px] tracking-[0.4em] text-stone-300 uppercase">Wedding</div>
          <div className="mt-2 space-y-1.5 text-center">
            <div className="h-1.5 w-9 bg-stone-800/30 rounded-full mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-4 bg-stone-200" />
              <div className="h-px w-4 bg-stone-200" />
            </div>
            <div className="h-1.5 w-9 bg-stone-800/30 rounded-full mx-auto" />
          </div>
          <div className="h-4 w-px bg-stone-200 mt-2" />
          <div className="space-y-0.5">
            <div className="h-0.5 w-6 bg-stone-200 rounded-full mx-auto" />
            <div className="h-0.5 w-5 bg-stone-200 rounded-full mx-auto" />
          </div>
        </div>
      );

    case 'floral':
      return (
        <div className="w-full h-full bg-gradient-to-b from-rose-50 via-pink-50 to-rose-50 flex flex-col items-center justify-center p-3 gap-1.5">
          <div className="text-rose-300 text-xs">&#x1F33A;</div>
          <div className="text-[5px] tracking-[0.2em] text-rose-400">Wedding</div>
          <div className="bg-white/60 rounded-xl px-3 py-2 border border-rose-100 mt-1">
            <div className="space-y-0.5 text-center">
              <div className="h-1.5 w-7 bg-rose-800/30 rounded-full mx-auto" />
              <div className="text-[5px] text-rose-300">&</div>
              <div className="h-1.5 w-7 bg-rose-800/30 rounded-full mx-auto" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-px w-3 bg-rose-200" />
            <div className="text-rose-200 text-[6px]">&#x2740;</div>
            <div className="h-px w-3 bg-rose-200" />
          </div>
          <div className="text-rose-300 text-[8px]">&#x1F338;</div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <div className="text-slate-400 text-xs">Preview</div>
        </div>
      );
  }
}
export function TemplateTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const templates = [
    {
      id: 'classic',
      name: 'Classic',
      description: '전통적인 웨딩 스타일',
      tier: 'FREE',
    },
    {
      id: 'modern',
      name: 'Modern',
      description: '대담한 타이포그래피',
      tier: 'FREE',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: '여백의 미, 흑백 톤',
      tier: 'FREE',
    },
    {
      id: 'floral',
      name: 'Floral',
      description: '꽃무늬 파스텔 디자인',
      tier: 'FREE',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">템플릿</h2>
        <p className="text-sm text-stone-500">청첩장 디자인을 선택하세요</p>
      </div>

      {/* 무료 템플릿 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-stone-700">무료 템플릿</h3>
          <span className="text-xs text-stone-500">• {templates.filter((t) => t.tier === 'FREE').length}개</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {templates
            .filter((t) => t.tier === 'FREE')
            .map((template) => {
              const isSelected = invitation.templateId === template.id;

              return (
                <button
                  key={template.id}
                  onClick={() => updateInvitation({ templateId: template.id })}
                  className={`
                    group relative p-3 rounded-xl text-left transition-all
                    ${
                      isSelected
                        ? 'ring-2 ring-pink-500 ring-offset-2 shadow-lg'
                        : 'hover:shadow-md hover:scale-[1.02]'
                    }
                  `}
                >
                  {/* 미니 프리뷰 */}
                  <div className="relative aspect-[3/4] rounded-lg mb-3 overflow-hidden">
                    <TemplateMiniPreview templateId={template.id} />

                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg z-10">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div>
                    <h4 className="font-medium text-sm text-stone-900">{template.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* 프리미엄 템플릿 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-stone-700">프리미엄 템플릿</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-pink-500 rounded-full">
            <Sparkles className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">Premium</span>
          </div>
        </div>

        {/* 업그레이드 CTA */}
        <div className="bg-pink-50/50 rounded-xl p-6 border border-stone-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-stone-900 mb-1">
                  20개 이상의 프리미엄 템플릿
                </h4>
                <p className="text-sm text-stone-500 mb-4">
                  전문가가 디자인한 고급 템플릿과 독점 기능을 이용하세요
                </p>

                <button className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  업그레이드 (9,900원)
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
