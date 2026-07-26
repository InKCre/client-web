import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const formatter = fileURLToPath(new URL('../node_modules/.bin/oxfmt', import.meta.url))

function formatTypeScript(source, filename) {
  return execFileSync(formatter, ['--stdin-filepath', filename], {
    encoding: 'utf8',
    input: source,
  })
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

export function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  return value
}

function typeScriptType(typeDocument) {
  const type = requireObject(typeDocument, 'protocol column type')
  switch (type.kind) {
    case 'array':
      return `Array<${typeScriptType(type.items)}>`
    case 'boolean':
      return 'boolean'
    case 'enum':
      return type.values.map((value) => JSON.stringify(value)).join(' | ')
    case 'json':
      return 'Json'
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    default:
      throw new TypeError(`unsupported protocol type kind: ${String(type.kind)}`)
  }
}

function property(name) {
  return JSON.stringify(name)
}

function valueType(column) {
  const type = typeScriptType(column.type)
  return column.nullable ? `${type} | null` : type
}

function rowType(columns) {
  const lines = Object.entries(columns).map(
    ([name, column]) => `          ${property(name)}: ${valueType(column)}`
  )
  return ['{', ...lines, '        }'].join('\n')
}

function insertType(columns) {
  const lines = Object.entries(columns).map(([name, column]) => {
    const optional = column.nullable || column.has_default || column.generated ? '?' : ''
    return `          ${property(name)}${optional}: ${valueType(column)}`
  })
  return ['{', ...lines, '        }'].join('\n')
}

function updateType(columns) {
  const lines = Object.entries(columns).map(
    ([name, column]) => `          ${property(name)}?: ${valueType(column)}`
  )
  return ['{', ...lines, '        }'].join('\n')
}

function relationshipsType(relationships) {
  if (relationships.length === 0) return '[]'

  const entries = relationships.map((relationship) => {
    const columns = relationship.columns.map((column) => JSON.stringify(column)).join(', ')
    const referencedColumns = relationship.referenced_columns
      .map((column) => JSON.stringify(column))
      .join(', ')
    return [
      '          {',
      `            foreignKeyName: ${JSON.stringify(relationship.foreign_key_name)}`,
      `            columns: [${columns}]`,
      `            isOneToOne: ${relationship.one_to_one}`,
      `            referencedRelation: ${JSON.stringify(relationship.referenced_relation)}`,
      `            referencedColumns: [${referencedColumns}]`,
      '          }',
    ].join('\n')
  })
  return ['[', entries.join(',\n'), '        ]'].join('\n')
}

export function validateContractDocument(contract) {
  requireObject(contract, 'core contract')
  const protocol = requireObject(contract.protocol, 'core contract protocol')
  const relations = requireObject(protocol.relations, 'core contract relations')
  const jwt = requireObject(contract.jwt, 'core contract JWT')

  if (contract.format !== 1 || protocol.format !== 1) {
    throw new Error('unsupported core contract format')
  }
  if (typeof contract.revision !== 'string' || contract.revision.length === 0) {
    throw new Error('core contract revision must be a non-empty string')
  }
  if (protocol.schema !== 'inkcre') {
    throw new Error(`expected protocol schema "inkcre", got ${String(protocol.schema)}`)
  }
  if (Object.keys(relations).length === 0) {
    throw new Error('core contract must publish at least one relation')
  }
  for (const field of ['algorithm', 'role', 'issuer', 'audience']) {
    if (typeof jwt[field] !== 'string' || jwt[field].length === 0) {
      throw new Error(`core contract JWT ${field} must be a non-empty string`)
    }
  }
  if (
    !Array.isArray(jwt.required_claims) ||
    jwt.required_claims.some((claim) => typeof claim !== 'string')
  ) {
    throw new Error('core contract JWT required_claims must be a string array')
  }
  if (
    typeof jwt.maximum_lifetime_seconds !== 'number' ||
    !Number.isInteger(jwt.maximum_lifetime_seconds) ||
    jwt.maximum_lifetime_seconds <= 0
  ) {
    throw new Error('core contract JWT maximum_lifetime_seconds must be a positive integer')
  }
  return contract
}

export function projectRuntimeContract(contract) {
  const validated = validateContractDocument(contract)

  return {
    format: validated.format,
    revision: validated.revision,
    protocol: {
      format: validated.protocol.format,
      schema: validated.protocol.schema,
    },
    jwt: {
      algorithm: validated.jwt.algorithm,
      role: validated.jwt.role,
      issuer: validated.jwt.issuer,
      audience: validated.jwt.audience,
      required_claims: [...validated.jwt.required_claims],
      maximum_lifetime_seconds: validated.jwt.maximum_lifetime_seconds,
    },
  }
}

export function generateDatabaseTypes(contract) {
  const validated = validateContractDocument(contract)
  const relations = Object.entries(validated.protocol.relations)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, relation]) => {
      const columns = requireObject(relation.columns, `${name} columns`)
      const relationships = relation.relationships ?? []
      return [
        `      ${property(name)}: {`,
        `        Row: ${rowType(columns)}`,
        `        Insert: ${insertType(columns)}`,
        `        Update: ${updateType(columns)}`,
        `        Relationships: ${relationshipsType(relationships)}`,
        '      }',
      ].join('\n')
    })

  return formatTypeScript(
    `${[
      '// Generated by scripts/sync-database-contract.mjs. Do not edit by hand.',
      '',
      'export type Json =',
      '  | string',
      '  | number',
      '  | boolean',
      '  | null',
      '  | { [key: string]: Json | undefined }',
      '  | Json[]',
      '',
      'export type Database = {',
      '  inkcre: {',
      '    Tables: {',
      relations.join('\n'),
      '    }',
      '    Views: Record<never, never>',
      '    Functions: Record<never, never>',
      '  }',
      '}',
      '',
      "export type InkcreSchema = Database['inkcre']",
      "export type RelationName = keyof InkcreSchema['Tables']",
      "export type RelationRow<Name extends RelationName> = InkcreSchema['Tables'][Name]['Row']",
      '',
    ].join('\n')}\n`,
    'database.generated.ts'
  )
}

export function generateRuntimeContract(contract) {
  const runtimeContract = projectRuntimeContract(contract)

  return formatTypeScript(
    `${[
      '// Generated by scripts/sync-database-contract.mjs. Do not edit by hand.',
      '',
      `export const peerJwtContract = ${JSON.stringify(runtimeContract.jwt, null, 2)} as const`,
      '',
      'export const databaseRuntimeContract = {',
      `  format: ${JSON.stringify(runtimeContract.format)},`,
      `  revision: ${JSON.stringify(runtimeContract.revision)},`,
      '  protocol: {',
      `    format: ${JSON.stringify(runtimeContract.protocol.format)},`,
      `    schema: ${JSON.stringify(runtimeContract.protocol.schema)},`,
      '  },',
      '  jwt: peerJwtContract,',
      '} as const',
      '',
      'export type DatabaseRuntimeContract = typeof databaseRuntimeContract',
      '',
    ].join('\n')}\n`,
    'runtime-contract.generated.ts'
  )
}
