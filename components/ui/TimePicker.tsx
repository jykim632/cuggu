'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value?: string; // HH:MM 형식
  onChange: (time: string) => void;
  placeholder?: string;
}

/**
 * 커스텀 TimePicker 컴포넌트
 *
 * - 시간/분 드롭다운 선택
 * - 한국 결혼식 시간대 (오전 10시 ~ 오후 8시)
 * - 15분 단위
 */
export function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택'
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // HH:MM 파싱
  const [parsedHour, parsedMinute] = value
    ? value.split(':').map(Number)
    : [12, 0];

  // 임시 선택 상태 (popover 내에서만 사용)
  const [tempHour, setTempHour] = useState(parsedHour);
  const [tempMinute, setTempMinute] = useState(parsedMinute);

  // 결혼식 일반적인 시간대 (10:00 ~ 20:00)
  const hours = Array.from({ length: 11 }, (_, i) => i + 10);
  const minutes = [0, 15, 30, 45];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
      // popover 열 때 현재 값으로 초기화
      setTempHour(parsedHour);
      setTempMinute(parsedMinute);
    }
  }, [isOpen, parsedHour, parsedMinute]);

  // 시간만 선택 (popover는 열어둠)
  const handleHourSelect = (hour: number) => {
    setTempHour(hour);
  };

  // 분 선택 (최종 확정 & popover 닫기)
  const handleMinuteSelect = (minute: number) => {
    const timeString = `${String(tempHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}시 ${minute === 0 ? '' : `${minute}분`}`.trim();
  };

  const dropdown = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Time Selector */}
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-stone-200 p-4 w-64"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
            <div className="grid grid-cols-2 gap-3">
              {/* 시간 선택 */}
              <div>
                <div className="text-xs font-semibold text-stone-600 mb-2">시간</div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleHourSelect(hour)}
                      className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                        hour === tempHour
                          ? 'bg-pink-500 text-white font-medium'
                          : 'hover:bg-pink-50 text-stone-700'
                      }`}
                    >
                      {formatTime(hour, 0).split(' ')[0]} {formatTime(hour, 0).split(' ')[1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 분 선택 */}
              <div>
                <div className="text-xs font-semibold text-stone-600 mb-2">분</div>
                <div className="space-y-1">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => handleMinuteSelect(minute)}
                      className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                        minute === tempMinute
                          ? 'bg-pink-500 text-white font-medium'
                          : 'hover:bg-pink-50 text-stone-700'
                      }`}
                    >
                      {minute === 0 ? '정각' : `${minute}분`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
    </>
  ) : null;

  return (
    <div className="relative">
      {/* Input */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-300 focus:border-pink-300 transition-colors text-left flex items-center justify-between"
      >
        <span className={value ? 'text-stone-900' : 'text-stone-400'}>
          {value ? formatTime(parsedHour, parsedMinute) : placeholder}
        </span>
        <Clock className="w-4 h-4 text-stone-400" />
      </button>

      {/* Portal Dropdown */}
      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
