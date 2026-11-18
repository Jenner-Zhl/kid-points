import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态路由
export const dynamic = "force-dynamic";

/**
 * PUT /api/templates/[id]
 * 更新指定事项模板（名称、预设分值、图标、状态等）
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, type, defaultPoints, category, icon, sortOrder, isActive } =
      body;

    console.log(`[API] 修改事项模板: ID=${id}, title=${title}`);

    let points: number | undefined = undefined;
    if (defaultPoints !== undefined) {
      points = parseInt(defaultPoints, 10);
      if (isNaN(points)) {
        return NextResponse.json(
          { success: false, error: "预设分值必须为有效整数" },
          { status: 400 }
        );
      }
      if (Math.abs(points) > 100) {
        return NextResponse.json(
          { success: false, error: "预设分值幅度不能超过 ±100 分" },
          { status: 400 }
        );
      }
      if (type === "DEDUCT" && points > 0) {
        points = -points;
      } else if (type === "ADD" && points < 0) {
        points = Math.abs(points);
      }
    }

    // 安全处理排序权重
    let cleanSortOrder: number | undefined = undefined;
    if (sortOrder !== undefined) {
      const parsed = parseInt(sortOrder, 10);
      cleanSortOrder = isNaN(parsed) ? 0 : parsed;
    }

    const updated = await prisma.pointTemplate.update({
      where: { id },
      data: {
        title: title ? title.trim().slice(0, 50) : undefined,
        type: type || undefined,
        defaultPoints: points,
        category: category ? category.trim().slice(0, 20) : undefined,
        icon: icon ? icon.trim().slice(0, 10) : undefined,
        sortOrder: cleanSortOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[API] 更新事项模板失败:", error);
    return NextResponse.json(
      { success: false, error: "更新事项模板失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * 删除或停用事项模板
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[API] 删除事项模板: ID=${id}`);

    // 删除模板，历史流水中关联的 templateId 将由数据库外键置为 NULL，保留流水真实性
    await prisma.pointTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "模板已删除",
    });
  } catch (error) {
    console.error("[API] 删除事项模板失败:", error);
    return NextResponse.json(
      { success: false, error: "删除事项模板失败" },
      { status: 500 }
    );
  }
}
