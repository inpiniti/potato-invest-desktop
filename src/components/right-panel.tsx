import { useStockStore } from '@/stores/useStockStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export function RightPanel() {
  const { ticker, news, toss } = useStockStore()

  if (!ticker) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">종목을 선택해주세요</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="news" className="h-full flex flex-col">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
        <TabsTrigger value="news" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
          뉴스
        </TabsTrigger>
        <TabsTrigger value="community" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
          커뮤니티
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        <TabsContent value="news" className="m-0 p-3">
          <div className="space-y-2">
            {news && news.length > 0 ? (
              news.map((article, index) => (
                <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xs font-medium line-clamp-2 flex-1">
                        {article.title}
                      </CardTitle>
                      {article.thumbnail && (
                        <img 
                          src={article.thumbnail} 
                          alt="" 
                          className="w-12 h-12 object-cover rounded flex-shrink-0"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{article.author}</span>
                      <span>{new Date(article.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                뉴스가 없습니다
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="community" className="m-0 p-3">
          <div className="space-y-2">
            {toss && toss.length > 0 ? (
              toss.map((comment, index) => (
                <Card key={index} className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium">
                        {comment.author || '익명'}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {comment.title && (
                      <p className="text-xs font-medium mb-1">{comment.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {comment.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                커뮤니티 댓글이 없습니다
              </div>
            )}
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  )
}
