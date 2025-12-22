import { useRef, useCallback } from 'react'
import { useTrendHook } from './useTrendHook'
import type { Trend } from '@/types/trend'

interface TrendRequest {
  ticker: string
  exchange: 'NAS' | 'NYS'
  resolve: (trend: Trend | null) => void
}

/**
 * 추세 조회 큐 관리 훅
 * 
 * - 추세 조회를 순차적으로 처리 (동시 호출 시 실패 방지)
 * - 1분 간격 쓰로틀링 (응답 시간 기준)
 * - 큐에 넣고 차례대로 처리
 */
export function useTrendQueue() {
  const { getTrendMinutes } = useTrendHook()
  
  // 요청 큐
  const queueRef = useRef<TrendRequest[]>([])
  // 현재 처리 중인지 여부
  const isProcessingRef = useRef(false)
  // 종목별 마지막 조회 시간 (응답 완료 시간 기준)
  const lastFetchTimeRef = useRef<Map<string, number>>(new Map())
  // 종목별 마지막 조회된 Trend 캐시
  const trendCacheRef = useRef<Map<string, Trend>>(new Map())
  // 종목별 로딩 상태
  const loadingMapRef = useRef<Map<string, boolean>>(new Map())
  
  const ONE_MINUTE = 60 * 1000

  /**
   * 큐에서 다음 요청을 꺼내서 처리
   */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return
    if (queueRef.current.length === 0) return

    isProcessingRef.current = true

    while (queueRef.current.length > 0) {
      const request = queueRef.current.shift()
      if (!request) break

      const { ticker, exchange, resolve } = request
      const cacheKey = `${ticker}_${exchange}`

      // 1분 쓰로틀링 체크 (응답 시간 기준)
      const lastTime = lastFetchTimeRef.current.get(cacheKey) || 0
      const now = Date.now()
      
      if (now - lastTime < ONE_MINUTE) {
        // 1분이 안 지났으면 캐시된 데이터 반환
        const cached = trendCacheRef.current.get(cacheKey) || null
        resolve(cached)
        continue
      }

      // 로딩 상태 설정
      loadingMapRef.current.set(cacheKey, true)

      try {
        console.log(`📊 추세 조회 시작: ${ticker}`)
        
        // 타임아웃 설정 (30초)
        const TIMEOUT = 30 * 1000
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Trend fetch timeout')), TIMEOUT)
        )
        
        const trend = await Promise.race([
          getTrendMinutes({ ticker, exchange }),
          timeoutPromise
        ]) as Awaited<ReturnType<typeof getTrendMinutes>>
        
        // 응답 완료 시간 저장 (요청 시간이 아닌 응답 시간!)
        lastFetchTimeRef.current.set(cacheKey, Date.now())
        
        // 캐시 저장
        trendCacheRef.current.set(cacheKey, trend)
        
        console.log(`✅ 추세 조회 완료: ${ticker}`)
        resolve(trend)
      } catch (err) {
        console.error(`❌ 추세 조회 실패: ${ticker}`, err)
        // 실패해도 캐시된 데이터 반환 (Promise가 pending 상태로 남지 않도록!)
        const cached = trendCacheRef.current.get(cacheKey) || null
        resolve(cached)
      } finally {
        loadingMapRef.current.set(cacheKey, false)
      }

      // API 부하 방지를 위한 딜레이 (200ms)
      await new Promise(r => setTimeout(r, 200))
    }

    isProcessingRef.current = false
  }, [getTrendMinutes])

  /**
   * 추세 조회 요청 큐에 추가
   */
  const requestTrend = useCallback((ticker: string, exchange: 'NAS' | 'NYS'): Promise<Trend | null> => {
    return new Promise((resolve) => {
      queueRef.current.push({ ticker, exchange, resolve })
      processQueue()
    })
  }, [processQueue])

  /**
   * 특정 종목의 로딩 상태 확인
   */
  const isLoading = useCallback((ticker: string, exchange: 'NAS' | 'NYS'): boolean => {
    const cacheKey = `${ticker}_${exchange}`
    return loadingMapRef.current.get(cacheKey) || false
  }, [])

  /**
   * 캐시된 추세 데이터 가져오기
   */
  const getCachedTrend = useCallback((ticker: string, exchange: 'NAS' | 'NYS'): Trend | null => {
    const cacheKey = `${ticker}_${exchange}`
    return trendCacheRef.current.get(cacheKey) || null
  }, [])

  return {
    requestTrend,
    isLoading,
    getCachedTrend,
  }
}
