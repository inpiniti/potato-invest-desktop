import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Trend } from '@/types/trend'

interface TrendState {
  trends: Trend[]
  setTrends: (trends: Trend[]) => void
  addTrend: (trend: Trend) => void
  clearTrends: () => void
  getTrendByTicker: (ticker: string) => Trend | undefined
}

export const useTrendStore = create<TrendState>()(
  persist(
    (set, get) => ({
      trends: [],
      
      setTrends: (trends) => set({ trends }),
      
      addTrend: (trend) => set((state) => ({ 
        trends: [...state.trends, trend] 
      })),
      
      clearTrends: () => set({ trends: [] }),
      
      getTrendByTicker: (ticker) => {
        return get().trends.find(t => t.ticker === ticker)
      },
    }),
    {
      name: 'trend-storage', // sessionStorage 키 이름
      storage: createJSONStorage(() => sessionStorage), // sessionStorage 사용
    }
  )
)

// 개발 환경에서 콘솔로 확인할 수 있도록 window 객체에 노출
if (typeof window !== 'undefined') {
  (window as any).__trendStore = useTrendStore
}
