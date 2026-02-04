'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 기본 정보 탭
 *
 * 신랑/신부 정보 입력
 * - 이름 (필수)
 * - 부모님 이름
 * - 관계 (장남/차남 등)
 * - 연락처
 */
export function BasicInfoTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleGroomChange = (field: string, value: any) => {
    updateInvitation({
      groom: {
        ...invitation.groom,
        [field]: value,
      },
    });
  };

  const handleBrideChange = (field: string, value: any) => {
    updateInvitation({
      bride: {
        ...invitation.bride,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">기본 정보</h2>
        <p className="text-sm text-slate-500">신랑과 신부의 정보를 입력하세요</p>
      </div>

      {/* 신랑 정보 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">신랑</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.groom?.name || ''}
            onChange={(e) => handleGroomChange('name', e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              아버지
            </label>
            <input
              type="text"
              value={invitation.groom?.fatherName || ''}
              onChange={(e) => handleGroomChange('fatherName', e.target.value)}
              placeholder="홍판서"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              어머니
            </label>
            <input
              type="text"
              value={invitation.groom?.motherName || ''}
              onChange={(e) => handleGroomChange('motherName', e.target.value)}
              placeholder="김씨"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              관계
            </label>
            <select
              value={invitation.groom?.relation || ''}
              onChange={(e) => handleGroomChange('relation', e.target.value)}
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            >
              <option value="">선택</option>
              <option value="장남">장남</option>
              <option value="차남">차남</option>
              <option value="삼남">삼남</option>
              <option value="막내">막내</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={invitation.groom?.phone || ''}
              onChange={(e) => handleGroomChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 신부 정보 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">신부</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.bride?.name || ''}
            onChange={(e) => handleBrideChange('name', e.target.value)}
            placeholder="김영희"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              아버지
            </label>
            <input
              type="text"
              value={invitation.bride?.fatherName || ''}
              onChange={(e) => handleBrideChange('fatherName', e.target.value)}
              placeholder="김판서"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              어머니
            </label>
            <input
              type="text"
              value={invitation.bride?.motherName || ''}
              onChange={(e) => handleBrideChange('motherName', e.target.value)}
              placeholder="이씨"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              관계
            </label>
            <select
              value={invitation.bride?.relation || ''}
              onChange={(e) => handleBrideChange('relation', e.target.value)}
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            >
              <option value="">선택</option>
              <option value="장녀">장녀</option>
              <option value="차녀">차녀</option>
              <option value="삼녀">삼녀</option>
              <option value="막내">막내</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              연락처
            </label>
            <input
              type="tel"
              value={invitation.bride?.phone || ''}
              onChange={(e) => handleBrideChange('phone', e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
