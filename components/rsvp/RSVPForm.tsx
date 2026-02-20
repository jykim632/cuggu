"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { AttendanceStatus, MealOption } from "@/schemas/rsvp";
import type { SerializableTheme } from "@/lib/templates/types";

const DEFAULT_INPUT = "border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent";
const DEFAULT_ACTIVE = "bg-rose-600 text-white";
const DEFAULT_INACTIVE = "bg-stone-100 text-stone-600 hover:bg-stone-200";
const DEFAULT_SUBMIT = "bg-rose-600 hover:bg-rose-700 text-white";
const DEFAULT_LABEL = "text-sm font-medium text-stone-700";
const DEFAULT_REQUIRED = "text-rose-500";

export interface RSVPFormFields {
  phone?: boolean;
  guestCount?: boolean;
  meal?: boolean;
  message?: boolean;
}

interface RSVPFormProps {
  invitationId: string;
  fields?: RSVPFormFields;
  theme?: SerializableTheme;
  onSuccess?: () => void;
  className?: string;
}

export function RSVPForm({ invitationId, fields, theme, onSuccess, className = "" }: RSVPFormProps) {
  const inputCls = theme?.rsvpInputClass ?? DEFAULT_INPUT;
  const activeCls = theme?.rsvpActiveClass ?? DEFAULT_ACTIVE;
  const inactiveCls = theme?.rsvpInactiveClass ?? DEFAULT_INACTIVE;
  const submitCls = theme?.rsvpSubmitClass ?? DEFAULT_SUBMIT;
  const labelCls = theme?.labelClass ?? DEFAULT_LABEL;
  const requiredCls = theme?.iconColor ?? DEFAULT_REQUIRED;

  // 기본값: 모든 필드 표시
  const showPhone = fields?.phone !== false;
  const showGuestCount = fields?.guestCount !== false;
  const showMeal = fields?.meal !== false;
  const showMessage = fields?.message !== false;
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [attendance, setAttendance] = useState<AttendanceStatus>("ATTENDING");
  const [guestCount, setGuestCount] = useState(1);
  const [mealOption, setMealOption] = useState<MealOption>("ADULT");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!guestName.trim()) {
      setError("이름을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
          attendance,
          guestCount: attendance === "ATTENDING" ? guestCount : 1,
          mealOption: attendance === "ATTENDING" ? mealOption : undefined,
          message: message.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "제출에 실패했습니다");
        return;
      }

      setIsSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 mb-2">
          전달되었습니다
        </h3>
        <p className="text-sm text-stone-500">
          참석 여부를 알려주셔서 감사합니다. 좋은 날 뵙겠습니다
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {/* 이름 */}
      <div>
        <label className={`block ${labelCls} mb-1.5`}>
          이름 <span className={requiredCls}>*</span>
        </label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="이름을 입력하세요"
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputCls}`}
        />
      </div>

      {/* 연락처 */}
      {showPhone && (
        <div>
          <label className={`block ${labelCls} mb-1.5`}>
            연락처 <span className="text-stone-400">(선택)</span>
          </label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="010-0000-0000"
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputCls}`}
          />
        </div>
      )}

      {/* 참석 여부 */}
      <div>
        <label className={`block ${labelCls} mb-2`}>
          참석 여부 <span className={requiredCls}>*</span>
        </label>
        <div className="flex gap-2">
          {[
            { value: "ATTENDING", label: "참석" },
            { value: "NOT_ATTENDING", label: "불참" },
            { value: "MAYBE", label: "미정" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAttendance(option.value as AttendanceStatus)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                attendance === option.value ? activeCls : inactiveCls
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 참석 시 추가 정보 */}
      {attendance === "ATTENDING" && (
        <>
          {/* 동행 인원 */}
          {showGuestCount && (
            <div>
              <label className={`block ${labelCls} mb-2`}>
                동행 인원 (본인 포함)
              </label>
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputCls}`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>{n}명</option>
                ))}
              </select>
            </div>
          )}

          {/* 식사 */}
          {showMeal && (
            <div>
              <label className={`block ${labelCls} mb-2`}>
                식사
              </label>
              <select
                value={mealOption}
                onChange={(e) => setMealOption(e.target.value as MealOption)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputCls}`}
              >
                <option value="ADULT">성인</option>
                <option value="CHILD">어린이</option>
                <option value="VEGETARIAN">채식</option>
                <option value="NONE">식사 안함</option>
              </select>
            </div>
          )}
        </>
      )}

      {/* 축하 메시지 */}
      {showMessage && (
        <div>
          <label className={`block ${labelCls} mb-1.5`}>
            축하 메시지 <span className="text-stone-400">(선택)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="축하 메시지를 남겨주세요"
            rows={3}
            maxLength={500}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputCls} resize-none`}
          />
          <p className="text-xs text-stone-400 mt-1 text-right">{message.length}/500</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 ${submitCls} font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            전송 중...
          </>
        ) : (
          "참석 여부 전송"
        )}
      </button>
    </form>
  );
}
