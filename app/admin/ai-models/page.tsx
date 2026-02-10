"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Zap, Shield, Star, Loader2, Brain, Video, Palette, DollarSign, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──

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

interface ThemeModelInfo {
  id: string;
  name: string;
  provider: string;
  providerType: string;
  providerModel: string;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  description: string;
  speed: "fast" | "medium" | "slow";
}

interface ThemeConfig {
  fastModelId: string;
  qualityModelId: string;
}

type Tab = "photo" | "video" | "theme";

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "photo", label: "사진 생성", icon: Sparkles },
  { id: "video", label: "영상 생성", icon: Video },
  { id: "theme", label: "테마 생성", icon: Palette },
];

// ── Badges ──

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

// ── Toggle Switch ──

function ToggleSwitch({
  checked,
  disabled,
  loading,
  onToggle,
  title,
  activeColor = "bg-stone-900",
}: {
  checked: boolean;
  disabled?: boolean;
  loading?: boolean;
  onToggle: () => void;
  title?: string;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={onToggle}
      title={title}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? activeColor : "bg-stone-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Theme Radio Group ──

function ThemeModelRadioGroup({
  label,
  description,
  icon: Icon,
  models,
  selectedId,
  onSelect,
  disabled,
}: {
  label: string;
  description: string;
  icon: typeof Zap;
  models: ThemeModelInfo[];
  selectedId: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-violet-600" />
        <div>
          <h4 className="text-sm font-semibold text-stone-900">{label}</h4>
          <p className="text-xs text-stone-500">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        {models.map((model) => {
          const isSelected = model.id === selectedId;
          const speedBadge = SPEED_BADGES[model.speed];
          const estimatedCost = (
            (1500 * model.inputCostPerMTok + 3000 * model.outputCostPerMTok) / 1_000_000
          ).toFixed(4);

          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(model.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all",
                isSelected
                  ? "border-violet-300 bg-violet-50/50 ring-1 ring-violet-300"
                  : "border-stone-100 hover:border-stone-200 hover:bg-stone-50/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* 라디오 */}
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-stone-300" />
                )}
              </div>

              {/* 모델 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-900">{model.name}</span>
                  <span className="text-xs text-stone-400">{model.provider}</span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{model.description}</p>
              </div>

              {/* 뱃지 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                  ~${estimatedCost}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${speedBadge.color}`}>
                  <Zap className="w-3 h-3 inline mr-0.5" />
                  {speedBadge.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──

export default function AdminAIModelsPage() {
  const [tab, setTab] = useState<Tab>("photo");
  const [models, setModels] = useState<AIModelWithSettings[]>([]);
  const [themeModels, setThemeModels] = useState<ThemeModelInfo[]>([]);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({ fastModelId: "", qualityModelId: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [savingThemeConfig, setSavingThemeConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-models");
      const data = await res.json();
      if (data.success) {
        setModels(data.data.models);
        setThemeModels(data.data.themeModels);
        setThemeConfig(data.data.themeConfig);
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

  const handleThemeConfigChange = async (field: "fastModelId" | "qualityModelId", modelId: string) => {
    const newConfig = { ...themeConfig, [field]: modelId };
    setThemeConfig(newConfig);
    setSavingThemeConfig(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ai-models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "theme_config",
          ...newConfig,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "테마 설정 저장 실패");
        // rollback
        setThemeConfig(themeConfig);
      }
    } catch {
      setError("서버 연결 실패");
      setThemeConfig(themeConfig);
    } finally {
      setSavingThemeConfig(false);
    }
  };

  const enabledPhotoCount = models.filter((m) => m.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">AI 모델 설정</h1>
        <p className="mt-1 text-stone-500">
          AI 기능에 사용할 모델을 관리합니다
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 탭 */}
      <div className="flex gap-1 border-b border-stone-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-stone-900 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          로딩 중...
        </div>
      ) : (
        <>
          {/* 사진 생성 탭 */}
          {tab === "photo" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Sparkles className="w-4 h-4" />
                <span>
                  전체 {models.length}개 모델 중{" "}
                  <span className="font-medium text-stone-900">{enabledPhotoCount}개</span>{" "}
                  활성화
                </span>
              </div>

              {models.map((model) => {
                const faceBadge = FACE_BADGES[model.facePreservation];
                const speedBadge = SPEED_BADGES[model.speed];
                const isUpdating = updatingId === model.id;
                const isLastEnabled = model.enabled && enabledPhotoCount <= 1;

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

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500">활성화</span>
                          <ToggleSwitch
                            checked={model.enabled}
                            disabled={isLastEnabled && model.enabled}
                            loading={isUpdating}
                            onToggle={() => handleToggle(model.id, "enabled", !model.enabled)}
                            title={isLastEnabled && model.enabled ? "최소 1개의 모델은 활성화되어야 합니다" : undefined}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-500">추천</span>
                          <ToggleSwitch
                            checked={model.isRecommended}
                            disabled={!model.enabled}
                            loading={isUpdating}
                            onToggle={() => handleToggle(model.id, "isRecommended", !model.isRecommended)}
                            activeColor="bg-pink-500"
                          />
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

          {/* 영상 생성 탭 */}
          {tab === "video" && (
            <div className="flex items-center justify-center h-48 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-center">
                <Video className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-500">영상 생성 모델은 준비 중입니다</p>
              </div>
            </div>
          )}

          {/* 테마 생성 탭 */}
          {tab === "theme" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Brain className="w-4 h-4" />
                <span>
                  사용자에게{" "}
                  <span className="font-medium text-stone-900">빠른 생성</span>과{" "}
                  <span className="font-medium text-stone-900">정밀 생성</span>{" "}
                  옵션이 제공됩니다
                </span>
                {savingThemeConfig && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500 ml-auto" />
                )}
              </div>

              <ThemeModelRadioGroup
                label="빠른 생성 모델"
                description="사용자가 '빠른 생성'을 선택했을 때 사용할 모델"
                icon={Zap}
                models={themeModels}
                selectedId={themeConfig.fastModelId}
                onSelect={(id) => handleThemeConfigChange("fastModelId", id)}
                disabled={savingThemeConfig}
              />

              <ThemeModelRadioGroup
                label="정밀 생성 모델"
                description="사용자가 '정밀 생성'을 선택했을 때 사용할 모델"
                icon={Sparkles}
                models={themeModels}
                selectedId={themeConfig.qualityModelId}
                onSelect={(id) => handleThemeConfigChange("qualityModelId", id)}
                disabled={savingThemeConfig}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
