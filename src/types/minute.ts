// 해외주식 분봉 시세 타입
export interface Minute {
  tymd: string // 현지영업일자
  xymd: string // 현지기준일자
  xhms: string // 현지기준시간
  kymd: string // 한국기준일자
  khms: string // 한국기준시간
  open: string // 시가
  high: string // 고가
  low: string // 저가
  last: string // 종가
  evol: string // 체결량
  eamt: string // 체결대금
}
