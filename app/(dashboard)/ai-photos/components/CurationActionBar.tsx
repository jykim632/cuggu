'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FolderInput, Trash2, X } from 'lucide-react';
import type { AlbumGroup } from '@/types/ai';

const UNGROUPED_ID = '__ungrouped__';

interface CurationActionBarProps {
  selectedCount: number;
  groups: AlbumGroup[];
  onMoveToGroup: (groupId: string) => void;
  onDelete: () => void;
  onDeselectAll: () => void;
}

export function CurationActionBar({
  selectedCount,
  groups,
  onMoveToGroup,
  onDelete,
  onDeselectAll,
}: CurationActionBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="sticky bottom-0 z-10 -mx-4 border-t border-stone-200 bg-white/95 backdrop-blur px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-700">
              {selectedCount}장 선택
            </span>
            <button
              onClick={onDeselectAll}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 그룹 이동 */}
            {groups.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                  그룹 이동
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute bottom-full right-0 mb-1 z-20 w-40 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onMoveToGroup(UNGROUPED_ID); setShowDropdown(false); }}
                        className="w-full px-3 py-1.5 text-left text-xs text-stone-600 hover:bg-stone-50"
                      >
                        미분류
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => { onMoveToGroup(g.id); setShowDropdown(false); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-stone-600 hover:bg-stone-50"
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 삭제 */}
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
              삭제
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
