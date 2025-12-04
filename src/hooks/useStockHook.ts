import { useState } from 'react'
import type { StockInfo, Board } from '@/types/stock'
import { useStockStore } from '@/stores/useStockStore'

/**
 * 종목 정보 및 커뮤니티 크롤링 훅
 */
export function useStockHook() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setInfo, setNews, setToss } = useStockStore()

  /**
   * 종목 정보 조회 (Yahoo Finance)
   */
  const getInfo = async (ticker: string): Promise<StockInfo | null> => {
    setLoading(true)
    setError(null)

    try {
      if (!window.ipcRenderer?.tradingViewCrawl) {
        throw new Error('IPC communication not available.')
      }

      const info = await window.ipcRenderer.tradingViewCrawl(ticker)
      
      if (info) {
        setInfo(info)
      }
      
      return info
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred.'
      setError(errorMessage)
      console.error('getInfo error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * 뉴스 조회 (추후 구현)
   */
  const getNews = async (ticker: string): Promise<Board[]> => {
    setLoading(true)
    setError(null)

    try {
      if (!window.ipcRenderer?.newsCrawl) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const news = await window.ipcRenderer.newsCrawl(ticker)
      setNews(news)
      return news
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getNews 오류:', err)
      return []
    } finally {
      setLoading(false)
    }
  }



  /**
   * 토스 커뮤니티 글 조회
   */
  const getToss = async (ticker: string): Promise<Board[]> => {
    setLoading(true)
    setError(null)

    try {
      if (!window.ipcRenderer?.tossCrawl) {
        throw new Error('IPC 통신이 불가능합니다.')
      }

      const result = await window.ipcRenderer.tossCrawl(ticker)
      const tossComments = result.comments || []
      
      setToss(tossComments)
      return tossComments
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('getToss 오류:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    getInfo,
    getNews,
    getToss,
    loading,
    error,
  }
}
