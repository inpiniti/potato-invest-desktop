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
import { useBalanceStore } from "@/stores/useBalanceStore"
import type { Account } from "@/types/account"
import { Trash2, Plus, Check, ArrowLeft } from "lucide-react"

interface AccountSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const { accounts, selectedAccount, addAccount, removeAccount, selectAccount, setAccessToken } = useAccountStore()
  const { balance } = useBalanceStore()
  
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
      if (window.ipcRenderer?.koreaInvestAuth && window.ipcRenderer?.koreaInvestBalance) {
        const authResult = await window.ipcRenderer.koreaInvestAuth({
          appkey: account.appkey,
          appsecret: account.appsecret,
        })
        
        console.log('한투 인증 성공:', authResult)
        
        // 액세스 토큰 저장
        setAccessToken(authResult.accessToken)
        
        // 계좌 선택
        selectAccount(account.cano)
        
        // 잔고 조회
        console.log('잔고 조회 시작...')
        const balanceResult = await window.ipcRenderer.koreaInvestBalance({
          accessToken: authResult.accessToken,
          appkey: account.appkey,
          appsecret: account.appsecret,
          cano: account.cano,
        })
        
        console.log('잔고 조회 성공:', balanceResult)
        
        // useBalanceStore에 저장 (동적 import)
        const { useBalanceStore } = await import('@/stores/useBalanceStore')
        const { setHoldings, setBalance } = useBalanceStore.getState()
        
        setHoldings(balanceResult.holdings)
        setBalance(balanceResult.balance)
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

  // 금액 포맷팅 함수
  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
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
          <div className="flex gap-4 h-[500px]">
            {/* 왼쪽: 계좌 리스트 */}
            <div className="w-1/3 border-r pr-4 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2">
                {accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    등록된 계좌가 없습니다.
                  </p>
                ) : (
                  accounts.map((account) => (
                    <div
                      key={account.cano}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAccount?.cano === account.cano
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => handleSelectAccount(account)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {selectedAccount?.cano === account.cano && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{account.cano}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {account.appkey.substring(0, 10)}...
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeAccount(account.cano)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* 추가 버튼 */}
              <Button onClick={() => setView('add')} className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                계좌 추가
              </Button>
            </div>

            {/* 오른쪽: 잔고 데이터 */}
            <div className="flex-1 overflow-y-auto">
              {isAuthenticating ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">인증 중...</p>
                </div>
              ) : !selectedAccount ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">계좌를 선택해주세요</p>
                </div>
              ) : !balance ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">잔고 데이터를 불러오는 중...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">잔고 정보</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">총자산</p>
                        <p className="text-lg font-semibold">${formatCurrency(balance.tot_asst_amt)}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">평가금액</p>
                        <p className="text-lg font-semibold">${formatCurrency(balance.evlu_amt_smtl)}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">평가손익</p>
                        <p className={`text-lg font-semibold ${parseFloat(balance.evlu_pfls_amt_smtl) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          ${formatCurrency(balance.evlu_pfls_amt_smtl)}
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">수익률</p>
                        <p className={`text-lg font-semibold ${parseFloat(balance.evlu_erng_rt1) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {formatCurrency(balance.evlu_erng_rt1)}%
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">예수금</p>
                        <p className="text-lg font-semibold">${formatCurrency(balance.dncl_amt)}</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">인출가능금액</p>
                        <p className="text-lg font-semibold">${formatCurrency(balance.wdrw_psbl_tot_amt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
