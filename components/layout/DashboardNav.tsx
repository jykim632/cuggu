import Link from "next/link";
import { FileHeart, Sparkles, Settings, LogOut } from "lucide-react";

const navItems = [
  {
    title: "내 청첩장",
    href: "/admin",
    icon: FileHeart,
  },
  {
    title: "AI 사진 생성",
    href: "/admin/ai-photos",
    icon: Sparkles,
  },
  {
    title: "설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function DashboardNav() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white p-6">
      <Link href="/" className="text-2xl font-bold text-pink-500 block mb-8">
        Cuggu
      </Link>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="px-3 py-2 text-sm">
          <div className="text-gray-600 mb-1">AI 크레딧</div>
          <div className="text-lg font-semibold text-gray-900">2 / 2</div>
        </div>
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors w-full mt-4">
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
