'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { CheckCircle2, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';

type ActivateState =
  | { step: 'form' }
  | { step: 'loading' }
  | { step: 'success'; creditsGranted: number; premiumUpgraded: boolean; productName: string }
  | { step: 'error'; message: string };

export default function ActivatePage() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<ActivateState>({ step: 'form' });
  const [orderNumber, setOrderNumber] = useState('');

  // 세션 로딩 중
  if (status === 'loading') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto" />
      </div>
    );
  }

  // 미로그인 → 로그인 유도
  if (!session?.user) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-stone-900">상품 활성화</h1>
          <p className="text-sm text-stone-500 mt-2">
            스마트스토어에서 구매한 상품을 활성화하려면<br />
            먼저 로그인해주세요.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn('kakao', { callbackUrl: '/activate' })}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
            </svg>
            카카오로 로그인
          </button>

          <button
            onClick={() => signIn('naver', { callbackUrl: '/activate' })}
            className="w-full bg-[#03C75A] hover:bg-[#02b351] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
            </svg>
            네이버로 로그인
          </button>
        </div>
      </div>
    );
  }

  // 활성화 요청
  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setState({ step: 'loading' });

    try {
      const res = await fetch('/api/payments/activate-smartstore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productOrderId: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ step: 'error', message: data.error || '활성화에 실패했습니다' });
        return;
      }

      setState({
        step: 'success',
        creditsGranted: data.data.creditsGranted,
        premiumUpgraded: data.data.premiumUpgraded,
        productName: data.data.productName,
      });
    } catch {
      setState({ step: 'error', message: '네트워크 오류가 발생했습니다' });
    }
  }

  // 성공
  if (state.step === 'success') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-stone-900 mb-2">활성화 완료!</h1>
        <p className="text-sm text-stone-600 mb-4">{state.productName}</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 space-y-1">
          <p className="text-sm text-green-800">
            AI 크레딧 <span className="font-bold">+{state.creditsGranted}</span>장 지급
          </p>
          {state.premiumUpgraded && (
            <p className="text-sm text-green-800 font-bold">
              프리미엄 플랜 업그레이드 완료!
            </p>
          )}
        </div>
        <a
          href="/dashboard"
          className="inline-block w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          대시보드로 이동
        </a>
      </div>
    );
  }

  // 폼 / 에러 / 로딩
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="text-center mb-6">
        <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-stone-900">상품 활성화</h1>
        <p className="text-sm text-stone-500 mt-2">
          스마트스토어에서 구매한 상품의<br />
          상품주문번호를 입력해주세요.
        </p>
      </div>

      {state.step === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{state.message}</p>
        </div>
      )}

      <form onSubmit={handleActivate}>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          상품주문번호
        </label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="예: 2026021512345678"
          className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent"
          disabled={state.step === 'loading'}
        />
        <p className="text-xs text-stone-400 mt-2 mb-4">
          네이버 주문내역에서 확인할 수 있습니다.
        </p>

        <button
          type="submit"
          disabled={state.step === 'loading' || !orderNumber.trim()}
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {state.step === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              확인 중...
            </>
          ) : (
            '활성화하기'
          )}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-4">
        문제가 있나요?{' '}
        <a href="mailto:help@cuggu.com" className="underline hover:text-stone-600">
          고객센터
        </a>
      </p>
    </div>
  );
}
