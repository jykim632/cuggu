'use client';

import { useState } from 'react';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { Trash2, Plus } from 'lucide-react';

// 계좌 입력 폼 컴포넌트 (외부로 분리)
function AccountForm({
  account,
  onChange,
  onRemove,
  placeholder,
  showRemove = false,
  banks,
}: {
  account: any;
  onChange: (field: string, value: string) => void;
  onRemove?: () => void;
  placeholder?: string;
  showRemove?: boolean;
  banks: string[];
}) {
  return (
    <div className="space-y-3">
      {showRemove && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-stone-500">{placeholder}</span>
          <button
            type="button"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-2">
          은행
        </label>
        <select
          value={account?.bank || ''}
          onChange={(e) => onChange('bank', e.target.value)}
          className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors"
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
        <label className="block text-sm font-medium text-stone-600 mb-2">
          계좌번호
        </label>
        <input
          type="text"
          value={account?.accountNumber || ''}
          onChange={(e) => onChange('accountNumber', e.target.value)}
          placeholder="1234-5678-9012"
          className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 mb-2">
          예금주
        </label>
        <input
          type="text"
          value={account?.accountHolder || ''}
          onChange={(e) => onChange('accountHolder', e.target.value)}
          placeholder={placeholder || '홍길동'}
          className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors placeholder:text-stone-400"
        />
      </div>
    </div>
  );
}

/**
 * 계좌 정보 탭
 *
 * - 신랑/신부 본인 계좌
 * - 부모님(아버지/어머니) 계좌 (복수 개 가능)
 */
export function AccountTab() {
  const { invitation, updateInvitation } = useInvitationEditor();
  const [showGroomParentAccounts, setShowGroomParentAccounts] = useState(false);
  const [showBrideParentAccounts, setShowBrideParentAccounts] = useState(false);

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

  // 본인 계좌 핸들러
  const handleGroomAccountChange = (field: string, value: any) => {
    updateInvitation({
      groom: {
        ...invitation.groom,
        account: {
          ...invitation.groom?.account,
          [field]: value,
        },
      },
    });
  };

  const handleBrideAccountChange = (field: string, value: any) => {
    updateInvitation({
      bride: {
        ...invitation.bride,
        account: {
          ...invitation.bride?.account,
          [field]: value,
        },
      },
    });
  };

  // 부모님 계좌 추가
  const handleAddParentAccount = (
    side: 'groom' | 'bride',
    parent: 'father' | 'mother'
  ) => {
    const currentAccounts = invitation[side]?.parentAccounts?.[parent] || [];
    const parentName =
      parent === 'father'
        ? invitation[side]?.fatherName
        : invitation[side]?.motherName;

    updateInvitation({
      [side]: {
        ...invitation[side],
        parentAccounts: {
          ...invitation[side]?.parentAccounts,
          [parent]: [
            ...currentAccounts,
            {
              bank: '',
              accountNumber: '',
              accountHolder: parentName || '',
            },
          ],
        },
      },
    });
  };

  // 부모님 계좌 수정
  const handleUpdateParentAccount = (
    side: 'groom' | 'bride',
    parent: 'father' | 'mother',
    index: number,
    field: string,
    value: string
  ) => {
    const accounts = [...(invitation[side]?.parentAccounts?.[parent] || [])];
    accounts[index] = { ...accounts[index], [field]: value };

    updateInvitation({
      [side]: {
        ...invitation[side],
        parentAccounts: {
          ...invitation[side]?.parentAccounts,
          [parent]: accounts,
        },
      },
    });
  };

  // 부모님 계좌 삭제
  const handleRemoveParentAccount = (
    side: 'groom' | 'bride',
    parent: 'father' | 'mother',
    index: number
  ) => {
    const accounts = [...(invitation[side]?.parentAccounts?.[parent] || [])];
    accounts.splice(index, 1);

    updateInvitation({
      [side]: {
        ...invitation[side],
        parentAccounts: {
          ...invitation[side]?.parentAccounts,
          [parent]: accounts,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">계좌 정보</h2>
        <p className="text-sm text-stone-500">축의금을 받을 계좌를 입력하세요</p>
      </div>

      {/* 신랑측 */}
      <div className="bg-white rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700">신랑측 계좌</h3>

        {/* 본인 계좌 */}
        <div>
          <p className="text-xs font-medium text-stone-600 mb-3">본인</p>
          <AccountForm
            account={invitation.groom?.account}
            onChange={handleGroomAccountChange}
            placeholder={invitation.groom?.name || '신랑'}
            banks={banks}
          />
        </div>

        {/* 부모님 계좌 토글 */}
        <button
          type="button"
          onClick={() => setShowGroomParentAccounts(!showGroomParentAccounts)}
          className="text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors"
        >
          {showGroomParentAccounts ? '▼' : '▶'} 부모님 계좌 관리
        </button>

        {/* 부모님 계좌 섹션 */}
        {showGroomParentAccounts && (
          <div className="space-y-6 pt-2">
            {/* 아버지 계좌 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-600">
                  아버지 ({invitation.groom?.fatherName || '이름 미입력'})
                </span>
                <button
                  type="button"
                  onClick={() => handleAddParentAccount('groom', 'father')}
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  계좌 추가
                </button>
              </div>

              <div className="space-y-4">
                {invitation.groom?.parentAccounts?.father?.map((account: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <AccountForm
                      account={account}
                      onChange={(field, value) =>
                        handleUpdateParentAccount('groom', 'father', idx, field, value)
                      }
                      onRemove={() => handleRemoveParentAccount('groom', 'father', idx)}
                      placeholder={
                        invitation.groom?.parentAccounts?.father &&
                        invitation.groom.parentAccounts.father.length > 1
                          ? `계좌 ${idx + 1}`
                          : undefined
                      }
                      showRemove
                      banks={banks}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 어머니 계좌 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-600">
                  어머니 ({invitation.groom?.motherName || '이름 미입력'})
                </span>
                <button
                  type="button"
                  onClick={() => handleAddParentAccount('groom', 'mother')}
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  계좌 추가
                </button>
              </div>

              <div className="space-y-4">
                {invitation.groom?.parentAccounts?.mother?.map((account: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <AccountForm
                      account={account}
                      onChange={(field, value) =>
                        handleUpdateParentAccount('groom', 'mother', idx, field, value)
                      }
                      onRemove={() => handleRemoveParentAccount('groom', 'mother', idx)}
                      placeholder={
                        invitation.groom?.parentAccounts?.mother &&
                        invitation.groom.parentAccounts.mother.length > 1
                          ? `계좌 ${idx + 1}`
                          : undefined
                      }
                      showRemove
                      banks={banks}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 신부측 */}
      <div className="bg-white rounded-xl p-4 md:p-6 space-y-4 md:space-y-6 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700">신부측 계좌</h3>

        {/* 본인 계좌 */}
        <div>
          <p className="text-xs font-medium text-stone-600 mb-3">본인</p>
          <AccountForm
            account={invitation.bride?.account}
            onChange={handleBrideAccountChange}
            placeholder={invitation.bride?.name || '신부'}
            banks={banks}
          />
        </div>

        {/* 부모님 계좌 토글 */}
        <button
          type="button"
          onClick={() => setShowBrideParentAccounts(!showBrideParentAccounts)}
          className="text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors"
        >
          {showBrideParentAccounts ? '▼' : '▶'} 부모님 계좌 관리
        </button>

        {/* 부모님 계좌 섹션 */}
        {showBrideParentAccounts && (
          <div className="space-y-6 pt-2">
            {/* 아버지 계좌 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-600">
                  아버지 ({invitation.bride?.fatherName || '이름 미입력'})
                </span>
                <button
                  type="button"
                  onClick={() => handleAddParentAccount('bride', 'father')}
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  계좌 추가
                </button>
              </div>

              <div className="space-y-4">
                {invitation.bride?.parentAccounts?.father?.map((account: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <AccountForm
                      account={account}
                      onChange={(field, value) =>
                        handleUpdateParentAccount('bride', 'father', idx, field, value)
                      }
                      onRemove={() => handleRemoveParentAccount('bride', 'father', idx)}
                      placeholder={
                        invitation.bride?.parentAccounts?.father &&
                        invitation.bride.parentAccounts.father.length > 1
                          ? `계좌 ${idx + 1}`
                          : undefined
                      }
                      showRemove
                      banks={banks}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 어머니 계좌 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-stone-600">
                  어머니 ({invitation.bride?.motherName || '이름 미입력'})
                </span>
                <button
                  type="button"
                  onClick={() => handleAddParentAccount('bride', 'mother')}
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  계좌 추가
                </button>
              </div>

              <div className="space-y-4">
                {invitation.bride?.parentAccounts?.mother?.map((account: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <AccountForm
                      account={account}
                      onChange={(field, value) =>
                        handleUpdateParentAccount('bride', 'mother', idx, field, value)
                      }
                      onRemove={() => handleRemoveParentAccount('bride', 'mother', idx)}
                      placeholder={
                        invitation.bride?.parentAccounts?.mother &&
                        invitation.bride.parentAccounts.mother.length > 1
                          ? `계좌 ${idx + 1}`
                          : undefined
                      }
                      showRemove
                      banks={banks}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
