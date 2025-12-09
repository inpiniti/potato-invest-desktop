import { contextBridge, ipcRenderer } from "electron";
console.log("✅ Preload script loaded!");
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  oauthLogin: (loginUrl) => ipcRenderer.invoke("oauth-login", loginUrl),
  koreaInvestAuth: (credentials) => ipcRenderer.invoke("korea-invest-auth", credentials),
  koreaInvestApproval: (credentials) => ipcRenderer.invoke("korea-invest-approval", credentials),
  koreaInvestBalance: (params) => ipcRenderer.invoke("korea-invest-balance", params),
  koreaInvestDaily: (params) => ipcRenderer.invoke("korea-invest-daily", params),
  koreaInvestMinutes: (params) => ipcRenderer.invoke("korea-invest-minutes", params),
  sp500Fetch: () => ipcRenderer.invoke("sp500-fetch"),
  // Crawling API
  tossCrawl: (ticker) => ipcRenderer.invoke("toss-crawl", { ticker }),
  tradingViewCrawl: (ticker) => ipcRenderer.invoke("tradingview-crawl", { ticker }),
  newsCrawl: (ticker) => ipcRenderer.invoke("news-crawl", { ticker }),
  tradingViewList: (tickers) => ipcRenderer.invoke("tradingview-list", { tickers }),
  // Realtime API
  realtimeSubscribe: (params) => ipcRenderer.invoke("realtime-subscribe", params),
  realtimeUnsubscribe: (params) => ipcRenderer.invoke("realtime-unsubscribe", params)
  // You can expose other APTs you need here.
  // ...
});
console.log("✅ Preload script loaded!");
console.log("ipcRenderer exposed:", typeof window !== "undefined");
