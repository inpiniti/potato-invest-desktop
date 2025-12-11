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
   * 추세 지표 계산 (공통)
   * 기울기: (현재 - 과거) / 과거 * 100 (비율)
   * 가속도: 현재기울기 - 과거기울기
   * 반환값: 각 항목의 합산
   * @param mas 이동평균 값 배열 (0번째가 최신)
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

    // 1. 기울기 (Slope) 비율 계산
    // 식: (현재 - 과거) / 과거 * 100
    const slopes: number[] = []
    for (let i = 0; i < validMas.length - 1; i++) {
        const curr = validMas[i]
        const prev = validMas[i + 1]
        
        // 0으로 나누기 방지
        if (prev === 0) {
            slopes.push(0)
        } else {
            slopes.push(((curr - prev) / prev) * 100)
        }
    }

    // 2. 가속도 (Acceleration) 계산
    // 식: 현재기울기 - 과거기울기
    const accels: number[] = []
    for (let i = 0; i < slopes.length - 1; i++) {
      accels.push(slopes[i] - slopes[i + 1])
    }

    // 3. 합산 (User Request: 합산을 리턴)
    const slopeSum = slopes.reduce((sum, val) => sum + val, 0)
    const accelSum = accels.reduce((sum, val) => sum + val, 0)

    // 4. 설명 생성
    // Slope: + 상승, - 하락, 0 박스권
    // Accel: + 상승추세변화(가속/반등), - 하락추세변화(둔화/낙폭확대), 0 변화없음
    let description = ''
    
    // 부동소수점 오차 고려하여 0 판단
    const isSlopeFlat = Math.abs(slopeSum) < 0.000001
    const isAccelFlat = Math.abs(accelSum) < 0.000001

    if (isSlopeFlat) {
        description = '박스권 횡보'
    } else if (slopeSum > 0) {
        description = '상승 추세'
    } else {
        description = '하락 추세'
    }

    if (!isAccelFlat) {
        if (accelSum > 0) {
            // 가속도가 + 인 경우
            if (slopeSum > 0) description += ' (상승폭 확대)'
            else if (slopeSum < 0) description += ' (하락폭 축소/반등 시도)'
            else description += ' (상승 전환 시도)'
        } else {
            // 가속도가 - 인 경우
            if (slopeSum > 0) description += ' (상승폭 둔화)'
            else if (slopeSum < 0) description += ' (하락폭 확대)'
            else description += ' (하락 전환 시도)'
        }
    } else {
        description += ' (모멘텀 유지)'
    }

    return {
      value: current,
      slope: slopeSum,
      accel: accelSum,
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

      if (minuteData.length < 210) { // 10개 MA 계산을 위해 조금 더 여유있게
        throw new Error(`데이터가 부족합니다. (필요: 210개 이상, 현재: ${minuteData.length}개)`)
      }

      // 각 이동평균선의 최근 10개 값 계산
      const ma20Values: (number | null)[] = []
      const ma50Values: (number | null)[] = []
      const ma100Values: (number | null)[] = []
      const ma200Values: (number | null)[] = []

      for (let i = 0; i < 10; i++) {
        ma20Values.push(calculateMAMinute(minuteData, 20, i))
        ma50Values.push(calculateMAMinute(minuteData, 50, i))
        ma100Values.push(calculateMAMinute(minuteData, 100, i))
        ma200Values.push(calculateMAMinute(minuteData, 200, i))
      }

      // 추세 판단 - 10개 데이터 분석 함수 사용
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
