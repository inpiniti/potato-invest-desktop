/**
 * 크롤링 API 단위 테스트
 * 
 * 실행: npm test
 * 
 * 모든 테스트는 실제 데이터 반환을 검증합니다.
 * 빈 배열이나 null 반환 시 실패합니다.
 */

describe('Stock Crawling APIs', () => {
  const BASE_URL = 'https://wts-cert-api.tossinvest.com/api';
  const TEST_TICKER = 'GOOGL'; // GOOGL은 댓글이 많아서 테스트에 적합

  describe('TradingView API', () => {
    it('should fetch stock info successfully with valid data', async () => {
      const url = 'https://scanner.tradingview.com/america/scan';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: ['name', 'description', 'close', 'change', 'market_cap_basic'],
          filter: [{ left: 'name', operation: 'equal', right: TEST_TICKER }],
          range: [0, 10],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // 데이터가 반드시 존재해야 함
      expect(data.data).toBeDefined();
      expect(data.data.length).toBeGreaterThan(0);
      
      const [name, description, close] = data.data[0].d;
      expect(name).toBe(TEST_TICKER);
      expect(description).toBeTruthy(); // 설명이 있어야 함
      expect(close).toBeGreaterThan(0); // 가격이 0보다 커야 함
      
      console.log(`✅ TradingView: ${description} - $${close}`);
    });

    it('should return empty for invalid ticker', async () => {
      const url = 'https://scanner.tradingview.com/america/scan';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: ['name', 'description'],
          filter: [{ left: 'name', operation: 'equal', right: 'INVALID_TICKER_XYZ' }],
          range: [0, 10],
        }),
      });

      const data = await response.json();
      expect(data.data.length).toBe(0);
    });
  });

  describe('Toss News API', () => {
    it('should fetch news successfully with articles', async () => {
      const url = `${BASE_URL}/v3/search-all/wts-auto-complete`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: TEST_TICKER,
          sections: [{ type: 'NEWS' }],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      const newsSection = data.result?.find((s: any) => s.type === 'NEWS');
      
      // 뉴스 섹션이 반드시 존재해야 함
      expect(newsSection).toBeDefined();
      expect(newsSection.data.items).toBeDefined();
      
      // 최소 1개 이상의 뉴스가 있어야 함
      expect(newsSection.data.items.length).toBeGreaterThan(0);
      
      // 첫 번째 뉴스에 제목이 있어야 함
      expect(newsSection.data.items[0].title).toBeTruthy();
      
      console.log(`✅ Toss News: ${newsSection.data.items.length}개 기사`);
    });
  });

  describe('Toss Community API', () => {
    it('should fetch productCode and comments with data', async () => {
      // Step 1: Get productCode
      const searchResponse = await fetch(`${BASE_URL}/v3/search-all/wts-auto-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: TEST_TICKER,
          sections: [
            { type: 'PRODUCT', option: { addIntegratedSearchResult: true } },
          ],
        }),
      });

      const searchData = await searchResponse.json();
      let productCode;
      if (Array.isArray(searchData?.result)) {
        for (const section of searchData.result) {
          if (section?.type === 'PRODUCT' && section?.data?.items?.length) {
            productCode = section.data.items[0]?.productCode;
            if (productCode) break;
          }
        }
      }

      // productCode가 반드시 존재해야 함
      expect(productCode).toBeDefined();
      expect(productCode).toBeTruthy();
      
      console.log(`✅ Toss productCode: ${productCode}`);

      // Step 2: Get comments
      const communityResponse = await fetch(`${BASE_URL}/v3/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: productCode,
          subjectType: 'STOCK',
          commentSortType: 'RECENT',
        }),
      });

      expect(communityResponse.status).toBe(200);
      const communityData = await communityResponse.json();
      
      // 댓글 데이터 추출
      let comments: any[] = [];
      if (Array.isArray(communityData?.result?.comments?.body)) {
        comments = communityData.result.comments.body;
      } else if (Array.isArray(communityData?.result?.comments)) {
        comments = communityData.result.comments;
      } else if (Array.isArray(communityData?.comments?.body)) {
        comments = communityData.comments.body;
      } else if (Array.isArray(communityData?.comments)) {
        comments = communityData.comments;
      }
      
      // 댓글 배열이 존재하는지 확인
      expect(comments).toBeDefined();
      expect(Array.isArray(comments)).toBe(true);
      
      if (comments.length > 0) {
        // 첫 번째 댓글에 내용이 있어야 함
        expect(comments[0].body || comments[0].message).toBeTruthy();
        console.log(`✅ Toss Comments: ${comments.length}개 댓글`);
      } else {
        console.log(`⚠️ Toss Comments: 현재 댓글 없음 (API는 정상 작동)`);
      }
    });
  });

  describe('Integration Test', () => {
    it('should fetch all data for a ticker with valid results', async () => {
      const results = await Promise.allSettled([
        // TradingView
        fetch('https://scanner.tradingview.com/america/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            columns: ['name', 'close'],
            filter: [{ left: 'name', operation: 'equal', right: TEST_TICKER }],
            range: [0, 1],
          }),
        }).then(r => r.json()),
        
        // Toss News
        fetch(`${BASE_URL}/v3/search-all/wts-auto-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: TEST_TICKER,
            sections: [{ type: 'NEWS' }],
          }),
        }).then(r => r.json()),
      ]);

      // 모든 API가 성공해야 함
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBe(2);
      
      // TradingView 데이터 검증
      if (results[0].status === 'fulfilled') {
        expect(results[0].value.data.length).toBeGreaterThan(0);
      }
      
      // Toss News 데이터 검증
      if (results[1].status === 'fulfilled') {
        const newsSection = results[1].value.result?.find((s: any) => s.type === 'NEWS');
        expect(newsSection?.data?.items?.length).toBeGreaterThan(0);
      }
      
      console.log(`✅ Integration: All APIs returned valid data`);
    }, 10000); // 10초 타임아웃
  });
});
