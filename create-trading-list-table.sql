-- Trading List (트레이딩 목록) 테이블 생성
CREATE TABLE IF NOT EXISTS trading_list (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- uid로 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_list_uid ON trading_list(uid);

-- ticker로 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_list_ticker ON trading_list(ticker);

-- uid + ticker 복합 조회를 위한 인덱스 (중복 방지용)
CREATE INDEX IF NOT EXISTS idx_trading_list_uid_ticker ON trading_list(uid, ticker);

-- added_at으로 정렬 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_list_added_at ON trading_list(added_at DESC);

-- updated_at 자동 업데이트 트리거 (이미 함수가 있으면 재사용)
CREATE TRIGGER update_trading_list_updated_at
  BEFORE UPDATE ON trading_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 비활성화 (테스트용)
ALTER TABLE trading_list DISABLE ROW LEVEL SECURITY;

-- 코멘트 추가
COMMENT ON TABLE trading_list IS '트레이딩 목록 테이블';
COMMENT ON COLUMN trading_list.id IS '고유 ID (ticker_uid 형식)';
COMMENT ON COLUMN trading_list.uid IS '사용자 UID (kakaotoken)';
COMMENT ON COLUMN trading_list.ticker IS '티커 심볼';
COMMENT ON COLUMN trading_list.name IS '종목명';
COMMENT ON COLUMN trading_list.added_at IS '추가 시간';
COMMENT ON COLUMN trading_list.created_at IS '레코드 생성 시간';
COMMENT ON COLUMN trading_list.updated_at IS '레코드 수정 시간';
