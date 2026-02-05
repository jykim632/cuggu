"use client";

import { RSVPForm, type RSVPFormFields } from "./RSVPForm";

interface RSVPSectionProps {
  invitationId: string;
  fields?: RSVPFormFields;
  className?: string;
}

export function RSVPSection({ invitationId, fields, className = "" }: RSVPSectionProps) {
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-lg font-medium text-stone-800 mb-2">참석 여부</h2>
        <p className="text-sm text-stone-500">
          참석 여부를 알려주시면 감사하겠습니다
        </p>
      </div>

      <RSVPForm invitationId={invitationId} fields={fields} />
    </div>
  );
}
