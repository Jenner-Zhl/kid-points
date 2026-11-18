"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Calendar,
  Filter,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { formatDateTime, formatPoints } from "@/lib/utils";

interface PointRecord {
  id: string;
  childId: string;
  templateId?: string;
  title: string;
  type: string;
  pointsChange: number;
  balanceAfter: number;
  remark?: string;
  recordedAt: string;
  createdAt: string;
}

interface TrendDay {
  date: string;
  dayName: string;
  added: number;
  deducted: number;
  net: number;
}

/**
 * 历史流水与审计页
 * 提供完整收支变动轨迹、变动后结余快照、趋势图表与误操作安全撤销回滚
 */
export default function HistoryPage() {
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  // 加载流水与统计
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`[HistoryPage] 加载历史流水: filter=${filterType}`);

      const [recordsRes, statsRes] = await Promise.all([
        fetch(`/api/records?type=${filterType}&limit=100`),
        fetch("/api/stats"),
      ]);

      const [recordsJson, statsJson] = await Promise.all([
        recordsRes.json(),
        statsRes.json(),
      ]);

      if (recordsJson.success) {
        setRecords(recordsJson.data.records);
      }
      if (statsJson.success) {
        setTrend(statsJson.data.trend || []);
      }
    } catch (error) {
      console.error("[HistoryPage] 获取历史流水失败:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchRecords();

    // 跨设备体验优化：当手机切回前台时，自动同步最新的历史流水记录
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[HistoryPage] 检测到应用切回前台，正在自动同步云端流水...");
        fetchRecords();
      }
    };

    window.addEventListener("focus", fetchRecords);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", fetchRecords);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRecords]);

  // 撤销某笔记录
  const handleRollback = async (record: PointRecord) => {
    const isConfirm = window.confirm(
      `确定要撤销这一笔记录吗？\n事项: ${record.title} (${formatPoints(record.pointsChange)}分)\n撤销后总积分将自动回滚！`
    );
    if (!isConfirm) return;

    try {
      setRevertingId(record.id);
      console.log(`[HistoryPage] 正在撤销流水记录: ID=${record.id}`);

      const res = await fetch(`/api/records/${record.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (json.success) {
        // 重新拉取流水与近 7 天趋势，确保图表与结余同步刷新
        await fetchRecords();
        alert("已成功撤销该记录，积分已自动恢复！");
      } else {
        alert(json.error || "撤销失败");
      }
    } catch (err) {
      console.error("[HistoryPage] 撤销记录异常:", err);
      alert("请求异常，请稍后重试");
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">
            历史积分流水
          </h1>
          <p className="text-xs text-gray-400">完整记录每一次好习惯与小挫折</p>
        </div>
      </div>

      {/* 近 7 天积分趋势条形小图 */}
      {trend.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-600 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>近 7 天净增积分趋势</span>
          </div>

          <div className="flex items-end justify-between h-20 pt-2 px-1 gap-1.5">
            {trend.map((d) => {
              const maxAbs = Math.max(...trend.map((t) => Math.abs(t.net)), 10);
              const heightPercent = Math.min(
                100,
                Math.max(15, (Math.abs(d.net) / maxAbs) * 100)
              );
              const isPositive = d.net >= 0;

              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                >
                  <span
                    className={`text-[9px] font-bold mb-1 ${
                      isPositive ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {d.net > 0 ? `+${d.net}` : d.net}
                  </span>
                  <div className="w-full h-12 flex items-end justify-center bg-gray-50 rounded-md overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-sm transition-all ${
                        isPositive ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 筛选标签切换 */}
      <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-2xl">
        {[
          { label: "全部流水", value: "ALL" },
          { label: "仅看加分 (+)", value: "ADD" },
          { label: "仅看扣分 (-)", value: "DEDUCT" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              filterType === tab.value
                ? "bg-white text-indigo-600 shadow-sm shadow-indigo-600/10"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 流水明细列表 */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">
          正在载入流水明细...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">没有查到符合条件的流水记录</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {records.map((r) => {
            const isAdd = r.type === "ADD";
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex items-start justify-between gap-3 group"
              >
                {/* 左侧图标与文本 */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isAdd
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {isAdd ? (
                      <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      {r.title}
                    </h4>
                    {r.remark && (
                      <p className="text-xs text-gray-500 mt-0.5 bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                        {r.remark}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400 mt-1">
                      <span>{formatDateTime(r.recordedAt)}</span>
                      <span>·</span>
                      <span className="font-medium text-gray-600">
                        变动后结余: {r.balanceAfter}分
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右侧数值与撤销按钮 */}
                <div className="text-right shrink-0 flex flex-col items-end">
                  <div
                    className={`text-base font-black tracking-tight ${
                      isAdd ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {r.pointsChange > 0
                      ? `+${r.pointsChange}`
                      : r.pointsChange}
                  </div>

                  {/* 撤销误操作按钮 */}
                  <button
                    onClick={() => handleRollback(r)}
                    disabled={revertingId === r.id}
                    title="撤回该笔记录并恢复积分"
                    className="mt-2 text-[10px] text-gray-400 hover:text-rose-500 flex items-center space-x-0.5 transition p-1 hover:bg-rose-50 rounded-md"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{revertingId === r.id ? "回滚中" : "撤销"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
