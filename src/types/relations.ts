// Re-export Relation from business layer for backward compatibility
import type { Relation as RelationClass, RelationRef } from '../business/relation'
export type { RelationRef } from '../business/relation'
export { RelationZ, RelationProp } from '../business/relation'

// For components, Relation from DB will always have id and updated_at
export type Relation = RelationClass & Required<Pick<RelationClass, 'id' | 'updated_at'>>

