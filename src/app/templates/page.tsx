"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  Smile,
} from "lucide-react";

interface PointTemplate {
  id: string;
  title: string;
  type: string; // "ADD" | "DEDUCT"
  defaultPoints: number;
  category: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * 事项模板管理页
 * 允许家长自由新增、编辑、删除加分与扣分模板，设置默认分值与分类
 */
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PointTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 模态框控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PointTemplate | null>(null);

  // 表单状态
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [points, setPoints] = useState<number>(5);
  const [category, setCategory] = useState("日常习惯");
  const [icon, setIcon] = useState("🌟");
  const [submitting, setSubmitting] = useState(false);

  // 获取模板数据
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[TemplatesPage] 获取全部事项模板...");
      const res = await fetch("/api/templates?onlyActive=false");
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      }
    } catch (e) {
      console.error("[TemplatesPage] 获取模板异常:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // 打开创建新模板弹窗
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setTitle("");
    setType("ADD");
    setPoints(5);
    setCategory("日常习惯");
    setIcon("🌟");
    setIsModalOpen(true);
  };

  // 打开编辑模板弹窗
  const handleOpenEdit = (t: PointTemplate) => {
    setEditingTemplate(t);
    setTitle(t.title);
    setType(t.type as "ADD" | "DEDUCT");
    setPoints(Math.abs(t.defaultPoints));
    setCategory(t.category);
    setIcon(t.icon);
    setIsModalOpen(true);
  };

  // 删除模板
  const handleDelete = async (t: PointTemplate) => {
    const isConfirm = window.confirm(
      `确定要删除模板【${t.title}】吗？\n（历史流水记录仍会保留，不会被影响）`
    );
    if (!isConfirm) return;

    try {
      console.log(`[TemplatesPage] 正在删除模板: ID=${t.id}`);
      const res = await fetch(`/api/templates/${t.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setTemplates((prev) => prev.filter((item) => item.id !== t.id));
      } else {
        alert(json.error || "删除失败");
      }
    } catch (e) {
      console.error("[TemplatesPage] 删除模板失败:", e);
    }
  };

  // 保存模板（新建或更新）
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("请输入事项名称");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        type,
        defaultPoints: type === "ADD" ? Math.abs(points) : -Math.abs(points),
        category: category.trim() || "日常",
        icon: icon.trim() || (type === "ADD" ? "🌟" : "⚠️"),
      };

      if (editingTemplate) {
        // 更新现有模板
        console.log(`[TemplatesPage] 更新模板: ID=${editingTemplate.id}`, payload);
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchTemplates();
        } else {
          alert(json.error || "更新失败");
        }
      } else {
        // 新建模板
        console.log("[TemplatesPage] 新建事项模板:", payload);
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setIsModalOpen(false);
          fetchTemplates();
        } else {
          alert(json.error || "创建失败");
        }
      }
    } catch (err) {
      console.error("[TemplatesPage] 保存模板失败:", err);
      alert("保存异常，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 常用 Emoji 快捷选择池
  const emojiPicker = ["🌟", "🍽️", "🧸", "📖", "✍️", "🪥", "🤝", "🌙", "🧹", "🏃", "📱", "⏰", "😤", "🚯", "🍚", "⚠️"];

  const addTemplates = templates.filter((t) => t.type === "ADD");
  const deductTemplates = templates.filter((t) => t.type === "DEDUCT");

  return (
    <div className="space-y-6">
      {/* 顶部标题与新增按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-gray-800 tracking-tight">
              事项模板库
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {templates.length}/50
            </span>
          </div>
          <p className="text-xs text-gray-400">定制家规事项与默认分值（最多50个）</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={templates.length >= 50}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition ${
            templates.length >= 50
              ? "bg-gray-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{templates.length >= 50 ? "模板已满" : "添加新事项"}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">
          正在加载事项模板...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 正向加分模板 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>加分好习惯模板 ({addTemplates.length})</span>
            </div>

            <div className="space-y-2">
              {addTemplates.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-800">
                          {item.title}
                        </h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                          +{item.defaultPoints}分
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 扣分警戒线模板 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>行为扣除模板 ({deductTemplates.length})</span>
            </div>

            <div className="space-y-2">
              {deductTemplates.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-800">
                          {item.title}
                        </h4>
                        <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                          {item.defaultPoints}分
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 新建/编辑模板弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingTemplate ? "编辑事项模板" : "添加新事项模板"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* 类型选择 */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setType("ADD");
                    if (icon === "⚠️") setIcon("🌟");
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    type === "ADD"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  加分奖励项 (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("DEDUCT");
                    if (icon === "🌟") setIcon("⚠️");
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    type === "DEDUCT"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  行为扣除项 (-)
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
                  placeholder="例如：整理书包、自主光盘..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
                />
              </div>

              {/* 预设分值 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  默认预设分值 (记录时仍可自由调整)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={points}
                    onChange={(e) =>
                      setPoints(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24 px-3.5 py-2 rounded-xl border border-gray-200 text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-1">
                    {[2, 3, 5, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPoints(val)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                          points === val
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {val}分
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 事项分类 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  事项分类
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50"
                  />
                  <div className="flex gap-1">
                    {["生活自理", "学习成长", "礼貌纪律"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 图标/Emoji选择 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  图标 Emoji (当前: {icon})
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200/80">
                  {emojiPicker.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setIcon(em)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                        icon === em
                          ? "bg-indigo-500 text-white shadow-sm scale-110"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* 保存操作 */}
              <div className="flex items-center space-x-3 pt-3 safe-area-bottom">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? "正在保存..." : "保存模板"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
