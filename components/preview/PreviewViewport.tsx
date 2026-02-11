import { PhoneFrame } from '@/components/ui/PhoneFrame';

interface PreviewViewportProps {
  mode: 'desktop' | 'mobile' | 'phone';
  phoneModel?: 'iphone' | 'galaxy';
  zoom?: number;
  children: React.ReactNode;
}

export function PreviewViewport({
  mode,
  phoneModel = 'iphone',
  zoom = 100,
  children,
}: PreviewViewportProps) {
  const borderRadius =
    mode === 'phone'
      ? phoneModel === 'iphone'
        ? 'rounded-[2.75rem]'
        : 'rounded-[2.25rem]'
      : mode === 'mobile'
        ? 'rounded-2xl'
        : 'rounded-lg';

  return (
    <div
      className="relative transition-transform origin-top"
      style={{ transform: `scale(${zoom / 100})` }}
    >
      {/* 폰 프레임 (phone 모드만) */}
      {mode === 'phone' && <PhoneFrame model={phoneModel} />}

      {/* 콘텐츠 영역 */}
      <div
        className={`bg-white overflow-hidden ${borderRadius} ${
          mode === 'phone'
            ? 'relative z-10 w-[375px] h-[812px]'
            : mode === 'mobile'
              ? 'relative w-[375px] shadow-xl'
              : 'w-full'
        }`}
      >
        <div
          className={mode === 'phone' ? 'h-full overflow-y-auto' : 'overflow-y-auto'}
          style={mode === 'phone' ? ({ '--screen-height': '812px' } as React.CSSProperties) : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
