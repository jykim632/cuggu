"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export function EmptyState() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateInvitation = async () => {
    setIsCreating(true);

    try {
      // 기본 청첩장 데이터로 생성
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "classic",
          groom: {
            name: "신랑",
          },
          bride: {
            name: "신부",
          },
          wedding: {
            date: new Date(
              new Date().setMonth(new Date().getMonth() + 3)
            ).toISOString(), // 3개월 후
            venue: {
              name: "예식장",
              address: "주소를 입력하세요",
            },
          },
          content: {
            greeting: "",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("청첩장 생성 실패");
      }

      const result = await response.json();

      if (result.success && result.data?.id) {
        // 편집기로 이동
        router.push(`/editor/${result.data.id}`);
      }
    } catch (error) {
      console.error("청첩장 생성 실패:", error);
      alert("청첩장 생성에 실패했습니다. 다시 시도해주세요.");
      setIsCreating(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="text-center py-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Icon */}
          <div className="text-6xl mb-4">💌</div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            첫 청첩장을 만들어보세요
          </h3>
          <p className="text-gray-600 mb-8">
            AI가 도와주는 5분 완성 청첩장
          </p>

          {/* 3-step guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-pink-600 font-bold text-lg">1</span>
              </div>
              <p className="text-sm font-medium text-gray-700">템플릿 선택</p>
              <p className="text-xs text-gray-500 mt-1">20+ 프리미엄 디자인</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">2</span>
              </div>
              <p className="text-sm font-medium text-gray-700">내용 입력</p>
              <p className="text-xs text-gray-500 mt-1">드래그 앤 드롭 편집</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <p className="text-sm font-medium text-gray-700">공유하기</p>
              <p className="text-xs text-gray-500 mt-1">카카오톡 & QR 코드</p>
            </motion.div>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              className="shadow-lg"
              onClick={handleCreateInvitation}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "첫 청첩장 만들기"
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              무료로 시작하고, 필요한 기능만 결제하세요
            </p>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
