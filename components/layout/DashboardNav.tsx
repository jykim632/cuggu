"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FileHeart, Sparkles, Settings, LogOut, Home, Users } from "lucide-react";
import { UserProfile } from "./UserProfile";
import { useCredits } from "@/hooks/useCredits";

const navItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "내 청첩장",
    href: "/invitations",
    icon: FileHeart,
  },
  {
    title: "AI 포토 스튜디오",
    href: "/ai-photos",
    icon: Sparkles,
  },
  {
    title: "RSVP 관리",
    href: "/rsvp",
    icon: Users,
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { credits, isLoading: creditsLoading } = useCredits();

  return (
    <aside className="w-64 border-r border-stone-200 bg-white flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link
          href="/"
          className="inline-flex items-center"
        >
          <Image
            src="/brand/cuggu-lockup.svg"
            alt="Cuggu"
            width={128}
            height={40}
            className="h-16 w-auto"
            priority
          />
        </Link>
      </div>

      {/* User Profile */}
      <UserProfile />

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

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
              {creditsLoading ? '...' : credits ?? 0}
            </span>
          </div>

          <p className="text-xs text-stone-500">
            {creditsLoading
              ? '로딩 중...'
              : credits === 0
                ? '크레딧을 모두 사용했습니다'
                : `${credits}회 사용 가능`}
          </p>
        </div>

        <button className="w-full px-3 py-2 text-sm font-medium text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-md transition-colors">
          + 크레딧 구매
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
