'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, MessageCircle, Share2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { initKakaoShare, sendKakaoShare } from '@/lib/kakao-share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: {
    id: string;
    groom?: { name?: string };
    bride?: { name?: string };
    gallery?: { photos?: Array<{ url: string }> };
    aiPhotoUrl?: string;
    content?: { greeting?: string };
  };
  isJustPublished?: boolean;
}

function copyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
}

export function ShareModal({ isOpen, onClose, invitation, isJustPublished = false }: ShareModalProps) {
  const { showToast } = useToast();
  const [kakaoReady, setKakaoReady] = useState(false);

  const groomName = invitation.groom?.name || '신랑';
  const brideName = invitation.bride?.name || '신부';
  const shareTitle = `${groomName} ♥ ${brideName} 결혼합니다`;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/inv/${invitation.id}`
    : `/inv/${invitation.id}`;

  // 썸네일 이미지: AI 사진 > 갤러리 첫 번째 > 없음
  const thumbnailUrl = invitation.aiPhotoUrl
    || invitation.gallery?.photos?.[0]?.url
    || null;

  useEffect(() => {
    if (isOpen) {
      initKakaoShare().then(setKakaoReady);
    }
  }, [isOpen]);

  // ESC 키 + 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다!');
    } catch {
      const ok = copyToClipboard(shareUrl);
      if (ok) {
        showToast('링크가 복사되었습니다!');
      } else {
        showToast('복사에 실패했습니다', 'error');
      }
    }
  }, [shareUrl, showToast]);

  const handleKakao = useCallback(() => {
    if (!kakaoReady) {
      handleCopy();
      return;
    }
    sendKakaoShare({
      title: shareTitle,
      description: invitation.content?.greeting || `${groomName}님과 ${brideName}님의 결혼식에 초대합니다`,
      imageUrl: thumbnailUrl || '',
      shareUrl,
    });
  }, [kakaoReady, shareTitle, invitation.content?.greeting, groomName, brideName, thumbnailUrl, shareUrl, handleCopy]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }, [shareUrl, shareTitle, handleCopy]);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex justify-end p-3 pb-0">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 text-center">
                {/* 축하 메시지 (발행 직후만) */}
                {isJustPublished && (
                  <div className="mb-5">
                    <p className="text-3xl mb-2">🎉</p>
                    <h3 className="text-lg font-semibold text-stone-900">
                      청첩장이 발행되었습니다!
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      이제 소중한 분들에게 공유해보세요
                    </p>
                  </div>
                )}

                {/* 미리보기 카드 */}
                <div className="rounded-xl border border-stone-200 overflow-hidden mb-5">
                  {thumbnailUrl ? (
                    <div className="aspect-[2/1] bg-stone-100 overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt="청첩장 미리보기"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/1] bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                      <span className="text-4xl">💌</span>
                    </div>
                  )}
                  <div className="p-3 bg-white">
                    <p className="text-sm font-medium text-stone-900">{shareTitle}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{shareUrl}</p>
                  </div>
                </div>

                {/* 공유 버튼들 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleKakao}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FEE500] text-[#191919] text-sm font-medium active:scale-[0.97] transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    카카오톡
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 active:scale-[0.97] transition-all"
                  >
                    <Link className="w-4 h-4" />
                    링크 복사
                  </button>
                  <button
                    onClick={handleNativeShare}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-900 active:scale-[0.97] transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    공유
                  </button>
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="mt-4 w-full py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}
