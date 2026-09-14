# @inkcre/client-web

## 0.1.2

### Patch Changes

- 47fa3f6: 支持 Job 的 best-effort 停止意图：worker 集中读取 abort_requested，传递 AbortSignal，并在执行与清理结束后关闭 Job；应用退出先等待 worker 再释放 Extension runtime。
- Updated dependencies [47fa3f6]
  - @inkcre/core@0.3.0

## 0.1.1

### Patch Changes

- Updated dependencies [d72d88c]
  - @inkcre/core@0.2.0
