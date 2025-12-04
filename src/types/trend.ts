// 이동평균 추세 타입
export type TrendType = '상승' | '상승전환' | '하락' | '하락전환' | '유지'

export interface Trend {
  ticker: string   // 종목코드
  exchange: string // 거래소
  ma20: TrendType  // 이동평균 20일선 추세
  ma50: TrendType  // 이동평균 50일선 추세
  ma100: TrendType // 이동평균 100일선 추세
  ma200: TrendType // 이동평균 200일선 추세
}
