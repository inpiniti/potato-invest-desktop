import { contextBridge, ipcRenderer } from 'electron'

console.log('✅ Preload script loaded!')


// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },
    openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
    oauthLogin: (loginUrl: string) => ipcRenderer.invoke('oauth-login', loginUrl),
    koreaInvestAuth: (credentials: { appkey: string; appsecret: string }) => 
        ipcRenderer.invoke('korea-invest-auth', credentials),
    koreaInvestBalance: (params: { 
        accessToken: string; 
        appkey: string; 
        appsecret: string; 
        cano: string; 
        acntPrdtCd?: string 
    }) => ipcRenderer.invoke('korea-invest-balance', params),

    // You can expose other APTs you need here.
    // ...
})

// Preload 스크립트가 로드되었는지 확인하기 위한 플래그
console.log('✅ Preload script loaded!')
console.log('ipcRenderer exposed:', typeof window !== 'undefined')
