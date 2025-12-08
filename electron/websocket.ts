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
        if (realtimeWs.readyState === WebSocket.OPEN || realtimeWs.readyState === WebSocket.CONNECTING) {
            console.log('[WebSocket] 기존 연결 종료 중...')
            realtimeWs.close()
        }
        realtimeWs = null
    }

    console.log('[WebSocket] 연결 시작...')
    
    // 연결 시도 전 잠시 대기 (서버측 연결 종료 처리 시간 확보)
    setTimeout(() => {
        realtimeWs = new WebSocket('ws://ops.koreainvestment.com:21000/tryitout/HDFSCNT0')
        setupWebSocketHandlers()
    }, 1000)
}

function setupWebSocketHandlers() {
    if (!realtimeWs) return
    
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
            
            // 1. JSON 포맷인 경우 (구독 응답 등)
            if (message.startsWith('{')) {
                const parsed = JSON.parse(message)
                
                // 구독 성공 메시지인 경우 로그만 출력하고 종료
                if (parsed.body?.msg1?.includes('SUBSCRIBE SUCCESS')) {
                    console.log(`[WebSocket] 구독 성공: ${parsed.header?.tr_key}`)
                    return
                }
                
                // 그 외 JSON 메시지 (에러 등)
                console.log('[WebSocket] 시스템 메시지:', parsed)
                return
            }

            // 2. 텍스트 포맷인 경우 (실시간 데이터)
            // 형식: 0(암호화)|1(TR_ID)|2(데이터건수)|3(데이터)
            // 예: 0|HDFSCNT0|001|...데이터...
            const parts = message.split('|')
            if (parts.length < 4) return

            const trId = parts[1]
            const rawData = parts[3]

            if (trId === 'HDFSCNT0') { // 해외주식 실시간 체결가
                const rows = rawData.split('^')
                
                // 데이터 필드 매핑 (총 26개 필드)
                const realtimeData = {
                    RSYM: rows[0],  // 실시간종목코드 (D+시장+종목)
                    SYMB: rows[1],  // 종목코드
                    ZDIV: rows[2],  // 소수점자리수
                    TYMD: rows[3],  // 현지영업일자
                    XYMD: rows[4],  // 현지일자
                    XHMS: rows[5],  // 현지시간
                    KYMD: rows[6],  // 한국일자
                    KHMS: rows[7],  // 한국시간
                    OPEN: rows[8],  // 시가
                    HIGH: rows[9],  // 고가
                    LOW: rows[10],  // 저가
                    LAST: rows[11], // 현재가
                    SIGN: rows[12], // 대비구분
                    DIFF: rows[13], // 전일대비
                    RATE: rows[14], // 등락율
                    PBID: rows[15], // 매수호가
                    PASK: rows[16], // 매도호가
                    VBID: rows[17], // 매수잔량
                    VASK: rows[18], // 매도잔량
                    EVOL: rows[19], // 체결량
                    TVOL: rows[20], // 거래량
                    TAMT: rows[21], // 거래대금
                    BIVL: rows[22], // 매도체결량
                    ASVL: rows[23], // 매수체결량
                    STRN: rows[24], // 체결강도
                    MTYP: rows[25], // 시장구분
                }

                console.log(`[WebSocket] 시세 수신: ${realtimeData.SYMB} $${realtimeData.LAST}`)
                
                // 렌더러 프로세스로 실시간 데이터 전송
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('realtime-price', realtimeData)
                }
            }
        } catch (error) {
            console.error('[WebSocket] 메시지 처리 오류:', error)
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
