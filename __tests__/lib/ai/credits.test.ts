import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkCredits,
  checkCreditsFromUser,
  deductCredits,
  refundCredits,
} from '@/lib/ai/credits';

// Mock DB — transaction + insert 추가
const mockReturning = vi.fn();
const mockWhere = vi.fn(() => ({ returning: mockReturning }));
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockInsertValues = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    transaction: vi.fn(),
  },
}));

import { db } from '@/db';

describe('Credits System', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCredits', () => {
    it('성공: 크레딧이 충분함', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: mockUserId,
        aiCredits: 5,
      } as any);

      const result = await checkCredits(mockUserId);

      expect(result.hasCredits).toBe(true);
      expect(result.balance).toBe(5);
    });

    it('성공: 크레딧 0개', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: mockUserId,
        aiCredits: 0,
      } as any);

      const result = await checkCredits(mockUserId);

      expect(result.hasCredits).toBe(false);
      expect(result.balance).toBe(0);
    });

    it('실패: 사용자를 찾을 수 없음', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      await expect(checkCredits(mockUserId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('checkCreditsFromUser', () => {
    it('성공: 크레딧이 충분함', () => {
      const user = { aiCredits: 10 };

      const result = checkCreditsFromUser(user);

      expect(result.hasCredits).toBe(true);
      expect(result.balance).toBe(10);
    });

    it('성공: 크레딧 부족', () => {
      const user = { aiCredits: 0 };

      const result = checkCreditsFromUser(user);

      expect(result.hasCredits).toBe(false);
      expect(result.balance).toBe(0);
    });

    it('성공: DB 쿼리 없이 바로 계산', () => {
      const user = { aiCredits: 3 };
      const result = checkCreditsFromUser(user);

      expect(result.balance).toBe(3);
      // DB 호출이 없어야 함
      expect(db.query.users.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('deductCredits', () => {
    it('성공: 크레딧 차감 + 감사 추적 기록', async () => {
      const mockInsert = vi.fn(() => ({ values: vi.fn() }));
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 4 }]),
            })),
          })),
        })),
        insert: mockInsert,
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await deductCredits(mockUserId, 1, {
        referenceType: 'GENERATION',
        referenceId: 'gen-123',
        description: 'AI 사진 생성',
      });

      expect(result).toBe(4);
      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenCalled();
    });

    it('성공: options 없이 기본 description 사용', async () => {
      const insertValues = vi.fn();
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 9 }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: insertValues })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await deductCredits(mockUserId, 1);

      expect(result).toBe(9);
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DEDUCT',
          amount: 1,
          balanceAfter: 9,
          referenceType: null,
          referenceId: null,
          description: '크레딧 차감 (1장)',
        })
      );
    });

    it('실패: 크레딧 부족 (Race condition 방지)', async () => {
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([]), // 빈 배열
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: vi.fn() })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      await expect(deductCredits(mockUserId, 1)).rejects.toThrow(
        'Insufficient credits'
      );
      // 실패 시 insert 호출 없어야 함
      expect(mockTx.insert).not.toHaveBeenCalled();
    });

    it('반환값: balanceAfter 숫자 반환', async () => {
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 2 }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: vi.fn() })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await deductCredits(mockUserId, 3);
      expect(typeof result).toBe('number');
      expect(result).toBe(2);
    });
  });

  describe('refundCredits', () => {
    it('성공: 크레딧 환불 + 감사 추적 기록', async () => {
      const insertValues = vi.fn();
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 6 }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: insertValues })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await refundCredits(mockUserId, 1, {
        referenceType: 'GENERATION',
        referenceId: 'gen-123',
        description: 'AI 생성 실패 환불',
      });

      expect(result).toBe(6);
      expect(db.transaction).toHaveBeenCalled();
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REFUND',
          amount: 1,
          balanceAfter: 6,
          referenceType: 'GENERATION',
          referenceId: 'gen-123',
          description: 'AI 생성 실패 환불',
        })
      );
    });

    it('성공: options 없이 기본 description 사용', async () => {
      const insertValues = vi.fn();
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 11 }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: insertValues })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await refundCredits(mockUserId, 1);

      expect(result).toBe(11);
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REFUND',
          description: '크레딧 환불 (1장)',
          referenceType: null,
          referenceId: null,
        })
      );
    });

    it('실패: 사용자를 찾을 수 없음', async () => {
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: vi.fn() })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      await expect(refundCredits(mockUserId, 1)).rejects.toThrow('User not found');
    });

    it('반환값: balanceAfter 숫자 반환', async () => {
      const mockTx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ aiCredits: 100 }]),
            })),
          })),
        })),
        insert: vi.fn(() => ({ values: vi.fn() })),
      };

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => fn(mockTx));

      const result = await refundCredits(mockUserId, 100);
      expect(typeof result).toBe('number');
      expect(result).toBe(100);
    });
  });

  describe('Integration: 차감 → 환불 플로우', () => {
    it('성공: 실패 시나리오에서 크레딧 환불 (감사 추적 포함)', async () => {
      let txCallCount = 0;

      vi.mocked(db.transaction).mockImplementation(async (fn: any) => {
        txCallCount++;
        const mockTx = {
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ aiCredits: txCallCount === 1 ? 4 : 5 }]),
              })),
            })),
          })),
          insert: vi.fn(() => ({ values: vi.fn() })),
        };
        return fn(mockTx);
      });

      // 1. 크레딧 차감 성공
      const deductResult = await deductCredits(mockUserId, 1, {
        referenceType: 'GENERATION',
        referenceId: 'gen-abc',
      });
      expect(deductResult).toBe(4);

      // 2. 외부 API 실패 가정...

      // 3. 크레딧 환불
      const refundResult = await refundCredits(mockUserId, 1, {
        referenceType: 'GENERATION',
        referenceId: 'gen-abc',
        description: 'AI 생성 실패 환불',
      });
      expect(refundResult).toBe(5);

      // 2번의 트랜잭션: 차감 + 환불
      expect(db.transaction).toHaveBeenCalledTimes(2);
    });
  });
});
