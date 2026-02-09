'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 참석 확인 (RSVP) 탭
 *
 * - RSVP 활성화/비활성화
 * - 수집할 필드 설정 (연락처, 동행인원, 식사, 축하메시지)
 */
export function RsvpTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleSettingsChange = (field: string, value: any) => {
    updateInvitation({
      settings: {
        ...invitation.settings,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">참석 확인</h2>
        <p className="text-sm text-stone-500">하객이 참석 여부를 전송할 수 있습니다</p>
      </div>

      {/* RSVP 활성화 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">RSVP 기능</h3>
            <p className="text-xs text-stone-500 mt-1">
              청첩장에 참석 여부 폼을 표시합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={invitation.settings?.enableRsvp !== false}
              onChange={(e) => handleSettingsChange('enableRsvp', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
          </label>
        </div>

        {/* RSVP 필드 설정 */}
        {invitation.settings?.enableRsvp !== false && (
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <p className="text-xs font-medium text-stone-500 mb-2">수집할 정보</p>

            {/* 이름 - 필수 */}
            <label className="flex items-center justify-between py-1.5">
              <span className="text-sm text-stone-600">이름</span>
              <span className="text-xs text-stone-400">필수</span>
            </label>

            {/* 연락처 */}
            <label className="flex items-center justify-between py-1.5 cursor-pointer">
              <span className="text-sm text-stone-600">연락처</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.phone !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  phone: e.target.checked,
                })}
                className="w-4 h-4 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 참석 여부 - 필수 */}
            <label className="flex items-center justify-between py-1.5">
              <span className="text-sm text-stone-600">참석 여부</span>
              <span className="text-xs text-stone-400">필수</span>
            </label>

            {/* 동행 인원 */}
            <label className="flex items-center justify-between py-1.5 cursor-pointer">
              <span className="text-sm text-stone-600">동행 인원</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.guestCount !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  guestCount: e.target.checked,
                })}
                className="w-4 h-4 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 식사 */}
            <label className="flex items-center justify-between py-1.5 cursor-pointer">
              <span className="text-sm text-stone-600">식사 옵션</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.meal !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  meal: e.target.checked,
                })}
                className="w-4 h-4 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>

            {/* 축하 메시지 */}
            <label className="flex items-center justify-between py-1.5 cursor-pointer">
              <span className="text-sm text-stone-600">축하 메시지</span>
              <input
                type="checkbox"
                checked={invitation.settings?.rsvpFields?.message !== false}
                onChange={(e) => handleSettingsChange('rsvpFields', {
                  ...invitation.settings?.rsvpFields,
                  message: e.target.checked,
                })}
                className="w-4 h-4 text-pink-500 border-stone-300 rounded focus:ring-pink-200"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
