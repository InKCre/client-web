# 组件：Relation 关系

## Users

## Specification

### mode:wrap_a_block

- 可折叠卡片
- 卡片标题即关系内容，标题行的右侧是编辑、删除、展开卡片的图标按钮
  - 如果显示的块是入向块，添加 `AS` 前缀和 `OF` 后缀
- 卡片内容是 `comp:BlockViewer(blockId=whichBlock)`
- 用一条居中的线连接块和卡片标题

## Implementation

### Props

- `relation?: Relation`： 关系对象
- `relationId?: RelationID`： 关系ID（与关系对象二选一）
- `whichBlock?: 'from' | 'to' = 'from'`：展示的方向，未定义则默认为 'from'
  - 对于 `'wrap_a_block'` 模式，必须选其一
- `mode?: 'wrap_a_block' = 'wrap_a_block'`： 展示模式
- `v-model:fold: boolean = true`：控制折叠状态（仅展示模式可折叠时生效）

### Events

- `click-block(block: Block)`：块被点击
- `update:fold(fold: boolean)`：折叠状态更新
- `relation-updated(relation: Relation)`：关系被更新
- `relation-deleted(relationId: number)`：关系被删除

## Notes

- 组件支持通过 `relation` 或 `relationId` 参数传入关系数据
- 当提供 `relationId` 时，组件会自动获取关系数据
- 折叠状态通过 `v-model:fold` 双向绑定控制
- 编辑和删除功能集成在标题栏的操作按钮中
- 使用 BlockViewer 组件显示对应方向的块内容
