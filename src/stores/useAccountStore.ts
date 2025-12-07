import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account } from '@/types/account'

// 계좌 상태 타입 정의
interface AccountState {
  // 액세스 토큰
  accessToken: string | null
  
  // 선택된 계좌
  selectedAccount: Account | null
  
  // 계좌 목록
  accounts: Account[]
  
  // 액세스 토큰 설정
  setAccessToken: (token: string) => void
  
  // 계좌 추가
  addAccount: (account: Account) => void
  
  // 계좌 삭제
  removeAccount: (cano: string) => void
  
  // 계좌 선택
  selectAccount: (cano: string) => void
  
  // 웹소켓 접근 토큰 설정 (계좌별)
  setApprovalKey: (cano: string, approvalKey: string) => void
  
  // 모든 데이터 초기화 (로그아웃 시)
  reset: () => void
}

// Zustand 스토어 생성 (localStorage에 자동 저장)
export const useAccountStore = create<AccountState>()(
  persist(
    (set) => ({
      // 초기 상태
      accessToken: null,
      selectedAccount: null,
      accounts: [],
      
      // 액세스 토큰 설정
      setAccessToken: (token) => {
        set({ accessToken: token })
      },
      
      // 계좌 추가
      addAccount: (account) => {
        set((state) => {
          // 중복 체크 (같은 계좌번호가 있으면 추가 안 함)
          const exists = state.accounts.some(acc => acc.cano === account.cano)
          if (exists) {
            console.warn('이미 존재하는 계좌입니다:', account.cano)
            return state
          }
          
          const newAccounts = [...state.accounts, account]
          
          // 첫 번째 계좌면 자동 선택
          const newSelectedAccount = state.accounts.length === 0 
            ? account 
            : state.selectedAccount
          
          return {
            accounts: newAccounts,
            selectedAccount: newSelectedAccount
          }
        })
      },
      
      // 계좌 삭제
      removeAccount: (cano) => {
        set((state) => {
          const newAccounts = state.accounts.filter(acc => acc.cano !== cano)
          
          // 삭제된 계좌가 선택된 계좌였다면 선택 해제
          const newSelectedAccount = state.selectedAccount?.cano === cano
            ? (newAccounts.length > 0 ? newAccounts[0] : null)
            : state.selectedAccount
          
          return {
            accounts: newAccounts,
            selectedAccount: newSelectedAccount
          }
        })
      },
      
      // 계좌 선택
      selectAccount: (cano) => {
        set((state) => {
          const account = state.accounts.find(acc => acc.cano === cano)
          if (!account) {
            console.warn('계좌를 찾을 수 없습니다:', cano)
            return state
          }
          return { selectedAccount: account }
        })
      },
      
      // 웹소켓 접근 토큰 설정 (계좌별)
      setApprovalKey: (cano, approvalKey) => {
        set((state) => {
          // 계좌 목록에서 해당 계좌 찾아서 approvalKey 업데이트
          const newAccounts = state.accounts.map(acc => 
            acc.cano === cano 
              ? { ...acc, approvalKey }
              : acc
          )
          
          // 선택된 계좌도 업데이트
          const newSelectedAccount = state.selectedAccount?.cano === cano
            ? { ...state.selectedAccount, approvalKey }
            : state.selectedAccount
          
          return {
            accounts: newAccounts,
            selectedAccount: newSelectedAccount
          }
        })
      },
      
      // 모든 데이터 초기화
      reset: () => {
        set({
          accessToken: null,
          selectedAccount: null,
          accounts: []
        })
      },
    }),
    {
      name: 'account-storage', // localStorage 키 이름
    }
  )
)
