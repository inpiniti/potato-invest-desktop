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

    app.whenReady().then(createWindow)
}
