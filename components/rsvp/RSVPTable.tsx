"use client";

import { Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RSVPResponse } from "@/schemas/rsvp";

interface RSVPTableProps {
  rsvps: RSVPResponse[];
  onDelete: (rsvpId: string) => void;
  isDeleting?: string | null;
}

const ATTENDANCE_LABELS: Record<string, { label: string; className: string }> = {
  ATTENDING: { label: "참석", className: "bg-green-100 text-green-700" },
  NOT_ATTENDING: { label: "불참", className: "bg-red-100 text-red-700" },
  MAYBE: { label: "미정", className: "bg-yellow-100 text-yellow-700" },
};

const MEAL_LABELS: Record<string, string> = {
  ADULT: "성인",
  CHILD: "어린이",
  VEGETARIAN: "채식",
  NONE: "없음",
};

function formatDate(date: Date | string) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function RSVPTable({ rsvps, onDelete, isDeleting }: RSVPTableProps) {
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const handleDeleteClick = async (rsvp: RSVPResponse) => {
    const confirmed = await confirm({
      title: "RSVP 삭제",
      description: `${rsvp.guestName}님의 RSVP 응답을 삭제하시겠습니까?`,
      confirmText: "삭제",
      cancelText: "취소",
      variant: "danger",
    });

    if (confirmed) {
      onDelete(rsvp.id);
    }
  };

  if (rsvps.length === 0) {
    return (
      <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
        <p className="text-stone-500">아직 RSVP 응답이 없습니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-stone-200 bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-600">이름</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">연락처</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">참석</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">인원</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">식사</th>
                <th className="text-left px-4 py-3 font-medium text-stone-600">메시지</th>
                <th className="text-center px-4 py-3 font-medium text-stone-600">제출일</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rsvps.map((rsvp) => {
                const attendance = ATTENDANCE_LABELS[rsvp.attendance];
                return (
                  <tr key={rsvp.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {rsvp.guestName}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {rsvp.guestPhoneMasked || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${attendance.className}`}
                      >
                        {attendance.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-stone-600">
                      {rsvp.attendance === "ATTENDING" ? rsvp.guestCount : "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-stone-600">
                      {rsvp.mealOption ? MEAL_LABELS[rsvp.mealOption] : "-"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">
                      {rsvp.message || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-stone-500">
                      {formatDate(rsvp.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteClick(rsvp)}
                        disabled={isDeleting === rsvp.id}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        {...options}
      />
    </>
  );
}
