'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { AIPhotoUploader } from '@/app/dashboard/ai-photos/components/AIPhotoUploader';
import { StyleSelector } from '@/app/dashboard/ai-photos/components/StyleSelector';
import { AIStreamingGallery } from './AIStreamingGallery';
import { AIResultGallery } from './AIResultGallery';
import { PersonRole, AIStyle, AIGenerationResult } from '@/types/ai';

interface AIPhotoGeneratorProps {
  role: PersonRole;
  selectedUrls: string[];
  onSelectionChange: (urls: string[]) => void;
  credits: number;
  onCreditsUpdate: (remaining: number) => void;
  disabled?: boolean;
}

export function AIPhotoGenerator({
  role,
  selectedUrls,
  onSelectionChange,
  credits,
  onCreditsUpdate,
  disabled = false,
}: AIPhotoGeneratorProps) {
  const [image, setImage] = useState<File | null>(null);
  const [style, setStyle] = useState<AIStyle | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 스트리밍 상태
  const [streamingUrls, setStreamingUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const roleLabel = role === 'GROOM' ? '신랑' : '신부';
  const canGenerate = image && style && credits > 0 && !generating && !disabled;

  const handleGenerate = async () => {
    if (!image || !style) return;

    setGenerating(true);
    setError(null);
    setStreamingUrls([null, null, null, null]);
    setStatusMessage('준비 중...');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('style', style);
      formData.append('role', role);

      const res = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error('스트리밍 연결 실패');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'status':
                  setStatusMessage(data.message);
                  break;

                case 'image':
                  setStreamingUrls((prev) => {
                    const next = [...prev];
                    next[data.index] = data.url;
                    return next;
                  });
                  setStatusMessage(`${data.progress}/${data.total}장 생성 완료`);
                  break;

                case 'done':
                  setResult({
                    id: data.id,
                    urls: data.generatedUrls,
                    selected: null,
                  });
                  onCreditsUpdate(data.remainingCredits);
                  setGenerating(false);
                  break;

                case 'error':
                  throw new Error(data.error);
              }
            } catch (parseError) {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setResult(null);
    if (result) {
      const filtered = selectedUrls.filter((url) => !result.urls.includes(url));
      onSelectionChange(filtered);
    }
    await handleGenerate();
  };

  const handleToggleImage = (url: string) => {
    if (selectedUrls.includes(url)) {
      onSelectionChange(selectedUrls.filter((u) => u !== url));
    } else {
      onSelectionChange([...selectedUrls, url]);
    }
  };

  // 생성 중 (스트리밍)
  if (generating && style) {
    return (
      <AIStreamingGallery
        role={role}
        images={streamingUrls}
        statusMessage={statusMessage}
        originalImage={image}
      />
    );
  }

  // 결과 있음
  if (result) {
    return (
      <AIResultGallery
        role={role}
        images={result.urls}
        selectedImages={selectedUrls}
        onToggleImage={handleToggleImage}
        onRegenerate={handleRegenerate}
        remainingCredits={credits}
        disabled={disabled}
      />
    );
  }

  // 업로드 & 스타일 선택 UI
  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-stone-900">{roleLabel}</h3>

      <AIPhotoUploader
        role={role}
        image={image}
        onImageChange={setImage}
        disabled={disabled || generating}
      />

      {image && (
        <StyleSelector
          selectedStyle={style}
          onStyleSelect={setStyle}
          disabled={disabled || generating}
        />
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {image && style && (
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI 사진 생성 (1 크레딧)
            </>
          )}
        </button>
      )}

      {credits === 0 && image && style && (
        <p className="text-xs text-amber-600 text-center">
          크레딧이 부족합니다. 크레딧을 충전해주세요.
        </p>
      )}
    </div>
  );
}
