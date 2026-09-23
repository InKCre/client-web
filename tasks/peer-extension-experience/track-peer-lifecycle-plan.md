# Peer 身份与生命周期实施 Plan

Owner：Peer 身份与生命周期 Track。只有本 Track 目标通过 Human 复核后生效；后续 Track 不在本 Plan 中实施。

## 01 — Hub 契约

- 在 `InKCre/docs` 更新 Peer 产品术语和跨单元契约：`application_version` 表示运行应用发布版本，由 Peer 运行时上报；历史行允许未知。
- 不写入 Core/Web 的本地类名和调用顺序。
- 运行 Hub 检查，提交并推送 docs#31 分支，记录 commit。

返回：可供 Spokes 消费的已发布 Hub commit。

## 02 — core-py 数据库与生产者

- 从最新 `origin/main` 建立独立 core-py worktree/branch。
- 增加 nullable `peers.application_version` migration、模型、契约基线和数据库权限/生成物所需更新。
- Core 注册上报应用包版本，更新 runtime-owned schema/version，但不再覆盖人工名称。
- 增加最小数据库行为检查：旧行兼容、首次默认名、重注册保留人工名并更新版本。
- 先单独提交 Hub ref bump，再提交 core-py 代码；运行 `pdm run check` 及 migration/contract checks。
- 推送并创建依赖 Draft PR。

返回：已交付的数据库契约和 Core producer。

## 03 — client-web 消费契约

- 更新 `docs/_shared` 到已发布 Hub commit，并以独立 commit 保存 ref bump。
- 同步 core-py 数据库生成契约，使 Peer model 消费 nullable `application_version`。
- Web 注册上报 `apps/client-web` 应用版本；首次按浏览器/主要版本/系统生成默认名，重注册保留人工名。

返回：Web 可读取和发布统一 Peer 身份事实。

## 04 — Settings 与 Peers

- `/settings` 只保留元配置、本地偏好、完整导入导出和本地清理；保持未连接恢复能力。
- `/peers` 管理当前和其他 Peers，承接 Registry URL 等 Peer config。
- Card 展示名称、应用版本、ID、当前 Peer、能力和 lease 状态。
- 首次加载与 Refresh 统一读取列表和数据库时间 lease；移除无效的独立 health check。
- 读取失败、空列表、未知、离线、在线分别呈现。

返回：职责分离且可恢复的两个页面。

## 05 — Selectors、术语与文档

- 所有 Peer selector 的候选项和已选值显示名称与应用版本，包括 Extensions、Twitter、Memos 和共享 options 路径。
- 全仓按语义迁移运行节点的 client 用法，保留已确认例外。
- 更新 client-web 本地 TDD/AGENTS；更新 docs#31 中受新界面影响的步骤和桌面浅色截图。

返回：一致的产品语言、选择体验和用户教程。

## 06 — 验证与交付

- 针对 core-py migration/registration、client-web export/import/name/status/routes/selectors 添加最低必要行为检查。
- 运行两仓完整门禁和 `git diff --check`。
- 以桌面浅色界面验证 Settings、Peers、Extension selector；在干净浏览器验证完整恢复。
- 分别推送依赖 PR；client-web 创建覆盖所有四组的单一 Draft PR，本轮只把第一组标为完成。

返回：第一组可复核实现，后续组继续叠加同一 client-web PR。
