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
    windowMinimize: () => ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => ipcRenderer.invoke('window-maximize'),
    windowClose: () => ipcRenderer.invoke('window-close'),
    oauthLogin: (loginUrl: string) => ipcRenderer.invoke('oauth-login', loginUrl),
    koreaInvestAuth: (credentials: { appkey: string; appsecret: string }) => 
        ipcRenderer.invoke('korea-invest-auth', credentials),
    koreaInvestApproval: (credentials: { appkey: string; appsecret: string }) => 
        ipcRenderer.invoke('korea-invest-approval', credentials),
    koreaInvestBalance: (params: { 
        accessToken: string; 
        appkey: string; 
        appsecret: string; 
        cano: string; 
        acntPrdtCd?: string 
    }) => ipcRenderer.invoke('korea-invest-balance', params),
    koreaInvestDaily: (params: {
        accessToken: string;
        appkey: string;
        appsecret: string;
        ticker: string;
        exchange: 'NAS' | 'NYS';
    }) => ipcRenderer.invoke('korea-invest-daily', params),
    koreaInvestMinutes: (params: {
        accessToken: string;
        appkey: string;
        appsecret: string;
        ticker: string;
        exchange: 'NAS' | 'NYS';
    }) => ipcRenderer.invoke('korea-invest-minutes', params),
    sp500Fetch: () => ipcRenderer.invoke('sp500-fetch'),
    
    // Crawling API
    tossCrawl: (ticker: string) => ipcRenderer.invoke('toss-crawl', { ticker }),
    tradingViewCrawl: (ticker: string) => ipcRenderer.invoke('tradingview-crawl', { ticker }),
    newsCrawl: (ticker: string) => ipcRenderer.invoke('news-crawl', { ticker }),
    tradingViewList: (tickers: string[]) => ipcRenderer.invoke('tradingview-list', { tickers }),

    // Realtime API
    realtimeSubscribe: (params: { ticker: string; exchange: 'NAS' | 'NYS' }) => 
        ipcRenderer.invoke('realtime-subscribe', params),
    realtimeUnsubscribe: (params: { ticker: string; exchange: 'NAS' | 'NYS' }) => 
        ipcRenderer.invoke('realtime-unsubscribe', params),

    // You can expose other APTs you need here.
    // ...
})

// Preload 스크립트가 로드되었는지 확인하기 위한 플래그
console.log('✅ Preload script loaded!')
console.log('ipcRenderer exposed:', typeof window !== 'undefined')
