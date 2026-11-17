import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态路由，防止在 Next.js 构建阶段静态执行数据库查询
export const dynamic = "force-dynamic";

/**
 * GET /api/children
 * 获取当前孩子信息及积分总览
 */
export async function GET() {
  try {
    console.log("[API] 请求获取孩子列表信息");
    // 获取第一个孩子（单孩子场景），如果不存在则自动创建一个默认孩子
    let child = await prisma.child.findFirst();

    if (!child) {
      console.log("[API] 未发现孩子信息，自动初始化默认孩子");
      child = await prisma.child.create({
        data: {
          name: "小宝",
          avatar: "👦",
          currentPoints: 0,
        },
      });
    }

    // 统计今日加分与扣分汇总
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRecords = await prisma.pointRecord.findMany({
      where: {
        childId: child.id,
        recordedAt: {
          gte: startOfToday,
        },
      },
    });

    let todayAdded = 0;
    let todayDeducted = 0;
    for (const r of todayRecords) {
      if (r.pointsChange > 0) {
        todayAdded += r.pointsChange;
      } else {
        todayDeducted += Math.abs(r.pointsChange);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...child,
        todayAdded,
        todayDeducted,
        todayNet: todayAdded - todayDeducted,
      },
    });
  } catch (error) {
    console.error("[API] 获取孩子信息失败:", error);
    return NextResponse.json(
      { success: false, error: "获取孩子信息失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/children
 * 更新孩子昵称或头像
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, avatar } = body;

    console.log(`[API] 更新孩子信息: ID=${id}, name=${name}, avatar=${avatar}`);

    const updatedChild = await prisma.child.update({
      where: { id },
      data: {
        name: name?.trim() || undefined,
        avatar: avatar || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedChild,
    });
  } catch (error) {
    console.error("[API] 更新孩子信息失败:", error);
    return NextResponse.json(
      { success: false, error: "更新孩子信息失败" },
      { status: 500 }
    );
  }
}
