import { create } from 'zustand'
import type { TradingViewBBData } from '@/types/tradingview'

// TradingView 상태 타입 정의
interface TradingViewState {
  // 볼린저 밴드 데이터 맵 (ticker -> 데이터)
  bbDataMap: Map<string, TradingViewBBData>
  
  // 로딩 상태
  isLoading: boolean
  
  // 에러
  error: string | null
  
  // 조회 완료 여부
  isFetched: boolean
  
  // 볼린저 밴드 데이터 설정
  setBBData: (dataList: TradingViewBBData[]) => void
  
  // 특정 종목의 볼린저 밴드 데이터 가져오기
  getBBData: (ticker: string) => TradingViewBBData | null
  
  // 로딩 상태 설정
  setLoading: (loading: boolean) => void
  
  // 에러 설정
  setError: (error: string | null) => void
  
  // 초기화
  reset: () => void
}

// Zustand 스토어 생성 (persist 없음 - 앱 종료 시 초기화)
export const useTradingViewStore = create<TradingViewState>((set, get) => ({
  // 초기 상태
  bbDataMap: new Map(),
  isLoading: false,
  error: null,
  isFetched: false,
  
  // 볼린저 밴드 데이터 설정
  setBBData: (dataList) => {
    const newMap = new Map<string, TradingViewBBData>()
    dataList.forEach(data => {
      newMap.set(data.ticker, data)
    })
    set({ bbDataMap: newMap, error: null, isFetched: true })
  },
  
  // 특정 종목의 볼린저 밴드 데이터 가져오기
  getBBData: (ticker) => {
    return get().bbDataMap.get(ticker) || null
  },
  
  // 로딩 상태 설정
  setLoading: (loading) => {
    set({ isLoading: loading })
  },
  
  // 에러 설정
  setError: (error) => {
    set({ error, isLoading: false })
  },
  
  // 초기화
  reset: () => {
    set({
      bbDataMap: new Map(),
      isLoading: false,
      error: null,
      isFetched: false,
    })
  },
}))
