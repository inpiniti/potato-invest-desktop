-- Trading 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS trading (
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

-- uid로 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_uid ON trading(uid);

-- ticker로 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_ticker ON trading(ticker);

-- uid + ticker 복합 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_uid_ticker ON trading(uid, ticker);

-- buy_time으로 정렬 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_buy_time ON trading(buy_time DESC);

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

-- RLS (Row Level Security) 활성화
ALTER TABLE trading ENABLE ROW LEVEL SECURITY;

-- 자신의 데이터만 조회 가능
CREATE POLICY "Users can view their own trading history"
  ON trading
  FOR SELECT
  USING (uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert their own trading history"
  ON trading
  FOR INSERT
  WITH CHECK (uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- 자신의 데이터만 업데이트 가능
CREATE POLICY "Users can update their own trading history"
  ON trading
  FOR UPDATE
  USING (uid = current_setting('request.jwt.claims', true)::json->>'sub');

-- 코멘트 추가
COMMENT ON TABLE trading IS '트레이딩 히스토리 테이블';
COMMENT ON COLUMN trading.id IS '고유 ID (ticker_buyTime_timestamp 형식)';
COMMENT ON COLUMN trading.uid IS '사용자 UID (kakaotoken)';
COMMENT ON COLUMN trading.ticker IS '티커 심볼';
COMMENT ON COLUMN trading.buy_price IS '구매 가격';
COMMENT ON COLUMN trading.buy_quantity IS '구매 수량';
COMMENT ON COLUMN trading.buy_time IS '구매 시간';
COMMENT ON COLUMN trading.sell_price IS '판매 가격 (nullable)';
COMMENT ON COLUMN trading.sell_quantity IS '판매 수량 (nullable)';
COMMENT ON COLUMN trading.sell_time IS '판매 시간 (nullable)';
COMMENT ON COLUMN trading.created_at IS '레코드 생성 시간';
COMMENT ON COLUMN trading.updated_at IS '레코드 수정 시간';
