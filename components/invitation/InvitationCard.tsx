"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileHeart, Eye, Calendar, Edit, Share2, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";

interface InvitationCardProps {
  id: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  venueName: string;
  viewCount: number;
  status: "DRAFT" | "PUBLISHED" | "EXPIRED" | "DELETED";
  thumbnailUrl?: string;
  createdAt: string;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  DRAFT: { label: "임시저장", color: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "게시됨", color: "bg-green-100 text-green-700" },
  EXPIRED: { label: "만료됨", color: "bg-red-100 text-red-700" },
  DELETED: { label: "삭제됨", color: "bg-gray-100 text-gray-400" },
};

export function InvitationCard({
  id,
  groomName,
  brideName,
  weddingDate,
  venueName,
  viewCount,
  status,
  thumbnailUrl,
  createdAt,
  onDelete,
}: InvitationCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const handleEdit = () => {
    router.push(`/editor/${id}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/inv/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${groomName} ❤️ ${brideName}의 결혼식`,
          text: "청첩장을 확인해주세요",
          url,
        });
      } catch (error) {
        // 사용자가 취소한 경우 무시
        if ((error as Error).name !== "AbortError") {
          console.error("공유 실패:", error);
        }
      }
    } else {
      // Fallback: 클립보드 복사
      await navigator.clipboard.writeText(url);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  const handleDeleteClick = async () => {
    const confirmed = await confirm({
      title: "청첩장을 삭제하시겠습니까?",
      description: `${groomName} ❤️ ${brideName}의 청첩장이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`,
      confirmText: "삭제",
      cancelText: "취소",
      variant: "danger",
    });

    if (!confirmed) return;

    await performDelete();
  };

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      // 부모 컴포넌트에 삭제 알림
      onDelete?.(id);
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다. 다시 시도해주세요.");
      setIsDeleting(false);
    }
  };

  const weddingDateObj = new Date(weddingDate);
  const formattedDate = weddingDateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const relativeDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-pink-200 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${groomName} ❤️ ${brideName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileHeart className="w-16 h-16 text-pink-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleEdit}
            className="p-3 bg-white rounded-full hover:bg-pink-50 transition-colors shadow-lg"
            title="편집"
          >
            <Edit className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-white rounded-full hover:bg-pink-50 transition-colors shadow-lg"
            title="공유"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="p-3 bg-white rounded-full hover:bg-red-50 transition-colors shadow-lg disabled:opacity-50"
            title="삭제"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[status].color}`}>
            {statusConfig[status].label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
          {groomName} ❤️ {brideName}
        </h3>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-500" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            <span>조회수 {viewCount.toLocaleString()}회</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{relativeDate}</span>
          <Link
            href={`/editor/${id}`}
            className="text-sm font-semibold text-pink-600 hover:text-pink-700 transition-colors"
          >
            편집하기 →
          </Link>
        </div>
      </div>

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
    </motion.div>
  );
}
