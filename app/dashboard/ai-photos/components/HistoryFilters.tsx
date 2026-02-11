'use client';

import { PersonRole, AIStyle, AI_STYLES } from '@/types/ai';

export interface HistoryFilterState {
  role: PersonRole | null;
  style: AIStyle | null;
}

interface HistoryFiltersProps {
  filters: HistoryFilterState;
  onFilterChange: (filters: HistoryFilterState) => void;
}

const ROLE_OPTIONS = [
  { value: null, label: '전체' },
  { value: 'GROOM' as const, label: '신랑' },
  { value: 'BRIDE' as const, label: '신부' },
];

export function HistoryFilters({ filters, onFilterChange }: HistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Role filter */}
      <div className="flex gap-1 rounded-lg bg-stone-100 p-0.5">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onFilterChange({ ...filters, role: option.value })}
            className={`
              rounded-md px-3 py-1.5 text-xs font-medium transition-colors
              ${filters.role === option.value
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Style filter */}
      <select
        value={filters.style ?? ''}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            style: (e.target.value || null) as AIStyle | null,
          })
        }
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
      >
        <option value="">스타일 전체</option>
        {AI_STYLES.map((style) => (
          <option key={style.value} value={style.value}>
            {style.label}
          </option>
        ))}
      </select>
    </div>
  );
}
