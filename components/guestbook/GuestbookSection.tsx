"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, ChevronDown, Send } from "lucide-react";
import { SubmitGuestbookEntrySchema, type GuestbookEntryPublic } from "@/schemas/guestbook";
import type { SerializableTheme } from "@/lib/templates/types";

interface GuestbookSectionProps {
  invitationId: string;
  theme?: SerializableTheme;
}

export function GuestbookSection({ invitationId, theme }: GuestbookSectionProps) {
  const [entries, setEntries] = useState<GuestbookEntryPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(SubmitGuestbookEntrySchema),
    defaultValues: { name: "", message: "", isPrivate: false },
  });

  // 초기 로드
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}/guestbook`);
      const result = await res.json();
      if (result.success) {
        setEntries(result.data.entries);
        setNextCursor(result.data.nextCursor);
        setTotal(result.data.total);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [invitationId]);

  // 마운트 시 로드
  useState(() => {
    fetchEntries();
  });

  // 더 보기
  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(
        `/api/invitations/${invitationId}/guestbook?cursor=${encodeURIComponent(nextCursor)}`
      );
      const result = await res.json();
      if (result.success) {
        setEntries((prev) => [...prev, ...result.data.entries]);
        setNextCursor(result.data.nextCursor);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 제출
  const onSubmit = async (data: { name: string; message: string; isPrivate: boolean }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/invitations/${invitationId}/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || "메시지 전달에 실패했습니다. 다시 시도해주세요");
        return;
      }

      setSubmitSuccess(true);
      reset();

      // 비공개가 아닌 경우 목록에 즉시 추가
      if (!data.isPrivate) {
        setEntries((prev) => [
          {
            id: result.data.id,
            name: data.name,
            message: data.message,
            createdAt: result.data.createdAt,
          },
          ...prev,
        ]);
        setTotal((prev) => prev + 1);
      }

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch {
      setSubmitError("방명록 작성 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const headingClass = theme?.headingClass ?? "text-lg font-medium text-stone-800 mb-2";
  const labelClass = theme?.labelClass ?? "text-sm text-stone-500";
  const inputClass = theme?.rsvpInputClass ?? "border-stone-200 focus:ring-2 focus:ring-pink-200 focus:border-pink-300";
  const submitClass = theme?.rsvpSubmitClass ?? "bg-pink-500 hover:bg-pink-600 text-white";
  const iconColor = theme?.iconColor ?? "text-pink-500";

  return (
    <div className="max-w-md mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h2 className={headingClass}>방명록</h2>
        <p className={labelClass}>축하 메시지를 남겨주세요</p>
      </div>

      {/* 작성 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 space-y-3">
        <div>
          <input
            {...register("name")}
            placeholder="이름"
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${inputClass}`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <textarea
            {...register("message")}
            placeholder="축하 메시지를 남겨주세요"
            rows={3}
            maxLength={500}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none ${inputClass}`}
          />
          {errors.message && (
            <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("isPrivate")}
              className={`w-4 h-4 border-stone-300 rounded ${iconColor}`}
            />
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              비공개 (신랑·신부만 볼 수 있어요)
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${submitClass}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            등록
          </button>
        </div>

        {submitSuccess && (
          <p className="text-xs text-green-600 text-center">축하 메시지가 전달되었습니다</p>
        )}
        {submitError && (
          <p className="text-xs text-red-500 text-center">{submitError}</p>
        )}
      </form>

      {/* 메시지 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm text-stone-400 py-6">
          아직 남겨진 메시지가 없어요. 첫 번째 축하 인사를 전해주세요
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white/60 border border-stone-100 rounded-lg px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-stone-800">
                  {entry.name}
                </span>
                <span className="text-xs text-stone-400">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
              <p className="text-sm text-stone-600 whitespace-pre-wrap break-words">
                {entry.message}
              </p>
            </div>
          ))}

          {/* 더 보기 */}
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center justify-center gap-1"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  더 보기 ({total - entries.length}개 남음)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}
