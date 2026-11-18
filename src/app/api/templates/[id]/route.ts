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
      if (type === "DEDUCT" && points > 0) {
        points = -points;
      } else if (type === "ADD" && points < 0) {
        points = Math.abs(points);
      }
    }

    const updated = await prisma.pointTemplate.update({
      where: { id },
      data: {
        title: title?.trim() || undefined,
        type: type || undefined,
        defaultPoints: points,
        category: category?.trim() || undefined,
        icon: icon || undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder, 10) : undefined,
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
