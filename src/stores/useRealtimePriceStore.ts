import { create } from 'zustand'
import type { RealtimePrice } from '@/types/realtime'

interface RealtimePriceState {
  // 종목코드별 실시간 데이터
  priceData: Map<string, RealtimePrice>
  // 연결 상태
  isConnected: boolean
  
  // 액션
  updatePrice: (data: RealtimePrice) => void
  setConnected: (connected: boolean) => void
  getPrice: (ticker: string) => RealtimePrice | undefined
  clearAll: () => void
}

export const useRealtimePriceStore = create<RealtimePriceState>((set, get) => ({
  priceData: new Map(),
  isConnected: false,

  updatePrice: (data: RealtimePrice) => {
    set((state) => {
      const newMap = new Map(state.priceData)
      newMap.set(data.SYMB, data)
      return { priceData: newMap }
    })
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected })
  },

  getPrice: (ticker: string) => {
    return get().priceData.get(ticker)
  },

  clearAll: () => {
    set({ priceData: new Map(), isConnected: false })
  },
}))
