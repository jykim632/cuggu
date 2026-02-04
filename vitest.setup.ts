// Vitest 글로벌 설정
import { expect } from 'vitest';

// 환경 변수 설정 (테스트용)
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/cuggu_test';
