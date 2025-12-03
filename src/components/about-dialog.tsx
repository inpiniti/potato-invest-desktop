import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  // 앱 버전 정보 (package.json에서 가져올 수도 있음)
  const appVersion = "1.0.0"
  const electronVersion = typeof process !== 'undefined' && process.versions?.electron || "N/A"
  const chromeVersion = typeof process !== 'undefined' && process.versions?.chrome || "N/A"
  const nodeVersion = typeof process !== 'undefined' && process.versions?.node || "N/A"
  const v8Version = typeof process !== 'undefined' && process.versions?.v8 || "N/A"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Potato Invest Desktop</h2>
              <p className="text-sm text-muted-foreground">퀀트 투자 데스크톱 애플리케이션</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 버전 정보 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">버전</span>
              <span className="font-mono">{appVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Electron</span>
              <span className="font-mono">{electronVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chromium</span>
              <span className="font-mono">{chromeVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Node.js</span>
              <span className="font-mono">{nodeVersion}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">V8</span>
              <span className="font-mono">{v8Version}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">제작자</span>
              <span className="font-semibold">정영균</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">기술 스택</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  React
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  TypeScript
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Electron
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Tailwind CSS
                </span>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Zustand
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 Potato Invest Desktop. All rights reserved.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
