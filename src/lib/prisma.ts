import { PrismaClient } from "@prisma/client";

/**
 * 全局 PrismaClient 实例管理器
 * 防止在 Next.js 开发环境下热重载时创建过多的数据库连接
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建 Prisma 实例并配置开发环境下的查询与错误日志
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
