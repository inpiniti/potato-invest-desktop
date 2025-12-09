/**
 * 이슈 타입 (버그 또는 기능 제보)
 */
export type IssueType = 'bug' | 'feature'

/**
 * 이슈 상태 (열림 또는 닫힘)
 */
export type IssueStatus = 'open' | 'closed'

/**
 * 이슈 (게시글) 타입
 */
export interface Issue {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  type: IssueType
  status: IssueStatus
  createdAt: string
  updatedAt: string
}

/**
 * Supabase issues 테이블 레코드 타입 (snake_case)
 */
export interface IssueRecord {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  type: IssueType
  status: IssueStatus
  created_at: string
  updated_at: string
}

/**
 * 이슈 생성 시 필요한 데이터
 */
export interface CreateIssueInput {
  title: string
  content: string
  type: IssueType
}

/**
 * 이슈 수정 시 필요한 데이터
 */
export interface UpdateIssueInput {
  title?: string
  content?: string
  status?: IssueStatus
}

/**
 * 댓글 타입
 */
export interface IssueComment {
  id: string
  issueId: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

/**
 * Supabase issue_comments 테이블 레코드 타입 (snake_case)
 */
export interface IssueCommentRecord {
  id: string
  issue_id: string
  content: string
  author_id: string
  author_name: string
  created_at: string
}

/**
 * 댓글 생성 시 필요한 데이터
 */
export interface CreateCommentInput {
  issueId: string
  content: string
}
