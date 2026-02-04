import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/generate/route';
import { NextRequest } from 'next/server';

// Mock modules
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/ai/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/ai/face-detection', () => ({
  detectFace: vi.fn(),
}));

vi.mock('@/lib/ai/s3', () => ({
  uploadToS3: vi.fn(),
}));

vi.mock('@/lib/ai/replicate', () => ({
  generateWeddingPhotos: vi.fn(),
}));

import { auth } from '@/auth';
import { db } from '@/db';
import { rateLimit } from '@/lib/ai/rate-limit';
import { detectFace } from '@/lib/ai/face-detection';
import { uploadToS3 } from '@/lib/ai/s3';
import { generateWeddingPhotos } from '@/lib/ai/replicate';

describe('POST /api/ai/generate', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    aiCredits: 5,
  };

  const createMockRequest = (
    imageBuffer: Buffer,
    style: string = 'CLASSIC'
  ): NextRequest => {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'test.jpg');
    formData.append('style', style);

    return new NextRequest('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      body: formData,
    });
  };

  const createJPEGBuffer = (): Buffer => {
    // JPEG magic number: FF D8 FF
    const buffer = Buffer.alloc(100);
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;
    return buffer;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(auth).mockResolvedValue({
      user: { email: mockUser.email },
    } as any);

    vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

    vi.mocked(rateLimit).mockResolvedValue(true);

    vi.mocked(detectFace).mockResolvedValue({
      success: true,
      faceCount: 1,
    });

    vi.mocked(uploadToS3).mockResolvedValue(
      'https://s3.amazonaws.com/bucket/image.jpg'
    );

    vi.mocked(generateWeddingPhotos).mockResolvedValue({
      urls: [
        'https://replicate.com/output1.png',
        'https://replicate.com/output2.png',
        'https://replicate.com/output3.png',
        'https://replicate.com/output4.png',
      ],
      replicateId: 'pred-abc123',
      cost: 0.16,
    });

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ aiCredits: 4 }]),
        }),
      }),
    } as any);

    // DB insert mock - capture and return style parameter dynamically
    const insertMock = vi.fn();
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn((data: any) => ({
        returning: vi.fn().mockResolvedValue([
          {
            id: 'gen-123',
            originalUrl: 'https://s3.amazonaws.com/bucket/image.jpg',
            generatedUrls: [
              'https://replicate.com/output1.png',
              'https://replicate.com/output2.png',
              'https://replicate.com/output3.png',
              'https://replicate.com/output4.png',
            ],
            style: data.style, // Use actual style from request
          },
        ]),
      })),
    } as any);
  });

  describe('Success Cases', () => {
    it('성공: AI 사진 4장 생성', async () => {
      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer, 'CLASSIC');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.generatedUrls).toHaveLength(4);
      expect(data.data.style).toBe('CLASSIC');
      expect(data.data.remainingCredits).toBe(4); // 5 - 1

      // 크레딧 차감 확인
      expect(db.update).toHaveBeenCalled();

      // S3 업로드 확인
      expect(uploadToS3).toHaveBeenCalledWith(
        expect.any(Buffer),
        'image/jpeg',
        'ai-originals'
      );

      // Replicate API 호출 확인
      expect(generateWeddingPhotos).toHaveBeenCalledWith(
        'https://s3.amazonaws.com/bucket/image.jpg',
        'CLASSIC'
      );

      // DB 저장 확인
      expect(db.insert).toHaveBeenCalled();
    });

    it('성공: 다른 스타일 (MODERN)', async () => {
      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer, 'MODERN');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.style).toBe('MODERN');
      expect(generateWeddingPhotos).toHaveBeenCalledWith(
        expect.any(String),
        'MODERN'
      );
    });
  });

  describe('Authentication', () => {
    it('실패: 인증되지 않은 요청', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('실패: 사용자를 찾을 수 없음', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('Rate Limiting', () => {
    it('실패: Rate limit 초과', async () => {
      vi.mocked(rateLimit).mockResolvedValue(false);

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
    });
  });

  describe('Validation', () => {
    it('실패: 잘못된 스타일', async () => {
      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer, 'INVALID_STYLE');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid style');
    });

    it('실패: 이미지 없음', async () => {
      const formData = new FormData();
      formData.append('style', 'CLASSIC');

      const request = new NextRequest(
        'http://localhost:3000/api/ai/generate',
        {
          method: 'POST',
          body: formData,
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Image and style are required');
    });

    it('실패: PNG 파일 시그니처 검증 실패', async () => {
      // Invalid PNG (wrong magic number)
      const invalidBuffer = Buffer.alloc(100);
      invalidBuffer[0] = 0x00;
      invalidBuffer[1] = 0x00;

      const request = createMockRequest(invalidBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('유효하지 않은 이미지 파일입니다');
    });
  });

  describe('Credits', () => {
    it('실패: 크레딧 부족', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        aiCredits: 0,
      } as any);

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe('Insufficient credits');
      expect(data.balance).toBe(0);
    });

    it('실패: 크레딧 차감 Race condition', async () => {
      // 크레딧 차감 실패 (조건부 UPDATE가 빈 배열 반환)
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]), // Empty result
          }),
        }),
      } as any);

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe('Face Detection', () => {
    it('실패: 얼굴 감지 안됨', async () => {
      vi.mocked(detectFace).mockResolvedValue({
        success: false,
        faceCount: 0,
        error: '얼굴이 감지되지 않았습니다',
      });

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('얼굴이 감지되지 않았습니다');
    });

    it('실패: 여러 얼굴 감지됨', async () => {
      vi.mocked(detectFace).mockResolvedValue({
        success: false,
        faceCount: 2,
        error: '2명의 얼굴이 감지되었습니다. 1명만 가능합니다.',
      });

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('2명의 얼굴이 감지되었습니다');
    });
  });

  describe('S3 Upload', () => {
    it('실패: S3 업로드 실패 시 크레딧 환불', async () => {
      vi.mocked(uploadToS3).mockRejectedValue(new Error('S3 upload failed'));

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('S3 업로드 실패');

      // 크레딧 환불 확인 (UPDATE가 2번 호출됨: 차감 + 환불)
      expect(db.update).toHaveBeenCalledTimes(2);

      // 실패 이력 저장 확인
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('AI Generation', () => {
    it('실패: AI 생성 실패 시 크레딧 환불', async () => {
      vi.mocked(generateWeddingPhotos).mockRejectedValue(
        new Error('Replicate API failed')
      );

      const imageBuffer = createJPEGBuffer();
      const request = createMockRequest(imageBuffer);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('AI 생성 중 오류가 발생했습니다');

      // 크레딧 환불 확인
      expect(db.update).toHaveBeenCalledTimes(2);

      // 실패 이력 저장 확인
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
