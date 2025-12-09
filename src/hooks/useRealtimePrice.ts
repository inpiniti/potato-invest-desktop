import { useEffect, useRef, useState } from "react";
import { useAccountStore } from "@/stores/useAccountStore";

// 실시간 시세 필드 키
const FIELD_KEYS = [
  "RSYM",
  "SYMB",
  "ZDIV",
  "TYMD",
  "XYMD",
  "XHMS",
  "KYMD",
  "KHMS",
  "OPEN",
  "HIGH",
  "LOW",
  "LAST",
  "SIGN",
  "DIFF",
  "RATE",
  "PBID",
  "PASK",
  "VBID",
  "VASK",
  "EVOL",
  "TVOL",
  "TAMT",
  "BIVL",
  "ASVL",
  "STRN",
  "MTYP",
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

/**
 * 한국투자증권 실시간 시세 구독 Hook
 * 
 * IPC 통신 없이 직접 WebSocket 연결하여 실시간 시세 수신
 * @param symbols {ticker, exchange} 객체 배열
 * @returns data: 종목별 실시간 시세 데이터
 */
const useRealtimePrice = (symbols: SymbolInfo[]) => {
  const [data, setData] = useState<PriceDataMap>({});
  const socketRef = useRef<WebSocket | null>(null);
  const prevSymbolsRef = useRef<SymbolInfo[]>([]);
  const alertedRef = useRef(false); // 중복 alert 방지

  // 1. 소켓 연결 및 메시지 핸들링
  useEffect(() => {
    // ws:// 시도 (HTTPS 환경에서는 SecurityError 발생 가능) → try/catch로 페이지 크래시 방지
    let socket: WebSocket;
    try {
      socket = new WebSocket("ws://ops.koreainvestment.com:21000");
    } catch (e) {
      console.warn("웹소켓 생성 실패(혼합 콘텐츠 차단 가능):", e);
      if (typeof window !== "undefined" && !alertedRef.current) {
        alertedRef.current = true;
        try {
          alert(
            "웹소캣 연결에 오류가 발생하였습니다. 실시간 가격은 비활성화됩니다.\n파이어폭스로 이용가능 - about:config - network.websocket.allowInsecureFromHTTPS → true\nnetwork.websocket.allowInsecureFromHTTPS.override → true (버전에 따라 존재)"
          );
        } catch {}
      }
      return () => {};
    }

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("✅ 웹소켓 연결됨");
      // 최초 연결 시 등록 메시지 전송
      if (symbols && symbols.length > 0) {
        const approvalKey = useAccountStore.getState().approvalKey;
        if (!approvalKey) {
          console.warn("approval_key 누락: 구독 등록 생략");
          return;
        }
        symbols.forEach(({ ticker, exchange }) => {
          // tr_key 형식: D(해외)+거래소코드+종목코드 (예: DNASAAPL, DNYSMSFT)
          const trKey = `D${exchange}${ticker}`;
          const msg = {
            header: {
              approval_key: approvalKey,
              tr_type: "1", // 1: 등록
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
            socket.send(JSON.stringify(msg));
            console.log(`📡 구독 등록: ${ticker} (${trKey})`);
          } catch (e) {
            console.warn("구독 등록 전송 실패(무시):", e);
          }
        });
        prevSymbolsRef.current = symbols;
      }
    };

    socket.onmessage = (event) => {
      const raw = event.data;
      if (typeof raw !== "string") return;
      if (!raw.includes("^")) return;

      const values = raw.split("^");
      const parsed: ParsedPriceData = {};
      FIELD_KEYS.forEach((key, idx) => {
        parsed[key] = values[idx] || "";
      });

      const symbol = parsed["SYMB"] || parsed["RSYM"];
      if (!symbol) return;

      setData((prev) => ({
        ...prev,
        [symbol]: parsed,
      }));
    };

    socket.onerror = (err) => {
      console.error("웹소켓 에러:", err);
      if (typeof window !== "undefined" && !alertedRef.current) {
        alertedRef.current = true;
        try {
          alert(
            "웹소캣 연결에 오류가 발생하였습니다. 실시간 가격은 비활성화됩니다."
          );
        } catch {}
      }
    };
    
    socket.onclose = () => console.log("🔌 웹소켓 종료");

    return () => {
      try {
        socket.close();
      } catch {}
    };
  }, []); // 마운트 시 한 번만 연결

  // 2. 종목코드 변경 시 등록/해제 메시지 전송
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const prevSymbols = prevSymbolsRef.current;
    
    // 추가된 종목: 현재에는 있지만 이전에는 없던 것
    const added = symbols.filter(
      (s) => !prevSymbols.some((p) => p.ticker === s.ticker && p.exchange === s.exchange)
    );
    
    // 제거된 종목: 이전에는 있었지만 현재에는 없는 것
    const removed = prevSymbols.filter(
      (p) => !symbols.some((s) => s.ticker === p.ticker && s.exchange === p.exchange)
    );

    const sendMessage = (symbolInfo: SymbolInfo, trType: "1" | "2") => {
      const approvalKey = useAccountStore.getState().approvalKey;
      if (!approvalKey) {
        console.warn("approval_key 누락: 구독/해제 전송 생략");
        return;
      }

      const trKey = `D${symbolInfo.exchange}${symbolInfo.ticker}`;
      const msg = {
        header: {
          approval_key: approvalKey,
          tr_type: trType,
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
        socket.send(JSON.stringify(msg));
        console.log(
          `${trType === "1" ? "📡 구독 등록" : "❌ 구독 해제"}: ${symbolInfo.ticker} (${trKey})`
        );
      } catch (e) {
        console.warn("구독/해제 전송 실패(무시):", e);
      }
    };

    // 등록
    added.forEach((symbolInfo) => sendMessage(symbolInfo, "1"));
    // 해제
    removed.forEach((symbolInfo) => sendMessage(symbolInfo, "2"));

    prevSymbolsRef.current = symbols;
  }, [symbols]);

  return { data };
};

export default useRealtimePrice;
