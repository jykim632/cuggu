import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-pink-500">
          Cuggu
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#templates"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            템플릿
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            가격
          </Link>
          <Button variant="outline" size="sm">
            로그인
          </Button>
        </nav>
      </div>
    </header>
  );
}
