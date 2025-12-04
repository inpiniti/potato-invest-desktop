// 해외주식 일별 시세 타입
export interface Daily {
  xymd: string // 일자(YYYYMMDD)
  clos: string // 종가
  sign: string // 대비기호
  diff: string // 대비
  rate: string // 등락율
  open: string // 시가
  high: string // 고가
  low: string // 저가
  tvol: string // 거래량
  tamt: string // 거래대금
  pbid: string // 매수호가
  vbid: string // 매수호가잔량
  pask: string // 매도호가
  vask: string // 매도호가잔량
}
