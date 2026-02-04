import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkCredits,
  checkCreditsFromUser,
  deductCredits,
  refundCredits,
} from '@/lib/ai/credits';

// Mock DB
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
    it('성공: 크레딧 1개 차감', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ aiCredits: 4 }]),
          }),
        }),
      } as any);

      await expect(deductCredits(mockUserId, 1)).resolves.toBeUndefined();

      expect(db.update).toHaveBeenCalled();
    });

    it('성공: 크레딧 여러 개 차감', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ aiCredits: 2 }]),
          }),
        }),
      } as any);

      await expect(deductCredits(mockUserId, 3)).resolves.toBeUndefined();
    });

    it('실패: 크레딧 부족 (Race condition 방지)', async () => {
      // WHERE 조건으로 인해 UPDATE가 0개 행 반환
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]), // 빈 배열
          }),
        }),
      } as any);

      await expect(deductCredits(mockUserId, 1)).rejects.toThrow(
        'Insufficient credits'
      );
    });

    it('실패: 동시 요청 시 Race condition 방지', async () => {
      // 첫 번째 요청: 성공 (5 -> 4)
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ aiCredits: 4 }]),
          }),
        }),
      } as any);

      // 두 번째 요청: 실패 (WHERE 조건 불만족)
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      // 첫 번째 요청 성공
      await expect(deductCredits(mockUserId, 1)).resolves.toBeUndefined();

      // 두 번째 동시 요청 실패 (크레딧 부족)
      await expect(deductCredits(mockUserId, 5)).rejects.toThrow(
        'Insufficient credits'
      );
    });
  });

  describe('refundCredits', () => {
    it('성공: 크레딧 1개 환불', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await expect(refundCredits(mockUserId, 1)).resolves.toBeUndefined();

      expect(db.update).toHaveBeenCalled();
    });

    it('성공: 크레딧 여러 개 환불', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await expect(refundCredits(mockUserId, 3)).resolves.toBeUndefined();
    });

    it('성공: 환불은 항상 성공 (조건 없음)', async () => {
      // refundCredits는 WHERE 조건 없이 항상 실행됨
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await expect(refundCredits(mockUserId, 100)).resolves.toBeUndefined();
    });
  });

  describe('Integration: 차감 → 환불 플로우', () => {
    it('성공: 실패 시나리오에서 크레딧 환불', async () => {
      // 1. 크레딧 차감 성공
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ aiCredits: 4 }]),
          }),
        }),
      } as any);

      await deductCredits(mockUserId, 1);

      // 2. 외부 API 실패 가정...

      // 3. 크레딧 환불
      vi.mocked(db.update).mockReturnValueOnce({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      } as any);

      await refundCredits(mockUserId, 1);

      // 2번 호출됨: 차감 + 환불
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });
});
