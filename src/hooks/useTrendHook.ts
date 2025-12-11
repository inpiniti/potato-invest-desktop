import { useState } from 'react'
import type { Trend } from '@/types/trend'
import { useKoreainvestmentHook } from './useKoreainvestmentHook'
import { calculateTrendMetrics, calculateMADaily, calculateMAMinute } from '@/utils/trend-calculator'

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
