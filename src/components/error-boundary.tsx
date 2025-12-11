import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCcw } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>오류가 발생했습니다</CardTitle>
              </div>
              <CardDescription>
                애플리케이션 처리 중 예기치 않은 오류가 발생했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted p-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto">
                {this.state.error?.message || '알 수 없는 오류'}
              </div>
              {this.state.errorInfo && (
                <div className="rounded-md bg-muted p-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-40 overflow-auto hidden">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={this.handleReload} className="w-full gap-2">
                <RefreshCcw className="h-4 w-4" />
                애플리케이션 새로고침
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
