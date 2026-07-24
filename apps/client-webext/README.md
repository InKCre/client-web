# InKCre Web Extension

InKCre 是一个基于知识图谱的笔记和 AI 辅助写作浏览器扩展。

## 功能特性

- 创建互联的内容块（Blocks）构建个人知识图谱
- 使用关系（Relations）连接不同的内容块
- AI 辅助写作和内容解释
- 支持 Chrome 和 Firefox 浏览器

## 开发

### 环境要求

- Node.js 22.22.3
- pnpm 10.26.2

### 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 开发模式

```bash
# Chrome/Chromium 开发
pnpm run dev

# Firefox 开发
pnpm run dev:firefox
```

### 构建

```bash
# 构建 Chrome 版本
pnpm run build

# 构建 Firefox 版本
pnpm run build:firefox
```

### 打包

```bash
# 打包 Chrome 版本（ZIP）
pnpm run zip

# 打包 Chrome 版本（CRX）
pnpm run crx

# 打包 Firefox 版本
pnpm run zip:firefox
```

打包后的文件位于 `.output/` 目录：

- `inkcre-{version}-chrome.zip` - Chrome 扩展包（ZIP 格式）
- `inkcre-{version}-chrome.crx` - Chrome 扩展包（CRX 格式，用于发布）
- `inkcre-{version}-firefox.zip` - Firefox 扩展包
- `inkcre-{version}-sources.zip` - 源代码包（仅 Firefox）

### 类型检查

```bash
pnpm run type-check
```

## 仓库级验证

在 monorepo 根目录运行 `pnpm check`。当前仓库尚未实现浏览器扩展发布工作流；扩展 E2E
和发布契约由后续测试与交付阶段负责，不能把本地 `zip`/`crx` 命令视为自动发布。

## 技术栈

- **框架**: WXT (Web Extension Toolkit) + Vue 3 + TypeScript
- **样式**: UnoCSS
- **存储**: @wxt-dev/storage
- **通信**: webext-bridge

## 许可证

见 [LICENSE](LICENSE) 文件。
