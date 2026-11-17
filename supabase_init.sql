-- =====================================================================
-- 儿童积分管理系统 (KidPoints) 云端数据库初始化脚本
-- 适用数据库：Supabase / PostgreSQL
-- 说明：包含完整的表结构创建、高频查询索引及 12 个实用预设事项模板数据
-- 特点：幂等设计（使用 IF NOT EXISTS 与 ON CONFLICT，重复执行不会报错）
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 孩子信息表 (Child)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Child" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,                        -- 孩子姓名或小名
    "avatar" TEXT NOT NULL DEFAULT '👦',         -- 头像标识或内置 Emoji
    "currentPoints" INTEGER NOT NULL DEFAULT 0,  -- 当前总积分（原生支持负分）
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. 积分事项模板表 (PointTemplate)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PointTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT REFERENCES "Child"("id") ON DELETE CASCADE, -- 关联孩子(NULL表示全局通用)
    "title" TEXT NOT NULL,                       -- 事项名称，如 "光盘行动", "整理玩具"
    "type" TEXT NOT NULL,                        -- 事项类型: 'ADD'(加分) 或 'DEDUCT'(扣分)
    "defaultPoints" INTEGER NOT NULL,           -- 预设分值 (正数加分，负数扣分)
    "category" TEXT NOT NULL DEFAULT '日常',     -- 事项分类
    "icon" TEXT NOT NULL DEFAULT 'Star',         -- 显示图标或 Emoji
    "sortOrder" INTEGER NOT NULL DEFAULT 0,      -- 排序优先级 (数值越小越靠前)
    "isActive" BOOLEAN NOT NULL DEFAULT true,    -- 是否在快捷区展示
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. 积分历史流水明细表 (PointRecord)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PointRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL REFERENCES "Child"("id") ON DELETE CASCADE,
    "templateId" TEXT REFERENCES "PointTemplate"("id") ON DELETE SET NULL, -- 模板删除后流水仍保留
    "title" TEXT NOT NULL,                       -- 事项名称快照
    "type" TEXT NOT NULL,                        -- 变动类型: 'ADD' 或 'DEDUCT'
    "pointsChange" INTEGER NOT NULL,            -- 本次变动分值 (+5 或 -3)
    "balanceAfter" INTEGER NOT NULL,            -- 变动后的历史余额快照
    "remark" TEXT,                               -- 备注详情
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 行为实际发生时间
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP  -- 记录入库时间
);

-- ---------------------------------------------------------------------
-- 4. 优化索引 (提高流水查询与时间轴筛选性能)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "idx_point_record_child_recorded" 
ON "PointRecord" ("childId", "recordedAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_point_template_active_sort" 
ON "PointTemplate" ("isActive", "sortOrder" ASC);

-- ---------------------------------------------------------------------
-- 5. 初始化默认数据：孩子与初始激励金
-- ---------------------------------------------------------------------
INSERT INTO "Child" ("id", "name", "avatar", "currentPoints")
VALUES ('default-child-01', '小宝', '👦', 20)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PointRecord" ("id", "childId", "title", "type", "pointsChange", "balanceAfter", "remark")
VALUES ('init-rec-01', 'default-child-01', '系统初始激励金', 'ADD', 20, 20, '欢迎使用儿童积分管理系统，加油成为好习惯之星！')
ON CONFLICT ("id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. 初始化默认数据：12 个常用加分好习惯与扣分戒线模板
-- ---------------------------------------------------------------------
INSERT INTO "PointTemplate" ("id", "title", "type", "defaultPoints", "category", "icon", "sortOrder") VALUES
-- 加分好习惯
('t-01', '光盘行动', 'ADD', 5, '生活自理', '🍽️', 1),
('t-02', '自主整理玩具/房间', 'ADD', 3, '生活自理', '🧸', 2),
('t-03', '专注阅读30分钟', 'ADD', 5, '学习成长', '📖', 3),
('t-04', '认真按时完成作业', 'ADD', 5, '学习成长', '✍️', 4),
('t-05', '自主按时刷牙洗脸', 'ADD', 2, '生活自理', '🪥', 5),
('t-06', '礼貌问候/主动分享', 'ADD', 3, '礼貌纪律', '🤝', 6),
('t-07', '按时上床睡觉', 'ADD', 3, '日常作息', '🌙', 7),
-- 扣分警示项 (原生支持扣到负分)
('t-08', '严重挑食/浪费食物', 'DEDUCT', -3, '生活自理', '🍚', 101),
('t-09', '超时看电视/手机平板', 'DEDUCT', -3, '日常作息', '📱', 102),
('t-10', '赖床磨蹭/拖延时间', 'DEDUCT', -2, '日常作息', '⏰', 103),
('t-11', '乱发脾气/顶嘴/打人', 'DEDUCT', -5, '礼貌纪律', '😤', 104),
('t-12', '随手乱扔垃圾/弄乱房间', 'DEDUCT', -2, '生活自理', '🚯', 105)
ON CONFLICT ("id") DO NOTHING;
