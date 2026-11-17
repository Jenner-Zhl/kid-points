import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态路由，防止在 Next.js 构建阶段静态执行数据库查询
export const dynamic = "force-dynamic";

/**
 * GET /api/templates
 * 获取所有事项模板，支持按分类与排序权重输出
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "ADD" | "DEDUCT" | null
    const onlyActive = searchParams.get("onlyActive") !== "false";

    console.log(`[API] 查询事项模板列表: type=${type}, onlyActive=${onlyActive}`);

    const whereClause: {
      type?: string;
      isActive?: boolean;
    } = {};

    if (type) {
      whereClause.type = type;
    }
    if (onlyActive) {
      whereClause.isActive = true;
    }

    const templates = await prisma.pointTemplate.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("[API] 获取事项模板失败:", error);
    return NextResponse.json(
      { success: false, error: "获取事项模板失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * 创建新的事项模板
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, defaultPoints, category, icon, sortOrder } = body;

    if (!title || !type || defaultPoints === undefined) {
      return NextResponse.json(
        { success: false, error: "标题、类型和预设分值不能为空" },
        { status: 400 }
      );
    }

    // 确保扣分项保存为负数，加分项保存为正数
    let points = parseInt(defaultPoints, 10);
    if (type === "DEDUCT" && points > 0) {
      points = -points;
    } else if (type === "ADD" && points < 0) {
      points = Math.abs(points);
    }

    console.log(`[API] 创建新事项模板: ${title}, type=${type}, points=${points}`);

    const template = await prisma.pointTemplate.create({
      data: {
        title: title.trim(),
        type,
        defaultPoints: points,
        category: category?.trim() || "日常",
        icon: icon || (type === "ADD" ? "🌟" : "⚠️"),
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("[API] 创建事项模板失败:", error);
    return NextResponse.json(
      { success: false, error: "创建事项模板失败" },
      { status: 500 }
    );
  }
}
