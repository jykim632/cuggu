"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FileHeart } from "lucide-react";
import { InvitationCard } from "@/components/invitation/InvitationCard";
import { AnimatePresence, motion } from "framer-motion";

interface Invitation {
  id: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  venueName: string;
  viewCount: number;
  status: "DRAFT" | "PUBLISHED" | "EXPIRED" | "DELETED";
  galleryImages: string[] | null;
  createdAt: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      const result = await response.json();

      if (result.success) {
        setInvitations(result.data.invitations);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("청첩장 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "classic",
          groom: {
            name: "신랑",
          },
          bride: {
            name: "신부",
          },
          wedding: {
            date: new Date(
              new Date().setMonth(new Date().getMonth() + 3)
            ).toISOString(),
            venue: {
              name: "예식장",
              address: "주소를 입력하세요",
            },
          },
          content: {
            greeting: "",
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          alert(`${result.error}\n\n${result.message}`);
        } else {
          alert("청첩장 생성에 실패했습니다. 다시 시도해주세요.");
        }
        setIsCreating(false);
        return;
      }

      if (result.success && result.data?.id) {
        router.push(`/editor/${result.data.id}`);
      }
    } catch (error) {
      console.error("청첩장 생성 실패:", error);
      alert("청첩장 생성에 실패했습니다. 다시 시도해주세요.");
      setIsCreating(false);
    }
  };

  const handleDelete = (deletedId: string) => {
    setInvitations((prev) => prev.filter((inv) => inv.id !== deletedId));
    setTotal((prev) => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">내 청첩장</h1>
          <p className="text-sm text-stone-500 mt-1">
            총 {total}개의 청첩장을 관리하고 있습니다
          </p>
        </div>

        <button
          onClick={handleCreateInvitation}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              새 청첩장 만들기
            </>
          )}
        </button>
      </div>

      {/* Invitations Grid */}
      {invitations.length === 0 ? (
        <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
          <FileHeart className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-stone-900 mb-2">
            첫 청첩장을 만들어보세요
          </h3>
          <p className="text-sm text-stone-500 mb-6">
            템플릿을 선택하고 내용을 입력하면 바로 공유할 수 있습니다
          </p>
          <button
            onClick={handleCreateInvitation}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                청첩장 만들기
              </>
            )}
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <InvitationCard
                  id={invitation.id}
                  groomName={invitation.groomName}
                  brideName={invitation.brideName}
                  weddingDate={invitation.weddingDate}
                  venueName={invitation.venueName}
                  viewCount={invitation.viewCount}
                  status={invitation.status}
                  thumbnailUrl={invitation.galleryImages?.[0] || undefined}
                  createdAt={invitation.createdAt}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
