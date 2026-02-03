"use client";

import { motion } from "framer-motion";

interface Petal {
  id: number;
  x: number;
  delay: number;
  duration: number;
}

export function FallingPetals() {
  // 10개의 랜덤 꽃잎 생성
  const petals: Petal[] = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // 0-100% 가로 위치
    delay: Math.random() * 5, // 0-5초 지연
    duration: 8 + Math.random() * 4, // 8-12초 낙하 시간
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute -top-8 h-6 w-6 rounded-full bg-pink-200 opacity-60"
          style={{ left: `${petal.x}%` }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, Math.sin(petal.id) * 50, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
