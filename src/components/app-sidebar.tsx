import * as React from "react"
import { Command, Wallet, Flag } from "lucide-react"

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
import { useBalanceStore } from "@/stores/useBalanceStore"
import { useSP500Store } from "@/stores/useSP500Store"
import { AboutDialog } from "@/components/about-dialog"
import { useTrendHook } from "@/hooks/useTrendHook"
import { TrendAnalysisDialog } from "@/components/trend-analysis-dialog"
import { Badge } from "@/components/ui/badge"
import { useTrendStore } from "@/stores/useTrendStore"
import { useStockHook } from "@/hooks/useStockHook"
import { useStockStore } from "@/stores/useStockStore"

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
  const { setOpen } = useSidebar()
  const { holdings } = useBalanceStore()
  const { sp500 } = useSP500Store()
  const { getTrendByTicker } = useTrendStore()
  const { getInfo, getNews, getToss } = useStockHook()
  const { ticker: selectedTicker, setTicker } = useStockStore()

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }

  // 추세에 따른 Badge variant와 스타일 결정
  const getTrendBadgeStyle = (trendType: string) => {
    const isTransition = trendType.includes('전환')
    
    switch (trendType) {
      case '상승':
      case '상승전환':
        return {
          className: `h-4 px-1 text-[10px] bg-red-500 text-white hover:bg-red-600 ${isTransition ? 'ring-2 ring-red-300' : ''}`,
          variant: 'destructive' as const
        }
      case '하락':
      case '하락전환':
        return {
          className: `h-4 px-1 text-[10px] bg-blue-500 text-white hover:bg-blue-600 ${isTransition ? 'ring-2 ring-blue-300' : ''}`,
          variant: 'default' as const
        }
      case '유지':
      default:
        return {
          className: 'h-4 px-1 text-[10px] bg-gray-400 text-white hover:bg-gray-500',
          variant: 'secondary' as const
        }
    }
  }

  // S&P 500 종목 클릭 핸들러
  const handleStockClick = async (ticker: string, exchange: string) => {
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
  
  // 트렌드 분석 다이얼로그 상태
  const [trendAnalysisOpen, setTrendAnalysisOpen] = React.useState(false)

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
              <SidebarMenuButton 
                size="lg" 
                className="md:h-8 md:p-0 cursor-pointer"
                onClick={() => setAboutOpen(true)}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Potato Invest</span>
                  <span className="truncate text-xs">Desktop</span>
                </div>
              </SidebarMenuButton>
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
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setTrendAnalysisOpen(true)}
              >
                트렌드 분석
              </Button>
            )}
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {activeItem?.title === "보유종목" ? (
                // 보유종목 표시
                holdings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      보유종목이 없습니다
                    </p>
                  </div>
                ) : (
                  holdings.map((holding) => (
                    <a
                      href="#"
                      key={holding.pdno}
                      className="flex flex-col items-start gap-1 whitespace-nowrap border-b p-2 text-xs leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                sp500.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      S&P 500 데이터를 불러오는 중...
                    </p>
                  </div>
                ) : (
                  sp500.map((stock) => {
                    const trend = getTrendByTicker(stock.ticker)
                    
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
                          <span className="ml-auto text-xs text-muted-foreground">{stock.exchange}</span>
                        </div>
                        <div className="flex w-full gap-2">
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma20) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            20
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma50) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            50
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma100) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            100
                          </Badge>
                          <Badge 
                            {...(trend ? getTrendBadgeStyle(trend.ma200) : { className: 'h-4 px-1 text-[10px] bg-gray-400 text-white', variant: 'secondary' as const })}
                          >
                            200
                          </Badge>
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
      
      {/* 트렌드 분석 다이얼로그 */}
      <TrendAnalysisDialog open={trendAnalysisOpen} onOpenChange={setTrendAnalysisOpen} />
    </Sidebar>
  )
}
