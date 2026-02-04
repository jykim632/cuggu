"use client";

import { FileHeart, Users, Eye } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ScrollFade } from "@/components/animations/ScrollFade";

export default function DashboardPage() {
  // TODO: 실제 데이터는 DB/API에서 가져오기
  const stats = [
    {
      label: "내 청첩장",
      value: 0,
      icon: FileHeart,
      gradient: "from-pink-500 to-pink-600",
      iconColor: "text-pink-500",
    },
    {
      label: "총 조회수",
      value: 0,
      icon: Eye,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500",
    },
    {
      label: "RSVP 응답",
      value: 0,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollFade>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-2">
            환영합니다! 첫 청첩장을 만들어보세요.
          </p>
        </div>
      </ScrollFade>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <ScrollFade key={stat.label} delay={index * 0.1}>
            <StatsCard {...stat} />
          </ScrollFade>
        ))}
      </div>

      {/* Empty State */}
      <ScrollFade delay={0.3}>
        <EmptyState />
      </ScrollFade>
    </div>
  );
}
