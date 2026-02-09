'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/components/ui/Toast';
import { Check, Lock, Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';

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

    case 'elegant':
      return (
        <div className="w-full h-full bg-gradient-to-b from-amber-50/30 via-white to-slate-100 flex flex-col items-center justify-center p-3 gap-1.5">
          <div className="flex items-center gap-1">
            <div className="h-px w-3 bg-amber-400/60" />
            <div className="w-1.5 h-1.5 rotate-45 border border-amber-400/60" />
            <div className="h-px w-3 bg-amber-400/60" />
          </div>
          <div className="text-[5px] tracking-[0.3em] text-amber-600 uppercase">Wedding</div>
          <div className="space-y-0.5 text-center mt-1">
            <div className="h-1.5 w-8 bg-slate-700/40 rounded-full mx-auto" />
            <div className="text-[6px] text-amber-500">&</div>
            <div className="h-1.5 w-8 bg-slate-700/40 rounded-full mx-auto" />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="h-px w-3 bg-amber-400/60" />
            <div className="w-1.5 h-1.5 rotate-45 border border-amber-400/60" />
            <div className="h-px w-3 bg-amber-400/60" />
          </div>
          <div className="mt-1 space-y-0.5">
            <div className="h-0.5 w-6 bg-slate-300 rounded-full mx-auto" />
            <div className="h-0.5 w-5 bg-slate-300 rounded-full mx-auto" />
          </div>
        </div>
      );

    case 'natural':
      return (
        <div className="w-full h-full bg-gradient-to-b from-stone-50 via-emerald-50/30 to-stone-50 flex flex-col items-center justify-center p-3 gap-1.5">
          <div className="text-emerald-400/60 text-sm">&#x1F343;</div>
          <div className="text-[5px] tracking-[0.2em] text-emerald-600/70 uppercase">Wedding</div>
          <div className="space-y-0.5 text-center mt-1">
            <div className="h-1.5 w-9 bg-stone-600/30 rounded-full mx-auto" />
            <div className="flex items-center justify-center gap-1">
              <div className="h-px w-2 bg-emerald-400/50" />
              <div className="text-[5px] text-emerald-500/70">&</div>
              <div className="h-px w-2 bg-emerald-400/50" />
            </div>
            <div className="h-1.5 w-9 bg-stone-600/30 rounded-full mx-auto" />
          </div>
          <div className="text-emerald-400/60 text-xs mt-1">&#x1F33F;</div>
          <div className="space-y-0.5 mt-1">
            <div className="h-0.5 w-6 bg-stone-300 rounded-full mx-auto" />
            <div className="h-0.5 w-5 bg-stone-300 rounded-full mx-auto" />
          </div>
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
  const { credits, refetch: refreshCredits } = useCredits();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isCustomActive = invitation.templateId === 'custom' && invitation.customTheme;

  const templates = [
    { id: 'classic', name: 'Classic', description: '전통적인 웨딩 스타일', tier: 'FREE' },
    { id: 'modern', name: 'Modern', description: '대담한 타이포그래피', tier: 'FREE' },
    { id: 'minimal', name: 'Minimal', description: '여백의 미, 흑백 톤', tier: 'FREE' },
    { id: 'floral', name: 'Floral', description: '꽃무늬 파스텔 디자인', tier: 'FREE' },
    { id: 'elegant', name: 'Elegant', description: '호텔웨딩 고급 스타일', tier: 'FREE' },
    { id: 'natural', name: 'Natural', description: '가든웨딩 자연 스타일', tier: 'FREE' },
  ];

  const handleSelectBuiltin = (templateId: string) => {
    // 빌트인 선택하면 customTheme 해제
    updateInvitation({ templateId, customTheme: undefined });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'AI 테마 생성에 실패했습니다', 'error');
        return;
      }

      // 성공: 프리뷰에 반영
      updateInvitation({
        templateId: 'custom',
        customTheme: data.theme,
      });

      refreshCredits();
      showToast('AI 테마가 생성되었습니다!');
    } catch {
      showToast('AI 테마 생성 중 오류가 발생했습니다', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">템플릿</h2>
        <p className="text-sm text-stone-500">청첩장 디자인을 선택하세요</p>
      </div>

      {/* AI 테마 생성기 */}
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-xl p-6 space-y-4 border border-violet-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-800">AI 테마 생성</h3>
            <p className="text-xs text-stone-500">원하는 분위기를 설명하면 AI가 테마를 디자인합니다</p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 라벤더색 로맨틱한 봄 웨딩, 골드 포인트 고급스러운 느낌, 숲속 자연 느낌의 초록 톤..."
          className="w-full h-20 px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg resize-none placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent"
          maxLength={200}
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-400">
            {prompt.length}/200자 | 1 크레딧 소모
          </span>

          <div className="flex items-center gap-2">
            {isCustomActive && (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-white border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 만들기
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 테마 생성
                </>
              )}
            </button>
          </div>
        </div>

        {/* 커스텀 테마 활성 표시 */}
        {isCustomActive && (
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-100/60 rounded-lg">
            <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-xs font-medium text-violet-700">AI 생성 테마 적용 중</span>
            <span className="text-xs text-violet-500 ml-auto">아래 템플릿을 선택하면 해제됩니다</span>
          </div>
        )}
      </div>

      {/* 무료 템플릿 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-stone-700">무료 템플릿</h3>
          <span className="text-xs text-stone-500">• {templates.length}개</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => {
            const isSelected = invitation.templateId === template.id;

            return (
              <button
                key={template.id}
                onClick={() => handleSelectBuiltin(template.id)}
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
