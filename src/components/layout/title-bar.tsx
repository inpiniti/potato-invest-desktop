import { Minus, Square, X, PanelLeft, PanelBottom, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { useUiStore } from '@/stores/useUiStore'

export function TitleBar() {
  const { toggleSidebar } = useSidebar()
  const { toggleBottomPanel, toggleRightPanel, isBottomPanelOpen, isRightPanelOpen } = useUiStore()

  // 윈도우 컨트롤 핸들러
  const handleMinimize = () => window.ipcRenderer?.windowMinimize()
  const handleMaximize = () => window.ipcRenderer?.windowMaximize()
  const handleClose = () => window.ipcRenderer?.windowClose()

  return (
    <div 
      className="flex h-8 w-full items-center justify-between border-b bg-sidebar px-2 select-none app-region-drag z-50 relative"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 왼쪽: 아이콘 및 프로젝트명 */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-4 w-4 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
          P
        </div>
        <span className="text-xs font-medium text-sidebar-foreground">Potato Invest Desktop</span>
      </div>

      {/* 중앙 (비워둠) */}
      <div className="flex-1" />

      {/* 오른쪽: 레이아웃 토글 및 윈도우 컨트롤 */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* 레이아웃 토글 버튼 그룹 */}
        <div className="mr-2 flex items-center gap-1 border-r pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleSidebar}
            title="사이드바 토글"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent ${isBottomPanelOpen ? 'bg-sidebar-accent/50' : ''}`}
            onClick={toggleBottomPanel}
            title="하단 패널(트레이딩) 토글"
          >
            <PanelBottom className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 rounded-sm text-sidebar-foreground hover:bg-sidebar-accent ${isRightPanelOpen ? 'bg-sidebar-accent/50' : ''}`}
            onClick={toggleRightPanel}
            title="우측 패널(뉴스) 토글"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 윈도우 컨트롤 버튼 그룹 */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-10 rounded-none text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-10 rounded-none text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleMaximize}
          >
            <Square className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-10 rounded-none text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
