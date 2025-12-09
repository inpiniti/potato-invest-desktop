import { useCallback } from 'react'
import { useTradingViewStore } from '@/stores/useTradingViewStore'
import type { TradingViewBBData } from '@/types/tradingview'

/**
 * TradingView 볼린저 밴드 데이터 조회 훅
 * 
 * S&P 500 종목들의 볼린저 밴드 및 시가총액 데이터를 일괄 조회
 */
export function useTradingViewHook() {
  const { setBBData, setLoading, setError, isFetched } = useTradingViewStore()

  /**
   * TradingView 목록 조회
   * @param tickers 종목코드 배열
   */
  const fetchBBData = useCallback(async (tickers: string[]) => {
    // 이미 조회 완료되었으면 스킵
    if (isFetched) {
      console.log('[TradingView] 이미 조회 완료됨, 스킵')
      return
    }

    if (!tickers.length) {
      console.log('[TradingView] 조회할 종목이 없음')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!window.ipcRenderer?.tradingViewList) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      console.log(`[TradingView] 볼린저 밴드 조회 시작: ${tickers.length}개 종목`)
      
      const result = await window.ipcRenderer.tradingViewList(tickers) as TradingViewBBData[]
      
      console.log(`[TradingView] 볼린저 밴드 조회 완료: ${result.length}개 종목`)
      
      setBBData(result)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('[TradingView] 조회 오류:', error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [setBBData, setLoading, setError, isFetched])

  return {
    fetchBBData,
  }
}
