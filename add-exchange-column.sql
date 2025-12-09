-- trading_list 테이블에 exchange 컬럼 추가
-- 이 마이그레이션은 기존 데이터를 보존하면서 exchange 컬럼을 추가합니다.

-- 1. exchange 컬럼 추가 (기본값 'NAS')
ALTER TABLE trading_list 
ADD COLUMN IF NOT EXISTS exchange VARCHAR(3) DEFAULT 'NAS' NOT NULL;

-- 2. 컬럼에 체크 제약 조건 추가 (NAS 또는 NYS만 허용)
ALTER TABLE trading_list 
ADD CONSTRAINT chk_exchange CHECK (exchange IN ('NAS', 'NYS'));

-- 참고: 기존 데이터는 기본값 'NAS'로 설정됩니다.
-- 필요한 경우 아래 쿼리로 특정 종목의 거래소를 업데이트할 수 있습니다.
-- UPDATE trading_list SET exchange = 'NYS' WHERE ticker IN ('JPM', 'GS', 'WMT', ...);
