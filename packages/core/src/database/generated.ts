export type { Database, Json } from './database.generated'

import type { Database } from './database.generated'

export type InkcreSchema = Database['inkcre']
export type RelationName = keyof InkcreSchema['Tables']
export type RelationRow<Name extends RelationName> = InkcreSchema['Tables'][Name]['Row']
