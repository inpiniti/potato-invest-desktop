import { useState } from 'react'
import type { Trend } from '@/types/trend'
import type { Daily } from '@/types/daily'
import type { Minute } from '@/types/minute'
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
  const { getDaily, getMinutes } = useKoreainvestmentHook()

  /**
   * 일별 데이터 이동평균 계산
   * @param data 일별 시세 데이터 (0번째가 최신)
   * @param period 이동평균 기간
   * @param index 계산할 인덱스 (0이 오늘)
   * @returns 이동평균 값
   */
  const calculateMADaily = (data: Daily[], period: number, index: number): number | null => {
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
   * 분봉 데이터 이동평균 계산
   * @param data 분봉 시세 데이터 (0번째가 최신)
   * @param period 이동평균 기간
   * @param index 계산할 인덱스 (0이 현재)
   * @returns 이동평균 값
   */
  const calculateMAMinute = (data: Minute[], period: number, index: number): number | null => {
    // 데이터가 충분하지 않으면 null 반환
    if (index + period > data.length) {
      return null
    }

    let sum = 0
    for (let i = index; i < index + period; i++) {
      const closePrice = parseFloat(data[i].last) // Minute 타입은 'last' 필드 사용
      if (isNaN(closePrice)) {
        return null
      }
      sum += closePrice
    }

    return sum / period
  }

  /**
   * 추세 판단
   * @param mas 최근 5개의 이동평균 값 (0번째가 최신)
   * @returns 추세 타입
   */
  /**
   * 추세 지표 계산 (기울기, 가속도)
   * @param mas 최근 5개의 이동평균 값 (0번째가 최신)
   * @returns 추세 지표 객체
   */
  const calculateTrendMetrics = (mas: (number | null)[]): import('@/types/trend').TrendMetric => {
    // null 값이 있으면 기본값 반환
    if (mas.some(ma => ma === null)) {
      return {
        value: 0,
        slope: 0,
        accel: 0,
        description: '데이터 부족'
      }
    }

    const validMas = mas as number[]
    const current = validMas[0]

    // 1. 기울기 (Slope) 계산
    // 5일치 데이터 -> 4개의 구간
    // [오늘-1일전, 1일전-2일전, 2일전-3일전, 3일전-4일전]
    const slopes: number[] = []
    for (let i = 0; i < 4; i++) {
      slopes.push(validMas[i] - validMas[i + 1])
    }

    // 기울기 점수: 양수인 구간의 개수 (0 ~ 4)
    const slopeScore = slopes.filter(s => s > 0).length

    // 2. 가속도 (Acceleration) 계산
    // 4개의 기울기 -> 3개의 구간
    // [(오늘-1일전)-(1일전-2일전), ...]
    const accels: number[] = []
    for (let i = 0; i < 3; i++) {
      accels.push(slopes[i] - slopes[i + 1])
    }

    // 가속도 점수: 양수인 구간의 개수 (0 ~ 3)
    const accelScore = accels.filter(a => a > 0).length

    // 3. 설명 생성
    let description = ''
    if (slopeScore === 4 && accelScore >= 2) {
      description = '주가가 급등하고 있습니다. 강력 매수를 추천합니다.'
    } else if (slopeScore === 4 && accelScore === 0) {
      description = '고점징후가 보입니다. 매도를 추천합니다.'
    } else if (slopeScore === 0 && accelScore === 0) {
      description = '주가가 급락하고 있습니다. 강력 매도를 추천합니다.'
    } else if (slopeScore === 0 && accelScore === 3) {
      description = '바닥을 다지는 중입니다. 매수를 추천합니다.'
    } else {
      // 그 외 중간 상태에 대한 일반적인 설명
      if (slopeScore >= 3) description = '상승 추세가 이어지고 있습니다.'
      else if (slopeScore <= 1) description = '하락 추세가 이어지고 있습니다.'
      else description = '추세가 횡보하거나 전환되는 중입니다.'
    }

    return {
      value: current,
      slope: slopeScore,
      accel: accelScore,
      description
    }
  }

  /**
   * 일별 데이터 기반 이동평균 추세 분석
   * @param params ticker와 exchange를 포함한 파라미터
   * @returns Trend 객체
   */
  const getTrendDaily = async ({ ticker, exchange }: GetTrendParams): Promise<Trend> => {
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
        ma20Values.push(calculateMADaily(dailyData, 20, i))
        ma50Values.push(calculateMADaily(dailyData, 50, i))
        ma100Values.push(calculateMADaily(dailyData, 100, i))
        ma200Values.push(calculateMADaily(dailyData, 200, i))
      }

      // 추세 판단
      const trend: Trend = {
        ticker,
        exchange,
        ma20: calculateTrendMetrics(ma20Values),
        ma50: calculateTrendMetrics(ma50Values),
        ma100: calculateTrendMetrics(ma100Values),
        ma200: calculateTrendMetrics(ma200Values),
      }

      return trend
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getTrendDaily 오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 분봉 데이터 기반 이동평균 추세 분석
   * @param params ticker와 exchange를 포함한 파라미터
   * @returns Trend 객체
   */
  const getTrendMinutes = async ({ ticker, exchange }: GetTrendParams): Promise<Trend> => {
    setLoading(true)
    setError(null)

    try {
      // 분봉 시세 데이터 조회 (240개)
      const minuteData = await getMinutes({ ticker, exchange })

      if (minuteData.length < 205) {
        throw new Error(`데이터가 부족합니다. (필요: 205개, 현재: ${minuteData.length}개)`)
      }

      // 각 이동평균선의 최근 5개 값 계산
      const ma20Values: (number | null)[] = []
      const ma50Values: (number | null)[] = []
      const ma100Values: (number | null)[] = []
      const ma200Values: (number | null)[] = []

      for (let i = 0; i < 5; i++) {
        ma20Values.push(calculateMAMinute(minuteData, 20, i))
        ma50Values.push(calculateMAMinute(minuteData, 50, i))
        ma100Values.push(calculateMAMinute(minuteData, 100, i))
        ma200Values.push(calculateMAMinute(minuteData, 200, i))
      }

      // 추세 판단
      const trend: Trend = {
        ticker,
        exchange,
        ma20: calculateTrendMetrics(ma20Values),
        ma50: calculateTrendMetrics(ma50Values),
        ma100: calculateTrendMetrics(ma100Values),
        ma200: calculateTrendMetrics(ma200Values),
      }

      return trend
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getTrendMinutes 오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 여러 종목의 일별 데이터 기반 추세 일괄 분석 (병렬 처리)
   * @param sp500List S&P 500 종목 리스트
   * @param onProgress 진행 상황 콜백 (현재 진행 수, 전체 수)
   * @returns Trend 배열과 성공/실패 건수
   */
  const getTrends = async (
    sp500List: Array<{ ticker: string; exchange: string; name?: string }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ trends: Trend[]; successCount: number; failCount: number }> => {
    const trends: Trend[] = []
    let successCount = 0
    let failCount = 0
    const total = sp500List.length
    let completedCount = 0

    // 큐 생성 (복사본을 만들어 원본 배열을 수정하지 않음)
    const queue = [...sp500List]

    // 워커 함수: 큐에서 작업을 가져와 처리
    const worker = async () => {
      while (queue.length > 0) {
        // 큐에서 종목 하나 꺼내기
        const stock = queue.shift()
        if (!stock) break

        try {
          // 거래소 코드 변환
          const exchangeCode = stock.exchange === 'NASDAQ' ? 'NAS' : 'NYS'
          
          const trend = await getTrendDaily({ 
            ticker: stock.ticker, 
            exchange: exchangeCode as 'NAS' | 'NYS'
          })
          
          trends.push(trend)
          successCount++
        } catch (err) {
          console.error(`${stock.ticker} 추세 분석 실패:`, err)
          failCount++
        }

        // 진행 상황 업데이트
        completedCount++
        if (onProgress) {
          onProgress(completedCount, total)
        }

        // API Rate Limit 방지를 위한 딜레이 (100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 2개의 워커를 병렬로 실행 (API Rate Limit 방지)
    const workerCount = 2
    const workers = Array.from({ length: workerCount }, () => worker())
    
    // 모든 워커가 완료될 때까지 대기
    await Promise.all(workers)

    return { trends, successCount, failCount }
  }

  return {
    getTrendDaily,
    getTrendMinutes,
    getTrends,
    loading,
    error,
  }
}
