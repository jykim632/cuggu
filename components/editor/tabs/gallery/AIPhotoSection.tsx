'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Plus, Coins } from 'lucide-react';
import { AIPhotoGenerator } from './AIPhotoGenerator';

interface AIPhotoSectionProps {
  invitationId: string | null;
  onAddToGallery: (urls: string[]) => void;
}

export function AIPhotoSection({ invitationId, onAddToGallery }: AIPhotoSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 신랑/신부 선택된 이미지
  const [groomSelectedUrls, setGroomSelectedUrls] = useState<string[]>([]);
  const [brideSelectedUrls, setBrideSelectedUrls] = useState<string[]>([]);

  const totalSelected = groomSelectedUrls.length + brideSelectedUrls.length;

  // 크레딧 조회
  useEffect(() => {
    if (expanded && credits === null) {
      fetchCredits();
    }
  }, [expanded]);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  };

  const handleAddToGallery = () => {
    const allSelected = [...groomSelectedUrls, ...brideSelectedUrls];
    if (allSelected.length === 0) return;

    setLoading(true);
    onAddToGallery(allSelected);

    // 선택 초기화
    setGroomSelectedUrls([]);
    setBrideSelectedUrls([]);
    setLoading(false);
  };

  const handleCreditsUpdate = (remaining: number) => {
    setCredits(remaining);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-pink-50/50 to-white overflow-hidden">
      {/* 헤더 (접이식 토글) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">AI 웨딩 사진</h3>
            <p className="text-xs text-stone-500">
              증명 사진으로 웨딩 화보를 만들어보세요
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {credits !== null && (
            <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-white px-2.5 py-1 rounded-full border border-stone-200">
              <Coins className="w-3.5 h-3.5" />
              {credits} 크레딧
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-stone-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone-400" />
          )}
        </div>
      </button>

      {/* 확장된 내용 */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* 청첩장 저장 필요 안내 */}
          {!invitationId && (
            <div className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
              AI 사진을 생성하려면 먼저 청첩장을 저장해주세요.
            </div>
          )}

          {invitationId && credits !== null && (
            <>
              {/* 신랑/신부 생성기 */}
              <div className="grid gap-5 md:grid-cols-2">
                <AIPhotoGenerator
                  role="GROOM"
                  selectedUrls={groomSelectedUrls}
                  onSelectionChange={setGroomSelectedUrls}
                  credits={credits}
                  onCreditsUpdate={handleCreditsUpdate}
                />
                <AIPhotoGenerator
                  role="BRIDE"
                  selectedUrls={brideSelectedUrls}
                  onSelectionChange={setBrideSelectedUrls}
                  credits={credits}
                  onCreditsUpdate={handleCreditsUpdate}
                />
              </div>

              {/* 갤러리에 추가 버튼 */}
              {totalSelected > 0 && (
                <button
                  onClick={handleAddToGallery}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  선택한 사진 갤러리에 추가 ({totalSelected}장)
                </button>
              )}
            </>
          )}

          {invitationId && credits === null && (
            <div className="text-center py-8 text-stone-500 text-sm">
              로딩 중...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
