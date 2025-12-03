import {
  BadgeCheck,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSettingStore } from "@/stores/useSettingStore"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { isLoggedIn, email, thumbnailUrl, name } = useAuthStore()
  const { darkMode, toggleDarkMode } = useSettingStore()
  
  const handleLogin = async () => {
    console.log('로그인 버튼 클릭됨')
    try {
      console.log('Supabase 로그인 시도...')
      
      // 개발 환경 vs 운영 환경 구분
      const isDev = window.location.protocol === 'http:'
      const redirectTo = isDev 
        ? window.location.origin 
        : 'potato-invest://login-callback'
      
      console.log('Redirect URL:', redirectTo)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // 자동 리다이렉트 비활성화
        }
      })
      
      if (error) {
        console.error('Supabase 로그인 에러:', error)
        throw error
      }
      
      if (data?.url) {
        console.log('OAuth URL:', data.url)
        
        // Electron의 BrowserWindow를 사용하여 로그인
        if (window.ipcRenderer?.oauthLogin) {
          const tokens = await window.ipcRenderer.oauthLogin(data.url)
          
          // 사용자가 창을 닫은 경우 (null 반환)
          if (!tokens) {
            console.log('로그인 취소됨')
            return
          }
          
          console.log('토큰 받음:', tokens)
          
          // Supabase 세션 설정
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          })
          
          if (sessionError) {
            console.error('세션 설정 실패:', sessionError)
            throw sessionError
          }
          
          console.log('로그인 성공!')
        } else {
          console.error('ipcRenderer.oauthLogin을 사용할 수 없습니다')
          alert('로그인 기능을 사용할 수 없습니다. 앱을 다시 시작해주세요.')
        }
      }
    } catch (error: any) {
      console.error('로그인 실패:', error)
      // 에러는 이미 위에서 처리되었으므로 여기서는 아무것도 하지 않음
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // useAuthStore의 logout은 App.tsx의 onAuthStateChange에서 자동 호출됨
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }
  
  // 로그인하지 않은 경우
  if (!isLoggedIn()) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="md:h-8 md:p-0"
            onClick={handleLogin}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">로그인</span>
              <span className="truncate text-xs">계정에 로그인하세요</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // 로그인한 경우
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={thumbnailUrl || ''} alt={name || email || ''} />
                <AvatarFallback className="rounded-lg">
                  {name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name || email}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={thumbnailUrl || ''} alt={name || email || ''} />
                  <AvatarFallback className="rounded-lg">
                    {name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name || email}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                계정 설정
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <CreditCard />
                결제 정보
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleDarkMode}>
                {darkMode ? <Sun /> : <Moon />}
                {darkMode ? '라이트 모드' : '다크 모드'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
