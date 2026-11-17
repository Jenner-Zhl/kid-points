# KidPoints 云端全托管部署与本地运行指南

本项目基于 **Next.js 14 + Tailwind CSS + Prisma + SQLite (本地) / PostgreSQL (云端全托管)** 构建。遵循 0 服务器成本、0 运维、移动端优先原则。

---

## 一、 本地立即体验与运行

工程已初始化好本地 SQLite 数据库与 12 个常见预设事项模板。您只需在终端运行：

```bash
# 启动本地开发服务器
pnpm dev
# 或 npm run dev
```

启动后，在电脑或局域网手机浏览器中打开：
👉 **http://localhost:3000**

---

## 二、 云端全托管部署（3 步零成本上线，终身免费）

通过“**云端数据库 (Supabase) + 全栈托管 (Vercel)**”，无需租用任何云服务器，全程约 3~5 分钟。

```
 ┌─────────────────┐        Git Push        ┌──────────────────┐
 │  本地编写代码     │ ───────────────────>  │  GitHub 远程仓库  │
 └─────────────────┘                        └────────┬─────────┘
                                                     │ 自动触发构建部署
                                                     ▼
 ┌─────────────────┐   PostgreSQL 连接串    ┌──────────────────┐
 │ Supabase 云数据库 │ <─────────────────── │      Vercel      │
 └─────────────────┘                        │  (支持绑定自定义域名)│
                                            └──────────────────┘
```

### 第一步：获取免费云端 PostgreSQL 数据库（1分钟）
1. 打开 [Supabase 官网 (https://supabase.com)](https://supabase.com) 并用 GitHub 免费注册登录。
2. 点击 **"New project"** 创建一个项目（例如命名为 `kid-points`），设置一个数据库密码。
3. 进入 **Project Settings -> Database -> Connection String**，复制 `URI` 连接串，类似如下格式：
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:65432/postgres
   ```
4. 将 `prisma/schema.prisma` 中的 `provider = "sqlite"` 修改为 `provider = "postgresql"`（仅这一行改动）。

---

### 第二步：将代码推送到 GitHub 仓库
在本项目根目录下执行：
```bash
git add .
git commit -m "feat: complete kid-points application"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

### 第三步：在 Vercel 上线与国内免翻墙访问配置（2分钟）

1. 登录 [Vercel (https://vercel.com)](https://vercel.com)（使用 GitHub 账号登录）。
2. 点击 **"Add New Project"**，直接选择刚才推送的 GitHub 仓库。
3. 在 **"Environment Variables"**（环境变量）处添加：
   - **名称**：`DATABASE_URL`
   - **值**：粘贴第一步获取的 Supabase Transaction pooler 连接串。
4. 点击 **"Deploy"**！
   - Vercel 会在 1 分钟内自动编译、初始化数据库并上线。
   - 上线后会生成一个专属的公网域名（例如 `kid-points-xxx.vercel.app`）。

#### 国内网络免翻墙直接访问方案：
由于 `*.vercel.app` 默认域名被国内运营商 DNS 污染，**国内手机在家里不挂 VPN 访问时，只需在 Vercel 绑定一个自定义域名**：
1. 在 Vercel 项目后台进入 **Settings** -> **Domains**；
2. 绑定您拥有的二级域名（例如 `kids.yourdomain.com`，如果没有域名，可在腾讯云/阿里云花约 10 元买一个 `.top` 或 `.xyz` 便宜域名）；
3. 在域名解析处添加一条 CNAME 解析指向 Vercel 的国内专属优化节点：
   - **记录类型**：`CNAME`
   - **记录值**：`cname-china.vercel-dns.com`
4. 几分钟生效后，手机在任何国内 WiFi / 4G / 5G 网络下无需 VPN 均可秒开。

---

## 三、 手机端像 App 一样使用（PWA）

家长在手机浏览器打开部署后的网址后：
- **iPhone (Safari)**：点击浏览器底部的 **分享按钮** -> 选择 **“添加到主屏幕”**。
- **Android (Chrome)**：点击右上角 **三个点** -> 选择 **“添加到主屏幕”** 或 **“安装应用”**。

添加后，手机桌面上会生成专属的 **“儿童积分”** App 图标，点击直接全屏启动，没有浏览器地址栏，操作丝滑顺手。

---

## 四、 常见问题与提示

1. **模板与初始数据如何同步到云端数据库？**
   在配置了云端 `DATABASE_URL` 后，本地终端执行：
   ```bash
   pnpm prisma db push
   pnpm prisma:seed
   ```
   即可一键将表结构和预设事项填充到云数据库中。

2. **如何修改家长访问保护？**
   在环境变量中配置 `PARENT_PIN="1234"` 即可开启 PIN 码防护。
