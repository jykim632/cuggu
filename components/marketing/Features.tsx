import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

const features = [
  {
    title: "AI 웨딩 사진",
    description: "증명사진만 업로드하면 4장의 웨딩 화보 자동 생성",
    icon: "✨",
  },
  {
    title: "5가지 템플릿",
    description: "클래식, 모던, 빈티지, 플로럴, 미니멀 중 선택",
    icon: "🎨",
  },
  {
    title: "RSVP 관리",
    description: "참석 여부, 축하 메시지 통합 관리",
    icon: "📋",
  },
];

export function Features() {
  return (
    <section className="py-20 px-4 bg-white" id="features">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          핵심 기능
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          전통적인 청첩장의 불편함을 AI 기술로 해결합니다
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="text-5xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
