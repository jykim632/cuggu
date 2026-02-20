'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  invitationId: string;
}

/**
 * 비밀번호 보호 청첩장 게이트
 *
 * POST /api/invitations/[id]/verify 로 비밀번호 검증
 * 성공 시 쿠키 설정 후 페이지 리로드
 */
export function PasswordGate({ invitationId }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/invitations/${invitationId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || '비밀번호가 올바르지 않습니다');
      }
    } catch {
      setError('잠시 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full space-y-6 text-center"
      >
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-pink-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-800">
            소중한 분들을 위한 초대장이에요
          </h1>
          <p className="text-sm text-gray-500">
            비밀번호를 입력해주세요
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력해주세요"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-colors"
          autoFocus
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors"
        >
          {isLoading ? '확인 중...' : '확인'}
        </button>
      </form>
    </div>
  );
}
