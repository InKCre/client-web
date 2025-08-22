import type { Relation } from '../../types/relations'

export type RelationViewerProps = {
  relation: Relation
  to?: boolean
  from?: boolean
  mode?: 'wrap_block'
}
