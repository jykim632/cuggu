"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileHeart, Users, Eye, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { InvitationCard } from "@/components/invitation/InvitationCard";

interface DashboardStats {
  invitationCount: number;
  totalViews: number;
  rsvpCount: number;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    invitationCount: 0,
    totalViews: 0,
    rsvpCount: 0,
  });
  const [recentInvitations, setRecentInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 통계와 최근 청첩장 동시 요청
      const [statsRes, invitationsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/invitations?page=1&pageSize=3"),
      ]);

      const statsResult = await statsRes.json();
      const invitationsResult = await invitationsRes.json();

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      if (invitationsResult.success) {
        setRecentInvitations(invitationsResult.data.invitations);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (deletedId: string) => {
    setRecentInvitations((prev) => prev.filter((inv) => inv.id !== deletedId));
    setStats((prev) => ({
      ...prev,
      invitationCount: prev.invitationCount - 1,
    }));
  };

  const statsConfig = [
    {
      label: "내 청첩장",
      value: stats.invitationCount,
      icon: FileHeart,
    },
    {
      label: "총 조회수",
      value: stats.totalViews,
      icon: Eye,
    },
    {
      label: "RSVP 응답",
      value: stats.rsvpCount,
      icon: Users,
    },
  ];

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
      <div>
        <h1 className="text-lg font-semibold text-stone-900">대시보드</h1>
        <p className="text-sm text-stone-500 mt-1">
          {stats.invitationCount > 0
            ? `총 ${stats.invitationCount}개의 청첩장을 관리하고 있습니다.`
            : "환영합니다! 첫 청첩장을 만들어보세요."}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsConfig.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Recent Invitations or Empty State */}
      {stats.invitationCount === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide">최근 청첩장</h2>
            <button
              onClick={() => router.push("/dashboard/invitations")}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              모두 보기
            </button>
          </div>

          {/* Invitations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
