'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import 'react-day-picker/style.css';

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
}

/**
 * 커스텀 DatePicker 컴포넌트
 *
 * react-day-picker + Tailwind 스타일링
 * - 한국어 로케일
 * - 모바일 최적화
 * - 완전한 키보드 네비게이션
 */
export function DatePicker({
  selected,
  onSelect,
  placeholder = '날짜 선택',
  minDate = new Date()
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen]);

  const dropdown = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Calendar */}
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-pink-100 p-4"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => {
                onSelect(date);
                setIsOpen(false);
              }}
              locale={ko}
              disabled={{ before: minDate }}
              classNames={{
                root: 'text-sm',
                months: 'flex flex-col',
                month: 'space-y-4',
                month_caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-semibold text-slate-900',
                nav: 'flex items-center gap-1',
                button_previous: 'absolute left-0 inline-flex items-center justify-center rounded-lg w-8 h-8 bg-transparent hover:bg-pink-50 transition-colors',
                button_next: 'absolute right-0 inline-flex items-center justify-center rounded-lg w-8 h-8 bg-transparent hover:bg-pink-50 transition-colors',
                month_grid: 'w-full border-collapse space-y-1',
                weekdays: 'flex',
                weekday: 'text-slate-500 rounded-md w-9 font-normal text-xs',
                week: 'flex w-full mt-2',
                day: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-pink-50/50 [&:has([aria-selected])]:bg-pink-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day_button: 'inline-flex items-center justify-center rounded-lg w-9 h-9 hover:bg-pink-50 hover:text-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400',
                selected: 'bg-pink-600 text-white hover:bg-pink-700 hover:text-white focus:bg-pink-600 focus:text-white',
                today: 'bg-slate-100 text-slate-900 font-semibold',
                outside: 'text-slate-300 opacity-50',
                disabled: 'text-slate-300 opacity-50 cursor-not-allowed hover:bg-transparent',
                range_middle: 'aria-selected:bg-pink-50 aria-selected:text-pink-900',
                hidden: 'invisible',
              }}
            />
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
        className="w-full px-4 py-3 text-sm bg-gradient-to-br from-white to-pink-50/20 border border-pink-200/50 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-300 focus:bg-white transition-all duration-200 text-left flex items-center justify-between"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected ? format(selected, 'yyyy년 M월 d일', { locale: ko }) : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-slate-400" />
      </button>

      {/* Portal Dropdown */}
      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
