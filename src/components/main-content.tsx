import { useState } from 'react'
import { useStockStore } from '@/stores/useStockStore'
import { useTradingStore } from '@/stores/useTradingStore'
import { useTradingHook } from '@/hooks/useTradingHook'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TrendingUp, X, ShoppingCart, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
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
  const { ticker, info } = useStockStore()
  const { tradings, isInTrading } = useTradingStore()
  const { 
    addTradingItem, 
    removeTradingItem, 
    buyStock, 
    sellStock 
  } = useTradingHook()

  // Dialog 상태 관리
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // 트레이딩 패널 축소 상태
  const [collapsed, setCollapsed] = useState(false)

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
      openDialog(
        '트레이딩 목록에 추가',
        `${ticker}를 트레이딩 목록에 추가하시겠습니까?`,
        async () => {
          await addTradingItem(ticker, info?.name || ticker)
          setDialogOpen(false)
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

  // 매수 핸들러
  const handleBuy = async (tradingTicker: string) => {
    const result = await buyStock(tradingTicker)
    if (result) {
      alert(`✅ 매수 완료!\n티커: ${tradingTicker}\n수량: ${result.buyQuantity}\n가격: $${result.buyPrice}`)
    } else {
      alert('❌ 매수 실패. 다시 시도해주세요.')
    }
  }

  // 매도 핸들러
  const handleSell = async (tradingTicker: string) => {
    const result = await sellStock(tradingTicker)
    if (result) {
      alert(`✅ 매도 완료!\n티커: ${tradingTicker}\n수량: ${result.sellQuantity}\n가격: $${result.sellPrice}`)
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
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {tradings.map((trading) => (
                  <Card key={trading.ticker} className="h-40 w-full">
                    <CardHeader className="p-3 flex flex-row items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">{trading.ticker}</CardTitle>
                            <p className="text-xs text-muted-foreground">{trading.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 매수 버튼 */}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleBuy(trading.ticker)}
                              className="h-7 gap-1 bg-red-500 hover:bg-red-600"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              <span className="text-xs">매수</span>
                            </Button>
                            {/* 매도 버튼 */}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSell(trading.ticker)}
                              className="h-7 gap-1 bg-blue-500 hover:bg-blue-600"
                            >
                              <DollarSign className="h-3 w-3" />
                              <span className="text-xs">매도</span>
                            </Button>
                            {/* 삭제 버튼 */}
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
                      <div className="text-xs text-muted-foreground">
                        추가일: {new Date(trading.addedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </CardContent>
                  </Card>
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
