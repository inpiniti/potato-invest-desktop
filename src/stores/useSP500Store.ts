import { create } from 'zustand'
import type { SP500Stock } from '@/types/sp500'

// S&P 500 상태 타입 정의
interface SP500State {
  // S&P 500 종목 리스트
  sp500: SP500Stock[]
  
  // 로딩 상태
  isLoading: boolean
  
  // 에러
  error: string | null
  
  // S&P 500 리스트 설정
  setSP500: (stocks: SP500Stock[]) => void
  
  // 로딩 상태 설정
  setLoading: (loading: boolean) => void
  
  // 에러 설정
  setError: (error: string | null) => void
  
  // 초기화
  reset: () => void
}

// Zustand 스토어 생성
export const useSP500Store = create<SP500State>((set) => ({
  // 초기 상태
  sp500: [],
  isLoading: false,
  error: null,
  
  // S&P 500 리스트 설정
  setSP500: (stocks) => {
    set({ sp500: stocks, error: null })
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
      sp500: [],
      isLoading: false,
      error: null,
    })
  },
}))
