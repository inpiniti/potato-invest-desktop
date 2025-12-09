/**
 * 이슈(버그/기능 제보) 관련 훅
 * Supabase와 연동하여 CRUD 및 댓글 기능 제공
 */
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccountStore } from '@/stores/useAccountStore'
import type {
  Issue,
  IssueRecord,
  IssueComment,
  IssueCommentRecord,
  IssueType,
  CreateIssueInput,
  UpdateIssueInput,
  CreateCommentInput,
} from '@/types/issue'

/**
 * IssueRecord (snake_case) -> Issue (camelCase) 변환
 */
function toIssue(record: IssueRecord): Issue {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    authorId: record.author_id,
    authorName: record.author_name,
    type: record.type,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

/**
 * IssueCommentRecord (snake_case) -> IssueComment (camelCase) 변환
 */
function toComment(record: IssueCommentRecord): IssueComment {
  return {
    id: record.id,
    issueId: record.issue_id,
    content: record.content,
    authorId: record.author_id,
    authorName: record.author_name,
    createdAt: record.created_at,
  }
}

/**
 * 이슈 훅 반환 타입
 */
interface UseIssueHookReturn {
  // 상태
  issues: Issue[]
  selectedIssue: Issue | null
  comments: IssueComment[]
  loading: boolean
  error: string | null

  // 이슈 관련 함수
  fetchIssues: (type: IssueType) => Promise<void>
  selectIssue: (issue: Issue | null) => void
  createIssue: (input: CreateIssueInput) => Promise<Issue | null>
  updateIssue: (id: string, input: UpdateIssueInput) => Promise<Issue | null>
  deleteIssue: (id: string) => Promise<boolean>

  // 댓글 관련 함수
  fetchComments: (issueId: string) => Promise<void>
  createComment: (input: CreateCommentInput) => Promise<IssueComment | null>
  deleteComment: (commentId: string) => Promise<boolean>

  // 상태 초기화
  clearSelection: () => void
}

/**
 * 이슈 관리 훅
 */
export function useIssueHook(): UseIssueHookReturn {
  // 상태
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [comments, setComments] = useState<IssueComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 계정 스토어에서 사용자 정보 가져오기
  const { selectedAccount } = useAccountStore()

  /**
   * 이슈 목록 조회
   * 최신순으로 정렬
   */
  const fetchIssues = useCallback(async (type: IssueType) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('issues')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const issueList = (data as IssueRecord[]).map(toIssue)
      setIssues(issueList)
    } catch (err) {
      console.error('이슈 목록 조회 실패:', err)
      setError(err instanceof Error ? err.message : '이슈 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 이슈 선택 및 해당 이슈의 댓글 조회
   */
  const selectIssue = useCallback(async (issue: Issue | null) => {
    setSelectedIssue(issue)
    if (issue) {
      await fetchComments(issue.id)
    } else {
      setComments([])
    }
  }, [])

  /**
   * 이슈 생성
   */
  const createIssue = useCallback(async (input: CreateIssueInput): Promise<Issue | null> => {
    setLoading(true)
    setError(null)

    try {
      // 작성자 정보 (계좌 이름 또는 기본값)
      const authorName = selectedAccount?.alias || selectedAccount?.cano || '익명'
      const authorId = selectedAccount?.cano || 'anonymous'

      const { data, error: insertError } = await supabase
        .from('issues')
        .insert({
          title: input.title,
          content: input.content,
          type: input.type,
          author_id: authorId,
          author_name: authorName,
          status: 'open',
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newIssue = toIssue(data as IssueRecord)
      
      // 목록 상단에 추가
      setIssues((prev) => [newIssue, ...prev])
      
      return newIssue
    } catch (err) {
      console.error('이슈 생성 실패:', err)
      setError(err instanceof Error ? err.message : '이슈 생성에 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }, [selectedAccount])

  /**
   * 이슈 수정
   */
  const updateIssue = useCallback(async (id: string, input: UpdateIssueInput): Promise<Issue | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('issues')
        .update({
          ...(input.title && { title: input.title }),
          ...(input.content && { content: input.content }),
          ...(input.status && { status: input.status }),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const updatedIssue = toIssue(data as IssueRecord)
      
      // 목록 업데이트
      setIssues((prev) =>
        prev.map((issue) => (issue.id === id ? updatedIssue : issue))
      )
      
      // 선택된 이슈도 업데이트
      if (selectedIssue?.id === id) {
        setSelectedIssue(updatedIssue)
      }

      return updatedIssue
    } catch (err) {
      console.error('이슈 수정 실패:', err)
      setError(err instanceof Error ? err.message : '이슈 수정에 실패했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }, [selectedIssue])

  /**
   * 이슈 삭제
   */
  const deleteIssue = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('issues')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // 목록에서 제거
      setIssues((prev) => prev.filter((issue) => issue.id !== id))
      
      // 선택된 이슈면 선택 해제
      if (selectedIssue?.id === id) {
        setSelectedIssue(null)
        setComments([])
      }

      return true
    } catch (err) {
      console.error('이슈 삭제 실패:', err)
      setError(err instanceof Error ? err.message : '이슈 삭제에 실패했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }, [selectedIssue])

  /**
   * 댓글 목록 조회
   * 오래된 순으로 정렬
   */
  const fetchComments = useCallback(async (issueId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('issue_comments')
        .select('*')
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const commentList = (data as IssueCommentRecord[]).map(toComment)
      setComments(commentList)
    } catch (err) {
      console.error('댓글 조회 실패:', err)
      // 댓글 조회 실패는 치명적이지 않으므로 에러 상태 업데이트 안 함
    }
  }, [])

  /**
   * 댓글 생성
   */
  const createComment = useCallback(async (input: CreateCommentInput): Promise<IssueComment | null> => {
    try {
      // 작성자 정보
      const authorName = selectedAccount?.alias || selectedAccount?.cano || '익명'
      const authorId = selectedAccount?.cano || 'anonymous'

      const { data, error: insertError } = await supabase
        .from('issue_comments')
        .insert({
          issue_id: input.issueId,
          content: input.content,
          author_id: authorId,
          author_name: authorName,
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newComment = toComment(data as IssueCommentRecord)
      
      // 댓글 목록에 추가
      setComments((prev) => [...prev, newComment])

      return newComment
    } catch (err) {
      console.error('댓글 생성 실패:', err)
      setError(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.')
      return null
    }
  }, [selectedAccount])

  /**
   * 댓글 삭제
   */
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('issue_comments')
        .delete()
        .eq('id', commentId)

      if (deleteError) throw deleteError

      // 댓글 목록에서 제거
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))

      return true
    } catch (err) {
      console.error('댓글 삭제 실패:', err)
      setError(err instanceof Error ? err.message : '댓글 삭제에 실패했습니다.')
      return false
    }
  }, [])

  /**
   * 선택 상태 초기화
   */
  const clearSelection = useCallback(() => {
    setSelectedIssue(null)
    setComments([])
  }, [])

  return {
    // 상태
    issues,
    selectedIssue,
    comments,
    loading,
    error,

    // 이슈 관련 함수
    fetchIssues,
    selectIssue,
    createIssue,
    updateIssue,
    deleteIssue,

    // 댓글 관련 함수
    fetchComments,
    createComment,
    deleteComment,

    // 유틸리티
    clearSelection,
  }
}
