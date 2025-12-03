import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 인증 상태 타입 정의
interface AuthState {
  // 카카오 토큰
  kakaoToken: string | null
  // 사용자 이메일
  email: string | null
  // 프로필 썸네일 URL
  thumbnailUrl: string | null
  // 사용자 이름 (선택사항)
  name: string | null
  
  // 로그인 여부 확인
  isLoggedIn: () => boolean
  
  // 로그인 처리
  login: (data: {
    kakaoToken: string
    email: string
    thumbnailUrl: string
    name?: string
  }) => void
  
  // 로그아웃 처리
  logout: () => void
}

// Zustand 스토어 생성 (localStorage에 자동 저장)
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      kakaoToken: null,
      email: null,
      thumbnailUrl: null,
      name: null,
      
      // 로그인 여부 확인
      isLoggedIn: () => {
        const state = get()
        return !!state.email // 이메일만 있으면 로그인된 것으로 간주
      },
      
      // 로그인 처리
      login: (data) => {
        set({
          kakaoToken: data.kakaoToken,
          email: data.email,
          thumbnailUrl: data.thumbnailUrl,
          name: data.name || null,
        })
      },
      
      // 로그아웃 처리
      logout: () => {
        set({
          kakaoToken: null,
          email: null,
          thumbnailUrl: null,
          name: null,
        })
      },
    }),
    {
      name: 'auth-storage', // localStorage 키 이름
    }
  )
)
