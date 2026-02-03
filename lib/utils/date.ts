/**
 * 날짜 포맷팅 유틸리티
 * date-fns 없이 네이티브 Intl.DateTimeFormat 사용
 */

export interface DateFormatOptions {
  includeYear?: boolean;
  includeMonth?: boolean;
  includeDay?: boolean;
  includeWeekday?: boolean;
  includeTime?: boolean;
  hour12?: boolean;
}

/**
 * 한국어 날짜 포맷
 */
export function formatKoreanDate(
  date: Date,
  options: DateFormatOptions = {}
): string {
  const {
    includeYear = true,
    includeMonth = true,
    includeDay = true,
    includeWeekday = false,
    includeTime = false,
    hour12 = true,
  } = options;

  const intlOptions: Intl.DateTimeFormatOptions = {};

  if (includeYear) intlOptions.year = "numeric";
  if (includeMonth) intlOptions.month = "numeric";
  if (includeDay) intlOptions.day = "numeric";
  if (includeWeekday) intlOptions.weekday = "long";
  if (includeTime) {
    intlOptions.hour = "numeric";
    intlOptions.minute = "2-digit";
    intlOptions.hour12 = hour12;
  }

  return new Intl.DateTimeFormat("ko-KR", intlOptions).format(date);
}

/**
 * 웨딩 날짜 전용 포맷 (예: "2024년 5월 18일 토요일")
 */
export function formatWeddingDate(date: Date): string {
  return formatKoreanDate(date, {
    includeYear: true,
    includeMonth: true,
    includeDay: true,
    includeWeekday: true,
  });
}

/**
 * 웨딩 시간 전용 포맷 (예: "오후 2시 00분")
 */
export function formatWeddingTime(date: Date): string {
  return formatKoreanDate(date, {
    includeYear: false,
    includeMonth: false,
    includeDay: false,
    includeTime: true,
    hour12: true,
  });
}

/**
 * 웨딩 날짜+시간 전체 포맷 (예: "2024년 5월 18일 토요일 오후 2시 00분")
 */
export function formatWeddingDateTime(date: Date): string {
  const dateStr = formatWeddingDate(date);
  const timeStr = formatWeddingTime(date);
  return `${dateStr} ${timeStr}`;
}
