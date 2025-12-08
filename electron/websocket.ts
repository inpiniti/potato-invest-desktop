import WebSocket from 'ws'
import { BrowserWindow } from 'electron'

let realtimeWs: WebSocket | null = null
let approvalKey: string | null = null
const subscribedStocks = new Set<string>()
let mainWindow: BrowserWindow | null = null

/**
 * 메인 윈도우 설정
 */
export function setMainWindow(win: BrowserWindow) {
    mainWindow = win
}

/**
 * Approval Key 설정 및 웹소켓 초기화
 */
export function setApprovalKey(key: string) {
    approvalKey = key
    initializeWebSocket()
}

/**
 * 웹소켓 초기화
 */
function initializeWebSocket() {
    if (!approvalKey) {
        console.error('[WebSocket] approval_key가 없습니다.')
        return
    }

    // 기존 연결이 있으면 종료
    if (realtimeWs) {
        realtimeWs.close()
        realtimeWs = null
    }

    console.log('[WebSocket] 연결 시작...')
    
    realtimeWs = new WebSocket('ws://ops.koreainvestment.com:21000/tryitout/HDFSCNT0')

    realtimeWs.on('open', () => {
        console.log('[WebSocket] 연결 성공')
        
        // 기존 구독 목록 재구독
        subscribedStocks.forEach(trKey => {
            sendSubscription(trKey, '1')
        })
    })

    realtimeWs.on('message', (data: WebSocket.Data) => {
        try {
            const message = data.toString('utf-8')
            const parsed = JSON.parse(message)
            
            console.log('[WebSocket] 수신:', parsed)
            
            // 렌더러 프로세스로 실시간 데이터 전송
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('realtime-price', parsed)
            }
        } catch (error) {
            console.error('[WebSocket] 메시지 파싱 오류:', error)
        }
    })

    realtimeWs.on('error', (error) => {
        console.error('[WebSocket] 오류:', error)
    })

    realtimeWs.on('close', () => {
        console.log('[WebSocket] 연결 종료')
        realtimeWs = null
        
        // 5초 후 재연결 시도
        setTimeout(() => {
            if (approvalKey) {
                console.log('[WebSocket] 재연결 시도...')
                initializeWebSocket()
            }
        }, 5000)
    })
}

/**
 * 웹소켓 구독/해제 전송
 */
function sendSubscription(trKey: string, trType: '1' | '2') {
    if (!realtimeWs || realtimeWs.readyState !== WebSocket.OPEN) {
        console.error('[WebSocket] 연결되지 않음')
        return
    }

    if (!approvalKey) {
        console.error('[WebSocket] approval_key가 없습니다.')
        return
    }

    const message = JSON.stringify({
        header: {
            approval_key: approvalKey,
            custtype: 'P',
            tr_type: trType,
            'content-type': 'utf-8',
        },
        body: {
            input: {
                tr_id: 'HDFSCNT0',
                tr_key: trKey,
            }
        },
    })

    console.log(`[WebSocket] ${trType === '1' ? '구독' : '해제'} 전송:`, trKey)
    console.log('[WebSocket] 메시지:', message)
    realtimeWs.send(message)
}

/**
 * 실시간 시세 구독
 */
export function subscribe(ticker: string, exchange: 'NAS' | 'NYS') {
    // tr_key 생성: D + 시장구분(3자리) + 종목코드
    const marketCode = exchange === 'NAS' ? 'NAS' : 'NYS'
    const trKey = `D${marketCode}${ticker}`
    
    console.log('[Subscribe] 구독 요청:', trKey)
    
    // 구독 목록에 추가
    subscribedStocks.add(trKey)
    
    // 웹소켓으로 구독 전송
    sendSubscription(trKey, '1')
    
    return { success: true, trKey }
}

/**
 * 실시간 시세 구독 취소
 */
export function unsubscribe(ticker: string, exchange: 'NAS' | 'NYS') {
    // tr_key 생성
    const marketCode = exchange === 'NAS' ? 'NAS' : 'NYS'
    const trKey = `D${marketCode}${ticker}`
    
    console.log('[Unsubscribe] 구독 취소 요청:', trKey)
    
    // 구독 목록에서 제거
    subscribedStocks.delete(trKey)
    
    // 웹소켓으로 구독 취소 전송
    sendSubscription(trKey, '2')
    
    return { success: true, trKey }
}

/**
 * 모든 구독 취소
 */
export function unsubscribeAll() {
    subscribedStocks.forEach(trKey => {
        sendSubscription(trKey, '2')
    })
    subscribedStocks.clear()
}
