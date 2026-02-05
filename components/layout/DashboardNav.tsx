"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileHeart, Sparkles, Settings, LogOut, Home, Users } from "lucide-react";
import { UserProfile } from "./UserProfile";

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "내 청첩장",
    href: "/dashboard/invitations",
    icon: FileHeart,
  },
  {
    title: "AI 사진 생성",
    href: "/dashboard/ai-photos",
    icon: Sparkles,
  },
  {
    title: "RSVP 관리",
    href: "/dashboard/rsvp",
    icon: Users,
  },
  {
    title: "설정",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  // TODO: 실제 데이터는 DB/API에서 가져오기
  const aiCredits = {
    used: 0,
    total: 2,
  };

  const percentage = (aiCredits.used / aiCredits.total) * 100;

  return (
    <aside className="w-64 border-r border-stone-200 bg-white flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-md bg-rose-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-base font-semibold text-stone-900">
            Cuggu
          </span>
        </Link>
      </div>

      {/* User Profile */}
      <UserProfile />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm
                ${
                  isActive
                    ? "bg-stone-100 text-stone-900 font-medium"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Credits Card */}
      <div className="p-3 m-3 mb-4 rounded-lg border border-stone-200">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-400" />
              <span className="text-sm font-medium text-stone-700">AI 크레딧</span>
            </div>
            <span className="text-sm font-semibold text-stone-900">
              {aiCredits.total - aiCredits.used} / {aiCredits.total}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${100 - percentage}%` }}
            />
          </div>

          <p className="text-xs text-stone-500 mt-2">
            {aiCredits.used === aiCredits.total ? "크레딧을 모두 사용했습니다" : `${aiCredits.total - aiCredits.used}회 남음`}
          </p>
        </div>

        <button className="w-full px-3 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-md transition-colors">
          + 크레딧 구매
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
