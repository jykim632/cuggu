"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileHeart, Loader2 } from "lucide-react";

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

      const result = await response.json();

      if (!response.ok) {
        // 개수 제한 에러 (403)
        if (response.status === 403) {
          alert(`${result.error}\n\n${result.message}`);
        } else {
          alert("청첩장 생성에 실패했습니다. 다시 시도해주세요.");
        }
        setIsCreating(false);
        return;
      }

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
    <Card>
      <CardContent className="text-center py-16">
        {/* Icon */}
        <FileHeart className="w-10 h-10 text-stone-300 mx-auto mb-4" />

        {/* Title & Description */}
        <h3 className="text-base font-medium text-stone-900 mb-2">
          첫 청첩장을 만들어보세요
        </h3>
        <p className="text-sm text-stone-500 mb-8">
          템플릿을 선택하고 내용을 입력하면 바로 공유할 수 있습니다
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
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
      </CardContent>
    </Card>
  );
}
