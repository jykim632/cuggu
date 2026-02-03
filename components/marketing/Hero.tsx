import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="py-20 px-4 text-center bg-gradient-to-br from-pink-50 to-blue-50">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          AI로 만드는 특별한
          <br />
          웨딩 청첩장
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8">
          증명사진만으로 웨딩 화보 4장 무료 생성
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">무료로 시작하기</Button>
          <Button size="lg" variant="outline">
            템플릿 보기
          </Button>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          💳 신용카드 없이 시작 • ✨ AI 사진 2회 무료
        </div>
      </div>
    </section>
  );
}
