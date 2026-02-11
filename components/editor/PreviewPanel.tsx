'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { getTemplateComponent } from '@/lib/templates/get-template';
import { BaseTemplate } from '@/components/templates/BaseTemplate';
import { PreviewViewport } from '@/components/preview/PreviewViewport';
import { Smartphone, Monitor } from 'lucide-react';

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
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [phoneModel, setPhoneModel] = useState<'iphone' | 'galaxy'>('iphone');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [device]);

  // 미리보기용 데이터 변환 (기본값 채우기)
  // useMemo 의존성을 더 세부적으로 지정하여 실시간 반영 보장
  const previewData = useMemo(() => {
    return {
      id: invitation.id || 'preview',
      userId: invitation.userId || 'user',
      templateId: invitation.templateId || 'classic',

      groom: {
        name: invitation.groom?.name || '신랑',
        fatherName: invitation.groom?.fatherName,
        motherName: invitation.groom?.motherName,
        isDeceased: invitation.groom?.isDeceased,
        relation: invitation.groom?.relation,
        displayMode: invitation.groom?.displayMode,
        phone: invitation.groom?.phone,
        account: invitation.groom?.account,
        parentAccounts: invitation.groom?.parentAccounts || {
          father: [],
          mother: [],
        },
      },

      bride: {
        name: invitation.bride?.name || '신부',
        fatherName: invitation.bride?.fatherName,
        motherName: invitation.bride?.motherName,
        isDeceased: invitation.bride?.isDeceased,
        relation: invitation.bride?.relation,
        displayMode: invitation.bride?.displayMode,
        phone: invitation.bride?.phone,
        account: invitation.bride?.account,
        parentAccounts: invitation.bride?.parentAccounts || {
          father: [],
          mother: [],
        },
      },

      wedding: {
        date: invitation.wedding?.date || new Date().toISOString(),
        venue: {
          name: invitation.wedding?.venue?.name || '예식장',
          address: invitation.wedding?.venue?.address || '주소를 입력하세요',
          hall: invitation.wedding?.venue?.hall,
          tel: invitation.wedding?.venue?.tel,
          lat: invitation.wedding?.venue?.lat,
          lng: invitation.wedding?.venue?.lng,
          transportation: invitation.wedding?.venue?.transportation,
        },
      },

      content: {
        greeting: invitation.content?.greeting || '',
        notice: invitation.content?.notice,
      },

      gallery: {
        coverImage: invitation.gallery?.coverImage,
        images: invitation.gallery?.images || [],
      },

      settings: {
        showParents: invitation.settings?.showParents ?? true,
        showAccounts: invitation.settings?.showAccounts ?? true,
        showMap: invitation.settings?.showMap ?? true,
        enableRsvp: invitation.settings?.enableRsvp ?? true,
        sectionOrder: invitation.settings?.sectionOrder,
        ...invitation.settings,
      },

      isPasswordProtected: invitation.isPasswordProtected || false,
      status: 'DRAFT' as const,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    invitation.id,
    invitation.userId,
    invitation.templateId,
    invitation.groom,
    invitation.bride,
    invitation.wedding,
    invitation.content,
    invitation.gallery,
    invitation.settings,
    invitation.isPasswordProtected,
  ]);

  const TemplateComponent = getTemplateComponent(invitation.templateId || 'classic');

  // customTheme이 있으면 BaseTemplate 직접 사용
  const isCustom = invitation.templateId === 'custom' && invitation.customTheme;

  return (
    <aside className="w-[420px] bg-stone-50 border-l border-stone-200 flex flex-col flex-shrink-0">
      {/* 컨트롤 */}
      <div className="p-4 bg-white">
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">Preview</span>

            {/* 디바이스 전환 */}
            <div className="flex gap-1 bg-stone-200 rounded-md p-0.5">
              <button
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded transition-all ${
                  device === 'mobile'
                    ? 'bg-white shadow-sm text-stone-900'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title="모바일"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded transition-all ${
                  device === 'desktop'
                    ? 'bg-white shadow-sm text-stone-900'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title="데스크톱"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 폰 모델 선택 (모바일일 때만) */}
          {device === 'mobile' && (
            <div className="flex gap-1 bg-stone-100 rounded-md p-0.5">
              <button
                onClick={() => setPhoneModel('iphone')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                  phoneModel === 'iphone'
                    ? 'bg-white shadow-sm text-stone-900 font-medium'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                iPhone
              </button>
              <button
                onClick={() => setPhoneModel('galaxy')}
                className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                  phoneModel === 'galaxy'
                    ? 'bg-white shadow-sm text-stone-900 font-medium'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Galaxy
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 미리보기 영역 */}
      <div ref={scrollRef} className={`flex-1 p-8 flex items-start justify-center ${device === 'mobile' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <PreviewViewport
          mode={device === 'mobile' ? 'phone' : 'desktop'}
          phoneModel={phoneModel}
          zoom={device === 'mobile' ? 85 : 100}
        >
          {isCustom ? (
            <BaseTemplate data={previewData} theme={invitation.customTheme} isPreview />
          ) : (
            <TemplateComponent data={previewData} isPreview />
          )}
        </PreviewViewport>
      </div>

    </aside>
  );
}
