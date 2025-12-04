// 게시글 타입
export interface Board {
  author: string      // 작성자
  title: string       // 제목
  content: string     // 내용
  createdAt: string   // 등록일
  thumbnail?: string  // 썸네일 (선택)
}

// 종목 정보 타입
export interface StockInfo {
  ticker: string
  name: string
  currentPrice?: number
  changeRate?: number
  marketCap?: string
  description?: string
  
  // 기본 정보
  basicInfo?: {
    name: string
    description: string
    logoid: string
    type: string
    close: number
    change: number
    volume: number
    relativeVolume10d: number
    gap: number
    volumeChange: number
    sector: string
    exchange: string
    currency: string
  }
  
  // 평가
  valuation?: {
    marketCap: number
    perf1YMarketCap: number
    priceEarningsTTM: number
    priceEarningsGrowthTTM: number | null
    priceSalesCurrent: number
    priceBookFQ: number | null
    priceFCFTTM: number
    evToRevenueTTM: number
    evToEbitTTM: number
    evToEbitdaTTM: number
  }
  
  // 배당
  dividend?: {
    yieldCurrent: number
    payoutRatioTTM: number
    continuousPayout: number
    continuousGrowth: number
  }
  
  // 수익성
  profitability?: {
    grossMarginTTM: number
    operatingMarginTTM: number
    preTaxMarginTTM: number
    netMarginTTM: number
    fcfMarginTTM: number
    roaFQ: number
    roeFQ: number
    roicFQ: number
    sgaExpenseRatioTTM: number
  }
  
  // 손익계산
  incomeStatement?: {
    revenueGrowthTTM: number
    epsDilutedTTM: number
    epsGrowthTTM: number
  }
  
  // 대차대조표
  balanceSheet?: {
    currentRatioFQ: number
    quickRatioFQ: number
    debtToEquityFQ: number | null
    cashToDebtFQ: number
  }
  
  // 현금흐름
  cashFlow?: {
    operatingCFTTM: number
    investingCFTTM: number
    financingCFTTM: number
    freeCFTTM: number
    capexTTM: number
  }
  
  // 성과
  performance?: {
    perfWeek: number
    perf1Month: number
    perf3Month: number
    perf6Month: number
    perfYTD: number
    perfYear: number
    perf5Year: number
    perf10Year: number
    perfAll: number
    volatilityWeek: number
    volatilityMonth: number
  }
  
  // 기술적 지표
  technical?: {
    recommendAll: number
    recommendMA: number
    recommendOther: number
    rsi: number
    momentum: number
    ao: number
    cci20: number
    stochK: number
    stochD: number
    bbUpper: number
    bbBasis: number
    bbLower: number
    sma20: number
    sma50: number
    sma100: number
    sma200: number
  }
  
  // 추가 지표
  additional?: {
    recommendationMark: number
    priceTarget1YDelta: number
  }
}
