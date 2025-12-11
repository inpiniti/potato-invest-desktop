import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { RightPanel } from "@/components/right-panel"
import { Toaster } from "sonner"
import { useAppInit } from "@/hooks/useAppInit"

import { ErrorBoundary } from '@/components/error-boundary'

import { useUiStore } from "@/stores/useUiStore"
import { TitleBar } from "@/components/layout/title-bar"

export default function App() {
  // 초기화 로직 훅 사용
  useAppInit()
  const { isRightPanelOpen } = useUiStore()

  return (
    <ErrorBoundary>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "350px",
          } as React.CSSProperties
        }
      >
        <Toaster position="top-right" richColors />
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
          {/* 상단: 커스텀 타이틀바 */}
          <TitleBar />

          {/* 메인 영역 (사이드바 + 컨텐츠 + 우측패널) */}
          <div className="flex flex-1 overflow-hidden">
            {/* 좌측: 사이드바 */}
            <AppSidebar />
            
            {/* 중앙: 메인 컨텐츠 */}
            <main className="flex-1 overflow-hidden">
              <MainContent />
            </main>
            
            {/* 우측: 뉴스/커뮤니티 패널 */}
            {isRightPanelOpen && (
              <aside className="w-80 border-l overflow-hidden">
                <RightPanel />
              </aside>
            )}
          </div>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
