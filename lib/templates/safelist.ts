import type { SerializableTheme } from './types';
import * as allThemes from './themes';

// ── 빌트인 테마에서 클래스 자동 추출 ──

function extractClassesFromValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean);
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(extractClassesFromValue);
  }
  return [];
}

function extractAllClasses(theme: SerializableTheme): Set<string> {
  return new Set(extractClassesFromValue(theme));
}

// 6개 빌트인 테마에서 사용되는 모든 클래스
const builtinClasses = new Set<string>();
for (const theme of Object.values(allThemes.themes)) {
  for (const cls of extractAllClasses(theme)) {
    builtinClasses.add(cls);
  }
}

// ── 웨딩 색상 팔레트 확장 ──

const WEDDING_COLORS = [
  'rose', 'pink', 'amber', 'emerald', 'stone', 'zinc', 'slate',
  'teal', 'purple', 'indigo', 'sky', 'violet', 'fuchsia',
  'red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue',
  'gray', 'neutral', 'warm-gray', 'cool-gray',
];

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const OPACITIES = ['20', '30', '40', '50', '60', '70', '80'];

const expandedClasses = new Set<string>();

for (const color of WEDDING_COLORS) {
  for (const shade of SHADES) {
    // text, bg, border
    expandedClasses.add(`text-${color}-${shade}`);
    expandedClasses.add(`bg-${color}-${shade}`);
    expandedClasses.add(`border-${color}-${shade}`);

    // gradient stops
    expandedClasses.add(`from-${color}-${shade}`);
    expandedClasses.add(`via-${color}-${shade}`);
    expandedClasses.add(`to-${color}-${shade}`);

    // ring
    expandedClasses.add(`ring-${color}-${shade}`);

    // hover text/bg (AI가 링크/버튼에 자주 사용)
    expandedClasses.add(`hover:text-${color}-${shade}`);
    expandedClasses.add(`hover:bg-${color}-${shade}`);

    // focus ring (RSVP 등 폼 입력 필드)
    expandedClasses.add(`focus:ring-${color}-${shade}`);

    // opacity variants
    for (const opacity of OPACITIES) {
      expandedClasses.add(`text-${color}-${shade}/${opacity}`);
      expandedClasses.add(`bg-${color}-${shade}/${opacity}`);
      expandedClasses.add(`border-${color}-${shade}/${opacity}`);
      expandedClasses.add(`from-${color}-${shade}/${opacity}`);
      expandedClasses.add(`via-${color}-${shade}/${opacity}`);
      expandedClasses.add(`to-${color}-${shade}/${opacity}`);
      expandedClasses.add(`ring-${color}-${shade}/${opacity}`);
    }
  }
}

// 기본 white/black/transparent
for (const base of ['white', 'black', 'transparent']) {
  expandedClasses.add(`text-${base}`);
  expandedClasses.add(`bg-${base}`);
  expandedClasses.add(`border-${base}`);
  expandedClasses.add(`from-${base}`);
  expandedClasses.add(`via-${base}`);
  expandedClasses.add(`to-${base}`);
}
for (const opacity of OPACITIES) {
  expandedClasses.add(`bg-white/${opacity}`);
  expandedClasses.add(`bg-black/${opacity}`);
  expandedClasses.add(`from-white/${opacity}`);
  expandedClasses.add(`via-white/${opacity}`);
  expandedClasses.add(`to-white/${opacity}`);
}

// 레이아웃/타이포/유틸 (AI가 자주 사용할 안전한 클래스)
const UTILITY_CLASSES = [
  // font
  'font-serif', 'font-sans', 'font-mono', 'font-batang', 'font-myeongjo', 'font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
  // text size
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
  'text-[8px]', 'text-[10px]', 'text-[11px]',
  // text alignment
  'text-center', 'text-left', 'text-right',
  // tracking
  'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest',
  'tracking-[0.1em]', 'tracking-[0.15em]', 'tracking-[0.2em]', 'tracking-[0.25em]', 'tracking-[0.3em]', 'tracking-[0.4em]', 'tracking-[0.5em]',
  // leading
  'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
  // spacing
  'space-y-0', 'space-y-0.5', 'space-y-1', 'space-y-1.5', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8', 'space-y-10', 'space-y-12',
  'gap-0', 'gap-0.5', 'gap-1', 'gap-1.5', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12',
  // padding
  'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
  'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
  'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12', 'py-14', 'py-16', 'py-20', 'py-24',
  'pt-2', 'pt-4', 'pt-6', 'pt-8', 'pt-10', 'pt-12',
  'pb-2', 'pb-4', 'pb-6', 'pb-8', 'pb-10', 'pb-12',
  // margin
  'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-6', 'my-8', 'my-10', 'my-12',
  'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8', 'mb-10', 'mb-12', 'mb-16',
  'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-6', 'mt-8', 'mt-10', 'mt-12', 'mt-16',
  'mx-2', 'mx-3', 'mx-4', 'mx-6', 'mx-8', 'mx-12', 'mx-auto',
  '-mx-3', '-mt-1', '-mt-2',
  // border
  'border', 'border-0', 'border-t', 'border-b', 'border-l', 'border-r', 'border-2',
  'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
  // width/height
  'w-px', 'w-0.5', 'w-1', 'w-1.5', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-full',
  'h-px', 'h-0.5', 'h-1', 'h-1.5', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12',
  'min-h-screen', 'min-h-[44px]',
  // max width
  'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl',
  // flex/grid
  'flex', 'flex-1', 'flex-col', 'flex-wrap', 'inline-flex', 'items-center', 'items-start', 'items-end', 'justify-center', 'justify-between', 'justify-start', 'justify-end',
  'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3',
  'md:grid-cols-2', 'md:grid-cols-3',
  'col-span-2',
  'columns-2', 'columns-3', 'md:columns-3',
  'break-inside-avoid',
  'border-l-2',
  'h-auto',
  // display
  'inline-block', 'inline', 'block', 'hidden',
  // position
  'relative', 'absolute', 'z-10', 'z-20',
  // overflow
  'overflow-hidden',
  // cursor
  'cursor-pointer',
  // opacity
  'opacity-0', 'opacity-5', 'opacity-10', 'opacity-15', 'opacity-20', 'opacity-25', 'opacity-30', 'opacity-35',
  'opacity-40', 'opacity-45', 'opacity-50', 'opacity-55', 'opacity-60', 'opacity-65', 'opacity-70', 'opacity-75',
  'opacity-80', 'opacity-85', 'opacity-90', 'opacity-95', 'opacity-100',
  // transform
  'rotate-45', 'rotate-90', 'rotate-180', '-rotate-45',
  'scale-95', 'scale-100', 'scale-105', 'scale-110',
  // transition
  'transition-all', 'transition-colors', 'transition-transform', 'transition-opacity',
  'duration-200', 'duration-300', 'duration-500', 'duration-700',
  'ease-in-out', 'ease-out',
  // hover
  'hover:scale-105', 'hover:scale-110', 'hover:opacity-70', 'hover:opacity-80', 'hover:opacity-90',
  // gradient
  'bg-gradient-to-b', 'bg-gradient-to-t', 'bg-gradient-to-r', 'bg-gradient-to-l',
  'bg-gradient-to-br', 'bg-gradient-to-bl', 'bg-gradient-to-tr', 'bg-gradient-to-tl',
  // shadow
  'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
  // whitespace
  'whitespace-pre-line', 'whitespace-nowrap',
  // text decoration
  'uppercase', 'lowercase', 'capitalize', 'italic', 'underline', 'no-underline',
  // responsive prefix — text
  'md:text-xs', 'md:text-sm', 'md:text-base', 'md:text-lg', 'md:text-xl', 'md:text-2xl', 'md:text-3xl', 'md:text-4xl', 'md:text-5xl', 'md:text-6xl', 'md:text-7xl',
  // responsive prefix — spacing
  'md:py-8', 'md:py-10', 'md:py-12', 'md:py-14', 'md:py-16', 'md:py-20', 'md:py-24',
  'md:px-6', 'md:px-8', 'md:px-10', 'md:px-12',
  'md:p-4', 'md:p-5', 'md:p-6', 'md:p-8',
  'md:gap-2', 'md:gap-3', 'md:gap-4', 'md:gap-6', 'md:gap-8', 'md:gap-10', 'md:gap-12',
  'md:mb-2', 'md:mb-4', 'md:mb-6', 'md:mb-8', 'md:mb-10', 'md:mb-12',
  'md:mt-2', 'md:mt-4', 'md:mt-6', 'md:mt-8', 'md:mt-10', 'md:mt-12',
  'md:my-4', 'md:my-6', 'md:my-8',
  'md:space-y-4', 'md:space-y-6', 'md:space-y-8',
  // aspect
  'aspect-square', 'aspect-video',
  // backdrop
  'backdrop-blur-none', 'backdrop-blur-sm', 'backdrop-blur', 'backdrop-blur-md', 'backdrop-blur-lg', 'backdrop-blur-xl',
  // ring
  'ring-0', 'ring-1', 'ring-2', 'ring-[1px]',
  // focus (폼 입력 필드)
  'focus:ring-0', 'focus:ring-1', 'focus:ring-2',
  'focus:border-transparent', 'focus:outline-none',
  // grayscale
  'grayscale',
  // inset
  'inset-0',
];

// ── 최종 safelist ──

export const THEME_SAFELIST: string[] = [
  ...builtinClasses,
  ...expandedClasses,
  ...UTILITY_CLASSES,
];

// ── 클래스 검증 ──

const safelistSet = new Set(THEME_SAFELIST);

// 무시해도 되는 패턴 (동적 클래스가 아닌 고정값)
const SKIP_PATTERNS = [
  /^\d/, // 숫자로 시작 (opacity 값 등)
  /^[a-z]+$/, // 'center', 'bottom-left' 같은 enum 값
  /^[A-Z]/, // 대문자로 시작하는 단어
  /^#/, // hex color
  /^&/, // ampersand 문자
  /^[✨🌸🌺🌿🍃❀✦◇]/, // 이모지/심볼 문자
];

function isClassName(str: string): boolean {
  // 빈 문자열이나 non-class 패턴은 무시
  if (!str || SKIP_PATTERNS.some(p => p.test(str))) return false;
  // Tailwind 클래스는 보통 알파벳/하이픈/숫자/슬래시/대괄호로 구성
  return /^[a-z!-]/.test(str);
}

/**
 * 테마의 모든 string 필드에서 Tailwind 클래스를 추출하여
 * safelist에 포함되어 있는지 검증
 *
 * @throws Error 허용되지 않은 클래스 발견 시
 */
export function validateThemeClasses(theme: Record<string, unknown>): void {
  const result = checkThemeClasses(theme);
  if (!result.valid) {
    throw new Error(
      `Theme contains ${result.violations.length} disallowed Tailwind classes:\n${result.violations.slice(0, 10).join('\n')}`
    );
  }
}

/**
 * safelist 검증 — throw하지 않고 결과 반환
 */
export function checkThemeClasses(theme: Record<string, unknown>): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  function walk(obj: unknown, path: string) {
    if (typeof obj === 'string') {
      const classes = obj.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (isClassName(cls) && !safelistSet.has(cls)) {
          violations.push(`${path}: "${cls}"`);
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        walk(value, `${path}.${key}`);
      }
    }
  }

  walk(theme, 'theme');

  return { valid: violations.length === 0, violations };
}
