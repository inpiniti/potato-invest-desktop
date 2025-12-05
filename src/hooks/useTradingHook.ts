import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTradingStore } from '@/stores/useTradingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { TradingHistory, TradingRecord, TradingListItem, TradingListRecord } from '@/types/trading'


/**
 * 트레이딩 관리 훅 (히스토리 + 목록)
 * 
 * DB 중심 아키텍처:
 * - 모든 CUD 작업은 Supabase DB에 먼저 수행
 * - 성공 후 조회를 통해 Store 동기화
 * - Store는 읽기 전용 캐시 역할
 */
export function useTradingHook() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setHistories, setTradings } = useTradingStore()
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
   * DB 레코드를 앱 타입으로 변환 (trading_list)
   */
  const mapRecordToListItem = (record: TradingListRecord): TradingListItem => ({
    id: record.id,
    uid: record.uid,
    ticker: record.ticker,
    name: record.name,
    addedAt: record.added_at,
  })

  /**
   * ========================================
   * 트레이딩 목록 관련 함수
   * ========================================
   */

  /**
   * 트레이딩 목록 조회 (Supabase에서 가져와서 Store에 설정)
   */
  const fetchTradingList = async (): Promise<TradingListItem[]> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const { data, error: fetchError } = await supabase
        .from('trading_list')
        .select('*')
        .eq('uid', kakaoToken)
        .order('added_at', { ascending: false })

      if (fetchError) {
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      const tradingList = (data as TradingListRecord[]).map(mapRecordToListItem)
      setTradings(tradingList)
      return tradingList
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('fetchTradingList 오류:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * 트레이딩 목록에 추가
   */
  const addTradingItem = async (ticker: string, name: string): Promise<TradingListItem | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const id = `${ticker}_${kakaoToken}`

      const recordToInsert = {
        id,
        uid: kakaoToken,
        ticker,
        name,
        added_at: new Date().toISOString(),
      }

      console.log('📤 트레이딩 목록 추가:', recordToInsert)

      const { data, error: insertError } = await supabase
        .from('trading_list')
        .insert(recordToInsert)
        .select()
        .single()

      if (insertError) {
        console.error('❌ 트레이딩 목록 추가 에러:', insertError)
        throw new Error(`추가 실패: ${insertError.message}`)
      }

      console.log('✅ 트레이딩 목록 추가 성공:', data)

      await fetchTradingList()

      return mapRecordToListItem(data as TradingListRecord)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('❌ addTradingItem 오류:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 트레이딩 목록에서 제거
   */
  const removeTradingItem = async (ticker: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const id = `${ticker}_${kakaoToken}`

      console.log('🗑️ 트레이딩 목록 삭제:', id)

      const { error: deleteError } = await supabase
        .from('trading_list')
        .delete()
        .eq('id', id)
        .eq('uid', kakaoToken)

      if (deleteError) {
        console.error('❌ 트레이딩 목록 삭제 에러:', deleteError)
        throw new Error(`삭제 실패: ${deleteError.message}`)
      }

      console.log('✅ 트레이딩 목록 삭제 성공')

      await fetchTradingList()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('❌ removeTradingItem 오류:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * ========================================
   * 트레이딩 히스토리 관련 함수
   * ========================================
   */

  /**
   * 트레이딩 히스토리 조회
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
   * 트레이딩 히스토리 업데이트
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
        .eq('uid', kakaoToken)
        .select()
        .single()

      if (updateError) {
        throw new Error(`업데이트 실패: ${updateError.message}`)
      }

      await fetchHistories()

      return mapRecordToHistory(data as TradingRecord)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('❌ updateHistory 오류:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 매수 (LIFO 스택에 추가)
   * 수량 = 2^(미체결 개수)
   */
  const buyStock = async (ticker: string): Promise<TradingHistory | null> => {
    try {
      if (!kakaoToken) {
        throw new Error('로그인이 필요합니다.')
      }

      const { data, error: fetchError } = await supabase
        .from('trading')
        .select('id', { count: 'exact', head: false })
        .eq('uid', kakaoToken)
        .eq('ticker', ticker)
        .is('sell_price', null)

      if (fetchError) {
        console.error('미체결 포지션 조회 실패:', fetchError)
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      const openPositionCount = data?.length || 0
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
   * 가장 최근 매수한 포지션 판매
   */
  const sellStock = async (ticker: string): Promise<TradingHistory | null> => {
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
        .eq('ticker', ticker)
        .is('sell_price', null)
        .order('buy_time', { ascending: false })
        .limit(1)

      if (fetchError) {
        throw new Error(`조회 실패: ${fetchError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('매수한 수량이 부족해요')
      }

      const latestPosition = data[0] as TradingRecord
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
    // 트레이딩 목록
    fetchTradingList,
    addTradingItem,
    removeTradingItem,
    // 트레이딩 히스토리
    fetchHistories,
    addHistory,
    updateHistory,
    buyStock,
    sellStock,
    loading,
    error,
  }
}
