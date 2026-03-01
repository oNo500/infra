# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

这是一个 **AI 工具配置看板** 工作区，管理以下内容：

| 管理对象 | 路径 / 工具 |
|---------|-------------|
| Claude Code 配置 | `~/.claude/` |
| Claude Desktop MCP | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Cursor 配置 | `~/.cursor/`、`~/Library/Application Support/Cursor/User/settings.json` |
| Skills（AI 技能） | `~/.agents/skills/`（符号链接到 `~/.claude/skills/`） |
| Obsidian 笔记库 | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes/` |
| 代码项目 | `~/code/`（monorepo 多项目） |

## 关键路径速查

```
~/.claude/settings.json              # Claude Code 全局设置
~/.claude/skills/                    # 已安装 Skills（符号链接）
~/.agents/skills/                    # Skills 实体目录
~/.agents/.skill-lock.json           # Skills 版本锁文件
~/.cursor/projects/                  # Cursor 项目配置
~/Library/Application Support/Claude/claude_desktop_config.json  # Claude Desktop MCP
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes/   # Obsidian 主库
```

## Claude Code 配置

**全局设置** (`~/.claude/settings.json`)：
- `model: "sonnet"` - 使用 Sonnet 模型
- `language: "中文"` - 中文响应
- `skipDangerousModePermissionPrompt: true` - 跳过危险操作确认

**MCP 服务器**（在 Claude Desktop `claude_desktop_config.json` 中配置）：

| 服务器 | 说明 |
|--------|------|
| `sequential-thinking` | 多步推理 |
| `brave-search` | Web 搜索 |
| `context7` | 库文档查询 |
| `firecrawl-mcp` | 网页爬取（Obsidian 库中配置） |

**已安装 Skills**（`~/.agents/skills/`）：
`agent-browser`、`firecrawl`、`research`、`search`、`crawl`、`extract`、`find-skills`、`smithery`、`skill-creator`、`drizzle-orm`、`next-best-practices`、`next-cache-components`、`vercel-react-best-practices`、`vercel-composition-patterns`、`web-design-guidelines`、`better-auth-best-practices`、`create-auth-skill`、`tavily-best-practices`

安装 Skill：`claude skill install <name>`
查看 Skills：`ls ~/.agents/skills/`
锁文件：`~/.agents/.skill-lock.json`

## Obsidian 笔记库

**库路径**：`~/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes/`

采用 **Johnny-Decimal** 结构：

| 目录 | 用途 |
|------|------|
| `00-inbox` | 收集箱，每周日清空 |
| `10-projects` | 有截止日期和交付物的项目 |
| `20-areas` | 持续关注域，超 3 月未更新降级 |
| `30-resources` | 参考资料，禁止待办内容 |
| `90-archive` | 归档（按年份 `90-archive/2025/`） |
| `99-system` | 模板、MOC 导航、写作规范 |

**新建笔记流程**：
```bash
TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M'  # 获取时间
```
然后添加 YAML front matter（title、jd_id、created、updated、type、status、tags），更新对应 MOC。

**YAML 模板**：
```yaml
---
title: 文档标题
jd_id: J10-YYYYMMDD-HHMM
created: YYYY-MM-DD HH:MM
updated: YYYY-MM-DD HH:MM
type: note | tutorial | howto | reference | explanation | moc
status: draft | active | archived
tags: []
---
```

**写作规范**：表格 > 列表 > 段落；禁止装饰性 emoji（✅ ❌ ⚠️ 除外）；一文件一概念；行数上限见库中 `CLAUDE.md`。

## 代码项目架构

主要项目在 `~/code/`，以 **Turbo + pnpm monorepo** 为主：

**kaplan**（`~/code/kaplan/`）- 数字人对话平台：
- `apps/api` - NestJS 后端
- `apps/admin` - React 19 + Vite 管理台
- `apps/web` - Next.js 15 用户端
- `packages/db` - Drizzle ORM schema

**技术栈通用约定**（跨项目）：
- 后端：NestJS + Drizzle ORM + PostgreSQL
- 前端：React 19 + Tailwind v4 + shadcn/ui
- 认证：Better Auth
- 查询：TanStack Query + React Hook Form + Zod

## Cursor 配置

- 全局设置：`~/Library/Application Support/Cursor/User/settings.json`
- 默认格式化：Prettier
- AI 语言偏好：简体中文（`cline.preferredLanguage`）
- Copilot：已禁用（除 markdown）

## 看板

```bash
# 构建
cd ~/code/infra && pnpm build

# 运行构建产物
node ~/code/infra/dist/dashboard.js

# 开发模式（监听变化）
cd ~/code/infra && pnpm dev
```

终端 ASCII 看板，展示：Claude Code 版本/配置、MCP 服务器列表、已安装 Skills、Obsidian 笔记库状态（inbox 超 10 条预警）、Cursor 配置、近 7 天活跃 git 项目。

## 通用操作命令

```bash
# 查看已安装 Skills
ls ~/.agents/skills/

# 编辑 Claude Desktop MCP 配置
open ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 查看 Obsidian 笔记库
ls ~/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/notes/

# 获取上海时区时间（用于 Obsidian YAML）
TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M'

# kaplan 项目开发
cd ~/code/kaplan && pnpm dev
cd ~/code/kaplan/packages/db && pnpm generate  # DB schema 变更后生成迁移
cd ~/code/kaplan/packages/db && pnpm migrate   # 执行迁移
```

## 注意事项

- Skills 是符号链接：`~/.claude/skills/<name>` → `~/.agents/skills/<name>`，实体在 `~/.agents/`
- Obsidian 库通过 iCloud 同步，路径含空格需注意转义
- Claude Desktop 和 Claude Code 使用不同的 MCP 配置位置
- 代码中禁止遗留 debug 用 `console.log`；React 项目使用 hooks，禁止 class 组件
