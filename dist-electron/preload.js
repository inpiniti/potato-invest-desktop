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
  oauthLogin: (loginUrl) => ipcRenderer.invoke("oauth-login", loginUrl)
  // You can expose other APTs you need here.
  // ...
});
console.log("✅ Preload script loaded!");
console.log("ipcRenderer exposed:", typeof window !== "undefined");
