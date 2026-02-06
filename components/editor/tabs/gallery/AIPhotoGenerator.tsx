'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { AIPhotoUploader } from '@/app/dashboard/ai-photos/components/AIPhotoUploader';
import { StyleSelector } from '@/app/dashboard/ai-photos/components/StyleSelector';
import { AIStreamingGallery } from './AIStreamingGallery';
import { AIResultGallery } from './AIResultGallery';
import { PersonRole, AIStyle, AIGenerationResult } from '@/types/ai';
import { DEFAULT_MODEL } from '@/lib/ai/models';

interface AIPhotoGeneratorProps {
  role: PersonRole;
  selectedUrls: string[];
  onSelectionChange: (urls: string[]) => void;
  credits: number;
  onCreditsUpdate: (remaining: number) => void;
  disabled?: boolean;
}

interface AvailableModel {
  id: string;
  name: string;
  description: string;
  costPerImage: number;
  isRecommended: boolean;
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

  // 모델 목록 (API에서 fetch)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);

  // 고급 설정
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  // 스트리밍 상태
  const [streamingUrls, setStreamingUrls] = useState<(string | null)[]>([null, null, null, null]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // API에서 활성 모델 fetch
  useEffect(() => {
    fetch('/api/ai/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.models.length > 0) {
          setAvailableModels(data.data.models);
          // 현재 선택된 모델이 비활성화된 경우 fallback
          const ids = data.data.models.map((m: AvailableModel) => m.id);
          if (!ids.includes(selectedModel)) {
            setSelectedModel(data.data.defaultModel || ids[0]);
          }
        }
      })
      .catch(() => {
        // fetch 실패 시 기본값 유지
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      formData.append('modelId', selectedModel);

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

      {/* 고급 설정 */}
      {image && (
        <div className="border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>고급 설정</span>
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-stone-500">AI 모델 선택</p>
              <div className="space-y-1.5">
                {availableModels.map((model) => (
                  <label
                    key={model.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedModel === model.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`model-${role}`}
                      value={model.id}
                      checked={selectedModel === model.id}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-stone-700">
                          {model.name}
                        </span>
                        {model.isRecommended && (
                          <span className="text-[10px] bg-pink-500 text-white px-1.5 py-0.5 rounded">
                            추천
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {model.description} · ${model.costPerImage}/장
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedModel === model.id
                          ? 'border-pink-500'
                          : 'border-stone-300'
                      }`}
                    >
                      {selectedModel === model.id && (
                        <div className="w-2 h-2 rounded-full bg-pink-500" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
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
