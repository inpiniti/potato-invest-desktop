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
        const msg = '로그인이 필요합니다. kakaoToken이 없습니다.'
        alert(msg)
        throw new Error(msg)
      }

      // 고유 ID 생성
      const id = `${history.ticker}_${history.buyTime}_${Date.now()}`

      const recordToInsert = {
        id,
        ...mapHistoryToRecord({ ...history, uid: kakaoToken }),
      }

      console.log('📤 Supabase INSERT 시도:', recordToInsert)

      const { data, error: insertError } = await supabase
        .from('trading')
        .insert(recordToInsert)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Supabase INSERT 에러:', insertError)
        const msg = `추가 실패: ${insertError.message}\n\n상세: ${JSON.stringify(insertError, null, 2)}`
        alert(msg)
        throw new Error(msg)
      }

      console.log('✅ Supabase INSERT 성공:', data)

      // DB 추가 성공 후 전체 조회하여 Store 동기화
      await fetchHistories()

      return mapRecordToHistory(data as TradingRecord)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('❌ addHistory 오류:', err)
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

  /**
   * 매수 (LIFO 스택에 추가)
   * 새로운 포지션을 생성하여 스택에 추가
   * 
   * 수량 계산 로직:
   * - 해당 티커의 미체결 포지션 개수를 센다
   * - 수량 = 2^(미체결 개수)
   * - 예: 0개 → 1, 1개 → 2, 2개 → 4, 3개 → 8
   */
  const buyStock = async (ticker: string): Promise<TradingHistory | null> => {
    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // 해당 티커의 미체결 포지션 개수 조회
      const { data, error: fetchError } = await supabase
        .from('trading')
        .select('id', { count: 'exact', head: false })
        .eq('uid', kakaoToken)
        .eq('ticker', ticker)
        .is('sell_price', null) // 미체결만

      if (fetchError) {
        console.error('미체결 포지션 조회 실패:', fetchError)
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      // 미체결 포지션 개수
      const openPositionCount = data?.length || 0
      
      // 수량 = 2^n (1, 2, 4, 8, 16, ...)
      const quantity = Math.pow(2, openPositionCount)

      console.log(`📈 매수: 티커=${ticker}, 미체결=${openPositionCount}개, 수량=${quantity}`)

      return await addHistory({
        ticker,
        buyPrice: 1,
        buyQuantity: quantity,
        buyTime: new Date().toISOString(),
        sellPrice: null,
        sellQuantity: null,
        sellTime: null,
      })
    } catch (err) {
      console.error('buyStock 오류:', err)
      alert(err instanceof Error ? err.message : '매수 실패')
      return null
    }
  }

  /**
   * 매도 (LIFO 스택에서 제거)
   * 가장 최근에 매수한 미체결 포지션을 찾아 판매 정보 업데이트
   * 
   * LIFO 로직 (스택):
   * - 미체결 포지션(sellPrice === null)만 필터링
   * - buyTime 기준 내림차순 정렬 (가장 최근 것 우선)
   * - 첫 번째 항목을 판매 처리
   * - 판매 수량 = 해당 포지션의 매수 수량과 동일
   */
  const sellStock = async (ticker: string): Promise<TradingHistory | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      // 해당 티커의 미체결 포지션 조회 (LIFO: 가장 최근 것 우선)
      const { data, error: fetchError } = await supabase
        .from('trading')
        .select('*')
        .eq('uid', kakaoToken)
        .eq('ticker', ticker)
        .is('sell_price', null) // 미체결 포지션만
        .order('buy_time', { ascending: false }) // 최근 순서 (LIFO)
        .limit(1)

      if (fetchError) {
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('매수한 수량이 부족해요')
      }

      // 가장 최근 미체결 포지션 판매 처리
      const latestPosition = data[0] as TradingRecord
      
      // 판매 수량 = 매수 수량과 동일
      const sellQuantity = latestPosition.buy_quantity

      console.log(`📉 매도: 티커=${ticker}, 수량=${sellQuantity}`)
      
      const result = await updateHistory(latestPosition.id, {
        sellPrice: 1,
        sellQuantity: sellQuantity,
        sellTime: new Date().toISOString(),
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('sellStock 오류:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    fetchHistories,
    addHistory,
    updateHistory,
    buyStock,
    sellStock,
    loading,
    error,
  }
}
