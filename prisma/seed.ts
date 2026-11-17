import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 数据库初始种子数据填充
 * 创建默认孩子与常见实用的加分/扣分模板
 */
async function main() {
  console.log("[Seed] 开始初始化预设数据...");

  // 1. 初始化或获取默认孩子信息
  let child = await prisma.child.findFirst();
  if (!child) {
    child = await prisma.child.create({
      data: {
        name: "小宝",
        avatar: "👦",
        currentPoints: 20, // 初始激励底分
      },
    });
    console.log(`[Seed] 成功创建默认孩子: ${child.name} (ID: ${child.id})`);
  } else {
    console.log(`[Seed] 发现已有孩子记录: ${child.name}`);
  }

  // 2. 检查模板数量，如果为空则批量写入预设模板
  const templateCount = await prisma.pointTemplate.count();
  if (templateCount === 0) {
    const defaultTemplates = [
      // === 正向激励加分项 ===
      {
        title: "光盘行动",
        type: "ADD",
        defaultPoints: 5,
        category: "生活自理",
        icon: "🍽️",
        sortOrder: 1,
      },
      {
        title: "自主整理玩具/房间",
        type: "ADD",
        defaultPoints: 3,
        category: "生活自理",
        icon: "🧸",
        sortOrder: 2,
      },
      {
        title: "专注阅读30分钟",
        type: "ADD",
        defaultPoints: 5,
        category: "学习成长",
        icon: "📖",
        sortOrder: 3,
      },
      {
        title: "认真按时完成作业",
        type: "ADD",
        defaultPoints: 5,
        category: "学习成长",
        icon: "✍️",
        sortOrder: 4,
      },
      {
        title: "自主按时刷牙洗脸",
        type: "ADD",
        defaultPoints: 2,
        category: "生活自理",
        icon: "🪥",
        sortOrder: 5,
      },
      {
        title: "礼貌问候/主动分享",
        type: "ADD",
        defaultPoints: 3,
        category: "礼貌纪律",
        icon: "🤝",
        sortOrder: 6,
      },
      {
        title: "按时上床睡觉",
        type: "ADD",
        defaultPoints: 3,
        category: "日常作息",
        icon: "🌙",
        sortOrder: 7,
      },

      // === 行为约束扣分项 (支持扣到负分) ===
      {
        title: "严重挑食/浪费食物",
        type: "DEDUCT",
        defaultPoints: -3,
        category: "生活自理",
        icon: "🍚",
        sortOrder: 101,
      },
      {
        title: "超时看电视/手机平板",
        type: "DEDUCT",
        defaultPoints: -3,
        category: "日常作息",
        icon: "📱",
        sortOrder: 102,
      },
      {
        title: "赖床磨蹭/拖延时间",
        type: "DEDUCT",
        defaultPoints: -2,
        category: "日常作息",
        icon: "⏰",
        sortOrder: 103,
      },
      {
        title: "乱发脾气/顶嘴/打人",
        type: "DEDUCT",
        defaultPoints: -5,
        category: "礼貌纪律",
        icon: "😤",
        sortOrder: 104,
      },
      {
        title: "随手乱扔垃圾/弄乱房间",
        type: "DEDUCT",
        defaultPoints: -2,
        category: "生活自理",
        icon: "🚯",
        sortOrder: 105,
      },
    ];

    for (const t of defaultTemplates) {
      await prisma.pointTemplate.create({
        data: {
          ...t,
          childId: child.id,
        },
      });
    }
    console.log(`[Seed] 成功插入 ${defaultTemplates.length} 个预设事项模板`);
  } else {
    console.log(`[Seed] 已存在 ${templateCount} 个事项模板，跳过模板填充`);
  }

  // 3. 检查是否有流水，若无则插入一条初始欢迎流水
  const recordCount = await prisma.pointRecord.count();
  if (recordCount === 0 && child) {
    await prisma.pointRecord.create({
      data: {
        childId: child.id,
        title: "系统初始激励金",
        type: "ADD",
        pointsChange: 20,
        balanceAfter: 20,
        remark: "欢迎使用儿童积分管理系统，加油成为好习惯之星！",
      },
    });
    console.log("[Seed] 成功创建初始积分流水记录");
  }

  console.log("[Seed] 数据库种子数据填充完成！");
}

main()
  .catch((e) => {
    console.error("[Seed] 初始化数据发生错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
