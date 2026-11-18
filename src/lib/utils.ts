import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

/**
 * 样式类名合并辅助工具函数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期时间（例如：2026年11月17日 17:15）
 */
export function formatDateTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "yyyy年MM月dd日 HH:mm", { locale: zhCN });
  } catch (error) {
    console.error("[utils] 格式化日期失败:", error);
    return String(date);
  }
}

/**
 * 格式化简短时间（例如：今天 14:30 或 11-17 14:30）
 */
export function formatShortTime(date: Date | string): string {
  try {
    const target = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const isToday =
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate();

    if (isToday) {
      return `今天 ${format(target, "HH:mm")}`;
    }
    return format(target, "MM-dd HH:mm");
  } catch (error) {
    console.error("[utils] 格式化简短时间失败:", error);
    return String(date);
  }
}

/**
 * 格式化分值变动显示（例如：+5、-3、0）
 */
export function formatPoints(points: number): string {
  if (points > 0) return `+${points}`;
  return `${points}`;
}

/**
 * 获取北京时间（UTC+8）当天的 00:00:00 对应的真实时间对象
 * 解决海外 Serverless (如 Vercel 容器在 UTC 时区) 统计“今日加减分”时时区偏移 8 小时的问题
 */
export function getBeijingStartOfToday(): Date {
  const now = new Date();
  // 计算当前系统相对于 UTC+8 的偏差
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingTime = new Date(utc + 3600000 * 8);
  beijingTime.setHours(0, 0, 0, 0);
  // 转回对应的时间戳
  return new Date(beijingTime.getTime() - 3600000 * 8);
}
