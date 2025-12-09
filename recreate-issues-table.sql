-- =====================================================
-- 이슈 게시판 author_id 타입 변경
-- UUID -> TEXT (계좌번호 저장용)
-- =====================================================

-- 1. 기존 테이블 삭제 후 재생성 (데이터가 없는 경우)
-- 또는 컬럼 타입 변경

-- 방법 1: 기존 테이블 삭제 후 재생성 (권장 - 데이터가 없을 때)
DROP TABLE IF EXISTS issue_comments;
DROP TABLE IF EXISTS issues;

-- issues 테이블 재생성 (author_id를 TEXT로 변경)
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,               -- TEXT로 변경 (계좌번호 저장)
    author_name VARCHAR(100),
    type VARCHAR(10) NOT NULL CHECK (type IN ('bug', 'feature')),
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- issue_comments 테이블 재생성 (author_id를 TEXT로 변경)
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,               -- TEXT로 변경 (계좌번호 저장)
    author_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_author ON issues(author_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);

-- RLS 활성화
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자 허용
CREATE POLICY "issues_select_all" ON issues FOR SELECT USING (true);
CREATE POLICY "issues_insert_all" ON issues FOR INSERT WITH CHECK (true);
CREATE POLICY "issues_update_all" ON issues FOR UPDATE USING (true);
CREATE POLICY "issues_delete_all" ON issues FOR DELETE USING (true);

CREATE POLICY "issue_comments_select_all" ON issue_comments FOR SELECT USING (true);
CREATE POLICY "issue_comments_insert_all" ON issue_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "issue_comments_delete_all" ON issue_comments FOR DELETE USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
