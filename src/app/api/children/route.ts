import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBeijingStartOfToday } from "@/lib/utils";

// 强制动态路由，防止在 Next.js 构建阶段静态执行数据库查询
export const dynamic = "force-dynamic";

/**
 * GET /api/children
 * 获取所有孩子列表，并计算各自今日的积分变动收支
 */
export async function GET() {
  try {
    console.log("[API] 请求获取孩子列表信息");

    let allChildren = await prisma.child.findMany({
      orderBy: { createdAt: "asc" },
    });

    // 如果数据库中暂无孩子，自动初始化第一个默认孩子
    if (allChildren.length === 0) {
      console.log("[API] 未发现孩子信息，自动初始化默认孩子");
      const defaultChild = await prisma.child.create({
        data: {
          name: "小宝",
          avatar: "👦",
          currentPoints: 0,
        },
      });
      allChildren = [defaultChild];
    }

    const startOfToday = getBeijingStartOfToday();

    // 性能优化：单次批量查询所有孩子今日的流水记录，避免 N+1 数据库往返请求
    const allTodayRecords = await prisma.pointRecord.findMany({
      where: {
        childId: { in: allChildren.map((c) => c.id) },
        recordedAt: { gte: startOfToday },
      },
    });

    // 内存中按孩子 ID 快速聚合今日收支
    const childStatsMap = new Map<string, { added: number; deducted: number }>();
    for (const r of allTodayRecords) {
      const stats = childStatsMap.get(r.childId) || { added: 0, deducted: 0 };
      if (r.pointsChange > 0) {
        stats.added += r.pointsChange;
      } else {
        stats.deducted += Math.abs(r.pointsChange);
      }
      childStatsMap.set(r.childId, stats);
    }

    const enrichedChildren = allChildren.map((child) => {
      const stats = childStatsMap.get(child.id) || { added: 0, deducted: 0 };
      return {
        ...child,
        todayAdded: stats.added,
        todayDeducted: stats.deducted,
        todayNet: stats.added - stats.deducted,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        children: enrichedChildren,
        // 兼容单孩子场景直接访问属性
        ...enrichedChildren[0],
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
 * POST /api/children
 * 新增一个孩子（支持二宝、三宝扩展，设全局上限最多 10 个）
 */
export async function POST(request: Request) {
  try {
    // 1. 配额安全防护：检查全局孩子档案数量（最多允许 10 位）
    const totalCount = await prisma.child.count();
    if (totalCount >= 10) {
      console.warn(`[API] 达到全局宝贝数量上限 (${totalCount}/10)，拦截新增请求`);
      return NextResponse.json(
        {
          success: false,
          error: "已达到系统上限（最多支持 10 位宝贝档案）。如需扩容，请联系作者后台处理（微信：zhanglong__zl）",
          code: "QUOTA_EXCEEDED",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, avatar, initialPoints } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "孩子姓名/昵称不能为空" },
        { status: 400 }
      );
    }

    const startPoints = parseInt(initialPoints, 10) || 0;
    console.log(`[API] 创建新孩子: name=${name}, avatar=${avatar}, initialPoints=${startPoints}`);

    const newChild = await prisma.$transaction(async (tx) => {
      const child = await tx.child.create({
        data: {
          name: name.trim(),
          avatar: avatar || "👧",
          currentPoints: startPoints,
        },
      });

      // 如果有初始分值，记录初始激励流水
      if (startPoints !== 0) {
        await tx.pointRecord.create({
          data: {
            childId: child.id,
            title: "初始积分",
            type: startPoints > 0 ? "ADD" : "DEDUCT",
            pointsChange: startPoints,
            balanceAfter: startPoints,
            remark: "欢迎新成员加入积分成长计划！",
          },
        });
      }

      return child;
    });

    return NextResponse.json({
      success: true,
      data: newChild,
    });
  } catch (error) {
    console.error("[API] 添加孩子失败:", error);
    return NextResponse.json(
      { success: false, error: "添加孩子失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/children
 * 更新指定孩子的昵称或头像
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

/**
 * DELETE /api/children
 * 删除指定孩子档案及其关联流水
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少孩子 ID" },
        { status: 400 }
      );
    }

    const total = await prisma.child.count();
    if (total <= 1) {
      return NextResponse.json(
        { success: false, error: "家庭中至少保留一位孩子档案" },
        { status: 400 }
      );
    }

    console.log(`[API] 删除孩子档案: ID=${id}`);
    await prisma.child.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "孩子档案已删除",
    });
  } catch (error) {
    console.error("[API] 删除孩子失败:", error);
    return NextResponse.json(
      { success: false, error: "删除孩子失败" },
      { status: 500 }
    );
  }
}
