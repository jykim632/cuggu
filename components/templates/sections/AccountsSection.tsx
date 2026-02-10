"use client";

import { motion } from "framer-motion";
import type { Invitation } from "@/schemas/invitation";
import type { SerializableTheme } from "@/lib/templates/types";
import { HeadingRenderer } from "../renderers/HeadingRenderer";
import { DividerRenderer } from "../renderers/DividerRenderer";

interface AccountsSectionProps {
  data: Invitation;
  theme: SerializableTheme;
}

function AccountCard({
  label,
  name,
  bank,
  accountNumber,
  accountHolder,
  theme,
}: {
  label: string;
  name: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  theme: SerializableTheme;
}) {
  return (
    <div className={theme.accountCardClass}>
      <p className={theme.accountTypeLabel}>{label}</p>
      <p className={theme.accountName}>{name}</p>
      <p className={theme.accountDetail}>
        {bank} {accountNumber}
      </p>
      <p className={theme.accountHolder}>
        예금주: {accountHolder}
      </p>
    </div>
  );
}

function SideAccounts({
  side,
  person,
  theme,
}: {
  side: 'groom' | 'bride';
  person: Invitation['groom'] | Invitation['bride'];
  theme: SerializableTheme;
}) {
  const hasAccounts =
    person.account ||
    (person.parentAccounts?.father?.length ?? 0) > 0 ||
    (person.parentAccounts?.mother?.length ?? 0) > 0;

  if (!hasAccounts) return null;

  const sideLabel = side === 'groom' ? '신랑 측' : '신부 측';
  const selfLabel = side === 'groom' ? '신랑 본인' : '신부 본인';

  return (
    <div>
      <p className={theme.sideLabel}>{sideLabel}</p>
      <div className={theme.accountCardsSpacing}>
        {person.account && (
          <AccountCard
            label={selfLabel}
            name={person.name}
            bank={person.account.bank}
            accountNumber={person.account.accountNumber}
            accountHolder={person.account.accountHolder}
            theme={theme}
          />
        )}

        {person.parentAccounts?.father?.map((account, idx) => (
          <AccountCard
            key={`${side}-father-${idx}`}
            label={`아버지${person.parentAccounts!.father.length > 1 ? ` (계좌 ${idx + 1})` : ''}`}
            name={person.fatherName || '아버지'}
            bank={account.bank}
            accountNumber={account.accountNumber}
            accountHolder={account.accountHolder}
            theme={theme}
          />
        ))}

        {person.parentAccounts?.mother?.map((account, idx) => (
          <AccountCard
            key={`${side}-mother-${idx}`}
            label={`어머니${person.parentAccounts!.mother.length > 1 ? ` (계좌 ${idx + 1})` : ''}`}
            name={person.motherName || '어머니'}
            bank={account.bank}
            accountNumber={account.accountNumber}
            accountHolder={account.accountHolder}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

export function AccountsSection({ data, theme }: AccountsSectionProps) {
  const hasAccounts =
    data.groom.account ||
    (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.groom.parentAccounts?.mother?.length ?? 0) > 0 ||
    data.bride.account ||
    (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.bride.parentAccounts?.mother?.length ?? 0) > 0;

  if (!data.settings.showAccounts || !hasAccounts) return null;

  const hasGroomAccounts =
    data.groom.account ||
    (data.groom.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.groom.parentAccounts?.mother?.length ?? 0) > 0;
  const hasBrideAccounts =
    data.bride.account ||
    (data.bride.parentAccounts?.father?.length ?? 0) > 0 ||
    (data.bride.parentAccounts?.mother?.length ?? 0) > 0;

  return (
    <section className={`${theme.sectionPadding} ${theme.sectionBg.accounts ?? ''}`}>
      <div className={theme.contentMaxWidth}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className={(theme.ceremonyLayout === 'centered' || theme.ceremonyCentered) ? 'text-center' : ''}
        >
          {theme.accountsHeading ? (
            <HeadingRenderer config={theme.accountsHeading} fallbackClass={theme.headingClass}>
              마음 전하실 곳
            </HeadingRenderer>
          ) : (
            <h2 className={theme.headingClass}>마음 전하실 곳</h2>
          )}

          <div className={theme.accountsSpacing}>
            <SideAccounts side="groom" person={data.groom} theme={theme} />

            {theme.accountsDivider && hasGroomAccounts && hasBrideAccounts && (
              <DividerRenderer config={theme.accountsDivider} />
            )}

            <SideAccounts side="bride" person={data.bride} theme={theme} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
