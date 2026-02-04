'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

/**
 * 예식 정보 탭
 *
 * - 예식 날짜/시간 (필수)
 * - 예식장 정보 (필수)
 * - 홀 이름
 * - 주소
 * - 교통편
 */
export function VenueTab() {
  const { invitation, updateInvitation } = useInvitationEditor();

  // wedding.date ISO string을 날짜/시간으로 파싱
  const parseDateAndTime = (isoString?: string) => {
    if (!isoString) return { date: undefined, time: undefined };
    const dt = new Date(isoString);
    return {
      date: dt,
      time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
    };
  };

  const { date: weddingDate, time: weddingTime } = parseDateAndTime(invitation.wedding?.date);

  // 날짜만 변경
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;

    // 기존 시간 유지 (없으면 시간 설정 안 함)
    if (weddingTime) {
      const [hours, minutes] = weddingTime.split(':');
      date.setHours(Number(hours), Number(minutes));
    }

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        date: date.toISOString(),
        venue: invitation.wedding?.venue,
      },
    });
  };

  // 시간만 변경
  const handleTimeChange = (time: string) => {
    // 날짜가 없으면 오늘 날짜로 설정
    const baseDate = weddingDate || new Date();
    const [hours, minutes] = time.split(':');
    baseDate.setHours(Number(hours), Number(minutes), 0, 0);

    updateInvitation({
      wedding: {
        ...invitation.wedding,
        date: baseDate.toISOString(),
        venue: invitation.wedding?.venue,
      },
    });
  };

  const handleVenueChange = (field: string, value: any) => {
    updateInvitation({
      wedding: {
        ...invitation.wedding,
        venue: {
          ...invitation.wedding?.venue,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">예식 정보</h2>
        <p className="text-sm text-slate-500">결혼식 날짜와 장소를 입력하세요</p>
      </div>

      {/* 날짜/시간 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">예식 일시</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              날짜 <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={weddingDate}
              onSelect={handleDateChange}
              placeholder="날짜를 선택하세요"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              시간 <span className="text-red-500">*</span>
            </label>
            <TimePicker
              value={weddingTime}
              onChange={handleTimeChange}
              placeholder="시간을 선택하세요"
            />
          </div>
        </div>
      </div>

      {/* 예식장 정보 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-4 shadow-lg shadow-pink-100/50">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">예식장</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            예식장 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.wedding?.venue?.name || ''}
            onChange={(e) => handleVenueChange('name', e.target.value)}
            placeholder="서울웨딩홀"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            홀 이름
          </label>
          <input
            type="text"
            value={invitation.wedding?.venue?.hall || ''}
            onChange={(e) => handleVenueChange('hall', e.target.value)}
            placeholder="3층 그랜드홀"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invitation.wedding?.venue?.address || ''}
            onChange={(e) => handleVenueChange('address', e.target.value)}
            placeholder="서울시 강남구 테헤란로 123"
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            교통편 안내
          </label>
          <textarea
            value={invitation.wedding?.venue?.directions || ''}
            onChange={(e) => handleVenueChange('directions', e.target.value)}
            placeholder="지하철: 강남역 3번 출구 도보 5분&#10;버스: 146, 301, 402 강남역 하차"
            rows={4}
            className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 resize-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
