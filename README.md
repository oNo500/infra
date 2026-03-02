# ws

AI 工具链状态看板 CLI。

## 安装

```bash
pnpm install -g .
```

## 命令

### `ws`

展示终端看板，聚合显示本机 AI 工具链状态：

- Claude Code 版本与配置
- MCP 服务器列表
- 已安装 Skills
- Obsidian inbox 状态（超 10 条预警）
- Cursor 配置
- 当前项目 AI 工具链检测
- 近 7 天活跃 Git 项目（按最近提交时间排序）

### `ws mcp`

从缓存读取 MCP 服务器列表，交互选择后写入当前项目 `.mcp.json`。

```bash
ws mcp          # 安装到当前项目
ws mcp -c       # 扫描系统 MCP 来源，选择后缓存至 ~/.ws.json
ws mcp list     # 查看缓存的服务器列表
```

工作流：

```
ws mcp -c   →   扫描系统，选择要缓存的服务器   →   ~/.ws.json
ws mcp      →   从缓存选择，写入当前项目        →   .mcp.json
```

缓存超过 24 小时会提示更新。

### `ws note`

显示 Obsidian 笔记库状态。

## 缓存文件

`~/.ws.json` 存储 ws 的持久缓存：

```json
{
  "mcp": {
    "servers": {
      "context7": { "command": "npx", "args": ["..."] }
    },
    "collectedAt": "2026-03-02T10:00:00Z"
  }
}
```

## 开发

```bash
pnpm dev    # watch 模式
pnpm build  # 构建
```
