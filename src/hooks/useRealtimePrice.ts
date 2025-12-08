import { useCallback } from 'react'
import { toast } from 'sonner'
import { useRealtimePriceStore } from '@/stores/useRealtimePriceStore'

/**
 * 한국투자증권 실시간 시세 구독 Hook
 * 
 * 상태는 Zustand store에서 관리됨
 * 이벤트 리스너는 App.tsx에서 한 번만 등록됨
 */
export function useRealtimePrice() {
  const { priceData, isConnected, getPrice } = useRealtimePriceStore()

  /**
   * 실시간 시세 구독
   */
  const subscribe = useCallback(async (ticker: string, exchange: 'NAS' | 'NYS') => {
    try {
      if (!window.ipcRenderer?.realtimeSubscribe) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const result = await window.ipcRenderer.realtimeSubscribe({ ticker, exchange })
      console.log(`✅ 실시간 시세 구독: ${ticker} (${result.trKey})`)
      
      return result
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('실시간 시세 구독 오류:', error)
      
      toast.error('실시간 시세 구독 실패', {
        description: errorMessage,
        duration: 5000,
      })
      
      throw error
    }
  }, [])

  /**
   * 실시간 시세 구독 취소
   */
  const unsubscribe = useCallback(async (ticker: string, exchange: 'NAS' | 'NYS') => {
    try {
      if (!window.ipcRenderer?.realtimeUnsubscribe) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const result = await window.ipcRenderer.realtimeUnsubscribe({ ticker, exchange })
      console.log(`❌ 실시간 시세 구독 취소: ${ticker} (${result.trKey})`)
      
      return result
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      console.error('실시간 시세 구독 취소 오류:', error)
      
      toast.error('실시간 시세 구독 취소 실패', {
        description: errorMessage,
        duration: 5000,
      })
      
      throw error
    }
  }, [])

  /**
   * 특정 종목의 실시간 데이터 가져오기
   */
  const getRealtimeData = useCallback((ticker: string) => {
    return getPrice(ticker)
  }, [getPrice])

  return {
    subscribe,
    unsubscribe,
    getRealtimeData,
    realtimeData: priceData,
    isConnected,
  }
}

