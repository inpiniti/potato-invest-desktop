/**
 * 재사용 가능한 게시판 레이아웃 컴포넌트
 * 좌측: 목록 패널, 우측: 상세/작성 패널
 */
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

// 목록 아이템 타입
export interface BoardListItem {
  id: string
  title: string
  subtitle?: string
  badge?: string
  date?: string
}

// 목록 패널 Props
interface ListPanelProps {
  title: string
  items: BoardListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreateClick?: () => void
  showCreateButton?: boolean
  createButtonText?: string
  emptyMessage?: string
  renderBadge?: (item: BoardListItem) => ReactNode
}

// 목록 패널 컴포넌트
export function ListPanel({
  title,
  items,
  selectedId,
  onSelect,
  onCreateClick,
  showCreateButton = false,
  createButtonText = "등록하기",
  emptyMessage = "항목이 없습니다.",
  renderBadge,
}: ListPanelProps) {
  return (
    <div className="w-64 border-r bg-muted/10 flex flex-col">
      {/* 헤더 */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {showCreateButton && onCreateClick && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onCreateClick}
          >
            {createButtonText}
          </Button>
        )}
      </div>

      {/* 목록 */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-1">
          {items.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            items.map((item) => (
              <Button
                key={item.id}
                variant={selectedId === item.id ? "secondary" : "ghost"}
                className={cn(
                  "justify-start h-auto py-3 px-3 w-full text-left flex flex-col items-start gap-1 transition-all",
                  selectedId === item.id
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelect(item.id)}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm line-clamp-1 flex-1",
                      selectedId === item.id ? "text-primary" : ""
                    )}
                  >
                    {item.title}
                  </span>
                  {renderBadge ? (
                    renderBadge(item)
                  ) : item.badge ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted shrink-0">
                      {item.badge}
                    </span>
                  ) : null}
                  {selectedId === item.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                  )}
                </div>
                {item.subtitle && (
                  <span className="text-xs line-clamp-1 w-full opacity-80">
                    {item.subtitle}
                  </span>
                )}
                {item.date && (
                  <span className="text-[10px] text-muted-foreground">
                    {item.date}
                  </span>
                )}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// 상세 패널 Props
interface DetailPanelProps {
  children: ReactNode
  header?: ReactNode
  className?: string
}

// 상세 패널 컴포넌트
export function DetailPanel({ children, header, className }: DetailPanelProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col overflow-hidden bg-background",
        className
      )}
    >
      {header && (
        <div className="p-6 pb-2 border-b bg-background/95 backdrop-blur z-10">
          {header}
        </div>
      )}
      <ScrollArea className="flex-1 p-6">{children}</ScrollArea>
    </div>
  )
}

// 전체 게시판 레이아웃 Props
interface BoardLayoutProps {
  listPanel: ReactNode
  detailPanel: ReactNode
  className?: string
}

// 전체 게시판 레이아웃 컴포넌트
export function BoardLayout({
  listPanel,
  detailPanel,
  className,
}: BoardLayoutProps) {
  return (
    <div className={cn("flex flex-1 overflow-hidden", className)}>
      {listPanel}
      {detailPanel}
    </div>
  )
}
