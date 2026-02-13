"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Sparkles, History, FileSearch, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/users", label: "유저 관리", icon: Users },
  { href: "/admin/payments", label: "결제 내역", icon: CreditCard },
  { href: "/admin/ai-models", label: "AI 모델", icon: Sparkles },
  { href: "/admin/ai-history", label: "AI 기록", icon: History },
  { href: "/admin/credit-audit", label: "토큰 감사", icon: FileSearch },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 border-r border-stone-200 bg-white flex flex-col">
      <div className="p-4 border-b border-stone-200">
        <h1 className="text-lg font-semibold text-stone-900">Admin</h1>
      </div>

      <div className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-stone-100 text-stone-900"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-3 border-t border-stone-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          대시보드로 돌아가기
        </Link>
      </div>
    </nav>
  );
}
