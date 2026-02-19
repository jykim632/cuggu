'use client';

import { useState, useCallback, useRef } from 'react';
import { parseSSEEvents } from '@/lib/ai/parse-sse';

interface GenerationTask {
  index: number;
  style: string;
  role: string;
  referencePhotoIds: string[];
}

interface UseAIGenerationOptions {
  albumId: string;
  modelId: string;
  onCreditsChange?: (credits: number) => void;
  onComplete?: () => void;
}

export interface JobResult {
  completedImages: number;
  failedImages: number;
  totalImages: number;
  creditsRefunded: number;
  status: string;
}

interface GenerationState {
  isGenerating: boolean;
  currentIndex: number;
  totalImages: number;
  completedUrls: string[];
  statusMessage: string;
  error: string | null;
  jobId: string | null;
  jobResult: JobResult | null;
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
    jobResult: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  // Single generation: send one SSE request
  const generateSingle = useCallback(async (
    referencePhotoIds: string[],
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
      for (const id of referencePhotoIds) {
        formData.append('referencePhotoIds', id);
      }

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
        const { events, remaining } = parseSSEEvents(buffer);
        buffer = remaining;

        for (const event of events) {
          switch (event.type) {
            case 'status':
              setState(prev => ({ ...prev, statusMessage: event.message }));
              break;
            case 'image':
              setState(prev => ({
                ...prev,
                completedUrls: [...prev.completedUrls, event.url],
                statusMessage: `${event.progress}/${event.total}장 완료`,
              }));
              break;
            case 'done':
              setState(prev => ({
                ...prev,
                isGenerating: false,
                statusMessage: '완료!',
                completedUrls: event.generatedUrls,
              }));
              onCreditsChange?.(event.remainingCredits);
              window.dispatchEvent(new CustomEvent('credits-updated', { detail: event.remainingCredits }));
              onComplete?.();
              break;
            case 'error':
              throw new Error(event.error);
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
      jobResult: null,
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
        for (const id of task.referencePhotoIds) {
          formData.append('referencePhotoIds', id);
        }

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
          const { events, remaining } = parseSSEEvents(buffer);
          buffer = remaining;

          for (const event of events) {
            if (event.type === 'image') {
              urls.push(event.url);
              setState(prev => ({
                ...prev,
                completedUrls: [...urls],
              }));
            } else if (event.type === 'done') {
              onCreditsChange?.(event.remainingCredits);
              window.dispatchEvent(new CustomEvent('credits-updated', { detail: event.remainingCredits }));
            } else if (event.type === 'error') {
              console.error(`Task ${i} failed:`, event.error);
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

    // Complete the job (서버 자동완료가 있으므로 best effort — 1회 재시도)
    const completeJob = async () => {
      const res = await fetch(`/api/ai/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 이미 서버에서 완료된 경우 — 정상
        if (res.status === 400 && data.error?.includes('이미 완료')) return;
        throw new Error(`PATCH failed: ${res.status}`);
      }
    };
    try {
      await completeJob();
    } catch {
      // 1회 재시도
      try {
        await new Promise(r => setTimeout(r, 2000));
        await completeJob();
      } catch {
        // 서버 자동완료 + cron 안전망이 처리
      }
    }

    // Job 결과 조회 — 실패 수 + 환불 크레딧 확인
    let jobResult: JobResult | null = null;
    try {
      const jobRes = await fetch(`/api/ai/jobs/${jobId}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        if (jobData.success) {
          const j = jobData.data;
          jobResult = {
            completedImages: j.completedImages,
            failedImages: j.failedImages,
            totalImages: j.totalImages,
            creditsRefunded: j.creditsReserved - j.creditsUsed,
            status: j.status,
          };
        }
      }
    } catch {
      // 조회 실패해도 생성 결과는 정상 표시
    }

    const failedCount = tasks.length - urls.length;
    const statusMsg = failedCount > 0
      ? `${urls.length}/${tasks.length}장 완료 (${failedCount}장 실패)`
      : `${urls.length}/${tasks.length}장 완료`;

    setState(prev => ({
      ...prev,
      isGenerating: false,
      statusMessage: statusMsg,
      jobResult,
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
      jobResult: null,
    });
  }, []);

  return { state, generateSingle, generateBatch, cancel, reset };
}
