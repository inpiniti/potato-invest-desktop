-- =====================================================
-- 이슈 게시판 RLS 정책 수정
-- Supabase 인증을 사용하지 않으므로 모든 사용자 접근 허용
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "issues_insert_authenticated" ON issues;
DROP POLICY IF EXISTS "issues_update_owner" ON issues;
DROP POLICY IF EXISTS "issues_delete_owner" ON issues;
DROP POLICY IF EXISTS "issue_comments_insert_authenticated" ON issue_comments;
DROP POLICY IF EXISTS "issue_comments_delete_owner" ON issue_comments;

-- 새로운 정책: 모든 사용자가 게시글 작성 가능
CREATE POLICY "issues_insert_all" ON issues
    FOR INSERT WITH CHECK (true);

-- 새로운 정책: 모든 사용자가 게시글 수정 가능
CREATE POLICY "issues_update_all" ON issues
    FOR UPDATE USING (true);

-- 새로운 정책: 모든 사용자가 게시글 삭제 가능
CREATE POLICY "issues_delete_all" ON issues
    FOR DELETE USING (true);

-- 새로운 정책: 모든 사용자가 댓글 작성 가능
CREATE POLICY "issue_comments_insert_all" ON issue_comments
    FOR INSERT WITH CHECK (true);

-- 새로운 정책: 모든 사용자가 댓글 삭제 가능
CREATE POLICY "issue_comments_delete_all" ON issue_comments
    FOR DELETE USING (true);
