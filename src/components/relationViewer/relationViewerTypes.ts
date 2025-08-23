import type { Relation } from '../../types/relations'

export type RelationID = number

export type RelationViewerProps = {
  // 关系对象或关系ID（二选一）
  relation?: Relation
  relationId?: RelationID
  // 展示的方向，对于 wrap_a_block 模式必须选其一
  whichBlock?: 'from' | 'to'
  // 展示模式
  mode?: 'wrap_a_block'
  // 控制折叠状态
  fold?: boolean
}
