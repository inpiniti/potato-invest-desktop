import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/useAuthStore"

export default function App() {
  const { login, logout } = useAuthStore()

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login({
          kakaoToken: session.provider_token || session.access_token, // 카카오 토큰 또는 세션 토큰
          email: session.user.email || '',
          thumbnailUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        })
      }
    })

    // 인증 상태 변경 감지 (로그인/로그아웃)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth State Change:', _event, session?.user?.email)
      
      if (session?.user) {
        const userData = {
          kakaoToken: session.provider_token || session.access_token,
          email: session.user.email || '',
          thumbnailUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        }
        console.log('Updating Auth Store:', userData)
        login(userData)
      } else {
        logout()
      }
    })

    return () => subscription.unsubscribe()
  }, [login, logout])

  useEffect(() => {
    // 딥링크 리스너 (로그인 콜백 처리)
    const handleDeepLink = (_event: any, url: string) => {
      console.log('Deep link received:', url)
      
      // URL에서 해시 파라미터 추출 (access_token, refresh_token 등)
      // 예: potato-invest://login-callback#access_token=...&refresh_token=...
      try {
        const hashIndex = url.indexOf('#')
        if (hashIndex !== -1) {
          const hash = url.substring(hashIndex + 1)
          const params = new URLSearchParams(hash)
          
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken && refreshToken) {
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }).then(({ error }) => {
              if (error) console.error('세션 설정 실패:', error)
              else console.log('세션 설정 성공')
            })
          }
        }
      } catch (e) {
        console.error('딥링크 처리 중 오류:', e)
      }
    }

    // @ts-ignore
    const removeListener = window.ipcRenderer?.on('deep-link', handleDeepLink)
    
    return () => {
      if (removeListener) removeListener()
    }
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
    </SidebarProvider>
  )
}
