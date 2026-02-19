'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, Gem, Check, ExternalLink, Loader2, ChevronLeft, Trash2 } from 'lucide-react';
import { AlbumImage, AlbumGroup } from '@/types/ai';
import { AlbumDashboard } from '../components/AlbumDashboard';
import { ApplyToInvitationModal } from '../components/ApplyToInvitationModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirm } from '@/hooks/useConfirm';
import { DEFAULT_MODEL } from '@/lib/ai/models';

const IS_DEV = process.env.NODE_ENV === 'development';

interface Album {
  id: string;
  name: string;
  snapType: string | null;
  images: AlbumImage[];
  groups: AlbumGroup[];
  status: string;
  generations: Array<{
    id: string;
    style: string;
    role: string | null;
    generatedUrls: string[] | null;
    isFavorited?: boolean;
    createdAt: string;
  }>;
}

interface AvailableModel {
  id: string;
  name: string;
  description: string;
  costPerImage: number;
  isRecommended: boolean;
}

export default function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const router = useRouter();

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 크레딧 & 모델
  const [credits, setCredits] = useState<number>(0);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  // 적용 모달
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyToast, setApplyToast] = useState<string | null>(null);

  // 삭제
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    fetchAlbum();
    fetchCredits();
    fetchModels();
  }, [albumId]);

  useEffect(() => {
    if (!applyToast) return;
    const timer = setTimeout(() => setApplyToast(null), 5000);
    return () => clearTimeout(timer);
  }, [applyToast]);

  const fetchAlbum = useCallback(async () => {
    try {
      // loading은 초기값 true → 첫 fetch 후 false. refresh 시에는 건드리지 않아
      // AlbumDashboard가 unmount되면 생성 진행 상태가 날아가기 때문.
      const res = await fetch(`/api/ai/albums/${albumId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '앨범을 불러올 수 없습니다');
        setAlbum(null);
        return;
      }
      setAlbum({
        ...data.data,
        groups: data.data.groups ?? [],
      });
      setError(null);
    } catch {
      setError('앨범을 불러올 수 없습니다');
      setAlbum(null);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  const fetchCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const res = await fetch('/api/user/credits');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCredits(data.credits);
    } catch {
      // ignore
    } finally {
      setIsLoadingCredits(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/ai/models');
      const data = await res.json();
      if (data.success && data.data.models.length > 0) {
        setAvailableModels(data.data.models);
        const ids = data.data.models.map((m: AvailableModel) => m.id);
        if (!ids.includes(selectedModel)) {
          setSelectedModel(data.data.defaultModel || ids[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteAlbum = async () => {
    if (!album) return;
    const imageCount = (album.images ?? []).length;
    const confirmed = await confirm({
      title: '앨범을 삭제하시겠습니까?',
      description: imageCount > 0
        ? `이 앨범에 포함된 ${imageCount}장의 사진이 모두 삭제되며, 복구할 수 없습니다.`
        : '빈 앨범이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/ai/albums/${album.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/ai-photos');
      }
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/ai-photos')}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            앨범 리스트
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <h1 className="text-lg font-semibold text-stone-900">
              {album?.name ?? 'AI 웨딩 앨범'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {album && (
            <button
              onClick={handleDeleteAlbum}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              삭제
            </button>
          )}
          {availableModels.length > 1 && album && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition-colors hover:border-stone-300 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{model.isRecommended ? ' ✦' : ''}
                </option>
              ))}
            </select>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
            <Gem className="w-3 h-3" />
            {isLoadingCredits ? '...' : IS_DEV ? '∞ DEV' : `${credits} 크레딧`}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          <p className="text-sm text-stone-500">로딩 중...</p>
        </div>
      ) : error || !album ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm text-stone-500">{error ?? '앨범을 찾을 수 없습니다'}</p>
          <button
            onClick={() => router.push('/ai-photos')}
            className="text-sm text-rose-600 hover:text-rose-700"
          >
            앨범 리스트로 돌아가기
          </button>
        </div>
      ) : (
        <AlbumDashboard
          album={album}
          credits={credits}
          selectedModel={selectedModel}
          onCreditsChange={setCredits}
          onRefreshAlbum={fetchAlbum}
          onShowApplyModal={() => setShowApplyModal(true)}
        />
      )}

      {/* 적용 모달 */}
      <ApplyToInvitationModal
        isOpen={showApplyModal}
        images={album?.images ?? []}
        groups={album?.groups ?? []}
        onClose={() => setShowApplyModal(false)}
        onApplied={(name, count) => {
          setApplyToast(`${count}장이 ${name}에 추가됨`);
        }}
      />

      {/* 적용 완료 토스트 */}
      {applyToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl bg-stone-900 px-5 py-3 text-sm text-white shadow-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span>{applyToast}</span>
            <a
              href="/invitations"
              className="flex items-center gap-1 text-rose-300 hover:text-rose-200"
            >
              에디터 열기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        isLoading={isDeleting}
      />
    </div>
  );
}
