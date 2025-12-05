import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TradingHistory } from '@/types/trading'

interface TradingItem {
  ticker: string
  name: string
  addedAt: string
}

interface TradingStore {
  tradings: TradingItem[]
  histories: TradingHistory[] // 트레이딩 히스토리 리스트
  addTrading: (ticker: string, name: string) => void
  removeTrading: (ticker: string) => void
  isInTrading: (ticker: string) => boolean
  clearTradings: () => void
  
  // 트레이딩 히스토리 관련 액션 (DB 중심 아키텍처로 변경)
  setHistories: (histories: TradingHistory[]) => void // Hook에서 조회 후 설정
  getHistoriesByTicker: (ticker: string) => TradingHistory[]
}


export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      tradings: [],
      histories: [], // 트레이딩 히스토리 초기 상태
      
      addTrading: (ticker: string, name: string) => {
        const { tradings } = get()
        if (!tradings.find(t => t.ticker === ticker)) {
          set({
            tradings: [
              ...tradings,
              {
                ticker,
                name,
                addedAt: new Date().toISOString(),
              },
            ],
          })
        }
      },
      
      removeTrading: (ticker: string) => {
        set({
          tradings: get().tradings.filter(t => t.ticker !== ticker),
        })
      },
      
      isInTrading: (ticker: string) => {
        return get().tradings.some(t => t.ticker === ticker)
      },
      
      clearTradings: () => {
        set({ tradings: [] })
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

