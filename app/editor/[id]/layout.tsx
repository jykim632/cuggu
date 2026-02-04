import { ReactNode } from 'react';

interface EditorLayoutProps {
  children: ReactNode;
}

/**
 * Figma 스타일 편집기 레이아웃
 *
 * TopBar 포함한 전체 화면 레이아웃 (사이드바 없음)
 * children에서 3-패널 구조 렌더링
 */
export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white">
      {children}
    </div>
  );
}
