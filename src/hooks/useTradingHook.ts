import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/stores/useTradingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { TradingHistory, TradingRecord } from '@/types/trading'


/**
 * 트레이딩 히스토리 관리 훅
 * 
 * DB 중심 아키텍처:
 * - 모든 CUD 작업은 Supabase DB에 먼저 수행
 * - 성공 후 조회를 통해 Store 동기화
 * - Store는 읽기 전용 캐시 역할
 */
export function useTradingHook() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setHistories } = useTradingStore()
  const { kakaoToken } = useAuthStore()

  /**
   * DB 레코드를 앱 타입으로 변환 (snake_case -> camelCase)
   */
  const mapRecordToHistory = (record: TradingRecord): TradingHistory => ({
    id: record.id,
    uid: record.uid,
    ticker: record.ticker,
    buyPrice: record.buy_price,
    buyQuantity: record.buy_quantity,
    buyTime: record.buy_time,
    sellPrice: record.sell_price,
    sellQuantity: record.sell_quantity,
    sellTime: record.sell_time,
  })

  /**
   * 앱 타입을 DB 레코드로 변환 (camelCase -> snake_case)
   */
  const mapHistoryToRecord = (history: Omit<TradingHistory, 'id'>): Omit<TradingRecord, 'id' | 'created_at' | 'updated_at'> => ({
    uid: history.uid,
    ticker: history.ticker,
    buy_price: history.buyPrice,
    buy_quantity: history.buyQuantity,
    buy_time: history.buyTime,
    sell_price: history.sellPrice,
    sell_quantity: history.sellQuantity,
    sell_time: history.sellTime,
  })

  /**
   * 트레이딩 히스토리 조회 (Supabase에서 가져와서 Store에 설정)
   * 현재 로그인한 사용자(kakaoToken)의 데이터만 조회
   */
  const fetchHistories = async (): Promise<TradingHistory[]> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const { data, error: fetchError } = await supabase
        .from('trading')
        .select('*')
        .eq('uid', kakaoToken)
        .order('buy_time', { ascending: false })

      if (fetchError) {
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      const histories = (data as TradingRecord[]).map(mapRecordToHistory)
      setHistories(histories)
      return histories
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('fetchHistories 오류:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * 새 트레이딩 히스토리 추가
   * DB에 추가 후 자동으로 조회하여 Store 동기화
   */
  const addHistory = async (
    history: Omit<TradingHistory, 'id' | 'uid'>
  ): Promise<TradingHistory | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // 고유 ID 생성
      const id = `${history.ticker}_${history.buyTime}_${Date.now()}`

      const recordToInsert = {
        id,
        ...mapHistoryToRecord({ ...history, uid: kakaoToken }),
      }

      const { data, error: insertError } = await supabase
        .from('trading')
        .insert(recordToInsert)
        .select()
        .single()

      if (insertError) {
        throw new Error(`추가 실패: ${insertError.message}`)
      }

      // DB 추가 성공 후 전체 조회하여 Store 동기화
      await fetchHistories()

      return mapRecordToHistory(data as TradingRecord)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('addHistory 오류:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 트레이딩 히스토리 업데이트 (주로 판매 정보 추가)
   * DB 업데이트 후 자동으로 조회하여 Store 동기화
   */
  const updateHistory = async (
    id: string,
    updates: Partial<Omit<TradingHistory, 'id' | 'uid'>>
  ): Promise<TradingHistory | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // camelCase -> snake_case 변환
      const recordUpdates: Partial<Omit<TradingRecord, 'id' | 'uid' | 'created_at' | 'updated_at'>> = {}
      if (updates.ticker !== undefined) recordUpdates.ticker = updates.ticker
      if (updates.buyPrice !== undefined) recordUpdates.buy_price = updates.buyPrice
      if (updates.buyQuantity !== undefined) recordUpdates.buy_quantity = updates.buyQuantity
      if (updates.buyTime !== undefined) recordUpdates.buy_time = updates.buyTime
      if (updates.sellPrice !== undefined) recordUpdates.sell_price = updates.sellPrice
      if (updates.sellQuantity !== undefined) recordUpdates.sell_quantity = updates.sellQuantity
      if (updates.sellTime !== undefined) recordUpdates.sell_time = updates.sellTime

      const { data, error: updateError } = await supabase
        .from('trading')
        .update(recordUpdates)
        .eq('id', id)
        .eq('uid', kakaoToken) // 본인 데이터만 수정 가능
        .select()
        .single()

      if (updateError) {
        throw new Error(`업데이트 실패: ${updateError.message}`)
      }

      // DB 업데이트 성공 후 전체 조회하여 Store 동기화
      await fetchHistories()

      return mapRecordToHistory(data as TradingRecord)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('updateHistory 오류:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    fetchHistories,
    addHistory,
    updateHistory,
    loading,
    error,
  }
}
