---
applyTo: "src/business/**"
---

本指南指导如何实现、维护业务逻辑模块。

## 文件结构

- `src/business`
  - `api.ts`: APIClient
  - `block.ts`
  - `relation.ts`

## 最佳实践

## 定义数据模型类

- 继承 `Z.class(zod-schema)`，传入 Zod Schema。
- 添加类型别名如 `type <XXX>Ref` 表示主键类型。
- 添加常量 `const <XXX>Z =` 表示 Zod Schema。
- 添加常量 `const <XXX>Prop =` 表示用于定义 Vue 组件属性时，type 字段的值
- 通过常量保存复杂的 Zod Schema 以便复用。

```typescript
export type LocationRef = string;

export class Location extends Z.class(
  v.object({
    address: v.array(v.string()),
    friendly_address: v.string(),
    lat: v.number(),
    lng: v.number(),
    _id: v.optional(v.string()),
  })
) {
  // 类实现
}
```

### 集成 APIClient

- 在类中定义 `api` （或者 `coreApi`, `dbApi`）静态属性，保存 `APIClient` 实例。

### 实现业务逻辑方法

- 实例方法处理对象级业务逻辑，如 `put`, `post`, `get` 等 。
