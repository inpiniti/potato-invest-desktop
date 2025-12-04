// 게시글 타입
export interface Board {
  author: string      // 작성자
  title: string       // 제목
  content: string     // 내용
  createdAt: string   // 등록일
  thumbnail?: string  // 썸네일 (선택)
}

// 종목 정보 타입
export interface StockInfo {
  ticker: string           // 종목 코드
  name: string            // 종목명
  currentPrice?: number   // 현재가
  changeRate?: number     // 등락률
  marketCap?: string      // 시가총액
  description?: string    // 기업 설명
}
