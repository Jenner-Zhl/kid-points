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
    // 1. 事项模板数量配额防护：最多支持 50 个预设模板，防止恶意刷库或无序膨胀
    const templateCount = await prisma.pointTemplate.count();
    if (templateCount >= 50) {
      console.warn(`[API] 事项模板数量达到上限 (${templateCount}/50)，拒绝新增`);
      return NextResponse.json(
        { success: false, error: "事项模板库已达上限（最多 50 个），请删除无用模板后再试" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, type, defaultPoints, category, icon, sortOrder } = body;

    if (!title || !type || defaultPoints === undefined) {
      return NextResponse.json(
        { success: false, error: "标题、类型和预设分值不能为空" },
        { status: 400 }
      );
    }

    // 确保扣分项保存为负数，加分项保存为正数，并防止 NaN
    let points = parseInt(defaultPoints, 10);
    if (isNaN(points)) {
      return NextResponse.json(
        { success: false, error: "预设分值必须为有效整数" },
        { status: 400 }
      );
    }

    // 模板单次预设分值上下限保护 (最大 ±100 分)
    if (Math.abs(points) > 100) {
      return NextResponse.json(
        { success: false, error: "事项预设分值幅度不能超过 ±100 分" },
        { status: 400 }
      );
    }

    if (type === "DEDUCT" && points > 0) {
      points = -points;
    } else if (type === "ADD" && points < 0) {
      points = Math.abs(points);
    }

    // 安全处理排序权重，防止非数字异常
    const parsedSortOrder = sortOrder !== undefined ? parseInt(sortOrder, 10) : 0;
    const finalSortOrder = isNaN(parsedSortOrder) ? 0 : parsedSortOrder;

    // 字符串长度保护，避免恶意超长内容
    const cleanTitle = title.trim().slice(0, 50);
    const cleanCategory = (category?.trim() || "日常").slice(0, 20);
    const cleanIcon = (icon?.trim() || (type === "ADD" ? "🌟" : "⚠️")).slice(0, 10);

    console.log(`[API] 创建新事项模板: ${cleanTitle}, type=${type}, points=${points}`);

    const template = await prisma.pointTemplate.create({
      data: {
        title: cleanTitle,
        type,
        defaultPoints: points,
        category: cleanCategory,
        icon: cleanIcon,
        sortOrder: finalSortOrder,
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
