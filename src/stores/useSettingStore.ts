import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 설정 상태 타입 정의
interface SettingState {
  // 다크모드 활성화 여부
  darkMode: boolean
  
  // 다크모드 토글
  toggleDarkMode: () => void
  
  // 다크모드 설정
  setDarkMode: (enabled: boolean) => void
}

// Zustand 스토어 생성 (localStorage에 자동 저장)
export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      // 초기 상태
      darkMode: false,
      
      // 다크모드 토글
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode
          // HTML 요소에 dark 클래스 추가/제거
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { darkMode: newDarkMode }
        })
      },
      
      // 다크모드 직접 설정
      setDarkMode: (enabled) => {
        set({ darkMode: enabled })
        if (enabled) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }),
    {
      name: 'setting-storage', // localStorage 키 이름
    }
  )
)
