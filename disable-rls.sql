-- 1단계: 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own trading history" ON trading;
DROP POLICY IF EXISTS "Users can insert their own trading history" ON trading;
DROP POLICY IF EXISTS "Users can update their own trading history" ON trading;

-- 2단계: RLS 비활성화 (테스트용)
ALTER TABLE trading DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'trading';

-- 결과가 rowsecurity = false 이면 성공!
