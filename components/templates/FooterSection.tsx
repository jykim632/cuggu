import { useRef, useEffect } from 'react';
import type { Invitation } from '@/schemas/invitation';
import type { FooterConfig } from '@/lib/templates/types';
import { useInvitationView } from '@/stores/invitation-view';
import { DecorationRenderer } from './renderers/DecorationRenderer';
import { DividerRenderer } from './renderers/DividerRenderer';

interface FooterSectionProps {
  data: Invitation;
  config: FooterConfig;
  isPreview?: boolean;
}

function getCtaUrl(invitationId: string) {
  return `https://cuggu.io?ref=invitation&id=${invitationId}`;
}

function ViralCTA({ invitationId }: { invitationId: string }) {
  const setCtaVisible = useInvitationView((s) => s.setCtaVisible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setCtaVisible]);

  return (
    <div ref={ref} className="mt-6 pt-5 border-t border-stone-100">
      <a
        href={getCtaUrl(invitationId)}
        data-event="viral_cta_click"
        data-ref-id={invitationId}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-full transition-colors active:scale-[0.97]"
      >
        나도 이렇게 예쁜 청첩장 만들기 →
      </a>
      <p className="mt-2 text-[11px] text-stone-300">
        Cuggu
      </p>
    </div>
  );
}

function FooterCentered({ data, config, isPreview }: FooterSectionProps) {
  const isPremium = useInvitationView((s) => s.isPremium);

  return (
    <footer className={config.containerClass ?? 'py-8 md:py-12 px-6 text-center text-xs md:text-sm text-gray-500 border-t border-amber-100'}>
      {config.topDivider && <DividerRenderer config={config.topDivider} />}
      {config.topDecoration && <DecorationRenderer config={config.topDecoration} />}
      <p className={config.nameClass ?? ''}>
        {data.groom.name} & {data.bride.name}
      </p>
      {!isPremium && <ViralCTA invitationId={data.id} />}
    </footer>
  );
}

function FooterFlexBetween({ data, config, isPreview }: FooterSectionProps) {
  const isPremium = useInvitationView((s) => s.isPremium);

  return (
    <footer className={config.containerClass ?? 'py-10 md:py-14 px-8 md:px-12 border-t border-zinc-200'}>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <p className={config.nameClass ?? ''}>{data.groom.name} & {data.bride.name}</p>
      </div>
      {!isPreview && !isPremium && (
        <div className="text-center mt-6">
          <ViralCTA invitationId={data.id} />
        </div>
      )}
    </footer>
  );
}

export function FooterSection({ data, config, isPreview }: FooterSectionProps) {
  if (config.layout === 'flex-between') {
    return <FooterFlexBetween data={data} config={config} isPreview={isPreview} />;
  }
  return <FooterCentered data={data} config={config} isPreview={isPreview} />;
}
