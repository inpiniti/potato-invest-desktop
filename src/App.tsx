import { useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { RightPanel } from "@/components/right-panel"
import { Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSettingStore } from "@/stores/useSettingStore"
import { useAccountStore } from "@/stores/useAccountStore"
import { useBalanceStore } from "@/stores/useBalanceStore"
import { useSP500Store } from "@/stores/useSP500Store"
import { useTradingHook } from "@/hooks/useTradingHook"
import { useRealtimePrice } from "@/hooks/useRealtimePrice"

export default function App() {
  const { login, logout, userId } = useAuthStore() // kakaoToken 대신 userId 사용
  const { darkMode } = useSettingStore()
  const { accessToken, selectedAccount } = useAccountStore()
  const { setHoldings, setBalance } = useBalanceStore()
  const { setSP500 } = useSP500Store()
  const { fetchTradingList, fetchHistories, cleanupDuplicates } = useTradingHook()
  const { subscribe } = useRealtimePrice()

  // 다크모드 초기화
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login({
          userId: session.user.id, // Supabase 사용자 고유 ID (UUID)
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
          userId: session.user.id, // Supabase 사용자 고유 ID (UUID)
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

  // 로그인 시 트레이딩 데이터 자동 로드 및 실시간 구독
  useEffect(() => {
    const loadAndSubscribe = async () => {
      if (userId) {
        console.log('로그인 감지 - 트레이딩 데이터 로드 시작...')
        
        // 중복 데이터 정리
        await cleanupDuplicates()
        
        // 트레이딩 목록 로드
        const tradingList = await fetchTradingList()
        console.log('📋 트레이딩 목록 로드 완료:', tradingList)
        
        await fetchHistories()
        
        // 트레이딩 목록의 모든 종목 실시간 구독
        if (tradingList && tradingList.length > 0) {
          console.log(`📡 실시간 시세 구독 시작: ${tradingList.length}개 종목`)
          
          for (const item of tradingList) {
            try {
              // 거래소 정보는 S&P 500 store에서 가져오거나 기본값 사용
              // 일단 기본값으로 NAS 사용 (추후 개선 가능)
              await subscribe(item.ticker, 'NAS')
            } catch (error) {
              console.error(`실시간 구독 실패: ${item.ticker}`, error)
            }
          }
        } else {
          console.log('📋 트레이딩 목록이 비어있습니다.')
        }
      }
    }
    
    loadAndSubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // 앱 시작 시 토큰이 있으면 자동 잔고 조회 및 웹소켓 토큰 발급
  useEffect(() => {
    const initializeAccount = async () => {
      if (accessToken && selectedAccount) {
        // 1. 웹소켓 토큰 발급
        if (window.ipcRenderer?.koreaInvestApproval) {
          try {
            console.log('앱 시작 시 웹소켓 토큰 자동 발급...')
            
            const approvalResult = await window.ipcRenderer.koreaInvestApproval({
              appkey: selectedAccount.appkey,
              appsecret: selectedAccount.appsecret,
            })
            
            console.log('✅ 웹소켓 토큰 발급 성공:', approvalResult.approvalKey)
            
            // useAccountStore에 저장
            const { setApprovalKey } = useAccountStore.getState()
            setApprovalKey(approvalResult.approvalKey)
          } catch (error: any) {
            console.error('⚠️ 웹소켓 토큰 발급 실패 (계속 진행):', error)
            const { toast } = await import('sonner')
            toast.error('웹소켓 토큰 발급 실패', {
              description: error.message || '알 수 없는 오류'
            })
          }
        }
        
        // 2. 잔고 조회
        if (window.ipcRenderer?.koreaInvestBalance) {
          try {
            console.log('앱 시작 시 잔고 자동 조회...')
            const balanceResult = await window.ipcRenderer.koreaInvestBalance({
              accessToken,
              appkey: selectedAccount.appkey,
              appsecret: selectedAccount.appsecret,
              cano: selectedAccount.cano,
            })
            
            console.log('✅ 잔고 조회 성공:', balanceResult)
            setHoldings(balanceResult.holdings)
            setBalance(balanceResult.balance)
          } catch (error: any) {
            console.error('❌ 자동 잔고 조회 실패:', error)
            const { toast } = await import('sonner')
            toast.error('잔고 조회 실패', {
              description: error.message || '알 수 없는 오류'
            })
          }
        }
      }
    }

    initializeAccount()
  }, []) // 앱 시작 시 한 번만 실행

  // 앱 시작 시 S&P 500 크롤링
  useEffect(() => {
    const fetchSP500 = async () => {
      if (window.ipcRenderer?.sp500Fetch) {
        try {
          console.log('S&P 500 크롤링 시작...')
          const sp500Data = await window.ipcRenderer.sp500Fetch()
          
          console.log(`S&P 500 크롤링 완료: ${sp500Data.length}개 종목`)
          setSP500(sp500Data)
        } catch (error) {
          console.error('S&P 500 크롤링 실패:', error)
        }
      }
    }

    fetchSP500()
  }, []) // 앱 시작 시 한 번만 실행

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
    if (window.ipcRenderer) {
      window.ipcRenderer.on('deep-link', handleDeepLink)
    }
    
    return () => {
      // @ts-ignore
      if (window.ipcRenderer) {
        window.ipcRenderer.off('deep-link', handleDeepLink)
      }
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
      <Toaster position="top-right" richColors />
      <div className="flex h-screen w-full">
        {/* 좌측: 사이드바 */}
        <AppSidebar />
        
        {/* 중앙: 메인 컨텐츠 */}
        <main className="flex-1 overflow-hidden">
          <MainContent />
        </main>
        
        {/* 우측: 뉴스/커뮤니티 패널 */}
        <aside className="w-80 border-l overflow-hidden">
          <RightPanel />
        </aside>
      </div>
    </SidebarProvider>
  )
}
