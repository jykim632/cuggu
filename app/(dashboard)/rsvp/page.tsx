"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, UserCheck, UserX, HelpCircle, Utensils } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { RSVPTable } from "@/components/rsvp/RSVPTable";
import { RSVPResponse, RSVPStatsResponse } from "@/schemas/rsvp";

interface Invitation {
  id: string;
  groomName: string;
  brideName: string;
}

export default function RSVPPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [stats, setStats] = useState<RSVPStatsResponse | null>(null);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 청첩장 목록 로드
  useEffect(() => {
    fetchInvitations();
  }, []);

  // 선택된 청첩장의 RSVP 로드
  useEffect(() => {
    if (selectedId) {
      fetchRsvps(selectedId);
    }
  }, [selectedId]);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      const result = await response.json();

      if (result.success) {
        const list = result.data.invitations.map((inv: any) => ({
          id: inv.id,
          groomName: inv.groomName,
          brideName: inv.brideName,
        }));
        setInvitations(list);

        // 청첩장이 1개면 자동 선택
        if (list.length === 1) {
          setSelectedId(list[0].id);
        }
      }
    } catch (error) {
      console.error("청첩장 목록 조회 실패:", error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const fetchRsvps = async (invitationId: string) => {
    setIsLoadingRsvps(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}/rsvp`);
      const result = await response.json();

      if (result.success) {
        setRsvps(result.data.rsvps);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error("RSVP 목록 조회 실패:", error);
    } finally {
      setIsLoadingRsvps(false);
    }
  };

  const handleDelete = async (rsvpId: string) => {
    if (!selectedId) return;

    setDeletingId(rsvpId);
    try {
      const response = await fetch(`/api/invitations/${selectedId}/rsvp/${rsvpId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRsvps((prev) => prev.filter((r) => r.id !== rsvpId));
        // 통계 다시 계산
        fetchRsvps(selectedId);
      }
    } catch (error) {
      console.error("RSVP 삭제 실패:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingInvitations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">RSVP 관리</h1>
          <p className="text-sm text-stone-500 mt-1">
            참석 여부 응답을 확인하고 관리합니다
          </p>
        </div>

        <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-stone-900 mb-2">
            청첩장이 없습니다
          </h3>
          <p className="text-sm text-stone-500">
            먼저 청첩장을 만들어주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-stone-900">RSVP 관리</h1>
        <p className="text-sm text-stone-500 mt-1">
          참석 여부 응답을 확인하고 관리합니다
        </p>
      </div>

      {/* 청첩장 선택 */}
      {invitations.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            청첩장 선택
          </label>
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="w-full max-w-xs px-3 py-2 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            <option value="">청첩장을 선택하세요</option>
            {invitations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.groomName} ♥ {inv.brideName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* RSVP 내용 */}
      {selectedId && (
        <>
          {isLoadingRsvps ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : (
            <>
              {/* 통계 카드 */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatsCard
                    label="참석"
                    value={stats.attending}
                    icon={UserCheck}
                  />
                  <StatsCard
                    label="총 인원"
                    value={stats.totalGuests}
                    icon={Users}
                  />
                  <StatsCard
                    label="불참"
                    value={stats.notAttending}
                    icon={UserX}
                  />
                  <StatsCard
                    label="미정"
                    value={stats.maybe}
                    icon={HelpCircle}
                  />
                </div>
              )}

              {/* 식사 통계 */}
              {stats && stats.totalGuests > 0 && (
                <div className="border border-stone-200 bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="w-4 h-4 text-stone-400" />
                    <span className="text-sm font-medium text-stone-700">식사 현황</span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="text-stone-600">
                      성인 <span className="font-medium text-stone-900">{stats.mealStats.adult}명</span>
                    </span>
                    <span className="text-stone-600">
                      어린이 <span className="font-medium text-stone-900">{stats.mealStats.child}명</span>
                    </span>
                    <span className="text-stone-600">
                      채식 <span className="font-medium text-stone-900">{stats.mealStats.vegetarian}명</span>
                    </span>
                  </div>
                </div>
              )}

              {/* RSVP 테이블 */}
              <RSVPTable
                rsvps={rsvps}
                onDelete={handleDelete}
                isDeleting={deletingId}
              />
            </>
          )}
        </>
      )}

      {/* 청첩장 미선택 시 */}
      {!selectedId && invitations.length > 1 && (
        <div className="border border-stone-200 bg-white rounded-lg p-12 text-center">
          <Users className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <p className="text-sm text-stone-500">
            청첩장을 선택하면 RSVP 응답을 확인할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}
