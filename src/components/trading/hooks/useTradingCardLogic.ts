
import { useRef, useEffect, useState } from 'react'
import type { Trend } from '@/types/trend'
import type { TradingListItem } from '@/types/trading'
import type { RealtimePrice } from '@/types/realtime'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTrendStore } from '@/stores/useTrendStore'

interface UseTradingCardLogicProps {
  trading: TradingListItem
  realtimeData: RealtimePrice | undefined
  trend: Trend | null
  onAutoTrade: (ticker: string, price: number, type: 'buy' | 'sell') => void
}

export const useTradingCardLogic = ({
  trading,
  realtimeData,
  trend,
  onAutoTrade
}: UseTradingCardLogicProps) => {
  const { getHistoriesByTicker } = useTradingStore()
  const { getTrendByTicker } = useTrendStore()
  
  // 일별 트렌드 (트렌드 분석 버튼으로 조회된 데이터)
  const dailyTrend = getTrendByTicker(trading.ticker) || null
  const [prevTrend, setPrevTrend] = useState<Trend | null>(null)
  const [lastAutoTradeTime, setLastAutoTradeTime] = useState<number>(0)
  const [autoTradeStatus, setAutoTradeStatus] = useState<'idle' | 'buying' | 'selling'>('idle')
  
  // 테두리 애니메이션 상태
  const [isHighlighted, setIsHighlighted] = useState(false)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPrice = realtimeData ? parseFloat(realtimeData.LAST) : null
  const changeRate = realtimeData ? parseFloat(realtimeData.RATE) : null
  const changeDiff = realtimeData ? parseFloat(realtimeData.DIFF) : null

  // 해당 종목의 트레이딩 내역
  const histories = getHistoriesByTicker(trading.ticker)
  
  // 미체결 포지션 개수 (매수했지만 아직 매도하지 않은 것)
  const openPositions = histories.filter(h => h.sellPrice === null)

  // --------------------------------------------------------------------------
  // ✨ 시장 미시구조 분석 (Market Microstructure)
  // --------------------------------------------------------------------------
  
  // 1. 체결강도 (Strength) & 단순 OBI (Order Imbalance)
  const strength = realtimeData?.STRN ? parseFloat(realtimeData.STRN) : null
  const vbid = realtimeData?.VBID ? parseInt(realtimeData.VBID) : 0
  const vask = realtimeData?.VASK ? parseInt(realtimeData.VASK) : 0
  
  // 단순 OBI 계산: (매수잔량 - 매도잔량) / (매수잔량 + 매도잔량)
  // 범위: -1 (매도압도) ~ +1 (매수압도)
  const obi = (vbid + vask) > 0 ? (vbid - vask) / (vbid + vask) : 0

  // 수급 상태 판별
  let supplyDemandStatus = '대기'
  let supplyDemandColor = 'text-gray-400'
  
  if (strength && strength >= 110) {
    supplyDemandStatus = '강한 매수세'
    supplyDemandColor = 'text-red-500 font-bold'
  } else if (strength && strength <= 90) {
    supplyDemandStatus = '강한 매도세'
    supplyDemandColor = 'text-blue-500 font-bold'
  } else if (obi > 0.2) {
    supplyDemandStatus = '매수 우위'
    supplyDemandColor = 'text-red-400'
  } else if (obi < -0.2) {
    supplyDemandStatus = '매도 우위'
    supplyDemandColor = 'text-blue-400'
  } else if (strength) {
    supplyDemandStatus = '팽팽함'
    supplyDemandColor = 'text-gray-500'
  }

  // 2. 스프레드 분석 (변동성/유동성 체크)
  const pbid = realtimeData?.PBID ? parseFloat(realtimeData.PBID) : 0
  const pask = realtimeData?.PASK ? parseFloat(realtimeData.PASK) : 0
  // 현재가가 없으면 매수/매도 호가 평균 사용
  const refPrice = currentPrice || (pbid + pask) / 2
  
  // 스프레드 비율 (%)
  const spreadRate = (pask > 0 && pbid > 0 && refPrice > 0) 
    ? ((pask - pbid) / refPrice) * 100 
    : 0
    
  let spreadStatus = '양호'
  let spreadColor = 'bg-green-500' // 신호등 색상 (점)
  
  if (spreadRate >= 0.3) {
    spreadStatus = '❗거래량 부족' // 또는 급변동
    spreadColor = 'bg-red-500'
  } else if (spreadRate >= 0.1) {
    spreadStatus = '⚠️ 호가 벌어짐'
    spreadColor = 'bg-orange-500'
  }

  // 실시간 데이터 수신 시 테두리 하이라이트 (가시성)
  useEffect(() => {
    if (realtimeData) {
      setIsHighlighted(true)
      
      // 기존 타임아웃 정리
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
      
      // 1초 후 하이라이트 해제
      highlightTimeoutRef.current = setTimeout(() => {
        setIsHighlighted(false)
      }, 1000)
    }
    
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [realtimeData?.KHMS]) // 한국시간이 변경될 때마다 (새 데이터 수신)

  // 추세 변화 감지 (MA20 가속도 기준)
  const hasTrendChanged = (prev: Trend | null, curr: Trend): boolean => {
    if (!prev) return true // 첫 번째 추세는 변화로 간주
    // 가속도나 기울기가 변했는지 체크
    return prev.ma20.accel !== curr.ma20.accel || prev.ma20.slope !== curr.ma20.slope
  }

  // 추세 변화 시 이전 추세 저장
  useEffect(() => {
    if (trend && hasTrendChanged(prevTrend, trend)) {
      setPrevTrend(trend)
    }
  }, [trend])

  // 자동 트레이딩 로직
  useEffect(() => {
    // 조건: 추세 데이터 있고, 가격 있고, 자동 트레이딩 중이 아닐 때
    if (!trend || !prevTrend || !currentPrice || currentPrice <= 0 || autoTradeStatus !== 'idle') {
      return
    }

    const now = Date.now()
    const AUTO_TRADE_COOLDOWN = 60 * 1000 // 1분 쿨다운

    // 마지막 자동 거래 후 1분이 지나지 않았으면 스킵
    if (now - lastAutoTradeTime < AUTO_TRADE_COOLDOWN) {
      return
    }

    // ------------------------------------------
    // Auto Trading Logic (Minute Trend - 10 Points)
    // ------------------------------------------

    // 매수 조건: 상승 추세이고 가속도가 양수 (상승폭 확대)
    const isBuySignal = (s: number, a: number) => {
      return s > 0 && a > 0
    }

    // 매도 조건: 상승 추세지만 가속도가 음수 (상승둔화/고점징후)
    const isSellSignal = (s: number, a: number) => {
      return s > 0 && a < 0
    }

    // MA20 기준 신호 확인 (분봉)
    const ma20Slope = trend.ma20.slope  // 0 ~ 9
    const ma20Accel = trend.ma20.accel  // 0 ~ 8

    // 매도 로직
    if (openPositions.length > 0 && isSellSignal(ma20Slope, ma20Accel)) {
      // 🔒 매도
      setAutoTradeStatus('selling')
      console.log(`🤖 [자동매도] ${trading.ticker} - 매도 신호 발생 (Slope:${ma20Slope.toFixed(2)}%, Accel:${ma20Accel.toFixed(2)}%)`)
      onAutoTrade(trading.ticker, currentPrice, 'sell')
      setLastAutoTradeTime(now)
      setTimeout(() => setAutoTradeStatus('idle'), 5000)
      return
    }

    // 매수 로직
    if (isBuySignal(ma20Slope, ma20Accel)) {
      // 🔒 가격 조건 체크
      if (openPositions.length > 0) {
        const sortedPositions = [...openPositions].sort((a, b) => 
          new Date(b.buyTime).getTime() - new Date(a.buyTime).getTime()
        )
        const lastBuyPrice = sortedPositions[0].buyPrice
        
        if (currentPrice >= lastBuyPrice) {
          console.log(`⏸️ [매수 보류] ${trading.ticker} - 매수 신호지만 가격이 높음 (현재가: $${currentPrice.toFixed(2)} >= 이전매수가: $${lastBuyPrice.toFixed(2)})`)
          return
        }
      }
      
      console.log(`🤖 [자동매수] ${trading.ticker} - 매수 신호 발생 (Slope:${ma20Slope.toFixed(2)}%, Accel:${ma20Accel.toFixed(2)}%)`)
      setAutoTradeStatus('buying')
      onAutoTrade(trading.ticker, currentPrice, 'buy')
      setLastAutoTradeTime(now)
      setTimeout(() => setAutoTradeStatus('idle'), 5000)
    }
  }, [trend, prevTrend, currentPrice, openPositions.length])

  return {
    dailyTrend,
    currentPrice,
    changeRate,
    changeDiff,
    histories,
    isHighlighted,
    supplyDemandStatus,
    supplyDemandColor,
    strength,
    spreadStatus,
    spreadColor,
    spreadRate,
    autoTradeStatus
  }
}
