import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from "lucide-react"
import { useTrendHook } from "@/hooks/useTrendHook"
import { useSP500Store } from "@/stores/useSP500Store"
import { useTrendStore } from "@/stores/useTrendStore"

interface TrendAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrendAnalysisDialog({ open, onOpenChange }: TrendAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [total, setTotal] = React.useState(0)
  const [result, setResult] = React.useState<{ successCount: number; failCount: number } | null>(null)
  
  const { getTrends } = useTrendHook()
  const { sp500 } = useSP500Store()
  const { setTrends } = useTrendStore()

  const handleStart = async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setTotal(sp500.length)
    setResult(null)

    try {
      const { trends, successCount, failCount } = await getTrends(
        sp500,
        (current, total) => {
          setProgress(current)
          setTotal(total)
        }
      )

      // 스토어에 저장
      setTrends(trends)
      
      // 결과 표시
      setResult({ successCount, failCount })
    } catch (error) {
      console.error('트렌드 분석 오류:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClose = () => {
    if (!isAnalyzing) {
      onOpenChange(false)
      // 다이얼로그 닫을 때 상태 초기화
      setTimeout(() => {
        setProgress(0)
        setTotal(0)
        setResult(null)
      }, 300)
    }
  }

  const progressPercent = total > 0 ? (progress / total) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>트렌드 분석</DialogTitle>
          <DialogDescription>
            S&P 500 전체 종목의 이동평균 추세를 분석합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isAnalyzing && !result && (
            <div className="text-sm text-muted-foreground">
              총 {sp500.length}개 종목을 분석합니다.
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">분석 중...</span>
                <span className="text-muted-foreground">
                  {progress} / {total}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {progressPercent.toFixed(1)}%
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">성공</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {result.successCount}개 종목 분석 완료
                </AlertDescription>
              </Alert>

              {result.failCount > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-200">실패</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {result.failCount}개 종목 분석 실패
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isAnalyzing && !result && (
            <>
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button onClick={handleStart}>
                시작
              </Button>
            </>
          )}

          {result && (
            <Button onClick={handleClose}>
              확인
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
