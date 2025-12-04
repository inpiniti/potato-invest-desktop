import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StockInfo, Board } from '@/types/stock'

interface StockState {
  ticker: string | null              // 선택된 종목
  info: StockInfo | null             // 선택된 종목의 정보
  news: Board[]                      // 뉴스
  naver: Board[]                     // 네이버 커뮤니티 글
  toss: Board[]                      // 토스 커뮤니티 글
  
  setTicker: (ticker: string) => void
  setInfo: (info: StockInfo) => void
  setNews: (news: Board[]) => void
  setNaver: (naver: Board[]) => void
  setToss: (toss: Board[]) => void
  clearStock: () => void
}

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      ticker: null,
      info: null,
      news: [],
      naver: [],
      toss: [],
      
      setTicker: (ticker) => set({ ticker }),
      setInfo: (info) => set({ info }),
      setNews: (news) => set({ news }),
      setNaver: (naver) => set({ naver }),
      setToss: (toss) => set({ toss }),
      clearStock: () => set({ 
        ticker: null, 
        info: null, 
        news: [], 
        naver: [], 
        toss: [] 
      }),
    }),
    {
      name: 'stock-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)

// 개발 환경에서 콘솔로 확인할 수 있도록 window 객체에 노출
if (typeof window !== 'undefined') {
  (window as any).__stockStore = useStockStore
}
