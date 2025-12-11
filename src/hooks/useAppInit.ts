import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSettingStore } from "@/stores/useSettingStore"
import { useAccountStore } from "@/stores/useAccountStore"
import { useBalanceStore } from "@/stores/useBalanceStore"
import { useSP500Store } from "@/stores/useSP500Store"
import { useTradingHook } from "@/hooks/useTradingHook"
import { useTradingViewHook } from "@/hooks/useTradingViewHook"

export function useAppInit() {
  const { login, logout, userId } = useAuthStore()
  const { darkMode } = useSettingStore()
  const { accessToken, selectedAccount } = useAccountStore()
  const { setHoldings, setBalance } = useBalanceStore()
  const { setSP500, sp500 } = useSP500Store()
  const { fetchTradingList, fetchHistories, cleanupDuplicates } = useTradingHook()
  const { fetchBBData } = useTradingViewHook()

  // 1. 다크모드 초기화
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // 2. 사용자 세션 관리 (Supabase)
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        login({
          userId: session.user.id,
          kakaoToken: session.provider_token || session.access_token,
          email: session.user.email || '',
          thumbnailUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        })
      }
    })

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth State Change:', _event, session?.user?.email)
      
      if (session?.user) {
        const userData = {
          userId: session.user.id,
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

  // 3. 트레이딩 데이터 로드
  useEffect(() => {
    const loadTradingData = async () => {
      if (userId) {
        console.log('로그인 감지 - 트레이딩 데이터 로드 시작...')
        await cleanupDuplicates()
        const tradingList = await fetchTradingList()
        console.log('📋 트레이딩 목록 로드 완료:', tradingList)
        await fetchHistories()
        console.log('📡 실시간 구독은 트레이딩 패널에서 자동 관리됩니다.')
      }
    }
    
    loadTradingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // 4. 계좌 초기화 (웹소켓 및 잔고)
  useEffect(() => {
    const initializeAccount = async () => {
      if (accessToken && selectedAccount) {
        // 웹소켓 토큰 발급
        if (window.ipcRenderer?.koreaInvestApproval) {
          try {
            console.log('앱 시작 시 웹소켓 토큰 자동 발급...')
            const approvalResult = await window.ipcRenderer.koreaInvestApproval({
              appkey: selectedAccount.appkey,
              appsecret: selectedAccount.appsecret,
            })
            console.log('✅ 웹소켓 토큰 발급 성공:', approvalResult.approvalKey)
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
        
        // 잔고 조회
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
  }, [accessToken]) // selectedAccount 변경 시에도 재실행 필요할 수 있으나 원본 로직 유지 또는 조정

  // 5. S&P 500 데이터 크롤링
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
  }, [])

  // 6. TradingView 데이터 조회
  useEffect(() => {
    if (sp500.length > 0) {
      const tickers = sp500.map(s => s.ticker)
      console.log(`TradingView 볼린저 밴드 조회 시작: ${tickers.length}개 종목`)
      fetchBBData(tickers)
    }
  }, [sp500, fetchBBData])

  // 7. 딥링크 처리
  useEffect(() => {
    const handleDeepLink = (_event: any, url: string) => {
      console.log('Deep link received:', url)
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
}
