// 이동평균 분석 결과 세부 정보
export interface TrendMetric {
  value: number        // 오늘 값 (이평선 값)
  slope: number        // 기울기 점수 (0-4)
  accel: number        // 가속도 점수 (0-3)
  description: string  // 설명
}

// 이동평균 추세 타입
export type TrendType = '상승' | '상승전환' | '하락' | '하락전환' | '유지'

export interface Trend {
  ticker: string   // 종목코드
  exchange: string // 거래소
  ma20: TrendMetric
  ma50: TrendMetric
  ma100: TrendMetric
  ma200: TrendMetric
}
