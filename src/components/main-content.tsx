import { useStockStore } from '@/stores/useStockStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MainContent() {
  const { ticker, info, news, toss } = useStockStore()

  if (!ticker) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">종목을 선택해주세요</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상단: 종목 정보 탭 */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              개요
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

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="m-0 p-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">종목명:</span> {info?.name}</div>
                      <div><span className="text-muted-foreground">현재가:</span> ${info?.currentPrice}</div>
                      <div><span className="text-muted-foreground">변동률:</span> <span className={info?.changeRate && info.changeRate > 0 ? 'text-red-400' : 'text-blue-400'}>{info?.changeRate}%</span></div>
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

            <TabsContent value="valuation" className="m-0 p-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">밸류에이션</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">P/E (TTM):</span> {info?.valuation?.priceEarningsTTM?.toFixed(2)}</div>
                      <div><span className="text-muted-foreground">P/S:</span> {info?.valuation?.priceSalesCurrent?.toFixed(2)}</div>
                      <div><span className="text-muted-foreground">P/B:</span> {info?.valuation?.priceBookFQ?.toFixed(2)}</div>
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

            <TabsContent value="financials" className="m-0 p-4">
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
                      <div><span className="text-muted-foreground">부채비율:</span> {info?.balanceSheet?.debtToEquityFQ?.toFixed(2)}</div>
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
                      <div><span className="text-muted-foreground">영업CF:</span> ${(info?.cashFlow?.operatingCFTTM / 1e9)?.toFixed(2)}B</div>
                      <div><span className="text-muted-foreground">투자CF:</span> ${(info?.cashFlow?.investingCFTTM / 1e9)?.toFixed(2)}B</div>
                      <div><span className="text-muted-foreground">재무CF:</span> ${(info?.cashFlow?.financingCFTTM / 1e9)?.toFixed(2)}B</div>
                      <div><span className="text-muted-foreground">FCF:</span> ${(info?.cashFlow?.freeCFTTM / 1e9)?.toFixed(2)}B</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="m-0 p-4">
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

            <TabsContent value="technical" className="m-0 p-4">
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
          </ScrollArea>
        </Tabs>
      </div>

      {/* 하단: 터미널 패널 (나중에 사용) */}
      <div className="h-32 border-t bg-muted/30">
        <div className="p-2 text-xs text-muted-foreground">
          터미널 (개발 예정)
        </div>
      </div>
    </div>
  )
}
