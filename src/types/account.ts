// 계좌 정보 타입
export interface Account {
  cano: string // 종합계좌번호
  appkey: string // 앱키
  appsecret: string // 앱시크릿키
  approvalKey?: string // 웹소켓 접근 토큰 (선택적)
}
