"use client";

import React, { useState } from "react";
import { X, Check, UserPlus } from "lucide-react";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newChildId: string) => void;
}

/**
 * 添加新孩子档案弹窗
 * 方便多孩家庭随时新增大宝、二宝、三宝，支持设置昵称、专属头像及初始底分
 */
export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("👧");
  const [initialPoints, setInitialPoints] = useState(20);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 孩子头像 Emoji 候选池
  const avatarList = ["👦", "👧", "👶", "🧒", "👸", "🦸", "🐱", "🐶", "🐻", "🐰"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("请输入孩子姓名或小名");
      return;
    }

    try {
      setLoading(true);
      console.log(`[AddChildModal] 提交添加新孩子: ${name}, ${avatar}, ${initialPoints}`);
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          initialPoints,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setName("");
        setInitialPoints(20);
        onSuccess(json.data.id);
        onClose();
      } else {
        alert(json.error || "添加孩子失败");
      }
    } catch (err) {
      console.error("[AddChildModal] 请求异常:", err);
      alert("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-gray-800">添加新宝贝档案</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 头像选择 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              选择专属头像（当前: {avatar}）
            </label>
            <div className="flex flex-wrap gap-2">
              {avatarList.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${
                    avatar === av
                      ? "bg-indigo-600 text-white shadow-md scale-110"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* 姓名输入 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              孩子小名 / 昵称 *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：贝贝、二宝、欣欣..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
            />
          </div>

          {/* 初始底分 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              初始激励积分（可为 0）
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={initialPoints}
                onChange={(e) => setInitialPoints(parseInt(e.target.value) || 0)}
                className="w-24 px-3.5 py-2 rounded-xl border border-gray-200 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex gap-1">
                {[0, 10, 20, 50].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInitialPoints(v)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      initialPoints === v
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {v}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center space-x-3 pt-3 safe-area-bottom">
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
              className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "正在创建..." : "立即创建档案"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
