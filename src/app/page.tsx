"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  History,
  PlusCircle,
  Clock,
} from "lucide-react";
import { ScoreCard } from "@/components/ScoreCard";
import { QuickActionModal } from "@/components/QuickActionModal";
import { CustomRecordModal } from "@/components/CustomRecordModal";
import { AddChildModal } from "@/components/AddChildModal";
import { formatShortTime } from "@/lib/utils";

interface TemplateItem {
  id: string;
  title: string;
  type: string;
  defaultPoints: number;
  category: string;
  icon: string;
}

interface ChildData {
  id: string;
  name: string;
  avatar: string;
  currentPoints: number;
  todayAdded?: number;
  todayDeducted?: number;
  todayNet?: number;
}

interface RecentRecord {
  id: string;
  childId?: string;
  child?: {
    id: string;
    name: string;
    avatar: string;
  };
  title: string;
  type: string;
  pointsChange: number;
  balanceAfter: number;
  remark?: string;
  recordedAt: string;
}

/**
 * 首页看板：汇总总分、分类呈现常用加扣分事项、支持极速记分与近期流水概览
 */
export default function HomePage() {
  const [childrenList, setChildrenList] = useState<ChildData[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("全部");
  const [loading, setLoading] = useState(true);

  // 弹窗控制状态
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  // 当前选中的孩子
  const activeChild =
    childrenList.find((c) => c.id === selectedChildId) || childrenList[0] || null;

  // 加载页面数据
  const fetchPageData = useCallback(async () => {
    try {
      console.log("[HomePage] 刷新首页核心数据...");
      const [childRes, templatesRes, recordsRes] = await Promise.all([
        fetch("/api/children"),
        fetch("/api/templates"),
        fetch("/api/records?limit=3"),
      ]);

      const [childJson, templatesJson, recordsJson] = await Promise.all([
        childRes.json(),
        templatesRes.json(),
        recordsRes.json(),
      ]);

      if (childJson.success) {
        const list: ChildData[] = childJson.data.children || [childJson.data];
        setChildrenList(list);
        setSelectedChildId((prev) => {
          if (prev && list.some((item) => item.id === prev)) return prev;
          return list[0]?.id || "";
        });
      }
      if (templatesJson.success) {
        setTemplates(templatesJson.data);
      }
      if (recordsJson.success) {
        setRecentRecords(recordsJson.data.records);
      }
    } catch (err) {
      console.error("[HomePage] 获取数据异常:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();

    // 跨设备体验优化：当手机切回前台或重新点亮屏幕时，自动静默同步云端最新积分
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[HomePage] 检测到应用切回前台，正在自动同步云端最新积分...");
        fetchPageData();
      }
    };

    window.addEventListener("focus", fetchPageData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", fetchPageData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchPageData]);

  // 更新孩子昵称
  const handleUpdateChildName = async (newName: string) => {
    if (!activeChild) return;
    try {
      console.log(`[HomePage] 发起更新孩子姓名: ${newName}`);
      const res = await fetch("/api/children", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeChild.id, name: newName }),
      });
      const json = await res.json();
      if (json.success) {
        setChildrenList((prev) =>
          prev.map((c) => (c.id === activeChild.id ? { ...c, name: newName } : c))
        );
      }
    } catch (e) {
      console.error("[HomePage] 更新姓名失败:", e);
    }
  };

  // 提取分类列表
  const categories = ["全部", ...Array.from(new Set(templates.map((t) => t.category)))];

  // 按分类与类型过滤模板
  const filteredTemplates = templates.filter((t) =>
    activeCategory === "全部" ? true : t.category === activeCategory
  );

  const addTemplates = filteredTemplates.filter((t) => t.type === "ADD");
  const deductTemplates = filteredTemplates.filter((t) => t.type === "DEDUCT");

  // 点击模板触发快捷微调弹窗
  const handleTemplateClick = (t: TemplateItem) => {
    setSelectedTemplate(t);
    setIsQuickModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 顶部总积分看板 (支持多孩子切换与新增) */}
      <ScoreCard
        child={activeChild}
        childrenList={childrenList}
        onSelectChild={(id) => setSelectedChildId(id)}
        onOpenAddChild={() => setIsAddChildModalOpen(true)}
        onOpenCustomRecord={() => setIsCustomModalOpen(true)}
        onUpdateChildName={handleUpdateChildName}
      />

      {/* 分类快捷标签栏 */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 快捷事项区：加分好习惯 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-emerald-700 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>加分好习惯（点击快速记录）</span>
          </div>
          <span className="text-xs text-gray-400">点击微调分值</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {addTemplates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTemplateClick(item)}
              className="group bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer active:scale-97 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  +{item.defaultPoints}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷事项区：扣分警示线 (支持扣到负分) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>扣分警戒线（支持扣至负分）</span>
          </div>
          <span className="text-xs text-gray-400">点击微调分值</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {deductTemplates.map((item) => (
            <div
              key={item.id}
              onClick={() => handleTemplateClick(item)}
              className="group bg-white p-3.5 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 transition-all cursor-pointer active:scale-97 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {item.defaultPoints}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 近期流水速览 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
            <History className="w-4 h-4 text-indigo-500" />
            <span>近期记录速览</span>
          </div>
          <Link
            href="/history"
            className="flex items-center space-x-0.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <span>完整流水</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            暂无记录，点击上方事项开始记分吧！
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRecords.map((rec) => (
              <div
                key={rec.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                    {childrenList.length > 1 && rec.child && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {rec.child.avatar} {rec.child.name}
                      </span>
                    )}
                    <span>{rec.title}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center space-x-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatShortTime(rec.recordedAt)}</span>
                    {rec.remark && <span>· {rec.remark}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-black text-sm ${
                      rec.pointsChange > 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {rec.pointsChange > 0
                      ? `+${rec.pointsChange}`
                      : rec.pointsChange}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    结余: {rec.balanceAfter}分
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 点击模板快速记分弹窗 */}
      <QuickActionModal
        isOpen={isQuickModalOpen}
        template={selectedTemplate}
        child={activeChild}
        onClose={() => setIsQuickModalOpen(false)}
        onSubmitSuccess={fetchPageData}
      />

      {/* 自由记一笔弹窗 */}
      <CustomRecordModal
        isOpen={isCustomModalOpen}
        child={activeChild}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmitSuccess={fetchPageData}
      />

      {/* 添加新宝贝档案弹窗 */}
      <AddChildModal
        isOpen={isAddChildModalOpen}
        currentCount={childrenList.length}
        onClose={() => setIsAddChildModalOpen(false)}
        onSuccess={(newChildId) => {
          fetchPageData();
          setSelectedChildId(newChildId);
        }}
      />
    </div>
  );
}
