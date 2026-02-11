'use client';

import { useState, useEffect } from 'react';
import { X, Check, FileHeart, ExternalLink, Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  groomName: string;
  brideName: string;
}

interface ApplyToInvitationModalProps {
  isOpen: boolean;
  imageUrls: string[];
  onClose: () => void;
  onApplied: (invitationName: string) => void;
}

export function ApplyToInvitationModal({
  isOpen,
  imageUrls,
  onClose,
  onApplied,
}: ApplyToInvitationModalProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);

    fetch('/api/invitations')
      .then((res) => res.json())
      .then((data) => {
        const list = data.success ? data.data : data.data ?? [];
        setInvitations(list);
        if (list.length === 1) {
          setSelectedId(list[0].id);
        }
      })
      .catch(() => setError('청첩장 목록을 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleApply = async () => {
    if (!selectedId) return;

    setApplying(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generations/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: selectedId,
          imageUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '적용 실패');

      onApplied(data.data.invitationName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '적용 중 오류가 발생했습니다');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h3 className="text-base font-semibold text-stone-900">청첩장에 적용</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Selected images preview */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imageUrls.slice(0, 6).map((url, i) => (
              <div key={i} className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-stone-200">
                <img src={url} alt={`선택 ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {imageUrls.length > 6 && (
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-stone-100 flex items-center justify-center text-xs text-stone-500">
                +{imageUrls.length - 6}
              </div>
            )}
          </div>

          <p className="text-sm text-stone-600">
            {imageUrls.length}장의 사진을 추가할 청첩장을 선택하세요
          </p>

          {/* Invitation list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center">
              <FileHeart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">청첩장이 없습니다</p>
              <p className="text-xs text-stone-500 mt-1">먼저 청첩장을 만들어주세요</p>
              <a
                href="/dashboard/invitations"
                className="inline-flex items-center gap-1 mt-3 text-xs text-rose-600 hover:text-rose-700"
              >
                청첩장 만들기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invitations.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`
                    w-full flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors
                    ${selectedId === inv.id
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-stone-200 hover:border-stone-300'
                    }
                  `}
                >
                  <FileHeart className={`w-5 h-5 flex-shrink-0 ${selectedId === inv.id ? 'text-rose-500' : 'text-stone-400'}`} />
                  <span className="text-sm font-medium text-stone-700">
                    {inv.groomName} ♥ {inv.brideName}
                  </span>
                  {selectedId === inv.id && (
                    <Check className="w-4 h-4 text-rose-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedId || applying || invitations.length === 0}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                적용 중...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                적용하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
