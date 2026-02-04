'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { Check, Lock, Sparkles } from 'lucide-react';

/**
 * 템플릿 선택 탭 (모던 스타일)
 *
 * - 깔끔한 카드 디자인
 * - 무료/프리미엄 구분
 * - 선택 시 즉시 미리보기 반영
 */
export function TemplateTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const templates = [
    {
      id: 'classic',
      name: 'Classic',
      description: '전통적인 웨딩 스타일',
      tier: 'FREE',
      thumbnail: '/templates/classic.png',
    },
    // TODO: 나머지 템플릿 추가
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">템플릿</h2>
        <p className="text-sm text-slate-500">청첩장 디자인을 선택하세요</p>
      </div>

      {/* 무료 템플릿 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">무료 템플릿</h3>
          <span className="text-xs text-slate-500">• {templates.filter((t) => t.tier === 'FREE').length}개</span>
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
                  {/* 썸네일 */}
                  <div className="relative aspect-[3/4] bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {/* TODO: 실제 썸네일 이미지 */}
                    <div className="text-slate-400 text-xs">Preview</div>

                    {/* 선택 표시 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div>
                    <h4 className="font-medium text-sm text-slate-900">{template.name}</h4>
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
          <h3 className="text-sm font-semibold text-slate-700">프리미엄 템플릿</h3>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full">
            <Sparkles className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">Premium</span>
          </div>
        </div>

        {/* 업그레이드 CTA */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl opacity-50 group-hover:opacity-75 blur transition-opacity" />
          <div className="relative bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1">
                  20개 이상의 프리미엄 템플릿
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  전문가가 디자인한 고급 템플릿과 독점 기능을 이용하세요
                </p>

                <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  업그레이드 (9,900원)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
