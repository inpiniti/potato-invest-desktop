import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TradingHistory, TradingListItem } from '@/types/trading'

interface TradingStore {
  tradings: TradingListItem[] // 트레이딩 목록 (DB에서 조회한 데이터)
  histories: TradingHistory[] // 트레이딩 히스토리 리스트
  
  // 트레이딩 목록 관련 액션 (DB 중심 아키텍처)
  setTradings: (tradings: TradingListItem[]) => void // Hook에서 조회 후 설정
  isInTrading: (ticker: string) => boolean
  
  // 트레이딩 히스토리 관련 액션 (DB 중심 아키텍처로 변경)
  setHistories: (histories: TradingHistory[]) => void // Hook에서 조회 후 설정
  getHistoriesByTicker: (ticker: string) => TradingHistory[]
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      tradings: [],
      histories: [], // 트레이딩 히스토리 초기 상태
      
      // 트레이딩 목록 관련 액션
      setTradings: (tradings: TradingListItem[]) => {
        set({ tradings })
      },
      
      isInTrading: (ticker: string) => {
        return get().tradings.some(t => t.ticker === ticker)
      },
      
      // 트레이딩 히스토리 관련 액션 구현 (DB 중심)
      setHistories: (histories: TradingHistory[]) => {
        set({ histories })
      },
      
      getHistoriesByTicker: (ticker: string) => {
        return get().histories.filter(h => h.ticker === ticker)
      },
    }),
    {
      name: 'trading-storage',
    }
  )
)

