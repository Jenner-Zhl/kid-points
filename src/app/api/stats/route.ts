import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

/**
 * GET /api/stats
 * 获取近 7 天积分趋势及习惯分布数据
 */
export async function GET() {
  try {
    console.log("[API] 获取积分趋势统计数据");
    const child = await prisma.child.findFirst();
    if (!child) {
      return NextResponse.json({
        success: true,
        data: { trend: [], categoryStats: [] },
      });
    }

    // 统计过去 7 天的每日积分变化
    const trend = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = subDays(now, i);
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);

      const dayRecords = await prisma.pointRecord.findMany({
        where: {
          childId: child.id,
          recordedAt: {
            gte: start,
            lte: end,
          },
        },
      });

      let added = 0;
      let deducted = 0;
      for (const r of dayRecords) {
        if (r.pointsChange > 0) {
          added += r.pointsChange;
        } else {
          deducted += Math.abs(r.pointsChange);
        }
      }

      trend.push({
        date: format(targetDate, "MM-dd"),
        dayName: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
          targetDate.getDay()
        ],
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
