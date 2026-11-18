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

    // 为每个孩子统计各自今日加分与扣分汇总
    const enrichedChildren = await Promise.all(
      allChildren.map(async (child) => {
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

        return {
          ...child,
          todayAdded,
          todayDeducted,
          todayNet: todayAdded - todayDeducted,
        };
      })
    );

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
 * 新增一个孩子（支持二宝、三宝扩展）
 */
export async function POST(request: Request) {
  try {
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
