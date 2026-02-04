"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { InvitationCard } from "@/components/invitation/InvitationCard";
import { ScrollFade } from "@/components/animations/ScrollFade";
import { motion, AnimatePresence } from "framer-motion";

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
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollFade>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">내 청첩장</h1>
            <p className="text-sm text-gray-600 mt-2">
              총 {total}개의 청첩장을 관리하고 있습니다
            </p>
          </div>

          <button
            onClick={handleCreateInvitation}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                새 청첩장 만들기
              </>
            )}
          </button>
        </div>
      </ScrollFade>

      {/* Invitations Grid */}
      {invitations.length === 0 ? (
        <ScrollFade delay={0.1}>
          <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-2xl border border-pink-100 p-12 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl mb-4">💌</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                첫 청첩장을 만들어보세요
              </h3>
              <p className="text-gray-600 mb-6">
                AI가 도와주는 5분 완성 청첩장
              </p>
              <button
                onClick={handleCreateInvitation}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    청첩장 만들기
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </ScrollFade>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {invitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
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
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
