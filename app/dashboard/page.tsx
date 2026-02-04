"use client";

import { useEffect, useState } from "react";
import { FileHeart, Users, Eye, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ScrollFade } from "@/components/animations/ScrollFade";

interface DashboardStats {
  invitationCount: number;
  totalViews: number;
  rsvpCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    invitationCount: 0,
    totalViews: 0,
    rsvpCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("통계 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsConfig = [
    {
      label: "내 청첩장",
      value: stats.invitationCount,
      icon: FileHeart,
      gradient: "from-pink-500 to-pink-600",
      iconColor: "text-pink-500",
    },
    {
      label: "총 조회수",
      value: stats.totalViews,
      icon: Eye,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
    },
    {
      label: "RSVP 응답",
      value: stats.rsvpCount,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500",
    },
  ];

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-sm text-slate-600 mt-2">
            {stats.invitationCount > 0
              ? `총 ${stats.invitationCount}개의 청첩장을 관리하고 있습니다.`
              : "환영합니다! 첫 청첩장을 만들어보세요."}
          </p>
        </div>
      </ScrollFade>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsConfig.map((stat, index) => (
          <ScrollFade key={stat.label} delay={index * 0.1}>
            <StatsCard {...stat} />
          </ScrollFade>
        ))}
      </div>

      {/* Empty State - 청첩장이 없을 때만 표시 */}
      {stats.invitationCount === 0 && (
        <ScrollFade delay={0.3}>
          <EmptyState />
        </ScrollFade>
      )}
    </div>
  );
}
