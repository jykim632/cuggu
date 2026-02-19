"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#before-after", label: "AI 사진" },
  { href: "#pricing", label: "가격" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center"
        >
          <Image
            src="/brand/cuggu-lockup.svg"
            alt="Cuggu"
            width={140}
            height={45}
            className="h-16 w-auto"
            priority
          />
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-gray-600 hover:text-rose-500"
                  : "text-gray-700 hover:text-rose-500"
              }`}
            >
              {link.label}
            </a>
          ))}
          <Link href="/login">
            <Button size="sm">시작하기</Button>
          </Link>
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-rose-500 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full">시작하기</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
