import { useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { RealtimePrice } from '@/types/realtime'

/**
 * 한국투자증권 실시간 시세 구독 Hook
 */
export function useRealtimePrice() {
  const [realtimeData, setRealtimeData] = useState<Map<string, RealtimePrice>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

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
      
      // 로컬 데이터에서 제거
      setRealtimeData(prev => {
        const next = new Map(prev)
        next.delete(ticker)
        return next
      })
      
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
  const getRealtimeData = useCallback((ticker: string): RealtimePrice | undefined => {
    return realtimeData.get(ticker)
  }, [realtimeData])

  /**
   * 실시간 데이터 수신 이벤트 리스너
   */
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleRealtimePrice = (_event: any, data: RealtimePrice) => {
      console.log('[Realtime] 수신:', data)
      
      // 연결 상태 업데이트
      setIsConnected(true)
      
      // 데이터 업데이트
      setRealtimeData(prev => {
        const next = new Map(prev)
        next.set(data.SYMB, data)
        return next
      })
    }

    // 이벤트 리스너 등록
    window.ipcRenderer.on('realtime-price', handleRealtimePrice)

    return () => {
      // 이벤트 리스너 제거
      window.ipcRenderer.off('realtime-price', handleRealtimePrice)
    }
  }, [])

  return {
    subscribe,
    unsubscribe,
    getRealtimeData,
    realtimeData,
    isConnected,
  }
}
