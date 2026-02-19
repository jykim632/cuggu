import { ReactNode } from 'react';

interface MobileEditorLayoutProps {
  children: ReactNode;
}

/**
 * 모바일 편집기 레이아웃
 *
 * 데스크톱 레이아웃과 동일한 구조
 */
export default function MobileEditorLayout({ children }: MobileEditorLayoutProps) {
  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-white">
      {children}
    </div>
  );
}
