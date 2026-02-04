'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';

/**
 * 인사말 탭
 *
 * - 인사말 텍스트
 * - 미리 작성된 예시 제공
 */
export function GreetingTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  const handleGreetingChange = (value: string) => {
    updateInvitation({
      content: {
        ...invitation.content,
        greeting: value,
      },
    });
  };

  const exampleGreetings = [
    '평생을 함께할 반려자를 만났습니다.\n저희 두 사람이 사랑과 믿음으로\n한 가정을 이루게 되었습니다.\n오셔서 축복해 주시면 감사하겠습니다.',
    '서로가 마주보며 다져온 사랑을\n이제 함께 한 곳을 바라보며\n걸어갈 수 있는 큰 사랑으로 키우고자 합니다.\n저희 두 사람의 앞날을 축복해 주십시오.',
    '두 사람이 사랑으로 만나\n진실과 이해로 하나를 이루어\n믿음과 신의로 가정을 이루려 합니다.\n오셔서 두 사람의 앞날을 축복해 주십시오.',
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">인사말</h2>
        <p className="text-sm text-slate-500">청첩장에 담을 인사말을 작성하세요</p>
      </div>

      {/* 인사말 입력 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            인사말
          </label>
          <textarea
            value={invitation.content?.greeting || ''}
            onChange={(e) => handleGreetingChange(e.target.value)}
            placeholder="인사말을 입력하세요"
            rows={8}
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 resize-none placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            {invitation.content?.greeting?.length || 0} / 500자
          </p>
        </div>
      </div>

      {/* 예시 인사말 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">예시 인사말</h3>
        <div className="space-y-2.5">
          {exampleGreetings.map((greeting, index) => (
            <button
              key={index}
              onClick={() => handleGreetingChange(greeting)}
              className="w-full p-3.5 text-left border border-slate-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all"
            >
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {greeting}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
