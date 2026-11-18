import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBeijingStartOfToday } from "@/lib/utils";

// 强制动态路由，防止在 Next.js 构建阶段静态执行数据库查询
export const dynamic = "force-dynamic";

/**
 * GET /api/stats
 * 获取近 7 天积分趋势及习惯分布数据
 * 架构优化：单次批量拉取 7 天记录，并在内存中依据北京时间划定天维度，避免 7 次串行数据库往返及跨时区偏差
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reqChildId = searchParams.get("childId");
    console.log(`[API] 获取积分趋势统计数据: childId=${reqChildId || "默认"}`);

    // 1. 定位目标孩子
    const child = reqChildId
      ? await prisma.child.findUnique({ where: { id: reqChildId } })
      : await prisma.child.findFirst();

    if (!child) {
      return NextResponse.json({
        success: true,
        data: { trend: [] },
      });
    }

    // 2. 计算北京时间近 7 天的时间边界 (以北京时间当天 00:00:00 为基准向前推 6 天)
    const beijingTodayStart = getBeijingStartOfToday();
    const oneDayMs = 24 * 3600 * 1000;
    const sixDaysAgoStart = new Date(beijingTodayStart.getTime() - 6 * oneDayMs);
    const tomorrowStart = new Date(beijingTodayStart.getTime() + oneDayMs);

    // 3. 性能优化：单次批量查询近 7 天的所有流水记录，充分利用 @@index([childId, recordedAt(sort: Desc)])
    const records = await prisma.pointRecord.findMany({
      where: {
        childId: child.id,
        recordedAt: {
          gte: sixDaysAgoStart,
          lt: tomorrowStart,
        },
      },
      select: {
        pointsChange: true,
        recordedAt: true,
      },
    });

    console.log(
      `[API] 统计聚合近 7 天流水: 孩子=${child.name}, 匹配总记录数=${records.length}`
    );

    // 4. 内存中按 7 个自然天进行分桶聚合，计算每日加分、扣分与净值
    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const beijingOffsetMs = 8 * 3600 * 1000;
    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const dayStartMs = beijingTodayStart.getTime() - i * oneDayMs;
      const dayEndMs = dayStartMs + oneDayMs;

      // 提取属于该天的流水记录
      let added = 0;
      let deducted = 0;
      for (const r of records) {
        const time = r.recordedAt.getTime();
        if (time >= dayStartMs && time < dayEndMs) {
          if (r.pointsChange > 0) {
            added += r.pointsChange;
          } else {
            deducted += Math.abs(r.pointsChange);
          }
        }
      }

      // 根据北京时间计算对应的月日及周几
      const beijingSnapshot = new Date(dayStartMs + beijingOffsetMs);
      const monthStr = String(beijingSnapshot.getUTCMonth() + 1).padStart(2, "0");
      const dateStr = String(beijingSnapshot.getUTCDate()).padStart(2, "0");
      const dayOfWeek = beijingSnapshot.getUTCDay();

      trend.push({
        date: `${monthStr}-${dateStr}`,
        dayName: dayNames[dayOfWeek],
        added,
        deducted,
        net: added - deducted,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        trend,
      },
    });
  } catch (error) {
    console.error("[API] 获取统计数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
