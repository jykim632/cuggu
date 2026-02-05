'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 설정 탭
 *
 * - 비밀번호 보호
 * - 공개 범위
 * - 삭제 예정일
 */
export function SettingsTab() {
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
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">설정</h2>
        <p className="text-sm text-stone-500">청첩장 공개 설정을 관리하세요</p>
      </div>

      {/* 비밀번호 보호 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">비밀번호 보호</h3>
            <p className="text-xs text-stone-500 mt-1">
              청첩장에 비밀번호를 설정합니다
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={invitation.settings?.requirePassword || false}
              onChange={(e) => handleSettingsChange('requirePassword', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
          </label>
        </div>

        {invitation.settings?.requirePassword && (
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-2">
              비밀번호
            </label>
            <input
              type="text"
              value={invitation.settings?.password || ''}
              onChange={(e) => handleSettingsChange('password', e.target.value)}
              placeholder="4자리 숫자"
              maxLength={4}
              className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
            />
            <p className="text-xs text-stone-500 mt-1.5">
              비밀번호는 4자리 숫자로 설정하세요
            </p>
          </div>
        )}
      </div>

      {/* 자동 삭제 */}
      <div className="bg-white rounded-xl p-6 space-y-3 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">자동 삭제</h3>
        <p className="text-xs text-stone-600">
          결혼식 후 90일이 지나면 자동으로 삭제됩니다
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            개인정보 보호를 위해 결혼식 후 90일이 지나면 청첩장이 자동으로 삭제됩니다
          </p>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">통계</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500 mb-1">조회수</p>
            <p className="text-2xl font-bold text-stone-900">
              {invitation.viewCount || 0}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500 mb-1">생성일</p>
            <p className="text-xs font-medium text-stone-900">
              {invitation.createdAt
                ? new Date(invitation.createdAt).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
