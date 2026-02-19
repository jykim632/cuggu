-- Step 0: 스마트스토어 결제 지원

-- 1. 결제수단에 NAVER_PAY 추가
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'NAVER_PAY';

-- 2. 결제 채널 enum 생성
CREATE TYPE payment_channel AS ENUM ('SITE', 'SMARTSTORE');

-- 3. payments 테이블에 채널 컬럼 추가
ALTER TABLE payments ADD COLUMN channel payment_channel DEFAULT 'SITE' NOT NULL;

-- 4. 스마트스토어 주문번호 (중복 활성화 방지용 UNIQUE)
ALTER TABLE payments ADD COLUMN smartstore_order_id varchar(64) UNIQUE;
