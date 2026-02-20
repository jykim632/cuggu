'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { GREETING_EXAMPLE_TEXTS } from '@/lib/copy/greeting-examples';

/**
 * 인사말 탭
 *
 * - 인사말 텍스트
 * - 미리 작성된 예시 제공
 */
export function GreetingTab() {
  const { invitation, updateInvitation, toggleSection, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();
  const enabled = enabledSections.greeting !== false;

  const handleGreetingChange = (value: string) => {
    updateInvitation({
      content: {
        ...invitation.content,
        greeting: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 tracking-tight mb-1 flex items-center gap-2">
            인사말
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
              {enabled ? '활성' : '비활성'}
            </span>
          </h2>
          <p className="text-sm text-stone-500">청첩장에 담을 인사말을 작성하세요</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleSection('greeting', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-stone-200 border border-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 peer-checked:border-pink-500"></div>
        </label>
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
          {GREETING_EXAMPLE_TEXTS.map((greeting, index) => (
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
