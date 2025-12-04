import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
process.env.DIST = path.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
  console.log("Preload path:", path.join(__dirname$1, "preload.js"));
  win = new BrowserWindow({
    title: "Potato Invest Desktop",
    icon: path.join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
    autoHideMenuBar: true,
    // 메뉴바 숨김
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
      // Preload 스크립트가 작동하도록 설정
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || "", "index.html"));
  }
  win.maximize();
}
try {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("potato-invest", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient("potato-invest");
  }
} catch (error) {
  console.error("딥링크 프로토콜 등록 실패:", error);
}
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find((arg) => arg.startsWith("potato-invest://"));
      if (url) {
        win.webContents.send("deep-link", url);
      }
    }
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      win = null;
    }
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (win) {
      win.webContents.send("deep-link", url);
    }
  });
  ipcMain.handle("open-external", async (_, url) => {
    await shell.openExternal(url);
  });
  ipcMain.handle("oauth-login", async (_, loginUrl) => {
    return new Promise((resolve, reject) => {
      let isResolved = false;
      const authWindow = new BrowserWindow({
        width: 500,
        height: 800,
        // 높이 증가 (700 → 800)
        show: false,
        autoHideMenuBar: true,
        // 메뉴바 숨김
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      authWindow.loadURL(loginUrl);
      authWindow.show();
      authWindow.webContents.on("will-redirect", (event, url) => {
        handleCallback(url);
      });
      authWindow.webContents.on("did-navigate", (event, url) => {
        handleCallback(url);
      });
      function handleCallback(url) {
        if (isResolved) return;
        if (url.includes("potato-invest://") || url.includes("#access_token=")) {
          isResolved = true;
          authWindow.close();
          const hashIndex = url.indexOf("#");
          if (hashIndex !== -1) {
            const hash = url.substring(hashIndex + 1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            if (accessToken && refreshToken) {
              resolve({ accessToken, refreshToken });
            } else {
              reject(new Error("토큰을 찾을 수 없습니다"));
            }
          } else {
            reject(new Error("잘못된 리다이렉트 URL"));
          }
        }
      }
      authWindow.on("closed", () => {
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      });
    });
  });
  ipcMain.handle("korea-invest-auth", async (_, { appkey, appsecret }) => {
    try {
      const response = await fetch("https://openapi.koreainvestment.com:9443/oauth2/tokenP", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          appkey,
          appsecret
        })
      });
      if (!response.ok) {
        throw new Error(`인증 실패: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in,
        tokenExpired: data.access_token_token_expired
      };
    } catch (error) {
      console.error("한투 API 인증 에러:", error);
      throw error;
    }
  });
  ipcMain.handle("korea-invest-balance", async (_, { accessToken, appkey, appsecret, cano, acntPrdtCd }) => {
    try {
      const CANO = cano.substring(0, 8);
      const ACNT_PRDT_CD = acntPrdtCd || cano.substring(9, 11) || "01";
      const url = new URL("https://openapi.koreainvestment.com:9443/uapi/overseas-stock/v1/trading/inquire-balance");
      url.searchParams.append("CANO", CANO);
      url.searchParams.append("ACNT_PRDT_CD", ACNT_PRDT_CD);
      url.searchParams.append("WCRC_FRCR_DVSN_CD", "02");
      url.searchParams.append("NATN_CD", "000");
      url.searchParams.append("TR_MKET_CD", "00");
      url.searchParams.append("INQR_DVSN_CD", "00");
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "authorization": `Bearer ${accessToken}`,
          "appkey": appkey,
          "appsecret": appsecret,
          "tr_id": "CTRP6504R"
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`잔고 조회 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      return {
        holdings: data.output1 || [],
        balance: data.output3 || null
      };
    } catch (error) {
      console.error("한투 잔고 조회 에러:", error);
      throw error;
    }
  });
  ipcMain.handle("sp500-fetch", async () => {
    try {
      const cheerio = await import("./index-fWQz7Isw.js");
      const response = await fetch(
        "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch S&P 500 data: ${response.status}`);
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      const stocks = [];
      const table = $("#constituents").first();
      table.find("tbody tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length >= 2) {
          const ticker = $(cells[0]).text().trim();
          const name = $(cells[1]).text().trim();
          const nasdaqSymbols = [
            "AAPL",
            "MSFT",
            "GOOGL",
            "GOOG",
            "AMZN",
            "NVDA",
            "META",
            "TSLA",
            "AVGO",
            "COST",
            "CSCO",
            "ADBE",
            "PEP",
            "NFLX",
            "CMCSA",
            "INTC",
            "AMD",
            "QCOM",
            "INTU",
            "AMGN",
            "AMAT",
            "ISRG",
            "BKNG",
            "ADP",
            "GILD",
            "MDLZ",
            "VRTX",
            "REGN",
            "LRCX",
            "PANW",
            "KLAC",
            "SNPS",
            "CDNS",
            "MRVL",
            "ASML",
            "ORLY",
            "CTAS",
            "ABNB",
            "WDAY",
            "MNST",
            "PCAR",
            "PAYX",
            "MCHP",
            "FAST",
            "ODFL",
            "DXCM",
            "ROST",
            "VRSK",
            "IDXX",
            "BIIB",
            "CTSH",
            "ANSS",
            "DLTR",
            "CPRT",
            "CSGP",
            "TEAM",
            "TTWO",
            "ZS",
            "DDOG",
            "CRWD",
            "FTNT",
            "CHTR",
            "NXPI",
            "MRNA"
          ];
          const exchange = nasdaqSymbols.includes(ticker) ? "NASDAQ" : "NYSE";
          if (ticker && name) {
            stocks.push({ ticker, name, exchange });
          }
        }
      });
      console.log(`S&P 500 크롤링 완료: ${stocks.length}개 종목`);
      return stocks;
    } catch (error) {
      console.error("S&P 500 크롤링 에러:", error);
      throw error;
    }
  });
  ipcMain.handle("korea-invest-daily", async (_, { accessToken, appkey, appsecret, ticker, exchange }) => {
    try {
      const allData = [];
      let bymd = "";
      const targetCount = 300;
      const maxIterations = 3;
      console.log(`${ticker} 일별 시세 조회 시작 (목표: ${targetCount}개)`);
      for (let i = 0; i < maxIterations; i++) {
        const url = new URL("https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/dailyprice");
        url.searchParams.append("AUTH", "");
        url.searchParams.append("EXCD", exchange);
        url.searchParams.append("SYMB", ticker);
        url.searchParams.append("GUBN", "0");
        url.searchParams.append("BYMD", bymd);
        url.searchParams.append("MODP", "0");
        console.log(`  ${i + 1}번째 조회 (BYMD: ${bymd || "오늘"})`);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "authorization": `Bearer ${accessToken}`,
            "appkey": appkey,
            "appsecret": appsecret,
            "tr_id": "HHDFS76240000"
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`일별 시세 조회 실패: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const output2 = data.output2 || [];
        if (output2.length === 0) {
          console.log(`  ${i + 1}번째 조회 결과: 데이터 없음 (조회 종료)`);
          break;
        }
        console.log(`  ${i + 1}번째 조회 결과: ${output2.length}개 (누적: ${allData.length + output2.length}개)`);
        allData.push(...output2);
        if (allData.length >= targetCount) {
          console.log(`  목표 개수 도달 (${allData.length}개)`);
          break;
        }
        const lastDate = output2[output2.length - 1].xymd;
        if (lastDate) {
          const year = parseInt(lastDate.substring(0, 4));
          const month = parseInt(lastDate.substring(4, 6)) - 1;
          const day = parseInt(lastDate.substring(6, 8));
          const date = new Date(year, month, day);
          date.setDate(date.getDate() - 1);
          bymd = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, "0") + date.getDate().toString().padStart(2, "0");
          console.log(`  다음 조회 기준일: ${bymd}`);
        } else {
          console.log(`  마지막 날짜 정보 없음 (조회 종료)`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      console.log(`${ticker} 일별 시세 조회 완료: 총 ${allData.length}개`);
      return allData;
    } catch (error) {
      console.error("한투 일별 시세 조회 에러:", error);
      throw error;
    }
  });
  ipcMain.handle("korea-invest-minutes", async (_, { accessToken, appkey, appsecret, ticker, exchange }) => {
    try {
      const allData = [];
      let keyb = "";
      const targetCount = 240;
      const maxIterations = 2;
      console.log(`${ticker} 분봉 조회 시작 (목표: ${targetCount}개)`);
      for (let i = 0; i < maxIterations; i++) {
        const url = new URL("https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/inquire-time-itemchartprice");
        url.searchParams.append("AUTH", "");
        url.searchParams.append("EXCD", exchange);
        url.searchParams.append("SYMB", ticker);
        url.searchParams.append("NMIN", "1");
        url.searchParams.append("PINC", "1");
        url.searchParams.append("NEXT", i === 0 ? "" : "1");
        url.searchParams.append("NREC", "120");
        url.searchParams.append("FILL", "");
        url.searchParams.append("KEYB", keyb);
        console.log(`  ${i + 1}번째 조회 (NEXT: ${i === 0 ? "최신" : "다음"}, KEYB: ${keyb || "최신"})`);
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "authorization": `Bearer ${accessToken}`,
            "appkey": appkey,
            "appsecret": appsecret,
            "tr_id": "HHDFS76950200"
          }
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`분봉 조회 실패: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const output2 = data.output2 || [];
        if (output2.length === 0) {
          console.log(`  ${i + 1}번째 조회 결과: 데이터 없음 (조회 종료)`);
          break;
        }
        console.log(`  ${i + 1}번째 조회 결과: ${output2.length}개 (누적: ${allData.length + output2.length}개)`);
        allData.push(...output2);
        if (allData.length >= targetCount) {
          console.log(`  목표 개수 도달 (${allData.length}개)`);
          break;
        }
        const lastData = output2[output2.length - 1];
        if (lastData && lastData.xymd && lastData.xhms) {
          const dateTime = lastData.xymd + lastData.xhms;
          const year = parseInt(dateTime.substring(0, 4));
          const month = parseInt(dateTime.substring(4, 6)) - 1;
          const day = parseInt(dateTime.substring(6, 8));
          const hour = parseInt(dateTime.substring(8, 10));
          const minute = parseInt(dateTime.substring(10, 12));
          const second = parseInt(dateTime.substring(12, 14));
          const date = new Date(year, month, day, hour, minute, second);
          date.setMinutes(date.getMinutes() - 1);
          keyb = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, "0") + date.getDate().toString().padStart(2, "0") + date.getHours().toString().padStart(2, "0") + date.getMinutes().toString().padStart(2, "0") + date.getSeconds().toString().padStart(2, "0");
          console.log(`  다음 조회 기준: ${keyb}`);
        } else {
          console.log(`  마지막 시간 정보 없음 (조회 종료)`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      console.log(`${ticker} 분봉 조회 완료: 총 ${allData.length}개`);
      return allData;
    } catch (error) {
      console.error("한투 분봉 조회 에러:", error);
      throw error;
    }
  });
  app.whenReady().then(createWindow);
}
