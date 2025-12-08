import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
let realtimeWs = null;
let approvalKey = null;
const subscribedStocks = /* @__PURE__ */ new Set();
let mainWindow = null;
function setMainWindow(win2) {
  mainWindow = win2;
}
function setApprovalKey(key) {
  approvalKey = key;
  initializeWebSocket();
}
function initializeWebSocket() {
  if (!approvalKey) {
    console.error("[WebSocket] approval_key가 없습니다.");
    return;
  }
  if (realtimeWs) {
    realtimeWs.close();
    realtimeWs = null;
  }
  console.log("[WebSocket] 연결 시작...");
  realtimeWs = new WebSocket("ws://ops.koreainvestment.com:21000/tryitout/HDFSCNT0");
  realtimeWs.on("open", () => {
    console.log("[WebSocket] 연결 성공");
    subscribedStocks.forEach((trKey) => {
      sendSubscription(trKey, "1");
    });
  });
  realtimeWs.on("message", (data) => {
    try {
      const message = data.toString("utf-8");
      const parsed = JSON.parse(message);
      console.log("[WebSocket] 수신:", parsed);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("realtime-price", parsed);
      }
    } catch (error) {
      console.error("[WebSocket] 메시지 파싱 오류:", error);
    }
  });
  realtimeWs.on("error", (error) => {
    console.error("[WebSocket] 오류:", error);
  });
  realtimeWs.on("close", () => {
    console.log("[WebSocket] 연결 종료");
    realtimeWs = null;
    setTimeout(() => {
      if (approvalKey) {
        console.log("[WebSocket] 재연결 시도...");
        initializeWebSocket();
      }
    }, 5e3);
  });
}
function sendSubscription(trKey, trType) {
  if (!realtimeWs || realtimeWs.readyState !== WebSocket.OPEN) {
    console.error("[WebSocket] 연결되지 않음");
    return;
  }
  if (!approvalKey) {
    console.error("[WebSocket] approval_key가 없습니다.");
    return;
  }
  const message = JSON.stringify({
    header: {
      approval_key: approvalKey,
      custtype: "P",
      tr_type: trType,
      "content-type": "utf-8"
    },
    body: {
      input: {
        tr_id: "HDFSCNT0",
        tr_key: trKey
      }
    }
  });
  console.log(`[WebSocket] ${trType === "1" ? "구독" : "해제"} 전송:`, trKey);
  console.log("[WebSocket] 메시지:", message);
  realtimeWs.send(message);
}
function subscribe(ticker, exchange) {
  const marketCode = exchange === "NAS" ? "NAS" : "NYS";
  const trKey = `D${marketCode}${ticker}`;
  console.log("[Subscribe] 구독 요청:", trKey);
  subscribedStocks.add(trKey);
  sendSubscription(trKey, "1");
  return { success: true, trKey };
}
function unsubscribe(ticker, exchange) {
  const marketCode = exchange === "NAS" ? "NAS" : "NYS";
  const trKey = `D${marketCode}${ticker}`;
  console.log("[Unsubscribe] 구독 취소 요청:", trKey);
  subscribedStocks.delete(trKey);
  sendSubscription(trKey, "2");
  return { success: true, trKey };
}
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
  setMainWindow(win);
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
  ipcMain.handle("korea-invest-approval", async (_, { appkey, appsecret }) => {
    try {
      console.log("[Approval] 웹소켓 토큰 발급 요청...");
      const requestBody = {
        grant_type: "client_credentials",
        appkey,
        secretkey: appsecret
        // API 스펙에 따라 'secretkey' 사용
      };
      console.log("[Approval] Request body:", JSON.stringify(requestBody, null, 2));
      const response = await fetch("https://openapi.koreainvestment.com:9443/oauth2/Approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(requestBody)
      });
      console.log("[Approval] Response status:", response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Approval] Error response:", errorText);
        throw new Error(`웹소켓 토큰 발급 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      console.log("[Approval] Success:", data);
      setApprovalKey(data.approval_key);
      return {
        approvalKey: data.approval_key
      };
    } catch (error) {
      console.error("한투 웹소켓 토큰 발급 에러:", error);
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
      console.log(`[Daily] ${ticker} - Start (target: ${targetCount})`);
      for (let i = 0; i < maxIterations; i++) {
        const url = new URL("https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/dailyprice");
        url.searchParams.append("AUTH", "");
        url.searchParams.append("EXCD", exchange);
        url.searchParams.append("SYMB", ticker);
        url.searchParams.append("GUBN", "0");
        url.searchParams.append("BYMD", bymd);
        url.searchParams.append("MODP", "0");
        console.log(`  ${i + 1}. Call (BYMD: ${bymd || "today"})`);
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
          console.log(`  Next BYMD: ${bymd}`);
        } else {
          console.log(`  No more data`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      console.log(`[Daily] ${ticker} - Complete: ${allData.length} items`);
      return allData;
    } catch (error) {
      console.error("[Daily] Error:", error);
      throw error;
    }
  });
  ipcMain.handle("korea-invest-minutes", async (_, { accessToken, appkey, appsecret, ticker, exchange }) => {
    try {
      const allData = [];
      let keyb = "";
      const targetCount = 240;
      const maxIterations = 2;
      console.log(`[Minutes] ${ticker} - Start (target: ${targetCount})`);
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
        console.log(`  ${i + 1}. Call (NEXT: ${i === 0 ? "latest" : "next"}, KEYB: ${keyb || "latest"})`);
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
          console.log(`  Next KEYB: ${keyb}`);
        } else {
          console.log(`  No time info (stop)`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      console.log(`[Minutes] ${ticker} - Complete: ${allData.length} items`);
      return allData;
    } catch (error) {
      console.error("[Minutes] Error:", error);
      throw error;
    }
  });
  ipcMain.handle("toss-crawl", async (_, { ticker }) => {
    try {
      const BASE_URL = "https://wts-cert-api.tossinvest.com/api";
      console.log(`[Toss] Crawling ${ticker}...`);
      const screenerResponse = await fetch(`${BASE_URL}/v3/search-all/wts-auto-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: ticker,
          sections: [
            { type: "SCREENER" },
            { type: "NEWS" },
            { type: "PRODUCT", option: { addIntegratedSearchResult: true } },
            { type: "TICS" }
          ]
        })
      });
      if (!screenerResponse.ok) {
        throw new Error(`Screener API error: ${screenerResponse.status}`);
      }
      const screenerData = await screenerResponse.json();
      let productCode;
      if (Array.isArray(screenerData?.result)) {
        for (const section of screenerData.result) {
          if (section?.type === "PRODUCT" && section?.data?.items?.length) {
            productCode = section.data.items[0]?.productCode;
            if (productCode) break;
          }
        }
      }
      if (!productCode) {
        console.log(`[Toss] Product code not found for ${ticker}`);
        return { productCode: null, comments: [] };
      }
      console.log(`[Toss] Found productCode: ${productCode}`);
      const communityResponse = await fetch(`${BASE_URL}/v3/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: productCode,
          subjectType: "STOCK",
          commentSortType: "RECENT"
        })
      });
      if (!communityResponse.ok) {
        throw new Error(`Community API error: ${communityResponse.status}`);
      }
      const communityData = await communityResponse.json();
      let comments = [];
      if (Array.isArray(communityData?.result?.comments?.body)) {
        comments = communityData.result.comments.body;
      } else if (Array.isArray(communityData?.result?.comments)) {
        comments = communityData.result.comments;
      } else if (Array.isArray(communityData?.comments?.body)) {
        comments = communityData.comments.body;
      } else if (Array.isArray(communityData?.comments)) {
        comments = communityData.comments;
      }
      const tossComments = comments.map((comment) => ({
        author: comment.author?.nickname || "Anonymous",
        title: comment.title || "",
        content: comment.message || "",
        createdAt: comment.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
        readCount: parseInt(comment.readCount) || 0,
        likeCount: parseInt(comment.likeCount) || 0,
        badge: comment.author?.badge?.badge || "",
        profilePictureUrl: comment.author?.profilePictureUrl || ""
      }));
      console.log(`[Toss] Found ${tossComments.length} comments for ${ticker}`);
      return {
        productCode,
        comments: tossComments
      };
    } catch (error) {
      console.error("[Toss] Crawling error:", error.message);
      return { productCode: null, comments: [] };
    }
  });
  ipcMain.handle("tradingview-crawl", async (_, { ticker }) => {
    try {
      console.log(`[TradingView] Crawling ${ticker}...`);
      const url = "https://scanner.tradingview.com/america/scan";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: [
            // 기본 정보
            "name",
            "description",
            "logoid",
            "type",
            "close",
            "change",
            "volume",
            "relative_volume_10d_calc",
            "gap",
            "volume_change",
            "sector.tr",
            "exchange",
            "currency",
            // 시가총액 및 평가
            "market_cap_basic",
            "Perf.1Y.MarketCap",
            "price_earnings_ttm",
            "price_earnings_growth_ttm",
            "price_sales_current",
            "price_book_fq",
            "price_free_cash_flow_ttm",
            "enterprise_value_to_revenue_ttm",
            "enterprise_value_to_ebit_ttm",
            "enterprise_value_ebitda_ttm",
            // 배당
            "dividends_yield_current",
            "dividend_payout_ratio_ttm",
            "continuous_dividend_payout",
            "continuous_dividend_growth",
            // 수익성
            "gross_margin_ttm",
            "operating_margin_ttm",
            "pre_tax_margin_ttm",
            "net_margin_ttm",
            "free_cash_flow_margin_ttm",
            "return_on_assets_fq",
            "return_on_equity_fq",
            "return_on_invested_capital_fq",
            "sell_gen_admin_exp_other_ratio_ttm",
            // 손익계산
            "total_revenue_yoy_growth_ttm",
            "earnings_per_share_diluted_ttm",
            "earnings_per_share_diluted_yoy_growth_ttm",
            // 대차대조표
            "current_ratio_fq",
            "quick_ratio_fq",
            "debt_to_equity_fq",
            "cash_n_short_term_invest_to_total_debt_fq",
            // 현금흐름
            "cash_f_operating_activities_ttm",
            "cash_f_investing_activities_ttm",
            "cash_f_financing_activities_ttm",
            "free_cash_flow_ttm",
            "capital_expenditures_ttm",
            // 성과 지표
            "Perf.W",
            "Perf.1M",
            "Perf.3M",
            "Perf.6M",
            "Perf.YTD",
            "Perf.Y",
            "Perf.5Y",
            "Perf.10Y",
            "Perf.All",
            "Volatility.W",
            "Volatility.M",
            // 기술적 지표
            "Recommend.All",
            "Recommend.MA",
            "Recommend.Other",
            "RSI",
            "Mom",
            "AO",
            "CCI20",
            "Stoch.K",
            "Stoch.D",
            "BB.upper",
            "BB.basis",
            "BB.lower",
            "SMA20",
            "SMA50",
            "SMA100",
            "SMA200",
            // 추가 지표
            "recommendation_mark",
            "price_target_1y_delta"
          ],
          filter: [
            {
              left: "name",
              operation: "equal",
              right: ticker
            }
          ],
          range: [0, 10]
        })
      });
      if (!response.ok) {
        throw new Error(`TradingView API error: ${response.status}`);
      }
      const data = await response.json();
      if (!data.data || data.data.length === 0) {
        throw new Error("No data found");
      }
      const item = data.data[0];
      const d = item.d;
      let idx = 0;
      const basicInfo = {
        name: d[idx++],
        description: d[idx++],
        logoid: d[idx++],
        type: d[idx++],
        close: d[idx++],
        change: d[idx++],
        volume: d[idx++],
        relativeVolume10d: d[idx++],
        gap: d[idx++],
        volumeChange: d[idx++],
        sector: d[idx++],
        exchange: d[idx++],
        currency: d[idx++]
      };
      const valuation = {
        marketCap: d[idx++],
        perf1YMarketCap: d[idx++],
        priceEarningsTTM: d[idx++],
        priceEarningsGrowthTTM: d[idx++],
        priceSalesCurrent: d[idx++],
        priceBookFQ: d[idx++],
        priceFCFTTM: d[idx++],
        evToRevenueTTM: d[idx++],
        evToEbitTTM: d[idx++],
        evToEbitdaTTM: d[idx++]
      };
      const dividend = {
        yieldCurrent: d[idx++],
        payoutRatioTTM: d[idx++],
        continuousPayout: d[idx++],
        continuousGrowth: d[idx++]
      };
      const profitability = {
        grossMarginTTM: d[idx++],
        operatingMarginTTM: d[idx++],
        preTaxMarginTTM: d[idx++],
        netMarginTTM: d[idx++],
        fcfMarginTTM: d[idx++],
        roaFQ: d[idx++],
        roeFQ: d[idx++],
        roicFQ: d[idx++],
        sgaExpenseRatioTTM: d[idx++]
      };
      const incomeStatement = {
        revenueGrowthTTM: d[idx++],
        epsDilutedTTM: d[idx++],
        epsGrowthTTM: d[idx++]
      };
      const balanceSheet = {
        currentRatioFQ: d[idx++],
        quickRatioFQ: d[idx++],
        debtToEquityFQ: d[idx++],
        cashToDebtFQ: d[idx++]
      };
      const cashFlow = {
        operatingCFTTM: d[idx++],
        investingCFTTM: d[idx++],
        financingCFTTM: d[idx++],
        freeCFTTM: d[idx++],
        capexTTM: d[idx++]
      };
      const performance = {
        perfWeek: d[idx++],
        perf1Month: d[idx++],
        perf3Month: d[idx++],
        perf6Month: d[idx++],
        perfYTD: d[idx++],
        perfYear: d[idx++],
        perf5Year: d[idx++],
        perf10Year: d[idx++],
        perfAll: d[idx++],
        volatilityWeek: d[idx++],
        volatilityMonth: d[idx++]
      };
      const technical = {
        recommendAll: d[idx++],
        recommendMA: d[idx++],
        recommendOther: d[idx++],
        rsi: d[idx++],
        momentum: d[idx++],
        ao: d[idx++],
        cci20: d[idx++],
        stochK: d[idx++],
        stochD: d[idx++],
        bbUpper: d[idx++],
        bbBasis: d[idx++],
        bbLower: d[idx++],
        sma20: d[idx++],
        sma50: d[idx++],
        sma100: d[idx++],
        sma200: d[idx++]
      };
      const additional = {
        recommendationMark: d[idx++],
        priceTarget1YDelta: d[idx++]
      };
      const stockInfo = {
        ticker,
        name: basicInfo.description || basicInfo.name || ticker,
        currentPrice: basicInfo.close,
        changeRate: basicInfo.change,
        marketCap: valuation.marketCap ? `$${(valuation.marketCap / 1e9).toFixed(2)}B` : void 0,
        description: `Sector: ${basicInfo.sector || "N/A"} | P/E: ${valuation.priceEarningsTTM || "N/A"} | Dividend: ${dividend.yieldCurrent || 0}%`,
        // 전체 구조화된 데이터
        basicInfo,
        valuation,
        dividend,
        profitability,
        incomeStatement,
        balanceSheet,
        cashFlow,
        performance,
        technical,
        additional
      };
      console.log(`[TradingView] Found info for ${ticker}: ${stockInfo.name} ($${stockInfo.currentPrice})`);
      return stockInfo;
    } catch (error) {
      console.error("[TradingView] Crawling error:", error.message);
      return null;
    }
  });
  ipcMain.handle("news-crawl", async (_, { ticker }) => {
    try {
      console.log(`[Toss News] Crawling ${ticker}...`);
      const BASE_URL = "https://wts-cert-api.tossinvest.com/api";
      const url = `${BASE_URL}/v3/search-all/wts-auto-complete`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: ticker,
          sections: [
            { type: "NEWS" }
          ]
        })
      });
      if (!response.ok) {
        throw new Error(`Toss News API error: ${response.status}`);
      }
      const data = await response.json();
      const newsSection = data.result?.find((s) => s.type === "NEWS");
      const newsItems = newsSection?.data?.items || [];
      const newsArticles = newsItems.map((article) => ({
        author: article.source || "Unknown",
        title: article.title || "",
        content: article.summary || "",
        createdAt: article.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        thumbnail: article.imageUrls?.[0]
      }));
      console.log(`[Toss News] Found ${newsArticles.length} articles for ${ticker}`);
      return newsArticles;
    } catch (error) {
      console.error("[Toss News] Crawling error:", error.message);
      return [];
    }
  });
  app.whenReady().then(createWindow);
}
ipcMain.handle("realtime-subscribe", async (_, { ticker, exchange }) => {
  try {
    return subscribe(ticker, exchange);
  } catch (error) {
    console.error("[Subscribe] 오류:", error);
    throw error;
  }
});
ipcMain.handle("realtime-unsubscribe", async (_, { ticker, exchange }) => {
  try {
    return unsubscribe(ticker, exchange);
  } catch (error) {
    console.error("[Unsubscribe] 오류:", error);
    throw error;
  }
});
