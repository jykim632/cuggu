"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileHeart, Sparkles, Settings, LogOut, Home } from "lucide-react";
import { UserProfile } from "./UserProfile";
import { motion } from "framer-motion";

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
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 pb-0">
        <Link href="/" className="text-2xl font-bold text-pink-500 block mb-6">
          Cuggu
        </Link>
      </div>

      {/* User Profile */}
      <UserProfile />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-pink-50 text-pink-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 rounded-r"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Icon className="w-6 h-6" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Credits */}
      <div className="p-6 border-t border-gray-200">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">AI 크레딧</span>
            <span className="text-sm font-semibold text-gray-900">
              {aiCredits.total - aiCredits.used} / {aiCredits.total}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${100 - percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {aiCredits.used === aiCredits.total ? "크레딧을 모두 사용했습니다" : `${aiCredits.total - aiCredits.used}회 남음`}
          </p>
        </div>

        <button className="w-full px-4 py-2 text-sm font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors mb-3">
          + 크레딧 구매
        </button>

        {/* Logout */}
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
