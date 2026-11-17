"use client";

import confetti from "canvas-confetti";

/**
 * 触发加分激励彩带微动画
 * 当记录正向加分时给家长和小朋友即时积极反馈
 */
export function triggerConfetti() {
  try {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"],
    });
  } catch (error) {
    console.warn("[Confetti] 彩带特效触发跳过:", error);
  }
}
