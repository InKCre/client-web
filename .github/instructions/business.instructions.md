---
applyTo: "src/business/**"
---

本指南指导如何实现、维护业务逻辑模块。

## 文件结构

- `src/business`
  - `base.ts`: CoreAPIClient, DBAPIClient
  - `block.ts`
  - `relation.ts`
  - ... other business modules

## 最佳实践

- 继承 `Z.class(zod-schema)`，传入 Zod Schema。
- 添加类型别名如 `type <XXX>Ref` 以复用主键类型。
- 添加常量 `const <XXX>Z` 表示 Zod Schema。
- 添加常量 `make<XXX>Prop` 以便利定义 Vue 组件属性。
- 通过常量保存复杂的 Zod Schema 以便复用。

```typescript
// src/business/entity.ts
export type EntityRef = string;

export class Entity extends Z.class(
  v.object({
    id: DomainRef,
    name: v.string(),
    // ... other fields
  })
) {
  // 在类中定义  `coreApi`, `dbApi` 静态属性，用于请求后端
  static coreApi = new CoreAPIClient("entity");
  static dbApi = new DBAPIClient("/entity");

  public static async getById(id: EntityRef): Promise<Entity> {
    return new Entity((await this.dbApi.select().eq("id", id)).data![0]);
  }
  // or
  public static async getById(id: EntityRef): Promise<Entity> {
    return new Entity(
      (
        await Entity.coreApi.requestHTTP({
          method: "GET",
          url: `/entity/${id}`,
        })
      ).data
    );
  }
}

export class EntityForm extends Z.class({
  ...EntityZ.shape,
  id: v.undefined(),
}) {
  public static async create(data: EntityForm): Promise<Entity> {
    return new Entity(
      (
        await Entity.coreApi.requestHTTP({
          method: "POST",
          url: `/entity`,
          data: data,
        })
      ).data
    );
  }
}
```

组件中使用

```typescript
// 定义组件 Props 时

export const componentProps = defineProps({
  entity: makeRelationProp(),
  entityId: makeRelationRefProp(),
  ...
});

// 定义 ref 时
const entity = ref<Entity | null>(null);
```
