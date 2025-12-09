/**
 * 트레이딩 히스토리 타입
 */
export interface TradingHistory {
  id: string // 고유 ID (ticker_buyTime_timestamp 형식)
  uid: string // 사용자 UID (kakaotoken)
  ticker: string // 티커 심볼
  buyPrice: number // 구매 가격
  buyQuantity: number // 구매 수량
  buyTime: string // 구매 시간 (ISO 8601 형식)
  sellPrice: number | null // 판매 가격 (nullable)
  sellQuantity: number | null // 판매 수량 (nullable)
  sellTime: string | null // 판매 시간 (nullable, ISO 8601 형식)
}

/**
 * Supabase trading 테이블 레코드 타입 (snake_case)
 */
export interface TradingRecord {
  id: string
  uid: string
  ticker: string
  buy_price: number
  buy_quantity: number
  buy_time: string
  sell_price: number | null
  sell_quantity: number | null
  sell_time: string | null
  created_at?: string
  updated_at?: string
}

/**
 * 트레이딩 목록 아이템 타입
 */
export interface TradingListItem {
  id: string // 고유 ID (ticker_uid 형식)
  uid: string // 사용자 UID (kakaotoken)
  ticker: string // 티커 심볼
  name: string // 종목명
  exchange: 'NAS' | 'NYS' // 거래소 (NASDAQ 또는 NYSE)
  addedAt: string // 추가 시간 (ISO 8601 형식)
}

/**
 * Supabase trading_list 테이블 레코드 타입 (snake_case)
 */
export interface TradingListRecord {
  id: string
  uid: string
  ticker: string
  name: string
  exchange: 'NAS' | 'NYS'
  added_at: string
  created_at?: string
  updated_at?: string
}
