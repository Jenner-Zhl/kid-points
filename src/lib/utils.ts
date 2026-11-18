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
 * 获取北京时间（UTC+8）当天的 00:00:00 对应的统一标准时间对象
 * 采用时区无关的 UTC 偏移推算，彻底避免在不同宿主时区（如 Vercel UTC+0 或本地 UTC+8）下双重偏移导致的日期计算偏差
 */
export function getBeijingStartOfToday(): Date {
  const beijingOffsetMs = 8 * 3600 * 1000;
  // 将当前绝对时间平移 8 小时得到北京时间的时钟快照
  const shifted = new Date(Date.now() + beijingOffsetMs);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  // 计算出北京时间当天 00:00:00 对应的全球标准 UTC 时间戳
  return new Date(Date.UTC(year, month, date, 0, 0, 0) - beijingOffsetMs);
}
