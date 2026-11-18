import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态路由
export const dynamic = "force-dynamic";

/**
 * DELETE /api/records/[id]
 * 撤销/删除一笔积分流水，并安全回滚孩子当前总积分
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[API] 收到撤销积分流水请求: ID=${id}`);

    // 使用事务确保“删除流水”与“回滚总积分”原子一致
    const result = await prisma.$transaction(async (tx) => {
      // 1. 查询待撤销的历史流水
      const record = await tx.pointRecord.findUnique({
        where: { id },
      });

      if (!record) {
        throw new Error("未找到对应的流水记录");
      }

      // 2. 查询对应的孩子
      const child = await tx.child.findUnique({
        where: { id: record.childId },
      });

      if (!child) {
        throw new Error("未找到关联的孩子信息");
      }

      // 3. 计算回滚后的分值：例如原记录是 +5，回滚则扣除 5；原记录是 -3，回滚则补回 3
      const rolledBackPoints = child.currentPoints - record.pointsChange;
      console.log(
        `[API] 撤销操作分值回滚: 原总分=${child.currentPoints}, 撤销变动=${record.pointsChange}, 回滚后总分=${rolledBackPoints}`
      );

      // 4. 更新孩子积分
      const updatedChild = await tx.child.update({
        where: { id: child.id },
        data: {
          currentPoints: rolledBackPoints,
        },
      });

      // 5. 删除该笔历史流水
      await tx.pointRecord.delete({
        where: { id },
      });

      return {
        deletedId: id,
        newPoints: updatedChild.currentPoints,
      };
    });

    return NextResponse.json({
      success: true,
      message: "记录已成功撤销并回滚积分",
      data: result,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "撤销记录失败";
    console.error("[API] 撤销记录发生错误:", errMessage);
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
