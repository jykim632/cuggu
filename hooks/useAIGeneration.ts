'use client';

import { useState, useCallback, useRef } from 'react';

interface GenerationTask {
  index: number;
  style: string;
  role: string;
  referencePhotoId: string;
}

interface UseAIGenerationOptions {
  albumId: string;
  modelId: string;
  onCreditsChange?: (credits: number) => void;
  onComplete?: () => void;
}

interface GenerationState {
  isGenerating: boolean;
  currentIndex: number;
  totalImages: number;
  completedUrls: string[];
  statusMessage: string;
  error: string | null;
  jobId: string | null;
}

export function useAIGeneration(options: UseAIGenerationOptions) {
  const { albumId, modelId, onCreditsChange, onComplete } = options;
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    currentIndex: 0,
    totalImages: 0,
    completedUrls: [],
    statusMessage: '',
    error: null,
    jobId: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  // Single generation: send one SSE request
  const generateSingle = useCallback(async (
    referencePhotoId: string,
    style: string,
    role: string,
  ) => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      currentIndex: 0,
      totalImages: 1,
      completedUrls: [],
      statusMessage: '준비 중...',
      jobId: null,
    }));

    try {
      const formData = new FormData();
      formData.append('style', style);
      formData.append('role', role);
      formData.append('modelId', modelId);
      formData.append('albumId', albumId);
      formData.append('referencePhotoId', referencePhotoId);

      abortRef.current = new AbortController();
      const res = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('스트리밍 연결 실패');

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
          if (!line.startsWith('data: ')) continue;
          const data = JSON.parse(line.slice(6));
          switch (data.type) {
            case 'status':
              setState(prev => ({ ...prev, statusMessage: data.message }));
              break;
            case 'image':
              setState(prev => ({
                ...prev,
                completedUrls: [...prev.completedUrls, data.url],
                statusMessage: `${data.progress}/${data.total}장 완료`,
              }));
              break;
            case 'done':
              setState(prev => ({
                ...prev,
                isGenerating: false,
                statusMessage: '완료!',
                completedUrls: data.generatedUrls,
              }));
              onCreditsChange?.(data.remainingCredits);
              onComplete?.();
              break;
            case 'error':
              throw new Error(data.error);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류',
      }));
    }
  }, [albumId, modelId, onCreditsChange, onComplete]);

  // Batch generation: create job, then run N sequential SSE requests
  const generateBatch = useCallback(async (
    jobId: string,
    tasks: GenerationTask[],
  ) => {
    setState({
      isGenerating: true,
      currentIndex: 0,
      totalImages: tasks.length,
      completedUrls: [],
      statusMessage: '배치 생성 시작...',
      error: null,
      jobId,
    });

    const urls: string[] = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      setState(prev => ({
        ...prev,
        currentIndex: i,
        statusMessage: `${i + 1}/${tasks.length}장 생성 중...`,
      }));

      try {
        const formData = new FormData();
        formData.append('style', task.style);
        formData.append('role', task.role);
        formData.append('modelId', modelId);
        formData.append('albumId', albumId);
        formData.append('jobId', jobId);
        formData.append('referencePhotoId', task.referencePhotoId);

        abortRef.current = new AbortController();
        const res = await fetch('/api/ai/generate/stream', {
          method: 'POST',
          body: formData,
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error(`Task ${i} 스트리밍 실패`);

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
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));
            if (data.type === 'image') {
              urls.push(data.url);
              setState(prev => ({
                ...prev,
                completedUrls: [...urls],
              }));
            } else if (data.type === 'done') {
              onCreditsChange?.(data.remainingCredits);
            } else if (data.type === 'error') {
              // Individual task failure — continue with remaining
              console.error(`Task ${i} failed:`, data.error);
            }
          }
        }

        // Small delay between requests to avoid rate limiting
        if (i < tasks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setState(prev => ({ ...prev, isGenerating: false, statusMessage: '취소됨' }));
          return;
        }
        // Continue with remaining tasks on individual failure
        console.error(`Task ${i} error:`, err);
      }
    }

    // Complete the job
    try {
      await fetch(`/api/ai/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
    } catch {
      // Job completion failure is non-critical
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      statusMessage: `${urls.length}/${tasks.length}장 완료`,
    }));
    onComplete?.();
  }, [albumId, modelId, onCreditsChange, onComplete]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isGenerating: false, statusMessage: '취소됨' }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      currentIndex: 0,
      totalImages: 0,
      completedUrls: [],
      statusMessage: '',
      error: null,
      jobId: null,
    });
  }, []);

  return { state, generateSingle, generateBatch, cancel, reset };
}
