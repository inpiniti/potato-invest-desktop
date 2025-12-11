import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Loader2 } from 'lucide-react'
import { calculateBBSignal } from '@/types/tradingview'
import type { Trend } from '@/types/trend'
import type { TradingViewBBData } from '@/types/tradingview'
import type { TradingListItem } from '@/types/trading'
import type { RealtimePrice } from '@/types/realtime'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTrendStore } from '@/stores/useTrendStore'

interface TradingCardProps {
  trading: TradingListItem
  realtimeData: RealtimePrice | undefined
  trend: Trend | null
  trendLoading: boolean
  bbData: TradingViewBBData | null
  handleRemoveClick: (ticker: string, name: string) => void
  onAutoTrade: (ticker: string, price: number, type: 'buy' | 'sell') => void
  onSelectStock: (ticker: string, exchange: 'NAS' | 'NYS') => void
}

export const TradingCard = ({ 
  trading, 
  realtimeData,
  trend,
  trendLoading,
  bbData,
  handleRemoveClick, 
  onAutoTrade,
  onSelectStock
}: TradingCardProps) => {
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

    // 매수 조건: 기울기 3~6, 가속도 7~8
    const isBuySignal = (s: number, a: number) => {
      return (s >= 3 && s <= 6) && (a >= 7 && a <= 8)
    }

    // 매도 조건: 기울기 3~6, 가속도 0~1
    const isSellSignal = (s: number, a: number) => {
      return (s >= 3 && s <= 6) && (a >= 0 && a <= 1)
    }

    // MA20 기준 신호 확인 (분봉)
    const ma20Slope = trend.ma20.slope  // 0 ~ 9
    const ma20Accel = trend.ma20.accel  // 0 ~ 8

    // 매도 로직
    if (openPositions.length > 0 && isSellSignal(ma20Slope, ma20Accel)) {
      // 🔒 매도
      setAutoTradeStatus('selling')
      console.log(`🤖 [자동매도] ${trading.ticker} - 매도 신호 발생 (Slope:${ma20Slope}, Accel:${ma20Accel})`)
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
      
      console.log(`🤖 [자동매수] ${trading.ticker} - 매수 신호 발생 (Slope:${ma20Slope}, Accel:${ma20Accel})`)
      setAutoTradeStatus('buying')
      onAutoTrade(trading.ticker, currentPrice, 'buy')
      setLastAutoTradeTime(now)
      setTimeout(() => setAutoTradeStatus('idle'), 5000)
    }
  }, [trend, prevTrend, currentPrice, openPositions.length])



  return (
    <Card 
      key={trading.ticker} 
      className={`w-full transition-all duration-1000 ${
        isHighlighted 
          ? 'border-primary/80 shadow-lg shadow-primary/20' 
          : 'border-border'
      }`}
    >
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div 
              className="cursor-pointer hover:opacity-80"
              onClick={() => onSelectStock(trading.ticker, trading.exchange)}
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{trading.ticker}</CardTitle>
                <span className="text-xs text-muted-foreground">{trading.name}</span>
                {/* 볼린저 밴드 신호 Badge */}
                {(() => {
                  const signal = bbData ? calculateBBSignal(bbData) : null
                  if (!signal) return null
                  const signalStyles: Record<string, string> = {
                    '강력매수': 'bg-red-600 text-white font-bold',
                    '매수': 'bg-red-400 text-white',
                    '매도': 'bg-blue-400 text-white',
                    '강력매도': 'bg-blue-600 text-white font-bold',
                  }
                  return (
                    <Badge className={`h-4 px-1 text-[10px] ${signalStyles[signal] || 'bg-gray-400 text-white'}`}>
                      {signal}
                    </Badge>
                  )
                })()}
                {/* 일별 트렌드 뱃지들 (트렌드 분석으로 조회된 데이터) */}
                {dailyTrend && (
                  <div className="flex gap-0.5">
                    {(['ma20', 'ma50', 'ma100', 'ma200'] as const).map((maKey) => {
                      const metric = dailyTrend[maKey]
                      const { slope } = metric
                      let bgColor = 'bg-gray-400'

                      // 1. 빨강 (Red): 기울기 3, 4
                      if (slope >= 3) {
                        bgColor = 'bg-red-500'
                      }
                      // 2. 파랑 (Blue): 기울기 0, 1
                      else if (slope <= 1) {
                        bgColor = 'bg-blue-500'
                      }
                      // 3. 회색 (Gray): 기울기 2
                      else {
                        bgColor = 'bg-gray-400'
                      }

                      return (
                        <Badge key={maKey} className={`h-4 px-1 text-[10px] ${bgColor} text-white`}>
                          {maKey.replace('ma', '')} ({metric.slope},{metric.accel})
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  ${currentPrice ? currentPrice.toFixed(2) : '-.--'}
                </span>
                {changeRate !== null && (
                  <span className={`text-xs ${changeRate > 0 ? 'text-red-400' : changeRate < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                    {changeRate > 0 ? '+' : ''}{changeRate}% (${changeDiff})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveClick(trading.ticker, trading.name)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            추가일: {new Date(trading.addedAt).toLocaleDateString('ko-KR')}
          </div>
          {/* 추세 정보 표시 - 로딩 중에도 기존 데이터 유지 */}
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-2">
              {/* 로딩 중이면 스피너 표시 (기존 데이터는 유지) */}
              {trendLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
              {trend ? (
                <>
                  {(['ma20', 'ma50', 'ma100', 'ma200'] as const).map((maKey) => {
                    const metric = trend[maKey]
                    const { slope, accel } = metric
                    let bgColor = 'bg-gray-400'

                      // 1. 빨강 (Buy Signal): 기울기 3~6, 가속도 7~8
                      if ((slope >= 3 && slope <= 6) && (accel >= 7 && accel <= 8)) {
                        bgColor = 'bg-red-500'
                      }
                      // 2. 파랑 (Sell Signal): 기울기 3~6, 가속도 0~1
                      else if ((slope >= 3 && slope <= 6) && (accel >= 0 && accel <= 1)) {
                        bgColor = 'bg-blue-500'
                      }
                      // 3. 회색: 나머지
                      else {
                        bgColor = 'bg-gray-400'
                      }

                    return (
                      <Badge key={maKey} className={`h-4 px-1 text-[10px] ${bgColor} text-white`}>
                        {maKey.replace('ma', '')} ({slope},{accel})
                      </Badge>
                    )
                  })}
                </>
              ) : !trendLoading ? (
                <span className="text-xs text-muted-foreground">-</span>
              ) : null}
            </div>
            
            {/* ✨ 호가 분석 정보 표시 */}
            {realtimeData && (
              <div className="flex items-center gap-2 text-[10px]">
                {/* 수급 상태 */}
                <div className={`flex items-center gap-1 ${supplyDemandColor}`}>
                  <span className="font-medium">{supplyDemandStatus}</span>
                  {strength && <span className="text-muted-foreground">({strength.toFixed(0)}%)</span>}
                </div>
                
                <div className="h-2 w-[1px] bg-border" />
                
                {/* 스프레드 상태 */}
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${spreadColor}`} />
                  <span className="text-muted-foreground">{spreadStatus}</span>
                  {spreadRate > 0 && <span className="text-muted-foreground">({spreadRate.toFixed(2)}%)</span>}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 트레이딩 내역 표 */}
        {histories.length > 0 && (
          <div className="mt-2 border rounded">
            <table className="w-full text-[10px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-1 text-left">매수가</th>
                  <th className="p-1 text-left">수량</th>
                  <th className="p-1 text-left">매도가</th>
                  <th className="p-1 text-right">손익</th>
                </tr>
              </thead>
              <tbody>
                {histories.slice(0, 5).map((h) => {
                  const profit = h.sellPrice 
                    ? (h.sellPrice - h.buyPrice) * h.buyQuantity 
                    : currentPrice 
                      ? (currentPrice - h.buyPrice) * h.buyQuantity 
                      : null
                  const profitRate = h.sellPrice 
                    ? ((h.sellPrice - h.buyPrice) / h.buyPrice * 100)
                    : currentPrice 
                      ? ((currentPrice - h.buyPrice) / h.buyPrice * 100)
                      : null
                  
                  return (
                    <tr key={h.id} className="border-t">
                      <td className="p-1">${h.buyPrice.toFixed(2)}</td>
                      <td className="p-1">{h.buyQuantity}</td>
                      <td className="p-1">
                        {h.sellPrice ? `$${h.sellPrice.toFixed(2)}` : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className={`p-1 text-right ${profit && profit > 0 ? 'text-red-400' : profit && profit < 0 ? 'text-blue-400' : ''}`}>
                        {profit !== null ? (
                          <>
                            ${profit.toFixed(2)} ({profitRate?.toFixed(1)}%)
                          </>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {histories.length > 5 && (
              <div className="text-[10px] text-muted-foreground text-center py-1">
                +{histories.length - 5}개 더 있음
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
