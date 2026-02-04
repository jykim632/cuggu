'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 계좌 정보 탭
 *
 * - 신랑측 계좌 정보
 * - 신부측 계좌 정보
 * - 카카오페이 송금 버튼 옵션
 */
export function AccountTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleGroomAccountChange = (field: string, value: any) => {
    updateInvitation({
      groom: {
        ...invitation.groom,
        bankAccount: {
          ...invitation.groom?.bankAccount,
          [field]: value,
        },
      },
    });
  };

  const handleBrideAccountChange = (field: string, value: any) => {
    updateInvitation({
      bride: {
        ...invitation.bride,
        bankAccount: {
          ...invitation.bride?.bankAccount,
          [field]: value,
        },
      },
    });
  };

  const banks = [
    '국민은행',
    '신한은행',
    '우리은행',
    'KEB하나은행',
    '농협은행',
    'IBK기업은행',
    '카카오뱅크',
    '토스뱅크',
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">계좌 정보</h2>
        <p className="text-sm text-slate-500">축의금을 받을 계좌를 입력하세요</p>
      </div>

      {/* 신랑측 계좌 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">신랑측 계좌</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            은행
          </label>
          <select
            value={invitation.groom?.bankAccount?.bank || ''}
            onChange={(e) => handleGroomAccountChange('bank', e.target.value)}
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          >
            <option value="">선택하세요</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            계좌번호
          </label>
          <input
            type="text"
            value={invitation.groom?.bankAccount?.accountNumber || ''}
            onChange={(e) => handleGroomAccountChange('accountNumber', e.target.value)}
            placeholder="1234-5678-9012"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            예금주
          </label>
          <input
            type="text"
            value={invitation.groom?.bankAccount?.accountHolder || ''}
            onChange={(e) => handleGroomAccountChange('accountHolder', e.target.value)}
            placeholder="홍길동"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 신부측 계좌 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">신부측 계좌</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            은행
          </label>
          <select
            value={invitation.bride?.bankAccount?.bank || ''}
            onChange={(e) => handleBrideAccountChange('bank', e.target.value)}
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          >
            <option value="">선택하세요</option>
            {banks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            계좌번호
          </label>
          <input
            type="text"
            value={invitation.bride?.bankAccount?.accountNumber || ''}
            onChange={(e) => handleBrideAccountChange('accountNumber', e.target.value)}
            placeholder="1234-5678-9012"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            예금주
          </label>
          <input
            type="text"
            value={invitation.bride?.bankAccount?.accountHolder || ''}
            onChange={(e) => handleBrideAccountChange('accountHolder', e.target.value)}
            placeholder="김영희"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
