import { makeRelationProp, makeRelationRefProp, Relation } from '@/business/relation';
import { makeBooleanProp, makeStringProp } from '@/utils/vue-props';

export const relationProps = {
  relation: makeRelationProp(),
  relationId: makeRelationRefProp(),
  // 展示的方向，对于 wrap_a_block 模式必须选其一
  whichBlock: makeStringProp<'from' | 'to'>(),
  // 展示模式
  mode: makeStringProp<'wrap_a_block'>('wrap_a_block'),
  // 控制折叠状态
  fold: makeBooleanProp(true),
};

export const relationEmits = {
  'update:fold': (fold: boolean) => true,
  'click-block': (block_id: number) => true,
  'relation-updated': (relation: Relation) => true,
  'relation-deleted': (relationId: number) => true
}
