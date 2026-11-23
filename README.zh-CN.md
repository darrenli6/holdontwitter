<div align="center">

# Tweet Pulse

[English](./README.md) · **简体中文**

每日发推打卡仪表盘。定一个目标（每天 30 条，或 20、50 条），打开网页就能看到今天发了多少：原创、回复、转发、引用分开统计，按**北京时间**计算。还可以加上你关注的账号，看看他们今天发推的频率。

数据来自 [twitterapi.io](https://twitterapi.io/?ref=l30gc41t)，使用你自己的 API key。

</div>

---

## 功能

- **每日目标**：1–500 之间任意设置，提供 20 / 30 / 50 快捷选项。有进度环和"还差 N 条"提示，达标后高亮显示。
- **分类统计**：原创、回复、转发、引用分开计数，每一条都算进目标。
- **北京时间**：不管你在哪里，一天都按 UTC+8 的 00:00–24:00 计算，过了零点自动切到新的一天。
- **关注列表**：输入用户名（`@name`、`name` 或主页链接都可以，可以一次粘贴多个），查看每个账号当天发了多少条。
- **查看历史**：用 ‹ › 往前翻，最多 14 天。
- **最近 7 天**：每次加载某一天的数据时，总数会存到浏览器里，所以 7 天柱状图不会多花 API 调用。
- **自动刷新**：页面在前台时每 10 分钟刷新一次，也可以点 ⟳ 手动刷新。
- **每分钟最多请求一次**：同一个账号同一天的数据，60 秒内只会向 twitterapi.io 请求一次。1 分钟内刷新网页、再点刷新、或者开第二个标签页，都会直接用上次的结果。刷新和重试按钮会显示倒计时，到时间才能再点。
- **隐私**：API key、目标和用户名只保存在你浏览器的 `localStorage` 里。没有数据库，也不用注册账号。
- **English / 中文**：页面右上角可以切换界面语言（默认英文，选择会保存在浏览器里）。
- 支持浅色和深色主题，手机上也能用。

## 工作原理

```
浏览器（localStorage：key、目标、用户名）
   │  GET /api/tweets?userName=…&date=YYYY-MM-DD   （请求头 x-api-key）
   ▼
Next.js 路由  ──►  twitterapi.io  GET /twitter/user/last_tweets?includeReplies=true
   每次取 20 条往前翻页，翻过北京时间当天 00:00 就停，
   然后统计落在当天 [00:00, 24:00) 里的推文
```

这层服务端路由只是因为浏览器不能直接请求 [twitterapi.io](https://twitterapi.io/?ref=l30gc41t)（跨域限制）。它只在内存里缓存结果 60 秒（用来限制请求频率），不写入任何文件，也不记录 key 和推文。

## 快速开始

> **需要一个 twitterapi.io 的 API key。** [点这里注册 twitterapi.io](https://twitterapi.io/?ref=l30gc41t)，在控制台复制 key 即可。

需要 Node.js 22+。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>，粘贴你的 [twitterapi.io](https://twitterapi.io/?ref=l30gc41t) API key，填上你的 X 用户名，就可以用了。

### 部署

不需要配置任何环境变量，可以直接部署到 Vercel，或任何能运行 Next.js 的环境：

```bash
npm run build && npm start
```

## 费用与限制

[twitterapi.io](https://twitterapi.io/?ref=l30gc41t) **按返回的推文条数计费**（撰写本文时约每 1000 条 $0.15）。每次请求最多返回 20 条，应用只往前翻到所选那天的开头。比如一个每天发 30 条的账号，每次刷新大约需要 2 次请求。

- 页面打开且在前台时，今天的数据每 10 分钟刷新一次。已经结束的历史日期只请求一次，之后一直用缓存。
- 同一个账号同一天，60 秒内绝不会请求两次。浏览器端会把结果存进 `localStorage`，所以刷新网页不花钱；服务端也有一层 60 秒的内存缓存（按 key、账号、日期区分，报错结果也会缓存）。
- 免费 key 限流比较严。服务端遇到 `429` 会退避重试，但关注的人很多时可能要多等一会儿。
- 最多翻 30 页（约 600 条）。如果当天推文超过这个数，卡片上会提示统计不完整。

## 说明

- **转发**：twitterapi.io 文档没有说明 `last_tweets` 是否一定包含转发。只要时间线里返回了转发，就会计入"转发"。
- **受保护或被封禁的账号**无法读取，对应卡片会显示错误。
- 7 天柱状图只记录你在这个浏览器里打开过的日子。

## 脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm start` | 生产构建并启动 |
| `npm test` | 单元测试（北京时间日界、推文分类、用户名解析） |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | ESLint |

没有真实 key 时，可以把 `TWITTERAPI_BASE_URL` 指向一个 mock 服务器来测试（见 `.env.example`）。

## 技术栈

Next.js 16（App Router）· React 19 · TanStack Query · Tailwind CSS · Zod · Sonner · 数据来自 [twitterapi.io](https://twitterapi.io/?ref=l30gc41t)

<sub>本文中的 twitterapi.io 链接为推广链接。</sub>

## 许可证

[MIT](./LICENSE)
