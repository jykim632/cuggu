import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FileHeart, Users, Eye } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">
          환영합니다! 첫 청첩장을 만들어보세요.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              내 청첩장
            </CardTitle>
            <FileHeart className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 조회수
            </CardTitle>
            <Eye className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              RSVP 응답
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle>아직 청첩장이 없습니다</CardTitle>
          <CardDescription>
            첫 청첩장을 만들어보세요. 5분이면 완성됩니다!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" disabled>
            첫 청첩장 만들기
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            곧 사용 가능합니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
