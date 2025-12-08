/**
 * 한국투자증권 웹소켓 실시간 시세 데이터
 */
export interface RealtimePrice {
  RSYM: string // 실시간종목코드
  SYMB: string // 종목코드
  ZDIV: string // 소수점자리수
  TYMD: string // 현지영업일자
  XYMD: string // 현지일자
  XHMS: string // 현지시간
  KYMD: string // 한국일자
  KHMS: string // 한국시간
  OPEN: string // 시가
  HIGH: string // 고가
  LOW: string // 저가
  LAST: string // 현재가
  SIGN: string // 대비구분
  DIFF: string // 전일대비
  RATE: string // 등락율
  PBID: string // 매수호가
  PASK: string // 매도호가
  VBID: string // 매수잔량
  VASK: string // 매도잔량
  EVOL: string // 체결량
  TVOL: string // 거래량
  TAMT: string // 거래대금
  BIVL: string // 매도체결량
  ASVL: string // 매수체결량
  STRN: string // 체결강도
  MTYP: string // 시장구분 1:장중,2:장전,3:장후
}

/**
 * 웹소켓 구독 정보
 */
export interface SubscriptionInfo {
  ticker: string
  exchange: 'NAS' | 'NYS'
  trKey: string // D+시장구분+종목코드 (예: DNASAAPL)
}
