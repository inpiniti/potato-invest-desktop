import { useState } from 'react'
import type { Daily } from '@/types/daily'
import type { Minute } from '@/types/minute'
import { useAccountStore } from '@/stores/useAccountStore'

interface GetDailyParams {
  ticker: string
  exchange: 'NAS' | 'NYS' // NAS: 나스닥, NYS: 뉴욕
}

interface GetMinutesParams {
  ticker: string
  exchange: 'NAS' | 'NYS' // NAS: 나스닥, NYS: 뉴욕
}

/**
 * 한국투자증권 해외주식 기간별시세 API 훅
 */
export function useKoreainvestmentHook() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { accessToken, selectedAccount } = useAccountStore()

  /**
   * 해외주식 일별 시세 조회
   * @param params ticker와 exchange를 포함한 파라미터
   * @returns Daily 배열
   */
  const getDaily = async ({ ticker, exchange }: GetDailyParams): Promise<Daily[]> => {
    setLoading(true)
    setError(null)

    try {
      // 필수 값 검증
      if (!accessToken) {
        throw new Error('접근 토큰이 없습니다. 계정 설정을 확인해주세요.')
      }

      if (!selectedAccount) {
        throw new Error('선택된 계정이 없습니다. 계정을 선택해주세요.')
      }

      const { appkey, appsecret } = selectedAccount

      // IPC를 통해 메인 프로세스에서 API 호출
      if (!window.ipcRenderer?.koreaInvestDaily) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const dailyData = await window.ipcRenderer.koreaInvestDaily({
        accessToken,
        appkey,
        appsecret,
        ticker,
        exchange,
      })

      return dailyData as Daily[]
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getDaily 오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 해외주식 분봉 시세 조회
   * @param params ticker와 exchange를 포함한 파라미터
   * @returns Minute 배열
   */
  const getMinutes = async ({ ticker, exchange }: GetMinutesParams): Promise<Minute[]> => {
    setLoading(true)
    setError(null)

    try {
      // 필수 값 검증
      if (!accessToken) {
        throw new Error('접근 토큰이 없습니다. 계정 설정을 확인해주세요.')
      }

      if (!selectedAccount) {
        throw new Error('선택된 계정이 없습니다. 계정을 선택해주세요.')
      }

      const { appkey, appsecret } = selectedAccount

      // IPC를 통해 메인 프로세스에서 API 호출
      if (!window.ipcRenderer?.koreaInvestMinutes) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const minuteData = await window.ipcRenderer.koreaInvestMinutes({
        accessToken,
        appkey,
        appsecret,
        ticker,
        exchange,
      })

      return minuteData as Minute[]
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getMinutes 오류:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    getDaily,
    getMinutes,
    loading,
    error,
  }
}
