"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, PlusCircle, UserCheck } from "lucide-react";

interface ScoreCardProps {
  child: {
    id: string;
    name: string;
    avatar: string;
    currentPoints: number;
    todayAdded?: number;
    todayDeducted?: number;
    todayNet?: number;
  } | null;
  onOpenCustomRecord: () => void;
  onUpdateChildName?: (newName: string) => Promise<void>;
}

/**
 * 孩子积分主看板组件
 * 包含总积分卡片（原生支持负分高亮与引导）、今日收支动态及自由记一笔按钮
 */
export const ScoreCard: React.FC<ScoreCardProps> = ({
  child,
  onOpenCustomRecord,
  onUpdateChildName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(child?.name || "小宝");

  // 同步外部传入的孩子姓名
  useEffect(() => {
    if (child?.name) {
      setEditName(child.name);
    }
  }, [child?.name]);

  const points = child?.currentPoints ?? 0;
  const isNegative = points < 0;

  // 保存修改孩子昵称
  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      console.log(`[ScoreCard] 提交修改孩子姓名: ${editName}`);
      if (onUpdateChildName) {
        await onUpdateChildName(editName.trim());
      }
      setIsEditingName(false);
    } catch (err) {
      console.error("[ScoreCard] 修改孩子昵称失败:", err);
    }
  };

  return (
    <div className="w-full relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all duration-300 text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* 背景装饰光晕 */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-pink-400/20 rounded-full blur-2xl pointer-events-none" />

      {/* 顶部孩子信息行 */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
            {child?.avatar || "👦"}
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-2 py-1 text-sm rounded bg-white text-gray-800 font-bold focus:outline-none w-28"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-2 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium"
                >
                  确定
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="group flex items-center space-x-1.5 cursor-pointer"
                title="点击修改昵称"
              >
                <h2 className="text-xl font-bold tracking-wide">
                  {child?.name || "小宝"}
                </h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm opacity-80 group-hover:opacity-100">
                  修改
                </span>
              </div>
            )}
            <p className="text-xs text-white/80">家长专属激励看板</p>
          </div>
        </div>

        {/* 自由记一笔触发按钮 */}
        <button
          onClick={onOpenCustomRecord}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold shadow-md active:scale-95 transition-smooth border border-white/30"
        >
          <PlusCircle className="w-4 h-4 text-amber-200" />
          <span>自由记一笔</span>
        </button>
      </div>

      {/* 核心总分数值展示区 (支持负分) */}
      <div className="relative z-10 my-3 text-center">
        <div className="text-xs font-medium text-white/70 uppercase tracking-widest mb-1">
          当前累计积分
        </div>
        <div className="flex items-baseline justify-center space-x-1">
          <span
            className={`text-6xl font-black tracking-tight drop-shadow-md ${
              isNegative ? "text-rose-200 animate-pulse" : "text-amber-200"
            }`}
          >
            {points}
          </span>
          <span className="text-sm font-bold text-white/80">分</span>
        </div>

        {/* 负分温馨警示与正向鼓励标签 */}
        {isNegative ? (
          <div className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1 rounded-full bg-rose-500/40 border border-rose-300/50 backdrop-blur-md text-xs font-medium text-rose-100 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
            <span>目前处于负分状态，离归零还差 {Math.abs(points)} 分，继续加油！</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-300/40 backdrop-blur-md text-xs font-medium text-emerald-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>积分保持正向，继续保持良好习惯！</span>
          </div>
        )}
      </div>

      {/* 今日收支动态看板 */}
      <div className="relative z-10 mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
          <div className="text-white/70 mb-0.5">今日加分</div>
          <div className="font-bold text-emerald-300 text-sm">
            +{child?.todayAdded || 0}
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
          <div className="text-white/70 mb-0.5">今日扣分</div>
          <div className="font-bold text-rose-300 text-sm">
            -{child?.todayDeducted || 0}
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
          <div className="text-white/70 mb-0.5">今日净增</div>
          <div
            className={`font-bold text-sm ${
              (child?.todayNet ?? 0) >= 0 ? "text-amber-300" : "text-rose-300"
            }`}
          >
            {(child?.todayNet ?? 0) > 0
              ? `+${child?.todayNet}`
              : `${child?.todayNet || 0}`}
          </div>
        </div>
      </div>
    </div>
  );
};
