// 계좌 정보 타입
export interface Account {
  cano: string // 종합계좌번호
  appkey: string // 앱키
  appsecret: string // 앱시크릿키
  alias?: string // 계좌 별명 (선택)
}
