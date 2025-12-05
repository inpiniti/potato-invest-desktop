-- 기존 테이블 완전 삭제
DROP TABLE IF EXISTS trading CASCADE;

-- 테이블 재생성 (RLS 없이)
CREATE TABLE trading (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  ticker TEXT NOT NULL,
  buy_price NUMERIC NOT NULL,
  buy_quantity NUMERIC NOT NULL,
  buy_time TIMESTAMPTZ NOT NULL,
  sell_price NUMERIC,
  sell_quantity NUMERIC,
  sell_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스만 생성 (RLS는 생략)
CREATE INDEX idx_trading_uid ON trading(uid);
CREATE INDEX idx_trading_ticker ON trading(ticker);
CREATE INDEX idx_trading_uid_ticker ON trading(uid, ticker);
CREATE INDEX idx_trading_buy_time ON trading(buy_time DESC);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_trading_updated_at
  BEFORE UPDATE ON trading
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 확인
ALTER TABLE trading DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'trading';
