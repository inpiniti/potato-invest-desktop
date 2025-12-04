import { useState } from 'react'
import type { Trend, TrendType } from '@/types/trend'
import type { Daily } from '@/types/daily'
import { useKoreainvestmentHook } from './useKoreainvestmentHook'

interface GetTrendParams {
  ticker: string
  exchange: 'NAS' | 'NYS'
}

/**
 * 이동평균 추세 분석 훅
 */
export function useTrendHook() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getDaily } = useKoreainvestmentHook()

  /**
   * 이동평균 계산
   * @param data 일별 시세 데이터 (0번째가 최신)
   * @param period 이동평균 기간
   * @param index 계산할 인덱스 (0이 오늘)
   * @returns 이동평균 값
   */
  const calculateMA = (data: Daily[], period: number, index: number): number | null => {
    // 데이터가 충분하지 않으면 null 반환
    if (index + period > data.length) {
      return null
    }

    let sum = 0
    for (let i = index; i < index + period; i++) {
      const closePrice = parseFloat(data[i].clos)
      if (isNaN(closePrice)) {
        return null
      }
      sum += closePrice
    }

    return sum / period
  }

  /**
   * 추세 판단
   * @param mas 최근 5일간의 이동평균 값 (0번째가 오늘)
   * @returns 추세 타입
   */
  const determineTrend = (mas: (number | null)[]): TrendType => {
    // null 값이 있으면 '유지'로 처리
    if (mas.some(ma => ma === null)) {
      return '유지'
    }

    const validMas = mas as number[]

    // 오늘(0번째) 이동평균
    const today = validMas[0]
    
    // 최근 4일(1~4번째)의 이동평균 추세 분석
    const recentTrends = []
    for (let i = 1; i < 5; i++) {
      if (validMas[i] > validMas[i - 1]) {
        recentTrends.push('상승')
      } else if (validMas[i] < validMas[i - 1]) {
        recentTrends.push('하락')
      } else {
        recentTrends.push('유지')
      }
    }

    // 오늘의 추세
    const todayTrend = today > validMas[1] ? '상승' : today < validMas[1] ? '하락' : '유지'

    // 최근 4일이 모두 하락이었는데 오늘 상승 또는 유지로 전환
    const allRecentDown = recentTrends.every(t => t === '하락')
    if (allRecentDown && (todayTrend === '상승' || todayTrend === '유지')) {
      return '상승전환'
    }

    // 최근 4일이 모두 상승이었는데 오늘 하락 또는 유지로 전환
    const allRecentUp = recentTrends.every(t => t === '상승')
    if (allRecentUp && (todayTrend === '하락' || todayTrend === '유지')) {
      return '하락전환'
    }

    // 일반적인 추세
    return todayTrend
  }

  /**
   * 이동평균 추세 분석
   * @param params ticker와 exchange를 포함한 파라미터
   * @returns Trend 객체
   */
  const getTrend = async ({ ticker, exchange }: GetTrendParams): Promise<Trend> => {
    setLoading(true)
    setError(null)

    try {
      // 일별 시세 데이터 조회 (300개)
      const dailyData = await getDaily({ ticker, exchange })

      if (dailyData.length < 205) {
        throw new Error(`데이터가 부족합니다. (필요: 205개, 현재: ${dailyData.length}개)`)
      }

      // 각 이동평균선의 최근 5일간 값 계산
      const ma20Values: (number | null)[] = []
      const ma50Values: (number | null)[] = []
      const ma100Values: (number | null)[] = []
      const ma200Values: (number | null)[] = []

      for (let i = 0; i < 5; i++) {
        ma20Values.push(calculateMA(dailyData, 20, i))
        ma50Values.push(calculateMA(dailyData, 50, i))
        ma100Values.push(calculateMA(dailyData, 100, i))
        ma200Values.push(calculateMA(dailyData, 200, i))
      }

      // 추세 판단
      const trend: Trend = {
        ma20: determineTrend(ma20Values),
        ma50: determineTrend(ma50Values),
        ma100: determineTrend(ma100Values),
        ma200: determineTrend(ma200Values),
      }

      return trend
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getTrend 오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    getTrend,
    loading,
    error,
  }
}
