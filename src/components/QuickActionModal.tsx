"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Clock, Edit3 } from "lucide-react";
import { triggerConfetti } from "./ConfettiCelebration";

interface PointTemplate {
  id: string;
  title: string;
  type: string; // "ADD" | "DEDUCT"
  defaultPoints: number;
  category: string;
  icon: string;
}

interface QuickActionModalProps {
  isOpen: boolean;
  template: PointTemplate | null;
  child?: { id: string; name: string } | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

/**
 * 点击事项模板弹出的快捷微调与确认弹窗
 * 默认预设模板分值，支持家长点击步进微调、手动输入、附带备注与补录时间
 */
export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  template,
  child,
  onClose,
  onSubmitSuccess,
}) => {
  const [points, setPoints] = useState<number>(0);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  // 当选中的模板改变时，同步重置分值与表单
  useEffect(() => {
    if (template) {
      setPoints(template.defaultPoints);
      setRemark("");
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const isAdd = template.type === "ADD";

  // 快捷步进调节
  const handleAdjust = (delta: number) => {
    setPoints((prev) => prev + delta);
  };

  // 提交记分流水
  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log(
        `[QuickActionModal] 提交记分: 模板=${template.title}, 分值=${points}, 备注=${remark}`
      );

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child?.id,
          templateId: template.id,
          title: template.title,
          type: template.type,
          pointsChange: points,
          remark: remark.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // 如果是正向加分，触发彩带微动效激励
        if (points > 0) {
          triggerConfetti();
        }
        onSubmitSuccess();
        onClose();
      } else {
        alert(json.error || "记录失败，请重试");
      }
    } catch (err) {
      console.error("[QuickActionModal] 提交记分失败:", err);
      alert("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* 遮罩背景点击关闭 */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* 底部升起的操作面板 */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 animate-slide-up">
        {/* 顶部标题与关闭按钮 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-lg font-bold text-gray-800">
                  {template.title}
                </h3>
                {child && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                    给 {child.name}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">{template.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 核心分值调节区 */}
        <div className="my-6 text-center">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            本次{isAdd ? "奖励" : "扣除"}分值（可调整）
          </div>

          <div className="flex items-center justify-center space-x-1">
            <span
              className={`text-4xl font-black ${
                points > 0 ? "text-emerald-500" : points < 0 ? "text-rose-500" : "text-gray-400"
              }`}
            >
              {points > 0 ? "+" : ""}
            </span>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
              className={`w-28 text-5xl font-black text-center tracking-tight bg-transparent focus:outline-none border-b-2 border-dashed border-gray-200 focus:border-indigo-500 transition ${
                points > 0 ? "text-emerald-500" : points < 0 ? "text-rose-500" : "text-gray-400"
              }`}
            />
          </div>

          {/* 快捷微调步进按钮 */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => handleAdjust(-5)}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(-1)}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(1)}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(5)}
              className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition"
            >
              +5
            </button>
          </div>
        </div>

        {/* 补充备注录入 */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            补充备注（可选，例如：吃光了青菜与米饭）
          </label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="写下具体原因或表现..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
          />
        </div>

        {/* 底部确认按钮 */}
        <div className="flex items-center space-x-3 safe-area-bottom">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center space-x-1.5 ${
              isAdd
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {loading ? "正在记录..." : `确认计入 (${points > 0 ? `+${points}` : points}分)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
