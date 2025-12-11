import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { RightPanel } from "@/components/right-panel"
import { Toaster } from "sonner"
import { useAppInit } from "@/hooks/useAppInit"

import { ErrorBoundary } from '@/components/error-boundary'

export default function App() {
  // 초기화 로직 훅 사용
  useAppInit()

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
        <div className="flex h-screen w-full">
          {/* 좌측: 사이드바 */}
          <AppSidebar />
          
          {/* 중앙: 메인 컨텐츠 */}
          <main className="flex-1 overflow-hidden">
            <MainContent />
          </main>
          
          {/* 우측: 뉴스/커뮤니티 패널 */}
          <aside className="w-80 border-l overflow-hidden">
            <RightPanel />
          </aside>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
