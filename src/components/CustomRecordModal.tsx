"use client";

import React, { useState } from "react";
import { X, Check, Plus, Minus } from "lucide-react";
import { triggerConfetti } from "./ConfettiCelebration";

interface CustomRecordModalProps {
  isOpen: boolean;
  child?: { id: string; name: string } | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

/**
 * 自由记一笔弹窗
 * 当遇到非预设模板的突发事项时，家长可随手输入事件名称、分值与备注进行即时记录
 */
export const CustomRecordModal: React.FC<CustomRecordModalProps> = ({
  isOpen,
  child,
  onClose,
  onSubmitSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [pointsValue, setPointsValue] = useState<number>(3);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("请输入事项名称");
      return;
    }

    try {
      setLoading(true);
      const pointsChange = type === "ADD" ? Math.abs(pointsValue) : -Math.abs(pointsValue);
      console.log(
        `[CustomRecordModal] 提交自定义记分: title=${title}, type=${type}, points=${pointsChange}`
      );

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: child?.id,
          title: title.trim(),
          type,
          pointsChange,
          remark: remark.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (pointsChange > 0) {
          triggerConfetti();
        }
        setTitle("");
        setPointsValue(3);
        setRemark("");
        onSubmitSuccess();
        onClose();
      } else {
        alert(json.error || "记录失败");
      }
    } catch (err) {
      console.error("[CustomRecordModal] 提交失败:", err);
      alert("网络请求异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 animate-slide-up">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-1.5">
            <h3 className="text-lg font-bold text-gray-800">自由记一笔</h3>
            {child && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                给 {child.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 类型切换 (加分 / 扣分) */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("ADD")}
              className={`py-2 text-sm font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === "ADD"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>正向奖励 (+分)</span>
            </button>
            <button
              type="button"
              onClick={() => setType("DEDUCT")}
              className={`py-2 text-sm font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                type === "DEDUCT"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Minus className="w-4 h-4" />
              <span>行为扣除 (-分)</span>
            </button>
          </div>

          {/* 事项名称 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              事项名称 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：主动帮奶奶拿拖鞋、不小心摔坏碗..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          {/* 分值微调 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              分值大小 (当前: {type === "ADD" ? `+${pointsValue}` : `-${pointsValue}`})
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="100"
                value={pointsValue}
                onChange={(e) => setPointsValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3.5 py-2 rounded-xl border border-gray-200 text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5, 10].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPointsValue(v)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      pointsValue === v
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
                    }`}
                  >
                    {v}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              详细原因 / 备注（可选）
            </label>
            <textarea
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="记录当时的场景或孩子的态度..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center space-x-3 pt-2 safe-area-bottom">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition active:scale-98 flex items-center justify-center space-x-1.5 ${
                type === "ADD"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                  : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "正在保存..." : "立即记入"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
