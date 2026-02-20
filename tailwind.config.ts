import type { Config } from "tailwindcss";

// ── AI 테마용 Tailwind safelist (inline) ──
// Turbopack이 tailwind.config.ts의 상대경로 import를 resolve 못 하므로 인라인 처리.
// 빌트인 테마 클래스는 content의 "./lib/templates/*.ts"로 자동 스캔.

const WEDDING_COLORS = [
  'rose', 'pink', 'amber', 'emerald', 'stone', 'zinc', 'slate',
  'teal', 'purple', 'indigo', 'sky', 'violet', 'fuchsia',
  'red', 'orange', 'yellow', 'lime', 'green', 'cyan', 'blue',
  'gray', 'neutral',
];
const SHADES = ['50','100','200','300','400','500','600','700','800','900','950'];
const OPACITIES = ['20','30','40','50','60','70','80'];

const safelist: string[] = [];
for (const c of WEDDING_COLORS) {
  for (const s of SHADES) {
    safelist.push(
      `text-${c}-${s}`, `bg-${c}-${s}`, `border-${c}-${s}`,
      `from-${c}-${s}`, `via-${c}-${s}`, `to-${c}-${s}`, `ring-${c}-${s}`,
      // hover (AI 생성 테마용)
      `hover:text-${c}-${s}`, `hover:bg-${c}-${s}`,
    );
    for (const o of OPACITIES) {
      safelist.push(
        `text-${c}-${s}/${o}`, `bg-${c}-${s}/${o}`, `border-${c}-${s}/${o}`,
        `from-${c}-${s}/${o}`, `via-${c}-${s}/${o}`, `to-${c}-${s}/${o}`,
        `ring-${c}-${s}/${o}`,
      );
    }
  }
}
for (const b of ['white', 'black', 'transparent']) {
  safelist.push(`text-${b}`, `bg-${b}`, `border-${b}`, `from-${b}`, `via-${b}`, `to-${b}`);
}
for (const o of OPACITIES) {
  safelist.push(`bg-white/${o}`, `bg-black/${o}`, `from-white/${o}`, `via-white/${o}`, `to-white/${o}`);
}

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/templates/*.ts",
  ],
  safelist,
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  			serif: ['var(--font-serif)', 'Georgia', 'serif'],
  			batang: ['var(--font-batang)', 'var(--font-serif)', 'serif'],
  			myeongjo: ['var(--font-myeongjo)', 'var(--font-serif)', 'serif'],
  			pretendard: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
  			maruburi: ['var(--font-maruburi)', 'serif'],
  			kopub: ['var(--font-kopub)', 'serif'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
