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
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1">인사말</h2>
        <p className="text-sm text-stone-500">청첩장에 담을 인사말을 작성하세요</p>
      </div>

      {/* 인사말 입력 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            인사말
          </label>
          <textarea
            value={invitation.content?.greeting || ''}
            onChange={(e) => handleGreetingChange(e.target.value)}
            placeholder="인사말을 입력하세요"
            rows={8}
            className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors resize-none placeholder:text-stone-400"
          />
          <p className="text-xs text-stone-500 mt-1.5">
            {invitation.content?.greeting?.length || 0} / 500자
          </p>
        </div>
      </div>

      {/* 예시 인사말 */}
      <div className="bg-white rounded-xl p-6 space-y-4 border border-stone-200">
        <h3 className="text-sm font-medium text-stone-700 mb-3">예시 인사말</h3>
        <div className="space-y-2.5">
          {exampleGreetings.map((greeting, index) => (
            <button
              key={index}
              onClick={() => handleGreetingChange(greeting)}
              className="w-full p-3.5 text-left border border-stone-200 rounded-lg hover:border-pink-300 hover:bg-pink-50/50 transition-colors"
            >
              <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">
                {greeting}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
