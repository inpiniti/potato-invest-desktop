import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
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

export function NavUser() {
  const { isMobile } = useSidebar()
  const { isLoggedIn, email, thumbnailUrl, name } = useAuthStore()
  
  console.log('NavUser Render:', { isLoggedIn: isLoggedIn(), email })
  console.log('window.ipcRenderer:', window.ipcRenderer)
  console.log('window keys:', Object.keys(window).filter(k => k.includes('ipc')))
  
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
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo,
        }
      })
      if (error) {
        console.error('Supabase 로그인 에러:', error)
        throw error
      }
      console.log('Supabase 로그인 요청 성공')
    } catch (error: any) {
      console.error('로그인 실패:', error)
      alert(`로그인 중 오류가 발생했습니다: ${error.message || error}`)
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
                <Sparkles />
                프로 업그레이드
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                계정 설정
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                결제 정보
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                알림 설정
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
