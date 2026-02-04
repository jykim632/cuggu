'use client';

import { useState, useEffect } from 'react';
import { AIStyle, PersonRole, AIGenerationResult } from '@/types/ai';
import { AIPhotoUploader } from './components/AIPhotoUploader';
import { StyleSelector } from './components/StyleSelector';
import { GenerationProgress } from './components/GenerationProgress';
import { ResultGallery } from './components/ResultGallery';

export default function AIPhotosPage() {
  // Credits
  const [credits, setCredits] = useState<number>(2);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);

  // Groom State
  const [groomImage, setGroomImage] = useState<File | null>(null);
  const [groomStyle, setGroomStyle] = useState<AIStyle | null>(null);
  const [groomGenerating, setGroomGenerating] = useState(false);
  const [groomResult, setGroomResult] = useState<AIGenerationResult | null>(null);

  // Bride State
  const [brideImage, setBrideImage] = useState<File | null>(null);
  const [brideStyle, setBrideStyle] = useState<AIStyle | null>(null);
  const [brideGenerating, setBrideGenerating] = useState(false);
  const [brideResult, setBrideResult] = useState<AIGenerationResult | null>(null);

  // Error
  const [error, setError] = useState<string | null>(null);

  // Fetch credits on mount
  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const response = await fetch('/api/user/credits');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch credits');
      }

      setCredits(data.credits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError('크레딧 정보를 불러올 수 없습니다');
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const handleGenerate = async (role: PersonRole) => {
    const image = role === 'GROOM' ? groomImage : brideImage;
    const style = role === 'GROOM' ? groomStyle : brideStyle;

    if (!image || !style) {
      setError('이미지와 스타일을 모두 선택해주세요');
      return;
    }

    if (credits === 0) {
      setError('크레딧이 부족합니다. 추가 구매가 필요합니다.');
      return;
    }

    // Set generating state
    if (role === 'GROOM') {
      setGroomGenerating(true);
    } else {
      setBrideGenerating(true);
    }
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('style', style);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('크레딧이 부족합니다');
        } else if (response.status === 400) {
          throw new Error(data.error || '얼굴을 감지할 수 없습니다');
        } else if (response.status === 429) {
          throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요');
        }
        throw new Error(data.error || 'AI 생성 중 오류가 발생했습니다');
      }

      // Update result and credits
      const result: AIGenerationResult = {
        id: data.data.id,
        urls: data.data.generatedUrls,
        selected: null,
      };

      if (role === 'GROOM') {
        setGroomResult(result);
      } else {
        setBrideResult(result);
      }

      setCredits(data.data.remainingCredits);
    } catch (err) {
      console.error('AI generation failed:', err);
      setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다');
    } finally {
      if (role === 'GROOM') {
        setGroomGenerating(false);
      } else {
        setBrideGenerating(false);
      }
    }
  };

  const handleRegenerate = async (role: PersonRole) => {
    // Reset result and regenerate
    if (role === 'GROOM') {
      setGroomResult(null);
    } else {
      setBrideResult(null);
    }
    await handleGenerate(role);
  };

  const handleSelectImage = (role: PersonRole, url: string) => {
    if (role === 'GROOM' && groomResult) {
      setGroomResult({ ...groomResult, selected: url });
    } else if (role === 'BRIDE' && brideResult) {
      setBrideResult({ ...brideResult, selected: url });
    }
  };

  const handleApplyToInvitation = () => {
    // TODO: Apply selected images to invitation
    alert(
      `신랑 사진: ${groomResult?.selected}\n신부 사진: ${brideResult?.selected}\n\n청첩장에 적용되었습니다!`
    );
  };

  const isGroomComplete = groomResult && groomResult.selected;
  const isBrideComplete = brideResult && brideResult.selected;
  const canApply = isGroomComplete && isBrideComplete;

  const canGenerateGroom = groomImage && groomStyle && !groomGenerating && !groomResult;
  const canGenerateBride = brideImage && brideStyle && !brideGenerating && !brideResult;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI 웨딩 사진 생성</h1>
        <p className="text-gray-600">
          증명 사진으로 웨딩 화보를 만들어보세요. 스타일을 선택하고 4장의 AI 사진을 생성합니다.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">잔여 크레딧:</span>
          {isLoadingCredits ? (
            <span className="text-sm text-gray-400">로딩 중...</span>
          ) : (
            <span className="text-lg font-bold text-pink-600">{credits}회</span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Groom Section */}
      <section className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <AIPhotoUploader
          role="GROOM"
          image={groomImage}
          onImageChange={setGroomImage}
          disabled={groomGenerating || !!groomResult}
        />

        {groomImage && !groomResult && (
          <StyleSelector
            selectedStyle={groomStyle}
            onStyleSelect={setGroomStyle}
            disabled={groomGenerating}
          />
        )}

        {canGenerateGroom && (
          <button
            onClick={() => handleGenerate('GROOM')}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            신랑 AI 사진 생성하기 (1 크레딧)
          </button>
        )}

        {groomGenerating && groomStyle && (
          <GenerationProgress
            role="GROOM"
            style={groomStyle}
            isGenerating={groomGenerating}
          />
        )}

        {groomResult && (
          <ResultGallery
            role="GROOM"
            images={groomResult.urls}
            selectedImage={groomResult.selected}
            onSelectImage={(url) => handleSelectImage('GROOM', url)}
            onRegenerate={() => handleRegenerate('GROOM')}
            remainingCredits={credits}
          />
        )}
      </section>

      {/* Bride Section */}
      <section className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <AIPhotoUploader
          role="BRIDE"
          image={brideImage}
          onImageChange={setBrideImage}
          disabled={brideGenerating || !!brideResult}
        />

        {brideImage && !brideResult && (
          <StyleSelector
            selectedStyle={brideStyle}
            onStyleSelect={setBrideStyle}
            disabled={brideGenerating}
          />
        )}

        {canGenerateBride && (
          <button
            onClick={() => handleGenerate('BRIDE')}
            className="w-full rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
          >
            신부 AI 사진 생성하기 (1 크레딧)
          </button>
        )}

        {brideGenerating && brideStyle && (
          <GenerationProgress
            role="BRIDE"
            style={brideStyle}
            isGenerating={brideGenerating}
          />
        )}

        {brideResult && (
          <ResultGallery
            role="BRIDE"
            images={brideResult.urls}
            selectedImage={brideResult.selected}
            onSelectImage={(url) => handleSelectImage('BRIDE', url)}
            onRegenerate={() => handleRegenerate('BRIDE')}
            remainingCredits={credits}
          />
        )}
      </section>

      {/* Apply Button */}
      {canApply && (
        <div className="flex justify-center">
          <button
            onClick={handleApplyToInvitation}
            className="rounded-lg bg-gradient-to-r from-pink-500 to-blue-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            ❤️ 청첩장에 적용하기
          </button>
        </div>
      )}
    </div>
  );
}
