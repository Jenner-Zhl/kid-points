"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, History, SlidersHorizontal } from "lucide-react";

/**
 * 底部常驻导航栏组件
 * 为家长在手机端单手操作提供快速切换视图的能力
 */
export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: "记分看板",
      href: "/",
      icon: Home,
    },
    {
      label: "历史流水",
      href: "/history",
      icon: History,
    },
    {
      label: "事项管理",
      href: "/templates",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-4 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "text-indigo-600 font-bold scale-105"
                  : "text-gray-400 hover:text-gray-600 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
