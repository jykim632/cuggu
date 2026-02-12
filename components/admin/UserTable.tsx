"use client";

import { useState } from "react";
import { Crown, Coins, MoreHorizontal } from "lucide-react";
import type { AdminUserItem } from "@/schemas/admin";

interface UserTableProps {
  users: AdminUserItem[];
  onAction: (userId: string, action: "grant_credits" | "set_premium" | "set_free") => void;
}

export function UserTable({ users, onAction }: UserTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 text-left text-sm text-stone-500">
            <th className="pb-3 font-medium">유저</th>
            <th className="pb-3 font-medium">플랜</th>
            <th className="pb-3 font-medium text-right">크레딧</th>
            <th className="pb-3 font-medium text-right">청첩장</th>
            <th className="pb-3 font-medium text-right">AI생성</th>
            <th className="pb-3 font-medium">가입일</th>
            <th className="pb-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {users.map((user) => (
            <tr key={user.id} className="border-b border-stone-100">
              <td className="py-3">
                <div>
                  <div className="font-medium text-stone-900">
                    {user.name || "(이름 없음)"}
                    {user.role === "ADMIN" && (
                      <span className="ml-1 text-xs text-amber-600 font-semibold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-stone-500">{user.email}</div>
                </div>
              </td>
              <td className="py-3">
                <span
                  className={
                    user.premiumPlan === "PREMIUM"
                      ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
                      : "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600"
                  }
                >
                  {user.premiumPlan === "PREMIUM" && <Crown className="w-3 h-3" />}
                  {user.premiumPlan}
                </span>
              </td>
              <td className="py-3 text-right tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Coins className="w-3 h-3 text-stone-400" />
                  {user.aiCredits}
                </span>
              </td>
              <td className="py-3 text-right tabular-nums text-stone-600">
                {user._count.invitations}
              </td>
              <td className="py-3 text-right tabular-nums text-stone-600">
                {user._count.aiGenerations}
              </td>
              <td className="py-3 text-stone-500">
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="py-3">
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === user.id ? null : user.id)
                    }
                    className="p-1 hover:bg-stone-100 rounded"
                  >
                    <MoreHorizontal className="w-4 h-4 text-stone-400" />
                  </button>
                  {openMenuId === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          onAction(user.id, "grant_credits");
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                      >
                        크레딧 부여
                      </button>
                      {user.premiumPlan === "FREE" ? (
                        <button
                          onClick={() => {
                            onAction(user.id, "set_premium");
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                        >
                          프리미엄 설정
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAction(user.id, "set_free");
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                        >
                          무료 플랜으로 변경
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
