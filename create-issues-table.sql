-- =====================================================
-- 이슈 게시판 테이블 (버그 제보 / 기능 제보)
-- =====================================================

-- 1. 게시글 테이블 (issues)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,           -- 제목
    content TEXT NOT NULL,                  -- 내용
    author_id UUID NOT NULL,                -- 작성자 ID (auth.users.id)
    author_name VARCHAR(100),               -- 작성자 이름 (표시용)
    type VARCHAR(10) NOT NULL CHECK (type IN ('bug', 'feature')),  -- 타입: 버그 또는 기능
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),  -- 상태
    created_at TIMESTAMPTZ DEFAULT NOW(),   -- 생성일
    updated_at TIMESTAMPTZ DEFAULT NOW()    -- 수정일
);

-- 2. 댓글 테이블 (issue_comments)
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,  -- 게시글 ID
    content TEXT NOT NULL,                  -- 댓글 내용
    author_id UUID NOT NULL,                -- 작성자 ID (auth.users.id)
    author_name VARCHAR(100),               -- 작성자 이름 (표시용)
    created_at TIMESTAMPTZ DEFAULT NOW()    -- 생성일
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_author ON issues(author_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- 5. 정책 설정 - 모든 사용자가 조회 가능
CREATE POLICY "issues_select_all" ON issues
    FOR SELECT USING (true);

CREATE POLICY "issue_comments_select_all" ON issue_comments
    FOR SELECT USING (true);

-- 6. 정책 설정 - 인증된 사용자만 게시글 작성 가능
CREATE POLICY "issues_insert_authenticated" ON issues
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "issue_comments_insert_authenticated" ON issue_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. 정책 설정 - 작성자만 수정/삭제 가능
CREATE POLICY "issues_update_owner" ON issues
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "issues_delete_owner" ON issues
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "issue_comments_delete_owner" ON issue_comments
    FOR DELETE USING (auth.uid() = author_id);

-- 8. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 사용 예시
-- =====================================================
-- 
-- 게시글 조회 (버그만):
-- SELECT * FROM issues WHERE type = 'bug' ORDER BY created_at DESC;
--
-- 게시글 조회 (기능 제보만):
-- SELECT * FROM issues WHERE type = 'feature' ORDER BY created_at DESC;
--
-- 특정 게시글의 댓글 조회:
-- SELECT * FROM issue_comments WHERE issue_id = 'uuid' ORDER BY created_at ASC;
