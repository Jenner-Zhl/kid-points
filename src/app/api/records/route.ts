import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态路由，防止在 Next.js 构建阶段静态执行数据库查询
export const dynamic = "force-dynamic";

/**
 * GET /api/records
 * 获取历史积分变动流水，支持分页和按类型过滤
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "ADD" | "DEDUCT" | null
    const childId = searchParams.get("childId"); // 特定孩子筛选
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    console.log(
      `[API] 获取积分流水: type=${type || "全部"}, childId=${childId || "全部"}, page=${page}, limit=${limit}`
    );

    const whereClause: {
      type?: string;
      childId?: string;
    } = {};

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    if (childId && childId !== "ALL") {
      whereClause.childId = childId;
    }

    const [records, total] = await Promise.all([
      prisma.pointRecord.findMany({
        where: whereClause,
        include: {
          child: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.pointRecord.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[API] 获取流水列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取流水列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records
 * 核心接口：录入一笔积分流水并原子更新孩子总分
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      childId: reqChildId,
      templateId,
      title,
      type,
      pointsChange,
      remark,
      recordedAt,
    } = body;

    console.log(
      `[API] 准备录入积分流水: title=${title}, type=${type}, pointsChange=${pointsChange}`
    );

    if (!title || !type || pointsChange === undefined) {
      return NextResponse.json(
        { success: false, error: "标题、类型和变动分值不能为空" },
        { status: 400 }
      );
    }

    // 确保加分时数值为正，扣分时数值为负，并防止非数字输入异常
    let finalPoints = parseInt(pointsChange, 10);
    if (isNaN(finalPoints)) {
      return NextResponse.json(
        { success: false, error: "变动分值必须为有效整数" },
        { status: 400 }
      );
    }
    if (type === "DEDUCT" && finalPoints > 0) {
      finalPoints = -finalPoints;
    } else if (type === "ADD" && finalPoints < 0) {
      finalPoints = Math.abs(finalPoints);
    }

    // 使用数据库事务保证“插入流水”与“更新孩子当前总积分”原子一致
    const result = await prisma.$transaction(async (tx) => {
      // 1. 获取目标孩子信息
      let targetChild = reqChildId
        ? await tx.child.findUnique({ where: { id: reqChildId } })
        : await tx.child.findFirst();

      if (!targetChild) {
        // 若孩子不存在则创建初始孩子
        targetChild = await tx.child.create({
          data: {
            name: "小宝",
            avatar: "👦",
            currentPoints: 0,
          },
        });
      }

      // 2. 计算变动后的积分余额（无下限限制，原生支持负数）
      const newBalance = targetChild.currentPoints + finalPoints;
      console.log(
        `[API] 积分变更核算: 原总分=${targetChild.currentPoints}, 变动=${finalPoints}, 变动后结余=${newBalance}`
      );

      // 3. 插入历史流水明细
      const record = await tx.pointRecord.create({
        data: {
          childId: targetChild.id,
          templateId: templateId || null,
          title: title.trim(),
          type,
          pointsChange: finalPoints,
          balanceAfter: newBalance,
          remark: remark?.trim() || null,
          recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        },
      });

      // 4. 更新孩子当前总积分
      const updatedChild = await tx.child.update({
        where: { id: targetChild.id },
        data: {
          currentPoints: newBalance,
        },
      });

      return { record, updatedChild };
    });

    console.log(
      `[API] 积分流水写入成功: 流水ID=${result.record.id}, 最新总分=${result.updatedChild.currentPoints}`
    );

    return NextResponse.json({
      success: true,
      data: {
        record: result.record,
        currentPoints: result.updatedChild.currentPoints,
      },
    });
  } catch (error) {
    console.error("[API] 录入积分流水失败:", error);
    return NextResponse.json(
      { success: false, error: "录入积分流水失败" },
      { status: 500 }
    );
  }
}
