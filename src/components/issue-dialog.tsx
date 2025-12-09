import { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ListPanel,
  DetailPanel,
  BoardLayout,
} from "@/components/ui/board-layout"
import type { BoardListItem } from "@/components/ui/board-layout"
import { useIssueHook } from "@/hooks/useIssueHook"
import type { IssueType } from "@/types/issue"
import { Loader2, Send, Trash2, Edit, X, Check } from "lucide-react"

interface IssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: IssueType
}

// 타입별 설정
const typeConfig: Record<IssueType, { title: string; label: string; badgeVariant: "destructive" | "default" }> = {
  bug: {
    title: "버그 제보",
    label: "Bug",
    badgeVariant: "destructive",
  },
  feature: {
    title: "기능 제안",
    label: "Feature",
    badgeVariant: "default",
  },
}

export function IssueDialog({ open, onOpenChange, type }: IssueDialogProps) {
  const config = typeConfig[type]

  // 훅에서 상태와 함수 가져오기
  const {
    issues,
    selectedIssue,
    comments,
    loading,
    fetchIssues,
    selectIssue,
    createIssue,
    updateIssue,
    deleteIssue,
    createComment,
    deleteComment,
    clearSelection,
  } = useIssueHook()

  // 로컬 상태
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [commentInput, setCommentInput] = useState("")

  // 다이얼로그 열릴 때 목록 조회
  useEffect(() => {
    if (open) {
      fetchIssues(type)
      setIsCreating(false)
      setIsEditing(false)
      clearSelection()
    }
  }, [open, type, fetchIssues, clearSelection])

  // 이슈 선택 핸들러
  const handleSelectIssue = useCallback((id: string) => {
    const issue = issues.find((i) => i.id === id)
    if (issue) {
      selectIssue(issue)
      setIsCreating(false)
      setIsEditing(false)
    }
  }, [issues, selectIssue])

  // 등록하기 버튼 클릭
  const handleCreateClick = useCallback(() => {
    setIsCreating(true)
    setIsEditing(false)
    setFormTitle("")
    setFormContent("")
    clearSelection()
  }, [clearSelection])

  // 수정 모드 진입
  const handleEditClick = useCallback(() => {
    if (selectedIssue) {
      setFormTitle(selectedIssue.title)
      setFormContent(selectedIssue.content)
      setIsEditing(true)
    }
  }, [selectedIssue])

  // 폼 제출 (등록/수정)
  const handleSubmit = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      alert("제목과 내용을 입력해주세요.")
      return
    }

    if (isEditing && selectedIssue) {
      // 수정
      const updated = await updateIssue(selectedIssue.id, {
        title: formTitle,
        content: formContent,
      })
      if (updated) {
        setIsEditing(false)
      }
    } else {
      // 등록
      const created = await createIssue({
        title: formTitle,
        content: formContent,
        type,
      })
      if (created) {
        setIsCreating(false)
        selectIssue(created)
      }
    }
  }, [formTitle, formContent, isEditing, selectedIssue, updateIssue, createIssue, type, selectIssue])

  // 이슈 삭제
  const handleDelete = useCallback(async () => {
    if (!selectedIssue) return
    if (!confirm("정말 삭제하시겠습니까?")) return
    
    await deleteIssue(selectedIssue.id)
  }, [selectedIssue, deleteIssue])

  // 댓글 등록
  const handleCommentSubmit = useCallback(async () => {
    if (!selectedIssue || !commentInput.trim()) return

    await createComment({
      issueId: selectedIssue.id,
      content: commentInput.trim(),
    })
    setCommentInput("")
  }, [selectedIssue, commentInput, createComment])

  // 댓글 삭제
  const handleCommentDelete = useCallback(async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return
    await deleteComment(commentId)
  }, [deleteComment])

  // 목록 아이템 변환
  const listItems: BoardListItem[] = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    subtitle: issue.authorName,
    badge: issue.status === "open" ? "열림" : "닫힘",
    date: new Date(issue.createdAt).toLocaleDateString("ko-KR"),
  }))

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {config.title}
            <Badge variant={config.badgeVariant} className="text-xs font-normal">
              {config.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <BoardLayout
          listPanel={
            <ListPanel
              title="게시글 목록"
              items={listItems}
              selectedId={selectedIssue?.id || null}
              onSelect={handleSelectIssue}
              showCreateButton={true}
              createButtonText="등록하기"
              onCreateClick={handleCreateClick}
              emptyMessage="아직 게시글이 없습니다."
              renderBadge={(item) => (
                <Badge
                  variant={item.badge === "열림" ? "outline" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {item.badge}
                </Badge>
              )}
            />
          }
          detailPanel={
            <DetailPanel
              header={
                isCreating || isEditing ? (
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold">
                      {isEditing ? "게시글 수정" : "새 게시글 작성"}
                    </h2>
                  </div>
                ) : selectedIssue ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">{selectedIssue.title}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{selectedIssue.authorName}</span>
                        <span>·</span>
                        <span>{formatDate(selectedIssue.createdAt)}</span>
                        <Badge
                          variant={selectedIssue.status === "open" ? "outline" : "secondary"}
                          className="ml-2"
                        >
                          {selectedIssue.status === "open" ? "열림" : "닫힘"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditClick}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={handleDelete}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                ) : null
              }
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : isCreating || isEditing ? (
                // 작성/수정 폼
                <div className="space-y-4 pb-10">
                  <div>
                    <label className="text-sm font-medium mb-2 block">제목</label>
                    <Input
                      placeholder="제목을 입력하세요"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">내용</label>
                    <Textarea
                      placeholder="내용을 입력하세요"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false)
                        setIsEditing(false)
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                    <Button onClick={handleSubmit}>
                      <Check className="w-4 h-4 mr-1" />
                      {isEditing ? "수정 완료" : "등록하기"}
                    </Button>
                  </div>
                </div>
              ) : selectedIssue ? (
                // 상세 보기
                <div className="space-y-6 pb-10">
                  {/* 본문 */}
                  <div className="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap">
                    {selectedIssue.content}
                  </div>

                  <Separator />

                  {/* 댓글 영역 */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4">
                      댓글 ({comments.length})
                    </h3>

                    {/* 댓글 목록 */}
                    <div className="space-y-3 mb-4">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          아직 댓글이 없습니다.
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-3 bg-muted/30 rounded-lg group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {comment.authorName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleCommentDelete(comment.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* 댓글 입력 */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="댓글을 입력하세요..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleCommentSubmit()
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleCommentSubmit}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // 아무것도 선택 안됨
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-sm">
                    게시글을 선택하거나 새로 작성해주세요.
                  </p>
                </div>
              )}
            </DetailPanel>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
