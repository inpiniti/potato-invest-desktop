import * as React from "react"
import { Command, Wallet, Flag, Bug, Lightbulb, FileText, Info, ListChecks } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBalanceStore } from "@/stores/useBalanceStore"
import { useSP500Store } from "@/stores/useSP500Store"
import { AboutDialog } from "@/components/about-dialog"
import { PatchNotesDialog } from "@/components/patch-notes-dialog"
import { IssueDialog } from "@/components/issue-dialog"
import { TrendAnalysisDialog } from "@/components/trend-analysis-dialog"
import { Badge } from "@/components/ui/badge"
import { useTrendStore } from "@/stores/useTrendStore"
import { useStockHook } from "@/hooks/useStockHook"
import { useStockStore } from "@/stores/useStockStore"
import { useTradingStore } from "@/stores/useTradingStore"
import { useTradingViewStore } from "@/stores/useTradingViewStore"
import { calculateBBSignal, type BBSignal } from "@/types/tradingview"

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "보유종목",
      url: "#",
      icon: Wallet,
      isActive: true,
    },
    {
      title: "S&P 500",
      url: "#",
      icon: Flag,
      isActive: false,
    },
  ],
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser:
        "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser:
        "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
    {
      name: "Bob Johnson",
      email: "bobjohnson@example.com",
      subject: "Weekend Plans",
      date: "2 days ago",
      teaser:
        "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
    },
    {
      name: "Emily Davis",
      email: "emilydavis@example.com",
      subject: "Re: Question about Budget",
      date: "2 days ago",
      teaser:
        "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
    },
    {
      name: "Michael Wilson",
      email: "michaelwilson@example.com",
      subject: "Important Announcement",
      date: "1 week ago",
      teaser:
        "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
    },
    {
      name: "Sarah Brown",
      email: "sarahbrown@example.com",
      subject: "Re: Feedback on Proposal",
      date: "1 week ago",
      teaser:
        "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
    },
    {
      name: "David Lee",
      email: "davidlee@example.com",
      subject: "New Project Idea",
      date: "1 week ago",
      teaser:
        "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
    },
    {
      name: "Olivia Wilson",
      email: "oliviawilson@example.com",
      subject: "Vacation Plans",
      date: "1 week ago",
      teaser:
        "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
    },
    {
      name: "James Martin",
      email: "jamesmartin@example.com",
      subject: "Re: Conference Registration",
      date: "1 week ago",
      teaser:
        "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
    },
    {
      name: "Sophia White",
      email: "sophiawhite@example.com",
      subject: "Team Dinner",
      date: "1 week ago",
      teaser:
        "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const [mails, setMails] = React.useState(data.mails)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [recommendedOnly, setRecommendedOnly] = React.useState(false)
  const [sortByMarketCap, setSortByMarketCap] = React.useState(false)
  const { setOpen } = useSidebar()
  const { holdings } = useBalanceStore()
  const { sp500 } = useSP500Store()
  const { getTrendByTicker } = useTrendStore()
  const { getInfo, getNews, getToss } = useStockHook()
  const { ticker: selectedTicker, setTicker } = useStockStore()
  const { isInTrading } = useTradingStore()
  const { getBBData } = useTradingViewStore()

  // 검색어로 필터된 목록
  const filteredSP500 = React.useMemo(() => {
    let result = sp500

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(stock => 
        stock.ticker.toLowerCase().includes(query) ||
        stock.name?.toLowerCase().includes(query)
      )
    }

    // 추천 필터 (4개 MA 모두 상승세: 기울기 3 이상)
    if (recommendedOnly) {
      result = result.filter(stock => {
        const trend = getTrendByTicker(stock.ticker)
        if (!trend) return false
        
        // 상승세 조건: 기울기 3 이상
        const isUpTrend = (m: import('@/types/trend').TrendMetric) => m.slope >= 3
        return isUpTrend(trend.ma20) && isUpTrend(trend.ma50) && isUpTrend(trend.ma100) && isUpTrend(trend.ma200)
      })
    }

    // 시총 정렬
    if (sortByMarketCap) {
      result = [...result].sort((a, b) => {
        const aMarketCap = getBBData(a.ticker)?.marketCap ?? 0
        const bMarketCap = getBBData(b.ticker)?.marketCap ?? 0
        return bMarketCap - aMarketCap // 내림차순 (큰 것부터)
      })
    }

    return result
  }, [sp500, searchQuery, recommendedOnly, sortByMarketCap, getTrendByTicker, getBBData])

  const filteredHoldings = React.useMemo(() => {
    if (!searchQuery.trim()) return holdings
    const query = searchQuery.toLowerCase()
    return holdings.filter(holding => 
      holding.pdno.toLowerCase().includes(query) ||
      holding.prdt_name?.toLowerCase().includes(query)
    )
  }, [holdings, searchQuery])

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }

  // 추세에 따른 Badge variant와 스타일 결정 (일별: 기울기 기준)
  const getTrendBadgeStyle = (metric: import('@/types/trend').TrendMetric) => {
    const { slope } = metric
    
    // 1. 빨강 (Red): 기울기 3, 4
    if (slope >= 3) {
      return {
        className: 'h-4 px-1 text-[10px] bg-red-500 text-white hover:bg-red-600',
        variant: 'destructive' as const
      }
    }
    
    // 2. 파랑 (Blue): 기울기 0, 1
    if (slope <= 1) {
      return {
        className: 'h-4 px-1 text-[10px] bg-blue-500 text-white hover:bg-blue-600',
        variant: 'default' as const
      }
    }
    
    // 3. 회색 (Gray): 기울기 2
    return {
      className: 'h-4 px-1 text-[10px] bg-gray-400 text-white hover:bg-gray-500',
      variant: 'secondary' as const
    }
  }

  // 볼린저 밴드 신호에 따른 Badge 스타일 결정
  const getBBSignalBadgeStyle = (signal: BBSignal) => {
    switch (signal) {
      case '강력매수':
        return {
          className: 'h-4 px-1 text-[10px] bg-red-600 text-white font-bold',
          label: '강력매수'
        }
      case '매수':
        return {
          className: 'h-4 px-1 text-[10px] bg-red-400 text-white',
          label: '매수'
        }
      case '매도':
        return {
          className: 'h-4 px-1 text-[10px] bg-blue-400 text-white',
          label: '매도'
        }
      case '강력매도':
        return {
          className: 'h-4 px-1 text-[10px] bg-blue-600 text-white font-bold',
          label: '강력매도'
        }
      default:
        return {
          className: 'h-4 px-1 text-[10px] bg-gray-400 text-white',
          label: '-'
        }
    }
  }

  // 시가총액 포맷 (억 단위)
  const formatMarketCap = (marketCap: number | null): string => {
    if (marketCap === null) return '-'
    
    // 단위: 십억 달러
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`
    }
    return `$${marketCap.toLocaleString()}`
  }

  // S&P 500 종목 클릭 핸들러
  const handleStockClick = async (ticker: string, _exchange: string) => {
    try {
      console.log(`${ticker} 종목 선택 및 크롤링 시작...`)
      
      // 1. ticker 설정
      setTicker(ticker)
      
      // 2. 모든 크롤링 병렬 실행
      const [infoResult, newsResult, tossResult] = await Promise.allSettled([
        getInfo(ticker),
        getNews(ticker),
        getToss(ticker),
      ])
      
      // 결과 로깅
      console.log(`${ticker} 크롤링 완료:`)
      console.log('  - 종목 정보:', infoResult.status === 'fulfilled' ? '성공' : '실패')
      console.log('  - 뉴스:', newsResult.status === 'fulfilled' ? `${(newsResult.value || []).length}개` : '실패')
      console.log('  - 토스:', tossResult.status === 'fulfilled' ? `${(tossResult.value || []).length}개` : '실패')
      
    } catch (error) {
      console.error(`${ticker} 크롤링 실패:`, error)
    }
  }

  // About 다이얼로그 상태
  const [aboutOpen, setAboutOpen] = React.useState(false)

  // 패치 노트 다이얼로그 상태
  const [patchNotesOpen, setPatchNotesOpen] = React.useState(false)
  
  // 트렌드 분석 다이얼로그 상태
  const [trendAnalysisOpen, setTrendAnalysisOpen] = React.useState(false)

  // 버그 제보 다이얼로그 상태
  const [bugReportOpen, setBugReportOpen] = React.useState(false)
  
  // 기능 제안 다이얼로그 상태
  const [featureRequestOpen, setFeatureRequestOpen] = React.useState(false)

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg" 
                    className="md:h-8 md:p-0 cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Potato Invest</span>
                      <span className="truncate text-xs">Desktop</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start" side="right">
                  <DropdownMenuItem onClick={() => setAboutOpen(true)}>
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBugReportOpen(true)}>
                    <Bug className="mr-2 h-4 w-4" />
                    <span>버그 제보</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFeatureRequestOpen(true)}>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    <span>기능 제안</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPatchNotesOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>패치노트</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        const mail = data.mails.sort(() => Math.random() - 0.5)
                        setMails(
                          mail.slice(
                            0,
                            Math.max(5, Math.floor(Math.random() * 10) + 1)
                          )
                        )
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem?.title}
            </div>
            {activeItem?.title === "S&P 500" && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={recommendedOnly ? "default" : "outline"}
                  className={`h-7 text-xs ${recommendedOnly ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  onClick={() => setRecommendedOnly(!recommendedOnly)}
                >
                  추천
                </Button>
                <Button 
                  size="sm" 
                  variant={sortByMarketCap ? "default" : "outline"}
                  className={`h-7 text-xs ${sortByMarketCap ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  onClick={() => setSortByMarketCap(!sortByMarketCap)}
                >
                  시총
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setTrendAnalysisOpen(true)}
                >
                  트렌드 분석
                </Button>
              </div>
            )}
          </div>
          <SidebarInput 
            placeholder="종목코드 또는 이름 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem?.title === "보유종목" ? (
                // 보유종목 표시
                filteredHoldings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? '검색 결과가 없습니다' : '보유종목이 없습니다'}
                    </p>
                  </div>
                ) : (
                  filteredHoldings.map((holding) => (
                    <a
                      href="#"
                      key={holding.pdno}
                      className={`flex flex-col items-start gap-1 whitespace-nowrap border-b p-2 text-xs leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        selectedTicker === holding.pdno ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        // 보유종목은 해외주식이므로 거래소 정보 추정 (기본 NAS)
                        handleStockClick(holding.pdno, 'NAS')
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="text-sm font-medium">{holding.prdt_name}</span>
                        <span className={`ml-auto text-sm font-semibold ${parseFloat(holding.evlu_pfls_rt1) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {formatCurrency(holding.evlu_pfls_rt1)}%
                        </span>
                      </div>
                      <div className="flex w-full gap-3 text-xs text-muted-foreground">
                        <span>수량: {holding.cblc_qty13}</span>
                        <span>평단: ${formatCurrency(holding.avg_unpr3)}</span>
                        <span>평가: ${formatCurrency(holding.frcr_evlu_amt2)}</span>
                      </div>
                    </a>
                  ))
                )
              ) : activeItem?.title === "S&P 500" ? (
                // S&P 500 종목 표시
                filteredSP500.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? '검색 결과가 없습니다' : 'S&P 500 데이터를 불러오는 중...'}
                    </p>
                  </div>
                ) : (
                  filteredSP500.map((stock) => {
                    const trend = getTrendByTicker(stock.ticker)
                    const bbData = getBBData(stock.ticker)
                    const bbSignal = bbData ? calculateBBSignal(bbData) : null
                    const bbStyle = getBBSignalBadgeStyle(bbSignal)
                    
                    return (
                      <a
                        href="#"
                        key={stock.ticker}
                        className={`flex flex-col items-start gap-1 whitespace-nowrap border-b p-2 text-xs leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                          selectedTicker === stock.ticker ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          handleStockClick(stock.ticker, stock.exchange)
                        }}
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className="text-sm font-medium">{stock.ticker}</span>
                          {isInTrading(stock.ticker) && (
                            <ListChecks className="h-3.5 w-3.5 text-green-500" />
                          )}
                          {/* 시가총액 */}
                          <span className="text-[10px] text-muted-foreground">
                            {formatMarketCap(bbData?.marketCap ?? null)}
                          </span>
                          {/* 볼린저 밴드 신호 */}
                          <Badge className={bbStyle.className}>
                            {bbStyle.label}
                          </Badge>
                          <span className="ml-auto text-xs text-muted-foreground">{stock.exchange}</span>
                        </div>
                        <div className="flex w-full gap-2">
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma20) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            {trend ? `20 (${trend.ma20.slope},${trend.ma20.accel})` : '20'}
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma50) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            {trend ? `50 (${trend.ma50.slope},${trend.ma50.accel})` : '50'}
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma100) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            {trend ? `100 (${trend.ma100.slope},${trend.ma100.accel})` : '100'}
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma200) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            {trend ? `200 (${trend.ma200.slope},${trend.ma200.accel})` : '200'}
                          </Badge>
                          {/* 종가 표시 */}
                          {bbData?.close && (
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              ${bbData.close.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </a>
                    )
                  })
                )
              ) : (
                // S&P 500 또는 다른 메뉴 (기존 mails)
                mails.map((mail) => (
                  <a
                    href="#"
                    key={mail.email}
                    className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span>{mail.name}</span>{" "}
                      <span className="ml-auto text-xs">{mail.date}</span>
                    </div>
                    <span className="font-medium">{mail.subject}</span>
                    <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
                      {mail.teaser}
                    </span>
                  </a>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* About 다이얼로그 */}
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

      {/* 패치노트 다이얼로그 */}
      <PatchNotesDialog open={patchNotesOpen} onOpenChange={setPatchNotesOpen} />
      
      {/* 트렌드 분석 다이얼로그 */}
      <TrendAnalysisDialog open={trendAnalysisOpen} onOpenChange={setTrendAnalysisOpen} />
      
      {/* 버그 제보 다이얼로그 */}
      <IssueDialog open={bugReportOpen} onOpenChange={setBugReportOpen} type="bug" />
      
      {/* 기능 제안 다이얼로그 */}
      <IssueDialog open={featureRequestOpen} onOpenChange={setFeatureRequestOpen} type="feature" />
    </Sidebar>
  )
}
