import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useStockStore } from '@/stores/useStockStore'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTradingViewStore } from '@/stores/useTradingViewStore'
import { useUiStore } from '@/stores/useUiStore'
import { toast } from 'sonner'
import { TradingCard } from '@/components/trading/TradingCard'
import { useTradingHook } from '@/hooks/useTradingHook'
import { useStockHook } from '@/hooks/useStockHook'
import useRealtimePrice from '@/hooks/useRealtimePrice'
import { useTrendQueue } from '@/hooks/useTrendQueue'
import type { RealtimePrice } from '@/types/realtime'
import type { Trend } from '@/types/trend'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TrendingUp, X } from 'lucide-react'
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

export function MainContent() {
  const { ticker, info, setTicker } = useStockStore()
  const { tradings, isInTrading } = useTradingStore()
  const { 
    addTradingItem, 
    removeTradingItem, 
    buyStock, 
    sellStock,
    error: tradingError 
  } = useTradingHook()
  const { getInfo, getNews, getToss } = useStockHook()
  const { isBottomPanelOpen, toggleBottomPanel } = useUiStore()
  
  // 볼린저 밴드 데이터 가져오기
  const { getBBData } = useTradingViewStore()
  
  // tradings를 {ticker, exchange} 배열로 변환하여 실시간 시세 구독
  const symbols = useMemo(() => 
    tradings.map(t => ({ ticker: t.ticker, exchange: t.exchange })),
    [tradings]
  )
  const { data: realtimePriceData } = useRealtimePrice(symbols)
  
  // 특정 종목의 실시간 데이터 가져오기 헬퍼 함수
  const getRealtimeData = useCallback((tickerName: string) => {
    return realtimePriceData[tickerName] as unknown as RealtimePrice | undefined
  }, [realtimePriceData])
  
  // 종목 선택 핸들러 (트레이딩 카드에서 클릭 시 상세 조회)
  const handleSelectStock = useCallback(async (selectedTicker: string, _exchange: 'NAS' | 'NYS') => {
    try {
      console.log(`${selectedTicker} 종목 선택 및 크롤링 시작...`)
      
      // 1. ticker 설정
      setTicker(selectedTicker)
      
      // 2. 모든 크롤링 병렬 실행
      const [infoResult, newsResult, tossResult] = await Promise.allSettled([
        getInfo(selectedTicker),
        getNews(selectedTicker),
        getToss(selectedTicker),
      ])
      
      // 결과 로깅
      console.log(`${selectedTicker} 크롤링 완료:`)
      console.log('  - 종목 정보:', infoResult.status === 'fulfilled' ? '성공' : '실패')
      console.log('  - 뉴스:', newsResult.status === 'fulfilled' ? `${(newsResult.value || []).length}개` : '실패')
      console.log('  - 토스:', tossResult.status === 'fulfilled' ? `${(tossResult.value || []).length}개` : '실패')
      
    } catch (error) {
      console.error(`${selectedTicker} 크롤링 실패:`, error)
    }
  }, [setTicker, getInfo, getNews, getToss])
  
  const { requestTrend } = useTrendQueue()

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

  // 이전 트레이딩 티커 목록 추적 (추세 조회 트리거용)
  const prevTickersRef = useRef<Set<string>>(new Set())

  /**
   * 트레이딩 목록 변경 시 새로 추가된 종목의 추세 조회
   * 구독/해제는 useRealtimePrice Hook 내부에서 자동 처리됨
   */
  useEffect(() => {
    const currentTickers = new Set(tradings.map(t => t.ticker))
    const prevTickers = prevTickersRef.current
    
    // 새로 추가된 종목의 추세 즉시 조회
    tradings.forEach((item) => {
      if (!prevTickers.has(item.ticker)) {
        fetchTrendForTicker(item.ticker, item.exchange)
      }
    })
    
    prevTickersRef.current = currentTickers
  }, [tradings])

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
      {isBottomPanelOpen && (
        <div 
          className="overflow-hidden bg-muted/20 border-t"
          style={{ 
            height: '450px',
            flexShrink: 0
          }}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-2 border-b bg-muted/40 px-4">
              <h3 className="text-xs font-semibold flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                트레이딩 패널
              </h3>
              <div className="flex items-center gap-1">
                 <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleBottomPanel}
                  className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title="패널 닫기"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
                {tradings.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground flex-col gap-2">
                    <p>트레이딩 중인 종목이 없습니다</p>
                    <Button variant="outline" size="sm" onClick={handleTradingToggle}>
                      현재 종목 추가하기
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {tradings.map((trading) => (
                        <TradingCard 
                          key={trading.ticker}
                          trading={trading}
                          realtimeData={getRealtimeData(trading.ticker)}
                          trend={trendMap.get(trading.ticker) || null}
                          trendLoading={trendLoadingMap.get(trading.ticker) || false}
                          bbData={getBBData(trading.ticker)}
                          handleRemoveClick={handleRemoveClick}
                          onAutoTrade={onAutoTrade}
                          onSelectStock={handleSelectStock}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
            </div>
          </div>
        </div>
      )}

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
