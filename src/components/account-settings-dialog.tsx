import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAccountStore } from "@/stores/useAccountStore"
import type { Account } from "@/types/account"
import { Trash2, Plus, Check, ArrowLeft } from "lucide-react"

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const { accounts, selectedAccount, addAccount, removeAccount, selectAccount, setAccessToken } = useAccountStore()
  
  const [view, setView] = useState<'list' | 'add'>('list')
  const [newAccount, setNewAccount] = useState<Account>({
    cano: '',
    appkey: '',
    appsecret: '',
  })
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleAddAccount = () => {
    if (!newAccount.cano || !newAccount.appkey || !newAccount.appsecret) {
      alert('모든 필드를 입력해주세요')
      return
    }

    addAccount(newAccount)
    
    // 입력 필드 초기화 및 목록으로 돌아가기
    setNewAccount({
      cano: '',
      appkey: '',
      appsecret: '',
    })
    setView('list')
  }

  const handleSelectAccount = async (account: Account) => {
    setIsAuthenticating(true)
    try {
      // 한투 API 인증
      if (window.ipcRenderer?.koreaInvestAuth) {
        const authResult = await window.ipcRenderer.koreaInvestAuth({
          appkey: account.appkey,
          appsecret: account.appsecret,
        })
        
        console.log('한투 인증 성공:', authResult)
        
        // 액세스 토큰 저장
        setAccessToken(authResult.accessToken)
        
        // 계좌 선택
        selectAccount(account.cano)
        
        alert('계좌가 선택되었습니다')
      } else {
        throw new Error('인증 기능을 사용할 수 없습니다')
      }
    } catch (error: any) {
      console.error('계좌 선택 실패:', error)
      alert(`계좌 선택 실패: ${error.message || error}`)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleClose = () => {
    setView('list')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view === 'add' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('list')}
                className="h-6 w-6 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {view === 'list' ? '계좌 설정' : '새 계좌 추가'}
          </DialogTitle>
          <DialogDescription>
            {view === 'list' 
              ? '한국투자증권 계좌를 관리하세요.' 
              : '새로운 계좌 정보를 입력하세요.'}
          </DialogDescription>
        </DialogHeader>

        {view === 'list' ? (
          <div className="space-y-4">
            {/* 계좌 목록 */}
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                등록된 계좌가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.cano}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      selectedAccount?.cano === account.cano
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedAccount?.cano === account.cano && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{account.cano}</p>
                        <p className="text-xs text-muted-foreground">
                          앱키: {account.appkey.substring(0, 10)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedAccount?.cano !== account.cano && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAccount(account)}
                          disabled={isAuthenticating}
                        >
                          {isAuthenticating ? '인증 중...' : '선택'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAccount(account.cano)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 추가 버튼 */}
            <Button onClick={() => setView('add')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              계좌 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 계좌 추가 폼 */}
            <div className="space-y-2">
              <Label htmlFor="cano">종합계좌번호</Label>
              <Input
                id="cano"
                placeholder="12345678-01"
                value={newAccount.cano}
                onChange={(e) => setNewAccount({ ...newAccount, cano: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appkey">앱키</Label>
              <Input
                id="appkey"
                placeholder="앱키를 입력하세요"
                value={newAccount.appkey}
                onChange={(e) => setNewAccount({ ...newAccount, appkey: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appsecret">앱시크릿키</Label>
              <Input
                id="appsecret"
                type="password"
                placeholder="앱시크릿키를 입력하세요"
                value={newAccount.appsecret}
                onChange={(e) => setNewAccount({ ...newAccount, appsecret: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setView('list')} className="flex-1">
                취소
              </Button>
              <Button onClick={handleAddAccount} className="flex-1">
                추가
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
