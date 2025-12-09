import { useEffect, useRef, useState, useCallback } from "react";
import { useAccountStore } from "@/stores/useAccountStore";

// 실시간 시세 필드 키
const FIELD_KEYS = [
  "RSYM", "SYMB", "ZDIV", "TYMD", "XYMD", "XHMS", "KYMD", "KHMS",
  "OPEN", "HIGH", "LOW", "LAST", "SIGN", "DIFF", "RATE",
  "PBID", "PASK", "VBID", "VASK", "EVOL", "TVOL", "TAMT",
  "BIVL", "ASVL", "STRN", "MTYP",
];

// 종목 정보 타입 정의
interface SymbolInfo {
  ticker: string;
  exchange: "NAS" | "NYS" | "AMS" | "HKS" | "SHS" | "SZS" | "TSE" | "HNX" | "HSX";
}

// 파싱된 시세 데이터 타입
interface ParsedPriceData {
  [key: string]: string;
}

// 전체 시세 데이터 맵 타입
interface PriceDataMap {
  [symbol: string]: ParsedPriceData;
}

// ============================================
// 싱글톤 웹소켓 매니저
// ============================================
const WS_URL = "ws://ops.koreainvestment.com:21000/tryitout/HDFSCNT0";
const RECONNECT_DELAY = 30000; // 30초 (서버가 이전 연결을 정리할 시간)
const MAX_RECONNECT_ATTEMPTS = 5;

class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private socket: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private listeners: Set<(data: ParsedPriceData) => void> = new Set();
  private subscribedSymbols: Map<string, SymbolInfo> = new Map();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // 리스너 등록
  addListener(callback: (data: ParsedPriceData) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // 데이터를 모든 리스너에게 전달
  private notifyListeners(data: ParsedPriceData) {
    this.listeners.forEach(listener => listener(data));
  }

  // 연결
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log("[WS] Already connected or connecting, skip");
      return;
    }

    this.isConnecting = true;
    console.log(`[WS] Connecting... (attempt ${this.reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    try {
      this.socket = new WebSocket(WS_URL);
    } catch (e) {
      console.error("[WS] WebSocket creation failed:", e);
      this.isConnecting = false;
      return;
    }

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected");
      this.isConnecting = false;
      this.reconnectAttempt = 0;

      // 기존 구독 복구
      if (this.subscribedSymbols.size > 0) {
        console.log(`[WS] Resubscribing to ${this.subscribedSymbols.size} symbols...`);
        this.subscribedSymbols.forEach((symbolInfo) => {
          this.sendSubscribe(symbolInfo);
        });
      }
    };

    this.socket.onmessage = (event) => {
      const raw = event.data;
      if (typeof raw !== "string") return;

      // JSON 메시지 처리
      if (raw.startsWith("{")) {
        try {
          const parsed = JSON.parse(raw);
          
          // PINGPONG 응답
          if (parsed.header?.tr_id === "PINGPONG") {
            this.socket?.send(raw);
            console.log("[WS] PINGPONG response sent");
            return;
          }
          
          // 서버 메시지 로깅
          if (parsed.body?.msg1) {
            console.log("[WS] Server message:", parsed.body.msg1);
            
            // ALREADY IN USE 에러 시 재연결 지연
            if (parsed.body.msg1.includes("ALREADY IN USE")) {
              console.warn("[WS] appkey already in use, waiting longer before reconnect...");
            }
          }
        } catch {}
        return;
      }

      // 가격 데이터 처리
      if (!raw.includes("^")) return;

      const values = raw.split("^");
      const parsed: ParsedPriceData = {};
      FIELD_KEYS.forEach((key, idx) => {
        parsed[key] = values[idx] || "";
      });

      const symbol = parsed["SYMB"] || parsed["RSYM"];
      if (symbol) {
        this.notifyListeners(parsed);
      }
    };

    this.socket.onerror = (err) => {
      console.error("[WS] WebSocket error:", err);
      this.isConnecting = false;
    };

    this.socket.onclose = (event) => {
      console.log(`🔌 WebSocket closed (code: ${event.code}, clean: ${event.wasClean})`);
      this.socket = null;
      this.isConnecting = false;

      // 재연결
      if (this.reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempt++;
        const delay = RECONNECT_DELAY * this.reconnectAttempt; // 점진적 증가
        console.log(`[WS] Reconnecting in ${delay / 1000}s...`);
        
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, delay);
      } else {
        console.error("[WS] Max reconnection attempts reached. Stopping.");
      }
    };
  }

  // 연결 종료
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempt = 0;
    this.isConnecting = false;
  }

  // 구독 메시지 전송
  private sendSubscribe(symbolInfo: SymbolInfo) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    const approvalKey = useAccountStore.getState().approvalKey;
    if (!approvalKey) {
      console.warn("[WS] approval_key missing");
      return;
    }

    const trKey = `D${symbolInfo.exchange}${symbolInfo.ticker}`;
    const msg = {
      header: {
        approval_key: approvalKey,
        tr_type: "1",
        custtype: "P",
        "content-type": "utf-8",
      },
      body: {
        input: {
          tr_id: "HDFSCNT0",
          tr_key: trKey,
        },
      },
    };

    try {
      this.socket.send(JSON.stringify(msg));
      console.log(`📡 Subscribe: ${symbolInfo.ticker} (${trKey})`);
    } catch (e) {
      console.warn("[WS] Subscribe failed:", e);
    }
  }

  // 심볼 구독
  subscribe(symbols: SymbolInfo[]) {
    // 기존 구독 목록 업데이트
    this.subscribedSymbols.clear();
    symbols.forEach(s => {
      this.subscribedSymbols.set(s.ticker, s);
    });

    // 연결되어 있으면 구독 전송
    if (this.socket?.readyState === WebSocket.OPEN) {
      symbols.forEach(s => this.sendSubscribe(s));
    } else {
      // 연결 시작
      this.connect();
    }
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// ============================================
// React Hook
// ============================================
const useRealtimePrice = (symbols: SymbolInfo[]) => {
  const [data, setData] = useState<PriceDataMap>({});
  const managerRef = useRef<WebSocketManager | null>(null);

  // 데이터 수신 핸들러
  const handleData = useCallback((parsed: ParsedPriceData) => {
    const symbol = parsed["SYMB"] || parsed["RSYM"];
    if (symbol) {
      setData(prev => ({
        ...prev,
        [symbol]: parsed,
      }));
    }
  }, []);

  // 초기화 및 구독
  useEffect(() => {
    const manager = WebSocketManager.getInstance();
    managerRef.current = manager;

    // 리스너 등록
    const unsubscribe = manager.addListener(handleData);

    // 구독
    if (symbols.length > 0) {
      manager.subscribe(symbols);
    }

    return () => {
      unsubscribe();
      // 싱글톤이므로 disconnect하지 않음 (다른 컴포넌트가 사용할 수 있음)
    };
  }, [handleData]);

  // symbols 변경 시 재구독
  useEffect(() => {
    if (managerRef.current && symbols.length > 0) {
      managerRef.current.subscribe(symbols);
    }
  }, [symbols]);

  return { data };
};

export default useRealtimePrice;
