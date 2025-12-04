import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    console.log('Preload path:', path.join(__dirname, 'preload.js'))
    
    win = new BrowserWindow({
        title: 'Potato Invest Desktop',
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        autoHideMenuBar: true, // 메뉴바 숨김
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Preload 스크립트가 작동하도록 설정
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST || '', 'index.html'))
    }
    
    // 창을 최대화 상태로 시작
    win.maximize()
}

// 딥링크 프로토콜 등록
try {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('potato-invest', process.execPath, [path.resolve(process.argv[1])])
        }
    } else {
        app.setAsDefaultProtocolClient('potato-invest')
    }
} catch (error) {
    console.error('딥링크 프로토콜 등록 실패:', error)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (_event, commandLine) => {
        // 누군가 두 번째 인스턴스를 실행하려고 했을 때 (예: 딥링크 클릭)
        if (win) {
            if (win.isMinimized()) win.restore()
            win.focus()
            
            // 딥링크 URL 찾기 (Windows)
            const url = commandLine.find(arg => arg.startsWith('potato-invest://'))
            if (url) {
                win.webContents.send('deep-link', url)
            }
        }
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
            win = null
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    // macOS 딥링크 처리
    app.on('open-url', (event, url) => {
        event.preventDefault()
        if (win) {
            win.webContents.send('deep-link', url)
        }
    })

    // 외부 링크 열기 핸들러
    ipcMain.handle('open-external', async (_, url) => {
        await shell.openExternal(url)
    })

    // OAuth 로그인 핸들러
    ipcMain.handle('oauth-login', async (_, loginUrl) => {
        return new Promise((resolve, reject) => {
            let isResolved = false // 이미 resolve/reject 되었는지 추적
            
            const authWindow = new BrowserWindow({
                width: 500,
                height: 800, // 높이 증가 (700 → 800)
                show: false,
                autoHideMenuBar: true, // 메뉴바 숨김
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            })

            authWindow.loadURL(loginUrl)
            authWindow.show()

            // URL 변경 감지
            authWindow.webContents.on('will-redirect', (event, url) => {
                handleCallback(url)
            })

            authWindow.webContents.on('did-navigate', (event, url) => {
                handleCallback(url)
            })

            function handleCallback(url: string) {
                if (isResolved) return // 이미 처리됨
                
                // potato-invest:// 또는 localhost로 리다이렉트되면 토큰 추출
                if (url.includes('potato-invest://') || url.includes('#access_token=')) {
                    isResolved = true
                    authWindow.close()
                    
                    // URL에서 해시 파라미터 추출
                    const hashIndex = url.indexOf('#')
                    if (hashIndex !== -1) {
                        const hash = url.substring(hashIndex + 1)
                        const params = new URLSearchParams(hash)
                        
                        const accessToken = params.get('access_token')
                        const refreshToken = params.get('refresh_token')
                        
                        if (accessToken && refreshToken) {
                            resolve({ accessToken, refreshToken })
                        } else {
                            reject(new Error('토큰을 찾을 수 없습니다'))
                        }
                    } else {
                        reject(new Error('잘못된 리다이렉트 URL'))
                    }
                }
            }

            authWindow.on('closed', () => {
                if (!isResolved) {
                    isResolved = true
                    // 사용자가 직접 닫은 경우 조용히 종료 (에러 없이 null 반환)
                    resolve(null as any)
                }
            })
        })
    })

    // 한국투자증권 API 인증 핸들러
    ipcMain.handle('korea-invest-auth', async (_, { appkey, appsecret }) => {
        try {
            const response = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    appkey,
                    appsecret,
                }),
            })

            if (!response.ok) {
                throw new Error(`인증 실패: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            
            return {
                accessToken: data.access_token,
                tokenType: data.token_type,
                expiresIn: data.expires_in,
                tokenExpired: data.access_token_token_expired,
            }
        } catch (error: any) {
            console.error('한투 API 인증 에러:', error)
            throw error
        }
    })

    // 한국투자증권 잔고 조회 핸들러
    ipcMain.handle('korea-invest-balance', async (_, { accessToken, appkey, appsecret, cano, acntPrdtCd }) => {
        try {
            // 계좌번호 앞 8자리와 뒤 2자리 분리
            const CANO = cano.substring(0, 8)
            const ACNT_PRDT_CD = acntPrdtCd || cano.substring(9, 11) || '01'
            
            const url = new URL('https://openapi.koreainvestment.com:9443/uapi/overseas-stock/v1/trading/inquire-balance')
            url.searchParams.append('CANO', CANO)
            url.searchParams.append('ACNT_PRDT_CD', ACNT_PRDT_CD)
            url.searchParams.append('WCRC_FRCR_DVSN_CD', '02')
            url.searchParams.append('NATN_CD', '000')
            url.searchParams.append('TR_MKET_CD', '00')
            url.searchParams.append('INQR_DVSN_CD', '00')

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'authorization': `Bearer ${accessToken}`,
                    'appkey': appkey,
                    'appsecret': appsecret,
                    'tr_id': 'CTRP6504R',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`잔고 조회 실패: ${response.status} ${response.statusText} - ${errorText}`)
            }

            const data = await response.json()
            
            return {
                holdings: data.output1 || [],
                balance: data.output3 || null,
            }
        } catch (error: any) {
            console.error('한투 잔고 조회 에러:', error)
            throw error
        }
    })

    // S&P 500 종목 리스트 크롤링 핸들러
    ipcMain.handle('sp500-fetch', async () => {
        try {
            const cheerio = await import('cheerio')
            
            // Wikipedia S&P 500 페이지에서 데이터 가져오기
            const response = await fetch(
                'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies',
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`Failed to fetch S&P 500 data: ${response.status}`)
            }

            const html = await response.text()
            const $ = cheerio.load(html)
            const stocks: Array<{ ticker: string; name: string; exchange: string }> = []

            // 첫 번째 테이블 찾기
            const table = $('#constituents').first()

            // 테이블의 각 행 순회
            table.find('tbody tr').each((_, row) => {
                const cells = $(row).find('td')

                if (cells.length >= 2) {
                    const ticker = $(cells[0]).text().trim()
                    const name = $(cells[1]).text().trim()

                    // 거래소 정보 추정
                    const nasdaqSymbols = [
                        'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA',
                        'AVGO', 'COST', 'CSCO', 'ADBE', 'PEP', 'NFLX', 'CMCSA', 'INTC',
                        'AMD', 'QCOM', 'INTU', 'AMGN', 'AMAT', 'ISRG', 'BKNG', 'ADP',
                        'GILD', 'MDLZ', 'VRTX', 'REGN', 'LRCX', 'PANW', 'KLAC', 'SNPS',
                        'CDNS', 'MRVL', 'ASML', 'ORLY', 'CTAS', 'ABNB', 'WDAY', 'MNST',
                        'PCAR', 'PAYX', 'MCHP', 'FAST', 'ODFL', 'DXCM', 'ROST', 'VRSK',
                        'IDXX', 'BIIB', 'CTSH', 'ANSS', 'DLTR', 'CPRT', 'CSGP', 'TEAM',
                        'TTWO', 'ZS', 'DDOG', 'CRWD', 'FTNT', 'CHTR', 'NXPI', 'MRNA'
                    ]
                    const exchange = nasdaqSymbols.includes(ticker) ? 'NASDAQ' : 'NYSE'

                    if (ticker && name) {
                        stocks.push({ ticker, name, exchange })
                    }
                }
            })

            console.log(`S&P 500 크롤링 완료: ${stocks.length}개 종목`)
            return stocks
        } catch (error: any) {
            console.error('S&P 500 크롤링 에러:', error)
            throw error
        }
    })

    // 한국투자증권 해외주식 기간별시세 핸들러 (총 300개 데이터 조회)
    ipcMain.handle('korea-invest-daily', async (_, { accessToken, appkey, appsecret, ticker, exchange }) => {
        try {
            const allData: any[] = []
            let bymd = '' // 첫 조회는 오늘 날짜 (공백)
            const targetCount = 300 // Target data count
            const maxIterations = 3 // Max 3 API calls

            console.log(`[Daily] ${ticker} - Start (target: ${targetCount})`)

            for (let i = 0; i < maxIterations; i++) {
                const url = new URL('https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/dailyprice')
                url.searchParams.append('AUTH', '')
                url.searchParams.append('EXCD', exchange) // NAS: 나스닥, NYS: 뉴욕
                url.searchParams.append('SYMB', ticker)
                url.searchParams.append('GUBN', '0')
                url.searchParams.append('BYMD', bymd)
                url.searchParams.append('MODP', '0')

                console.log(`  ${i + 1}. Call (BYMD: ${bymd || 'today'})`)

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'authorization': `Bearer ${accessToken}`,
                        'appkey': appkey,
                        'appsecret': appsecret,
                        'tr_id': 'HHDFS76240000',
                    },
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`일별 시세 조회 실패: ${response.status} ${response.statusText} - ${errorText}`)
                }

                const data = await response.json()
                const output2 = data.output2 || []

                if (output2.length === 0) {
                    console.log(`  ${i + 1}번째 조회 결과: 데이터 없음 (조회 종료)`)
                    break
                }

                console.log(`  ${i + 1}번째 조회 결과: ${output2.length}개 (누적: ${allData.length + output2.length}개)`)

                // 데이터 추가
                allData.push(...output2)

                // 목표 개수에 도달하면 종료
                if (allData.length >= targetCount) {
                    console.log(`  목표 개수 도달 (${allData.length}개)`)
                    break
                }

                // 다음 조회를 위한 BYMD 설정 (마지막 데이터의 날짜 - 1일)
                const lastDate = output2[output2.length - 1].xymd
                if (lastDate) {
                    // YYYYMMDD 형식의 날짜를 Date 객체로 변환
                    const year = parseInt(lastDate.substring(0, 4))
                    const month = parseInt(lastDate.substring(4, 6)) - 1 // 월은 0부터 시작
                    const day = parseInt(lastDate.substring(6, 8))
                    const date = new Date(year, month, day)
                    
                    // 하루 빼기
                    date.setDate(date.getDate() - 1)
                    
                    // YYYYMMDD 형식으로 변환
                    bymd = date.getFullYear().toString() + 
                           (date.getMonth() + 1).toString().padStart(2, '0') + 
                           date.getDate().toString().padStart(2, '0')
                    
                    console.log(`  Next BYMD: ${bymd}`)
                } else {
                    console.log(`  No more data`)
                    break
                }

                // API 호출 간격 (Rate Limit 방지)
                await new Promise(resolve => setTimeout(resolve, 200))
            }

            console.log(`[Daily] ${ticker} - Complete: ${allData.length} items`)
            return allData
        } catch (error: any) {
            console.error('[Daily] Error:', error)
            throw error
        }
    })

    // 한국투자증권 해외주식 분봉 조회 핸들러 (총 240개 데이터 조회)
    ipcMain.handle('korea-invest-minutes', async (_, { accessToken, appkey, appsecret, ticker, exchange }) => {
        try {
            const allData: any[] = []
            let keyb = '' // 첫 조회는 공백
            const targetCount = 240 // 목표 데이터 개수
            const maxIterations = 2 // 최대 2번 호출

            console.log(`[Minutes] ${ticker} - Start (target: ${targetCount})`)

            for (let i = 0; i < maxIterations; i++) {
                const url = new URL('https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/inquire-time-itemchartprice')
                url.searchParams.append('AUTH', '')
                url.searchParams.append('EXCD', exchange) // NAS: 나스닥, NYS: 뉴욕
                url.searchParams.append('SYMB', ticker)
                url.searchParams.append('NMIN', '1')
                url.searchParams.append('PINC', '1')
                url.searchParams.append('NEXT', i === 0 ? '' : '1') // 첫 조회는 '', 이후는 '1'
                url.searchParams.append('NREC', '120')
                url.searchParams.append('FILL', '')
                url.searchParams.append('KEYB', keyb)

                console.log(`  ${i + 1}. Call (NEXT: ${i === 0 ? 'latest' : 'next'}, KEYB: ${keyb || 'latest'})`)

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'authorization': `Bearer ${accessToken}`,
                        'appkey': appkey,
                        'appsecret': appsecret,
                        'tr_id': 'HHDFS76950200',
                    },
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`분봉 조회 실패: ${response.status} ${response.statusText} - ${errorText}`)
                }

                const data = await response.json()
                const output2 = data.output2 || []

                if (output2.length === 0) {
                    console.log(`  ${i + 1}번째 조회 결과: 데이터 없음 (조회 종료)`)
                    break
                }

                console.log(`  ${i + 1}번째 조회 결과: ${output2.length}개 (누적: ${allData.length + output2.length}개)`)

                // 데이터 추가
                allData.push(...output2)

                // 목표 개수에 도달하면 종료
                if (allData.length >= targetCount) {
                    console.log(`  목표 개수 도달 (${allData.length}개)`)
                    break
                }

                // 다음 조회를 위한 KEYB 설정 (마지막 데이터의 1분 전)
                const lastData = output2[output2.length - 1]
                if (lastData && lastData.xymd && lastData.xhms) {
                    // YYYYMMDD + HHMMSS 형식으로 조합
                    const dateTime = lastData.xymd + lastData.xhms
                    
                    // Date 객체로 변환
                    const year = parseInt(dateTime.substring(0, 4))
                    const month = parseInt(dateTime.substring(4, 6)) - 1
                    const day = parseInt(dateTime.substring(6, 8))
                    const hour = parseInt(dateTime.substring(8, 10))
                    const minute = parseInt(dateTime.substring(10, 12))
                    const second = parseInt(dateTime.substring(12, 14))
                    
                    const date = new Date(year, month, day, hour, minute, second)
                    
                    // 1분 빼기
                    date.setMinutes(date.getMinutes() - 1)
                    
                    // YYYYMMDDHHMMSS 형식으로 변환
                    keyb = date.getFullYear().toString() +
                           (date.getMonth() + 1).toString().padStart(2, '0') +
                           date.getDate().toString().padStart(2, '0') +
                           date.getHours().toString().padStart(2, '0') +
                           date.getMinutes().toString().padStart(2, '0') +
                           date.getSeconds().toString().padStart(2, '0')
                    
                    console.log(`  Next KEYB: ${keyb}`)
                } else {
                    console.log(`  No time info (stop)`)
                    break
                }

                // API 호출 간격 (Rate Limit 방지)
                await new Promise(resolve => setTimeout(resolve, 200))
            }

            console.log(`[Minutes] ${ticker} - Complete: ${allData.length} items`)
            return allData
        } catch (error: any) {
            console.error('[Minutes] Error:', error)
            throw error
        }
    })

    // Toss community crawling handler
    ipcMain.handle('toss-crawl', async (_, { ticker }) => {
        try {
            const BASE_URL = 'https://wts-cert-api.tossinvest.com/api'
            
            console.log(`[Toss] Crawling ${ticker}...`)
            
            // Step 1: Get productCode
            const screenerResponse = await fetch(`${BASE_URL}/v3/search-all/wts-auto-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: ticker,
                    sections: [
                        { type: 'SCREENER' },
                        { type: 'NEWS' },
                        { type: 'PRODUCT', option: { addIntegratedSearchResult: true } },
                        { type: 'TICS' },
                    ],
                }),
            })

            if (!screenerResponse.ok) {
                throw new Error(`Screener API error: ${screenerResponse.status}`)
            }

            const screenerData = await screenerResponse.json()
            
            // Extract productCode
            let productCode: string | undefined
            if (Array.isArray(screenerData?.result)) {
                for (const section of screenerData.result) {
                    if (section?.type === 'PRODUCT' && section?.data?.items?.length) {
                        productCode = section.data.items[0]?.productCode
                        if (productCode) break
                    }
                }
            }

            if (!productCode) {
                console.log(`[Toss] Product code not found for ${ticker}`)
                return { productCode: null, comments: [] }
            }
            
            console.log(`[Toss] Found productCode: ${productCode}`)

            // Step 2: Get community comments
            const communityResponse = await fetch(`${BASE_URL}/v3/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: productCode,
                    subjectType: 'STOCK',
                    commentSortType: 'RECENT',
                }),
            })

            if (!communityResponse.ok) {
                throw new Error(`Community API error: ${communityResponse.status}`)
            }

            const communityData = await communityResponse.json()
            
            // Extract comments (handle different response structures)
            let comments: any[] = []
            if (Array.isArray(communityData?.result?.comments?.body)) {
                comments = communityData.result.comments.body
            } else if (Array.isArray(communityData?.result?.comments)) {
                comments = communityData.result.comments
            } else if (Array.isArray(communityData?.comments?.body)) {
                comments = communityData.comments.body
            } else if (Array.isArray(communityData?.comments)) {
                comments = communityData.comments
            }

            // Convert to Board format
            const tossComments = comments.map((comment: any) => ({
                author: comment.author?.nickname || 'Anonymous',
                title: comment.title || '',
                content: comment.message || '',
                createdAt: comment.updatedAt || new Date().toISOString(),
                readCount: parseInt(comment.readCount) || 0,
                likeCount: parseInt(comment.likeCount) || 0,
                badge: comment.author?.badge?.badge || '',
                profilePictureUrl: comment.author?.profilePictureUrl || '',
            }))
            
            console.log(`[Toss] Found ${tossComments.length} comments for ${ticker}`)
            return {
                productCode,
                comments: tossComments,
            }
        } catch (error: any) {
            console.error('[Toss] Crawling error:', error.message)
            return { productCode: null, comments: [] }
        }
    })

    // Stock info crawling handler (TradingView Scanner API)
    ipcMain.handle('tradingview-crawl', async (_, { ticker }) => {
        try {
            console.log(`[TradingView] Crawling ${ticker}...`)
            
            // TradingView Scanner API with exact matching
            const url = 'https://scanner.tradingview.com/america/scan'
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    columns: [
                        // 기본 정보
                        'name',
                        'description',
                        'logoid',
                        'type',
                        'close',
                        'change',
                        'volume',
                        'relative_volume_10d_calc',
                        'gap',
                        'volume_change',
                        'sector.tr',
                        'exchange',
                        'currency',
                        
                        // 시가총액 및 평가
                        'market_cap_basic',
                        'Perf.1Y.MarketCap',
                        'price_earnings_ttm',
                        'price_earnings_growth_ttm',
                        'price_sales_current',
                        'price_book_fq',
                        'price_free_cash_flow_ttm',
                        'enterprise_value_to_revenue_ttm',
                        'enterprise_value_to_ebit_ttm',
                        'enterprise_value_ebitda_ttm',
                        
                        // 배당
                        'dividends_yield_current',
                        'dividend_payout_ratio_ttm',
                        'continuous_dividend_payout',
                        'continuous_dividend_growth',
                        
                        // 수익성
                        'gross_margin_ttm',
                        'operating_margin_ttm',
                        'pre_tax_margin_ttm',
                        'net_margin_ttm',
                        'free_cash_flow_margin_ttm',
                        'return_on_assets_fq',
                        'return_on_equity_fq',
                        'return_on_invested_capital_fq',
                        'sell_gen_admin_exp_other_ratio_ttm',
                        
                        // 손익계산
                        'total_revenue_yoy_growth_ttm',
                        'earnings_per_share_diluted_ttm',
                        'earnings_per_share_diluted_yoy_growth_ttm',
                        
                        // 대차대조표
                        'current_ratio_fq',
                        'quick_ratio_fq',
                        'debt_to_equity_fq',
                        'cash_n_short_term_invest_to_total_debt_fq',
                        
                        // 현금흐름
                        'cash_f_operating_activities_ttm',
                        'cash_f_investing_activities_ttm',
                        'cash_f_financing_activities_ttm',
                        'free_cash_flow_ttm',
                        'capital_expenditures_ttm',
                        
                        // 성과 지표
                        'Perf.W',
                        'Perf.1M',
                        'Perf.3M',
                        'Perf.6M',
                        'Perf.YTD',
                        'Perf.Y',
                        'Perf.5Y',
                        'Perf.10Y',
                        'Perf.All',
                        'Volatility.W',
                        'Volatility.M',
                        
                        // 기술적 지표
                        'Recommend.All',
                        'Recommend.MA',
                        'Recommend.Other',
                        'RSI',
                        'Mom',
                        'AO',
                        'CCI20',
                        'Stoch.K',
                        'Stoch.D',
                        'BB.upper',
                        'BB.basis',
                        'BB.lower',
                        'SMA20',
                        'SMA50',
                        'SMA100',
                        'SMA200',
                        
                        // 추가 지표
                        'recommendation_mark',
                        'price_target_1y_delta',
                    ],
                    filter: [
                        {
                            left: 'name',
                            operation: 'equal',
                            right: ticker,
                        },
                    ],
                    range: [0, 10],
                }),
            })
            
            if (!response.ok) {
                throw new Error(`TradingView API error: ${response.status}`)
            }
            
            const data = await response.json()
            
            if (!data.data || data.data.length === 0) {
                throw new Error('No data found')
            }
            
            const item = data.data[0]
            const d = item.d
            
            // 모든 컬럼을 순서대로 파싱
            let idx = 0
            
            // 기본 정보 (0-12)
            const basicInfo = {
                name: d[idx++],
                description: d[idx++],
                logoid: d[idx++],
                type: d[idx++],
                close: d[idx++],
                change: d[idx++],
                volume: d[idx++],
                relativeVolume10d: d[idx++],
                gap: d[idx++],
                volumeChange: d[idx++],
                sector: d[idx++],
                exchange: d[idx++],
                currency: d[idx++],
            }
            
            // 시가총액 및 평가 (13-22)
            const valuation = {
                marketCap: d[idx++],
                perf1YMarketCap: d[idx++],
                priceEarningsTTM: d[idx++],
                priceEarningsGrowthTTM: d[idx++],
                priceSalesCurrent: d[idx++],
                priceBookFQ: d[idx++],
                priceFCFTTM: d[idx++],
                evToRevenueTTM: d[idx++],
                evToEbitTTM: d[idx++],
                evToEbitdaTTM: d[idx++],
            }
            
            // 배당 (23-26)
            const dividend = {
                yieldCurrent: d[idx++],
                payoutRatioTTM: d[idx++],
                continuousPayout: d[idx++],
                continuousGrowth: d[idx++],
            }
            
            // 수익성 (27-35)
            const profitability = {
                grossMarginTTM: d[idx++],
                operatingMarginTTM: d[idx++],
                preTaxMarginTTM: d[idx++],
                netMarginTTM: d[idx++],
                fcfMarginTTM: d[idx++],
                roaFQ: d[idx++],
                roeFQ: d[idx++],
                roicFQ: d[idx++],
                sgaExpenseRatioTTM: d[idx++],
            }
            
            // 손익계산 (36-38)
            const incomeStatement = {
                revenueGrowthTTM: d[idx++],
                epsDilutedTTM: d[idx++],
                epsGrowthTTM: d[idx++],
            }
            
            // 대차대조표 (39-42)
            const balanceSheet = {
                currentRatioFQ: d[idx++],
                quickRatioFQ: d[idx++],
                debtToEquityFQ: d[idx++],
                cashToDebtFQ: d[idx++],
            }
            
            // 현금흐름 (43-47)
            const cashFlow = {
                operatingCFTTM: d[idx++],
                investingCFTTM: d[idx++],
                financingCFTTM: d[idx++],
                freeCFTTM: d[idx++],
                capexTTM: d[idx++],
            }
            
            // 성과 지표 (48-58)
            const performance = {
                perfWeek: d[idx++],
                perf1Month: d[idx++],
                perf3Month: d[idx++],
                perf6Month: d[idx++],
                perfYTD: d[idx++],
                perfYear: d[idx++],
                perf5Year: d[idx++],
                perf10Year: d[idx++],
                perfAll: d[idx++],
                volatilityWeek: d[idx++],
                volatilityMonth: d[idx++],
            }
            
            // 기술적 지표 (59-76)
            const technical = {
                recommendAll: d[idx++],
                recommendMA: d[idx++],
                recommendOther: d[idx++],
                rsi: d[idx++],
                momentum: d[idx++],
                ao: d[idx++],
                cci20: d[idx++],
                stochK: d[idx++],
                stochD: d[idx++],
                bbUpper: d[idx++],
                bbBasis: d[idx++],
                bbLower: d[idx++],
                sma20: d[idx++],
                sma50: d[idx++],
                sma100: d[idx++],
                sma200: d[idx++],
            }
            
            // 추가 지표 (77-78)
            const additional = {
                recommendationMark: d[idx++],
                priceTarget1YDelta: d[idx++],
            }
            
            const stockInfo = {
                ticker,
                name: basicInfo.description || basicInfo.name || ticker,
                currentPrice: basicInfo.close,
                changeRate: basicInfo.change,
                marketCap: valuation.marketCap ? `$${(valuation.marketCap / 1e9).toFixed(2)}B` : undefined,
                description: `Sector: ${basicInfo.sector || 'N/A'} | P/E: ${valuation.priceEarningsTTM || 'N/A'} | Dividend: ${dividend.yieldCurrent || 0}%`,
                
                // 전체 구조화된 데이터
                basicInfo,
                valuation,
                dividend,
                profitability,
                incomeStatement,
                balanceSheet,
                cashFlow,
                performance,
                technical,
                additional,
            }
            
            console.log(`[TradingView] Found info for ${ticker}: ${stockInfo.name} ($${stockInfo.currentPrice})`)
            return stockInfo
        } catch (error: any) {
            console.error('[TradingView] Crawling error:', error.message)
            return null
        }
    })

    // News crawling handler (Toss API - Working!)
    ipcMain.handle('news-crawl', async (_, { ticker }) => {
        try {
            console.log(`[Toss News] Crawling ${ticker}...`)
            
            // Toss API provides news in search results
            const BASE_URL = 'https://wts-cert-api.tossinvest.com/api'
            const url = `${BASE_URL}/v3/search-all/wts-auto-complete`
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: ticker,
                    sections: [
                        { type: 'NEWS' },
                    ],
                }),
            })
            
            if (!response.ok) {
                throw new Error(`Toss News API error: ${response.status}`)
            }
            
            const data = await response.json()
            const newsSection = data.result?.find((s: any) => s.type === 'NEWS')
            const newsItems = newsSection?.data?.items || []
            
            const newsArticles = newsItems.map((article: any) => ({
                author: article.source || 'Unknown',
                title: article.title || '',
                content: article.summary || '',
                createdAt: article.createdAt || new Date().toISOString(),
                thumbnail: article.imageUrls?.[0],
            }))
            
            console.log(`[Toss News] Found ${newsArticles.length} articles for ${ticker}`)
            return newsArticles
        } catch (error: any) {
            console.error('[Toss News] Crawling error:', error.message)
            return []
        }
    })

    app.whenReady().then(createWindow)
}
