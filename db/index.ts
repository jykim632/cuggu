import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = process.env.DATABASE_URL;

// Serverless 환경 최적화 (Supabase Pooler + Vercel)
const client = postgres(connectionString, {
  prepare: false,       // PgBouncer transaction mode 필수
  max: 3,               // Serverless 인스턴스당 최대 커넥션
  idle_timeout: 20,     // 유휴 커넥션 20초 후 해제
  connect_timeout: 10,  // 커넥션 타임아웃 10초
});

export const db = drizzle(client, { schema });
