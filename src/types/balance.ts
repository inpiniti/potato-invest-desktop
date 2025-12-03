// 보유종목 타입
export interface Holding {
  prdt_name: string // 상품명
  cblc_qty13: string // 잔고수량13
  thdt_buy_ccld_qty1: string // 당일매수체결수량1
  thdt_sll_ccld_qty1: string // 당일매도체결수량1
  ccld_qty_smtl1: string // 체결수량합계1
  ord_psbl_qty1: string // 주문가능수량1
  frcr_pchs_amt: string // 외화매입금액
  frcr_evlu_amt2: string // 외화평가금액2
  evlu_pfls_amt2: string // 평가손익금액2
  evlu_pfls_rt1: string // 평가손익율1
  pdno: string // 상품번호 (key)
  bass_exrt: string // 기준환율
  buy_crcy_cd: string // 매수통화코드
  ovrs_now_pric1: string // 해외현재가격1
  avg_unpr3: string // 평균단가3
  tr_mket_name: string // 거래시장명
  natn_kor_name: string // 국가한글명
  pchs_rmnd_wcrc_amt: string // 매입잔액원화금액
  thdt_buy_ccld_frcr_amt: string // 당일매수체결외화금액
  thdt_sll_ccld_frcr_amt: string // 당일매도체결외화금액
  unit_amt: string // 단위금액
  std_pdno: string // 표준상품번호
  prdt_type_cd: string // 상품유형코드
  scts_dvsn_name: string // 유가증권구분명
  loan_rmnd: string // 대출잔액
  loan_dt: string // 대출일자
  loan_expd_dt: string // 대출만기일자
  ovrs_excg_cd: string // 해외거래소코드
  item_lnkg_excg_cd: string // 종목연동거래소코드
}

// 잔고 데이터 타입
export interface Balance {
  pchs_amt_smtl: string // 매입금액합계
  evlu_amt_smtl: string // 평가금액합계
  evlu_pfls_amt_smtl: string // 평가손익금액합계
  dncl_amt: string // 예수금액
  cma_evlu_amt: string // CMA평가금액
  tot_dncl_amt: string // 총예수금액
  etc_mgna: string // 기타증거금
  wdrw_psbl_tot_amt: string // 인출가능총금액
  frcr_evlu_tota: string // 외화평가총액
  evlu_erng_rt1: string // 평가수익율1
  pchs_amt_smtl_amt: string // 매입금액합계금액
  evlu_amt_smtl_amt: string // 평가금액합계금액
  tot_evlu_pfls_amt: string // 총평가손익금액
  tot_asst_amt: string // 총자산금액
  buy_mgn_amt: string // 매수증거금액
  mgna_tota: string // 증거금총액
  frcr_use_psbl_amt: string // 외화사용가능금액
  ustl_sll_amt_smtl: string // 미결제매도금액합계
  ustl_buy_amt_smtl: string // 미결제매수금액합계
  tot_frcr_cblc_smtl: string // 총외화잔고합계
  tot_loan_amt: string // 총대출금액
}
