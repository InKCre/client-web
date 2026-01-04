# InKCre Web Extension

InKCre 是一个基于知识图谱的笔记和 AI 辅助写作浏览器扩展。

## 功能特性

- 创建互联的内容块（Blocks）构建个人知识图谱
- 使用关系（Relations）连接不同的内容块
- AI 辅助写作和内容解释
- 支持 Chrome 和 Firefox 浏览器

## 开发

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装依赖

```bash
pnpm install
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
pnpm run typecheck
```

## CI/CD

项目配置了自动化的 CI/CD 流程：

### 持续集成（CI）

当提交代码到主分支或创建 Pull Request 时，会自动触发 CI 流程：

- 类型检查
- 构建 Chrome 和 Firefox 版本
- 打包扩展
- 上传构建产物（保留 7 天）

### 持续部署（CD）

当创建版本标签时，会自动构建并发布到 GitHub Releases：

1. 创建新的版本标签：
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. GitHub Actions 会自动：
   - 构建 Chrome 和 Firefox 版本
   - 打包扩展（ZIP 和 CRX 格式）
   - 创建 GitHub Release
   - 上传扩展包到 Release（包含 `.zip` 和 `.crx` 文件）

3. 用户可以从 [Releases 页面](https://github.com/InKCre/client-webext/releases) 下载最新版本

### 安装发布的扩展

#### Chrome/Edge

1. 从 [Releases](https://github.com/InKCre/client-webext/releases) 下载 `inkcre-*-chrome.zip` 或 `inkcre-*-chrome.crx`
2. **对于 ZIP 文件**：
   - 解压文件
   - 打开浏览器扩展管理页面（`chrome://extensions/` 或 `edge://extensions/`）
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹
3. **对于 CRX 文件**：
   - 打开浏览器扩展管理页面（`chrome://extensions/` 或 `edge://extensions/`）
   - 将 `.crx` 文件拖放到浏览器窗口中
   - 确认安装

#### Firefox

1. 从 [Releases](https://github.com/InKCre/client-webext/releases) 下载 `inkcre-*-firefox.zip`
2. 打开 `about:debugging#/runtime/this-firefox`
3. 点击"临时加载附加组件"
4. 选择下载的 zip 文件

## 技术栈

- **框架**: WXT (Web Extension Toolkit) + Vue 3 + TypeScript
- **样式**: UnoCSS
- **存储**: @wxt-dev/storage
- **通信**: webext-bridge

## 许可证

见 [LICENSE](LICENSE) 文件。
