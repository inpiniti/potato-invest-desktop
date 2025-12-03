import { create } from 'zustand'
import type { Holding, Balance } from '@/types/balance'

// 잔고 상태 타입 정의
interface BalanceState {
  // 보유종목
  holdings: Holding[]
  
  // 잔고 데이터
  balance: Balance | null
  
  // 로딩 상태
  isLoading: boolean
  
  // 에러
  error: string | null
  
  // 보유종목 설정
  setHoldings: (holdings: Holding[]) => void
  
  // 잔고 데이터 설정
  setBalance: (balance: Balance) => void
  
  // 로딩 상태 설정
  setLoading: (loading: boolean) => void
  
  // 에러 설정
  setError: (error: string | null) => void
  
  // 초기화
  reset: () => void
}

// Zustand 스토어 생성
export const useBalanceStore = create<BalanceState>((set) => ({
  // 초기 상태
  holdings: [],
  balance: null,
  isLoading: false,
  error: null,
  
  // 보유종목 설정
  setHoldings: (holdings) => {
    set({ holdings, error: null })
  },
  
  // 잔고 데이터 설정
  setBalance: (balance) => {
    set({ balance, error: null })
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
      holdings: [],
      balance: null,
      isLoading: false,
      error: null,
    })
  },
}))
