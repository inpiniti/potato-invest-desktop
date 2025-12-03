export {}

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void
      off: (channel: string, ...args: any[]) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      openExternal: (url: string) => Promise<void>
      oauthLogin: (loginUrl: string) => Promise<{ accessToken: string; refreshToken: string }>
      koreaInvestAuth: (credentials: { appkey: string; appsecret: string }) => Promise<{
        accessToken: string
        tokenType: string
        expiresIn: number
        tokenExpired: string
      }>
    }
  }
}
