export {}

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void
      off: (channel: string, ...args: any[]) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      openExternal: (url: string) => Promise<void>
      oauthLogin: (loginUrl: string) => Promise<{ accessToken: string; refreshToken: string }>
      koreaInvestAuth: (credentials: { appkey: string; appsecret: string }) => Promise<{
        accessToken: string
        tokenType: string
        expiresIn: number
        tokenExpired: string
      }>
      koreaInvestApproval: (credentials: { appkey: string; appsecret: string }) => Promise<{
        approvalKey: string
      }>
      koreaInvestBalance: (params: {
        accessToken: string
        appkey: string
        appsecret: string
        cano: string
        acntPrdtCd?: string
      }) => Promise<{
        holdings: any[]
        balance: any
      }>
      koreaInvestDaily: (params: {
        accessToken: string
        appkey: string
        appsecret: string
        ticker: string
        exchange: 'NAS' | 'NYS'
      }) => Promise<any[]>
      koreaInvestMinutes: (params: {
        accessToken: string
        appkey: string
        appsecret: string
        ticker: string
        exchange: 'NAS' | 'NYS'
      }) => Promise<any[]>
      sp500Fetch: () => Promise<Array<{
        ticker: string
        name: string
        exchange: string
      }>>
      
      // Crawling API
      tossCrawl: (ticker: string) => Promise<{
        productCode: string
        comments: Array<{
          author: string
          title: string
          content: string
          createdAt: string
          thumbnail?: string
        }>
      }>
      tradingViewCrawl: (ticker: string) => Promise<{
        ticker: string
        name: string
        currentPrice?: number
        changeRate?: number
        marketCap?: string
        description?: string
      } | null>

      newsCrawl: (ticker: string) => Promise<any[]>
      
      // TradingView List API (볼린저 밴드 + 시가총액)
      tradingViewList: (tickers: string[]) => Promise<Array<{
        ticker: string
        close: number | null
        bbUpper: number | null
        bbBasis: number | null
        bbLower: number | null
        marketCap: number | null
      }>>
    }
  }
}
