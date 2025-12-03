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

    app.whenReady().then(createWindow)
}
