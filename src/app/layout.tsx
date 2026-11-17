import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "KidPoints - 儿童积分管理系统",
  description: "面向家长的极简儿童好习惯培养与积分记录工具",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KidPoints",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4f46e5",
};

/**
 * 根布局组件
 * 包裹全局移动端视口、统一背景及底部导航
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-100 flex justify-center text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
        {/* 响应式移动端容器，居中显示 */}
        <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl pb-24 relative">
          <main className="flex-1 p-4">{children}</main>
          <Navbar />
        </div>
      </body>
    </html>
  );
}
