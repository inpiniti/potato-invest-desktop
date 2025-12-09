// TradingView 볼린저 밴드 데이터 타입
export interface TradingViewBBData {
  ticker: string
  close: number | null      // 종가
  bbUpper: number | null    // 볼린저 밴드 상단
  bbBasis: number | null    // 볼린저 밴드 중간
  bbLower: number | null    // 볼린저 밴드 하단
  marketCap: number | null  // 시가총액
}

// 볼린저 밴드 신호 타입
export type BBSignal = '강력매수' | '매수' | '매도' | '강력매도' | null

// 볼린저 밴드 신호 계산 함수
export function calculateBBSignal(data: TradingViewBBData): BBSignal {
  const { close, bbUpper, bbBasis, bbLower } = data
  
  // 필요한 데이터가 없으면 null 반환
  if (close === null || bbUpper === null || bbBasis === null || bbLower === null) {
    return null
  }
  
  // 종가가 볼린저 밴드 상단보다 높으면 강력매도
  if (close > bbUpper) {
    return '강력매도'
  }
  
  // 종가가 볼린저 밴드 상단과 중간 사이면 매도
  if (close > bbBasis && close <= bbUpper) {
    return '매도'
  }
  
  // 종가가 볼린저 밴드 중간과 하단 사이면 매수
  if (close > bbLower && close <= bbBasis) {
    return '매수'
  }
  
  // 종가가 볼린저 밴드 하단보다 낮으면 강력매수
  if (close <= bbLower) {
    return '강력매수'
  }
  
  return null
}
