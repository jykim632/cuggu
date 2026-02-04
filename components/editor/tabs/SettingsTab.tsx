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
        <h2 className="text-xl font-bold text-slate-900 mb-1">설정</h2>
        <p className="text-sm text-slate-500">청첩장 공개 설정을 관리하세요</p>
      </div>

      {/* 비밀번호 보호 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">비밀번호 보호</h3>
            <p className="text-xs text-slate-500 mt-1">
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
            <div className="w-11 h-6 bg-gradient-to-br from-slate-100 to-pink-100/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-pink-200/50 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-br peer-checked:from-pink-500 peer-checked:to-rose-500"></div>
          </label>
        </div>

        {invitation.settings?.requirePassword && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              비밀번호
            </label>
            <input
              type="text"
              value={invitation.settings?.password || ''}
              onChange={(e) => handleSettingsChange('password', e.target.value)}
              placeholder="4자리 숫자"
              maxLength={4}
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              비밀번호는 4자리 숫자로 설정하세요
            </p>
          </div>
        )}
      </div>

      {/* 자동 삭제 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-3 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">자동 삭제</h3>
        <p className="text-xs text-slate-600">
          결혼식 후 90일이 지나면 자동으로 삭제됩니다
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            개인정보 보호를 위해 결혼식 후 90일이 지나면 청첩장이 자동으로 삭제됩니다
          </p>
        </div>
      </div>

      {/* 통계 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">통계</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gradient-to-br from-white to-pink-50/30 rounded-xl shadow-sm">
            <p className="text-xs text-slate-500 mb-1">조회수</p>
            <p className="text-2xl font-bold text-slate-900">
              {invitation.viewCount || 0}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">생성일</p>
            <p className="text-xs font-medium text-slate-900">
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
