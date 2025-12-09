import { useState, useEffect, useRef, useCallback } from 'react'
import { useStockStore } from '@/stores/useStockStore'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTradingHook } from '@/hooks/useTradingHook'
import { useRealtimePrice } from '@/hooks/useRealtimePrice'
import { useTrendQueue } from '@/hooks/useTrendQueue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, X, ShoppingCart, DollarSign, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import TradingViewWidgetChart from '@/components/TradingViewWidgetChart'
import type { Trend, TrendType } from '@/types/trend'
import type { RealtimePrice } from '@/types/realtime'
import type { TradingListItem } from '@/types/trading'
import { toast } from 'sonner'

// 추세 타입에 따른 색상 및 아이콘 반환
const getTrendStyle = (trend: TrendType) => {
  switch (trend) {
    case '상승':
    case '상승전환':
      return { color: 'text-red-400', icon: TrendingUp, label: trend }
    case '하락':
    case '하락전환':
      return { color: 'text-blue-400', icon: TrendingDown, label: trend }
    default:
      return { color: 'text-gray-400', icon: Minus, label: trend }
  }
}

interface TradingCardProps {
  trading: TradingListItem
  realtimeData: RealtimePrice | undefined
  trend: Trend | null
  trendLoading: boolean
  handleBuy: (ticker: string, price: number) => void
  handleSell: (ticker: string, price: number) => void
  handleRemoveClick: (ticker: string, name: string) => void
  onAutoTrade: (ticker: string, price: number, type: 'buy' | 'sell') => void
}

const TradingCard = ({ 
  trading, 
  realtimeData,
  trend,
  trendLoading,
  handleBuy, 
  handleSell, 
  handleRemoveClick, 
  onAutoTrade 
}: TradingCardProps) => {
  const { getHistoriesByTicker } = useTradingStore()
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

  // 자동 매수 조건 체크
  const checkBuyCondition = (t: Trend): boolean => {
    // MA20은 반드시 '상승전환'이어야 함
    if (t.ma20 !== '상승전환') return false
    
    // MA50, MA100, MA200은 '상승' 또는 '상승전환'이어야 함
    const isUpTrend = (ma: string) => ma === '상승' || ma === '상승전환'
    return isUpTrend(t.ma50) && isUpTrend(t.ma100) && isUpTrend(t.ma200)
  }

  // 자동 매도 조건 체크
  const checkSellCondition = (t: Trend): boolean => {
    // 4개 중 하나라도 '하락' 또는 '하락전환'이면 매도
    const isDownTrend = (ma: string) => ma === '하락' || ma === '하락전환'
    return isDownTrend(t.ma20) || isDownTrend(t.ma50) || isDownTrend(t.ma100) || isDownTrend(t.ma200)
  }

  // 추세 변화 감지
  const hasTrendChanged = (prev: Trend | null, curr: Trend): boolean => {
    if (!prev) return true // 첫 번째 추세는 변화로 간주
    return prev.ma20 !== curr.ma20 || prev.ma50 !== curr.ma50 || 
           prev.ma100 !== curr.ma100 || prev.ma200 !== curr.ma200
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
    if (!trend || !currentPrice || currentPrice <= 0 || autoTradeStatus !== 'idle') {
      return
    }

    // 추세 변화가 없으면 스킵
    if (!hasTrendChanged(prevTrend, trend)) {
      return
    }

    const now = Date.now()
    const AUTO_TRADE_COOLDOWN = 60 * 1000 // 1분 쿨다운

    // 마지막 자동 거래 후 1분이 지나지 않았으면 스킵
    if (now - lastAutoTradeTime < AUTO_TRADE_COOLDOWN) {
      return
    }

    // 매도 조건 먼저 체크 (보유 중일 때만)
    if (openPositions.length > 0 && checkSellCondition(trend)) {
      setAutoTradeStatus('selling')
      console.log(`🤖 [자동매도] ${trading.ticker} - 하락 추세 변화 감지`)
      onAutoTrade(trading.ticker, currentPrice, 'sell')
      setLastAutoTradeTime(now)
      setTimeout(() => setAutoTradeStatus('idle'), 5000) // 5초 후 상태 초기화
      return
    }

    // 매수 조건 체크
    if (checkBuyCondition(trend)) {
      setAutoTradeStatus('buying')
      console.log(`🤖 [자동매수] ${trading.ticker} - 상승전환 변화 감지 (MA20: ${trend.ma20})`)
      onAutoTrade(trading.ticker, currentPrice, 'buy')
      setLastAutoTradeTime(now)
      setTimeout(() => setAutoTradeStatus('idle'), 5000) // 5초 후 상태 초기화
    }
  }, [trend, currentPrice, openPositions.length])

  // 매수/매도 버튼 클릭 핸들러
  const onBuyClick = () => {
    if (currentPrice && currentPrice > 0) {
      handleBuy(trading.ticker, currentPrice)
    } else {
      alert('실시간 가격을 받아오지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const onSellClick = () => {
    if (currentPrice && currentPrice > 0) {
      handleSell(trading.ticker, currentPrice)
    } else {
      alert('실시간 가격을 받아오지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

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
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{trading.ticker}</CardTitle>
                <span className="text-xs text-muted-foreground">{trading.name}</span>
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
                variant="default"
                onClick={onBuyClick}
                disabled={!currentPrice}
                className="h-7 gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                <ShoppingCart className="h-3 w-3" />
                <span className="text-xs">매수</span>
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={onSellClick}
                disabled={!currentPrice}
                className="h-7 gap-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              >
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">매도</span>
              </Button>
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
          <div className="flex items-center gap-2">
            {/* 로딩 중이면 스피너 표시 (기존 데이터는 유지) */}
            {trendLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            {trend ? (
              <>
                {(['ma20', 'ma50', 'ma100', 'ma200'] as const).map((maKey) => {
                  const style = getTrendStyle(trend[maKey])
                  const Icon = style.icon
                  return (
                    <div key={maKey} className={`flex items-center gap-0.5 ${style.color}`}>
                      <Icon className="h-3 w-3" />
                      <span className="text-[10px]">{maKey.toUpperCase().replace('MA', '')}</span>
                    </div>
                  )
                })}
              </>
            ) : !trendLoading ? (
              <span className="text-xs text-muted-foreground">-</span>
            ) : null}
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

export function MainContent() {
  const { ticker, info } = useStockStore()
  const { tradings, isInTrading } = useTradingStore()
  const { 
    addTradingItem, 
    removeTradingItem, 
    buyStock, 
    sellStock,
    error: tradingError 
  } = useTradingHook()
  const { subscribe, unsubscribe, getRealtimeData } = useRealtimePrice()
  const { requestTrend } = useTrendQueue()

  // 이전 트레이딩 목록 (구독/해제 비교용)
  const prevTradingsRef = useRef<TradingListItem[]>([])
  
  // 종목별 추세 데이터 상태
  const [trendMap, setTrendMap] = useState<Map<string, Trend | null>>(new Map())
  const [trendLoadingMap, setTrendLoadingMap] = useState<Map<string, boolean>>(new Map())
  
  // 종목별 마지막 수신 시간 (추세 조회 트리거용)
  const lastDataTimeRef = useRef<Map<string, number>>(new Map())

  // Dialog 상태 관리
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // 트레이딩 패널 축소 상태
  const [collapsed, setCollapsed] = useState(false)

  /**
   * 트레이딩 목록 변경 시 구독/해제 처리 (예전 방식)
   */
  useEffect(() => {
    const prevTradings = prevTradingsRef.current
    const currentTradings = tradings

    // 새로 추가된 종목 구독
    const added = currentTradings.filter(
      curr => !prevTradings.some(prev => prev.ticker === curr.ticker)
    )
    
    // 제거된 종목 구독 해제
    const removed = prevTradings.filter(
      prev => !currentTradings.some(curr => curr.ticker === prev.ticker)
    )

    // 구독 등록
    added.forEach(async (item) => {
      try {
        console.log(`📡 구독 등록: ${item.ticker} (${item.exchange})`)
        await subscribe(item.ticker, item.exchange)
      } catch (error) {
        console.error(`구독 실패: ${item.ticker}`, error)
      }
    })

    // 구독 해제
    removed.forEach(async (item) => {
      try {
        console.log(`📡 구독 해제: ${item.ticker} (${item.exchange})`)
        await unsubscribe(item.ticker, item.exchange)
      } catch (error) {
        console.error(`구독 해제 실패: ${item.ticker}`, error)
      }
    })

    // 새로 추가된 종목의 추세 즉시 조회
    added.forEach((item) => {
      fetchTrendForTicker(item.ticker, item.exchange)
    })

    prevTradingsRef.current = currentTradings
  }, [tradings, subscribe, unsubscribe])

  /**
   * 특정 종목의 추세 조회 (큐에 추가)
   */
  const fetchTrendForTicker = useCallback(async (ticker: string, exchange: 'NAS' | 'NYS') => {
    setTrendLoadingMap(prev => {
      const newMap = new Map(prev)
      newMap.set(ticker, true)
      return newMap
    })

    try {
      const trend = await requestTrend(ticker, exchange)
      setTrendMap(prev => {
        const newMap = new Map(prev)
        newMap.set(ticker, trend)
        return newMap
      })
    } finally {
      setTrendLoadingMap(prev => {
        const newMap = new Map(prev)
        newMap.set(ticker, false)
        return newMap
      })
    }
  }, [requestTrend])

  /**
   * 실시간 데이터 수신 시 추세 조회 트리거 (1분 간격)
   */
  useEffect(() => {
    const ONE_MINUTE = 60 * 1000
    const now = Date.now()

    tradings.forEach((trading) => {
      const realtimeData = getRealtimeData(trading.ticker)
      if (!realtimeData) return

      const lastTime = lastDataTimeRef.current.get(trading.ticker) || 0
      
      // 1분이 지났으면 추세 조회
      if (now - lastTime >= ONE_MINUTE) {
        lastDataTimeRef.current.set(trading.ticker, now)
        fetchTrendForTicker(trading.ticker, trading.exchange)
      }
    })
  }, [tradings.map(t => getRealtimeData(t.ticker)?.KHMS).join(',')])

  if (!ticker) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">종목을 선택해주세요</p>
      </div>
    )
  }

  const inTrading = isInTrading(ticker)

  // Dialog 열기 헬퍼 함수
  const openDialog = (title: string, description: string, onConfirm: () => void) => {
    setDialogConfig({ title, description, onConfirm })
    setDialogOpen(true)
  }

  // 트레이딩 추가/삭제
  const handleTradingToggle = () => {
    if (inTrading) {
      openDialog(
        '트레이딩 목록에서 제거',
        `${ticker}를 트레이딩 목록에서 제거하시겠습니까?`,
        async () => {
          await removeTradingItem(ticker)
          setDialogOpen(false)
        }
      )
    } else {
      // 거래소 정보 가져오기 (info에서 또는 기본값)
      const exchange: 'NAS' | 'NYS' = info?.basicInfo?.exchange === 'NYSE' ? 'NYS' : 'NAS'
      
      openDialog(
        '트레이딩 목록에 추가',
        `${ticker}를 트레이딩 목록에 추가하시겠습니까?`,
        async () => {
          const result = await addTradingItem(ticker, info?.name || ticker, exchange)
          setDialogOpen(false)
          
          // 중복 체크 실패 시 알림
          if (!result && tradingError) {
            alert(`⚠️ ${tradingError}`)
          }
        }
      )
    }
  }

  // 패널에서 X 버튼 클릭
  const handleRemoveClick = (tradingTicker: string, tradingName: string) => {
    openDialog(
      '트레이딩 목록에서 제거',
      `${tradingName} (${tradingTicker})를 트레이딩 목록에서 제거하시겠습니까?`,
      async () => {
        await removeTradingItem(tradingTicker)
        setDialogOpen(false)
      }
    )
  }

  // 매수 핸들러 (수동)
  const handleBuy = async (tradingTicker: string, price: number) => {
    const result = await buyStock(tradingTicker, price)
    if (result) {
      alert(`✅ 매수 완료!\n티커: ${tradingTicker}\n수량: ${result.buyQuantity}\n가격: $${result.buyPrice.toFixed(2)}`)
    } else {
      alert('❌ 매수 실패. 다시 시도해주세요.')
    }
  }

  // 매도 핸들러 (수동)
  const handleSell = async (tradingTicker: string, price: number) => {
    const result = await sellStock(tradingTicker, price)
    if (result) {
      alert(`✅ 매도 완료!\n티커: ${tradingTicker}\n수량: ${result.sellQuantity}\n가격: $${result.sellPrice?.toFixed(2)}`)
    }
  }

  // 자동 트레이딩 핸들러 (toast 사용)
  const onAutoTrade = async (tradingTicker: string, price: number, type: 'buy' | 'sell') => {
    if (type === 'buy') {
      const result = await buyStock(tradingTicker, price)
      if (result) {
        toast.success(`🤖 자동 매수: ${tradingTicker}`, {
          description: `수량: ${result.buyQuantity} / 가격: $${result.buyPrice.toFixed(2)}`,
          duration: 5000,
        })
      } else {
        toast.error(`자동 매수 실패: ${tradingTicker}`)
      }
    } else {
      const result = await sellStock(tradingTicker, price)
      if (result) {
        toast.success(`🤖 자동 매도: ${tradingTicker}`, {
          description: `수량: ${result.sellQuantity} / 가격: $${result.sellPrice?.toFixed(2)}`,
          duration: 5000,
        })
      } else {
        toast.error(`자동 매도 실패: ${tradingTicker}`)
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상태바: 주식 정보 */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-semibold">{info?.name || ticker}</h2>
            <p className="text-xs text-muted-foreground">{ticker} · {info?.basicInfo?.exchange}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div>
              <span className="font-semibold">${info?.currentPrice}</span>
            </div>
            <div className={info?.changeRate && info.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}>
              <span className="font-medium">{info?.changeRate && info.changeRate > 0 ? '+' : ''}{info?.changeRate?.toFixed(2)}%</span>
            </div>
            <div className="text-muted-foreground">
              <span className="text-xs">시가총액: {info?.marketCap}</span>
            </div>
          </div>
        </div>
        
        {/* 트레이딩 버튼 */}
        <Button
          size="sm"
          variant={inTrading ? "default" : "outline"}
          onClick={handleTradingToggle}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          {inTrading ? '트레이딩 중' : '트레이딩 추가'}
        </Button>
      </div>

      {/* 종목 정보 탭 - flex-1로 남은 공간 차지 */}
      <div className="flex-1 overflow-hidden border-b">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              개요
            </TabsTrigger>
            <TabsTrigger value="chart" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              차트
            </TabsTrigger>
            <TabsTrigger value="valuation" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              평가
            </TabsTrigger>
            <TabsTrigger value="financials" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              재무
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              성과
            </TabsTrigger>
            <TabsTrigger value="technical" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              기술적
            </TabsTrigger>
          </TabsList>

          {/* 차트 탭 - 전체 높이 사용 */}
          <TabsContent value="chart" className="m-0 flex-1">
            <TradingViewWidgetChart 
              symbol={ticker} 
              market={info?.basicInfo?.exchange || "NASDAQ"} 
            />
          </TabsContent>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="m-0 p-4 overflow-auto flex-1">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">종목명:</span> {info?.name}</div>
                    <div><span className="text-muted-foreground">현재가:</span> ${info?.currentPrice}</div>
                    <div><span className="text-muted-foreground">변동률:</span> <span className={info?.changeRate && info.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.changeRate?.toFixed(2)}%</span></div>
                    <div><span className="text-muted-foreground">시가총액:</span> {info?.marketCap}</div>
                    <div><span className="text-muted-foreground">섹터:</span> {info?.basicInfo?.sector}</div>
                    <div><span className="text-muted-foreground">거래소:</span> {info?.basicInfo?.exchange}</div>
                    <div><span className="text-muted-foreground">거래량:</span> {info?.basicInfo?.volume?.toLocaleString()}</div>
                    <div><span className="text-muted-foreground">상대거래량:</span> {info?.basicInfo?.relativeVolume10d?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 평가 탭 */}
          <TabsContent value="valuation" className="m-0 p-4 overflow-auto flex-1">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">밸류에이션</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">P/E (TTM):</span> {info?.valuation?.priceEarningsTTM?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">P/S:</span> {info?.valuation?.priceSalesCurrent?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">P/B:</span> {info?.valuation?.priceBookFQ?.toFixed(2) || 'N/A'}</div>
                    <div><span className="text-muted-foreground">P/FCF:</span> {info?.valuation?.priceFCFTTM?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">EV/Revenue:</span> {info?.valuation?.evToRevenueTTM?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">EV/EBIT:</span> {info?.valuation?.evToEbitTTM?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">EV/EBITDA:</span> {info?.valuation?.evToEbitdaTTM?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">배당</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">배당수익률:</span> {info?.dividend?.yieldCurrent?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">배당성향:</span> {info?.dividend?.payoutRatioTTM?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">연속배당:</span> {info?.dividend?.continuousPayout}년</div>
                    <div><span className="text-muted-foreground">배당성장:</span> {info?.dividend?.continuousGrowth}년</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 재무 탭 */}
          <TabsContent value="financials" className="m-0 p-4 overflow-auto flex-1">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">수익성</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">총마진:</span> {info?.profitability?.grossMarginTTM?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">영업마진:</span> {info?.profitability?.operatingMarginTTM?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">순마진:</span> {info?.profitability?.netMarginTTM?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">FCF마진:</span> {info?.profitability?.fcfMarginTTM?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">ROA:</span> {info?.profitability?.roaFQ?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">ROE:</span> {info?.profitability?.roeFQ?.toFixed(2)}%</div>
                    <div><span className="text-muted-foreground">ROIC:</span> {info?.profitability?.roicFQ?.toFixed(2)}%</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">대차대조표</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">유동비율:</span> {info?.balanceSheet?.currentRatioFQ?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">당좌비율:</span> {info?.balanceSheet?.quickRatioFQ?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">부채비율:</span> {info?.balanceSheet?.debtToEquityFQ?.toFixed(2) || 'N/A'}</div>
                    <div><span className="text-muted-foreground">현금/부채:</span> {info?.balanceSheet?.cashToDebtFQ?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">현금흐름</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">영업CF:</span> ${((info?.cashFlow?.operatingCFTTM || 0) / 1e9).toFixed(2)}B</div>
                    <div><span className="text-muted-foreground">투자CF:</span> ${((info?.cashFlow?.investingCFTTM || 0) / 1e9).toFixed(2)}B</div>
                    <div><span className="text-muted-foreground">재무CF:</span> ${((info?.cashFlow?.financingCFTTM || 0) / 1e9).toFixed(2)}B</div>
                    <div><span className="text-muted-foreground">FCF:</span> ${((info?.cashFlow?.freeCFTTM || 0) / 1e9).toFixed(2)}B</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 성과 탭 */}
          <TabsContent value="performance" className="m-0 p-4 overflow-auto flex-1">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">성과 지표</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">주간:</span> <span className={info?.performance?.perfWeek && info.performance.perfWeek > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perfWeek?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">1개월:</span> <span className={info?.performance?.perf1Month && info.performance.perf1Month > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perf1Month?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">3개월:</span> <span className={info?.performance?.perf3Month && info.performance.perf3Month > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perf3Month?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">6개월:</span> <span className={info?.performance?.perf6Month && info.performance.perf6Month > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perf6Month?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">YTD:</span> <span className={info?.performance?.perfYTD && info.performance.perfYTD > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perfYTD?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">1년:</span> <span className={info?.performance?.perfYear && info.performance.perfYear > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perfYear?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">5년:</span> <span className={info?.performance?.perf5Year && info.performance.perf5Year > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perf5Year?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">10년:</span> <span className={info?.performance?.perf10Year && info.performance.perf10Year > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.performance?.perf10Year?.toFixed(2)}%</span></div>
                  <div><span className="text-muted-foreground">변동성(주):</span> {info?.performance?.volatilityWeek?.toFixed(2)}%</div>
                  <div><span className="text-muted-foreground">변동성(월):</span> {info?.performance?.volatilityMonth?.toFixed(2)}%</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기술적 탭 */}
          <TabsContent value="technical" className="m-0 p-4 overflow-auto flex-1">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">추천 지표</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">전체:</span> {info?.technical?.recommendAll?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">이동평균:</span> {info?.technical?.recommendMA?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">기타:</span> {info?.technical?.recommendOther?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">오실레이터</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">RSI:</span> {info?.technical?.rsi?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">모멘텀:</span> {info?.technical?.momentum?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">AO:</span> {info?.technical?.ao?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">CCI20:</span> {info?.technical?.cci20?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Stoch.K:</span> {info?.technical?.stochK?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">Stoch.D:</span> {info?.technical?.stochD?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">이동평균선</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">SMA20:</span> ${info?.technical?.sma20?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">SMA50:</span> ${info?.technical?.sma50?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">SMA100:</span> ${info?.technical?.sma100?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">SMA200:</span> ${info?.technical?.sma200?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">볼린저 밴드</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-muted-foreground">상단:</span> ${info?.technical?.bbUpper?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">중간:</span> ${info?.technical?.bbBasis?.toFixed(2)}</div>
                    <div><span className="text-muted-foreground">하단:</span> ${info?.technical?.bbLower?.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 하단: 트레이딩 패널 */}
      <div 
        className="overflow-hidden bg-muted/20"
        style={{ 
          height: collapsed ? 'auto' : '720px',
          flexShrink: 0
        }}
      >
        <div className="h-full">
          <div className="flex items-center justify-between p-2 border-b">
            <h3 className="text-sm font-semibold">트레이딩 종목</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed(!collapsed)}
              className="h-6 w-6 p-0"
            >
              {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {!collapsed && (
            <>
              {tradings.length === 0 ? (
                <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
                  트레이딩 종목이 없습니다
                </div>
              ) : (
                <ScrollArea className="h-[calc(100%-2rem)]">
                  {/* 2열 Grid 레이아웃 */}
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {tradings.map((trading) => (
                      <TradingCard 
                        key={trading.ticker}
                        trading={trading}
                        realtimeData={getRealtimeData(trading.ticker)}
                        trend={trendMap.get(trading.ticker) || null}
                        trendLoading={trendLoadingMap.get(trading.ticker) || false}
                        handleBuy={handleBuy}
                        handleSell={handleSell}
                        handleRemoveClick={handleRemoveClick}
                        onAutoTrade={onAutoTrade}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </div>

      {/* 확인 Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={dialogConfig.onConfirm}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
