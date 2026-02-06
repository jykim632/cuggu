"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Zap, Shield, Star, Loader2 } from "lucide-react";

interface AIModelWithSettings {
  id: string;
  name: string;
  provider: string;
  costPerImage: number;
  description: string;
  facePreservation: "excellent" | "good" | "fair" | "poor";
  speed: "fast" | "medium" | "slow";
  enabled: boolean;
  isRecommended: boolean;
  sortOrder: number;
  updatedAt: string | null;
}

const FACE_BADGES: Record<string, { label: string; color: string }> = {
  excellent: { label: "얼굴보존 우수", color: "bg-emerald-100 text-emerald-700" },
  good: { label: "얼굴보존 양호", color: "bg-blue-100 text-blue-700" },
  fair: { label: "얼굴보존 보통", color: "bg-amber-100 text-amber-700" },
  poor: { label: "얼굴보존 약함", color: "bg-stone-100 text-stone-500" },
};

const SPEED_BADGES: Record<string, { label: string; color: string }> = {
  fast: { label: "빠름", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "보통", color: "bg-amber-100 text-amber-700" },
  slow: { label: "느림", color: "bg-red-100 text-red-700" },
};

export default function AdminAIModelsPage() {
  const [models, setModels] = useState<AIModelWithSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-models");
      const data = await res.json();
      if (data.success) {
        setModels(data.data.models);
      }
    } catch {
      setError("모델 목록을 불러올 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleToggle = async (
    modelId: string,
    field: "enabled" | "isRecommended",
    value: boolean
  ) => {
    setUpdatingId(modelId);
    setError(null);

    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, [field]: value }),
      });
      const data = await res.json();

      if (data.success) {
        setModels((prev) =>
          prev.map((m) => (m.id === modelId ? { ...m, [field]: value } : m))
        );
      } else {
        setError(data.error?.message || "업데이트 실패");
      }
    } catch {
      setError("서버 연결 실패");
    } finally {
      setUpdatingId(null);
    }
  };

  const enabledCount = models.filter((m) => m.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI 모델 관리</h1>
        <p className="mt-1 text-stone-500">
          AI 사진 생성에 사용할 모델을 관리합니다
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          로딩 중...
        </div>
      ) : (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Sparkles className="w-4 h-4" />
            <span>
              전체 {models.length}개 모델 중{" "}
              <span className="font-medium text-stone-900">{enabledCount}개</span>{" "}
              활성화
            </span>
          </div>

          {/* 모델 카드 */}
          {models.map((model) => {
            const faceBadge = FACE_BADGES[model.facePreservation];
            const speedBadge = SPEED_BADGES[model.speed];
            const isUpdating = updatingId === model.id;
            const isLastEnabled = model.enabled && enabledCount <= 1;

            return (
              <div
                key={model.id}
                className={`bg-white rounded-xl border p-5 transition-colors ${
                  model.enabled
                    ? "border-stone-200"
                    : "border-stone-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 모델 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-stone-900">
                        {model.name}
                      </h3>
                      <span className="text-xs text-stone-400">
                        {model.provider}
                      </span>
                      {model.isRecommended && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-pink-500 text-white px-1.5 py-0.5 rounded">
                          <Star className="w-2.5 h-2.5" />
                          추천
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-stone-500">
                      {model.description}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                        ${model.costPerImage}/장
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${faceBadge.color}`}
                      >
                        <Shield className="w-3 h-3 inline mr-0.5" />
                        {faceBadge.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${speedBadge.color}`}
                      >
                        <Zap className="w-3 h-3 inline mr-0.5" />
                        {speedBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* 토글 */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {/* 활성화 토글 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">활성화</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={model.enabled}
                        disabled={isUpdating || (isLastEnabled && model.enabled)}
                        onClick={() =>
                          handleToggle(model.id, "enabled", !model.enabled)
                        }
                        title={
                          isLastEnabled && model.enabled
                            ? "최소 1개의 모델은 활성화되어야 합니다"
                            : undefined
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          model.enabled ? "bg-stone-900" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            model.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* 추천 토글 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">추천</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={model.isRecommended}
                        disabled={isUpdating || !model.enabled}
                        onClick={() =>
                          handleToggle(
                            model.id,
                            "isRecommended",
                            !model.isRecommended
                          )
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          model.isRecommended ? "bg-pink-500" : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            model.isRecommended
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {model.updatedAt && (
                  <p className="mt-3 text-[10px] text-stone-400">
                    마지막 수정:{" "}
                    {new Date(model.updatedAt).toLocaleString("ko-KR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
