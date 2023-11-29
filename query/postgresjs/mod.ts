/**
 * Utilities for [postgresjs](https://deno.land/x/postgresjs).
 *
 * @module
 */
import { postgres } from '../../deps.ts'
import parseStringCondition, { ArrayStringCondition, Condition, parseSearchCondition } from '../condition.ts'
import { DOLLAR_WRAPPED_PARAM_MARKER, ParamMarker } from '../param_marker.ts'
import createQueryTemplate, { QueryTemplate } from '../template.ts'
import { DEFAULT_VALUE_PARSER, ValueParser } from '../value_parser.ts'

/**
 * Create a [partial query of postgresjs](https://deno.land/x/postgresjs#partial-queries).
 *
 * Usage:
 *
 * ```ts
 * const queryTemplate = {
 *   content: "sql`age > ${age1} and age < ${ag2}`",
 *   params: { age1: 10, age2: 20}
 * }
 * const partialQuery = createPartialQuery(sql, queryTemplate)
 * const users = await sql`select * from user where name = 'x' and ${partialQuery}`
 * ```
 *
 * The upper example do the same bellow things:
 *
 * ```js
 * const partialQuery = (age1, age2) => sql`age > ${age1} and age < ${age2}`
 * const users = await sql`select * from user where name = 'x' and ${partialQuery(10, 20)}`
 * ```
 */
export default function createPartialQuery(
  sql: postgres.Sql,
  template: QueryTemplate,
): postgres.PendingQuery<postgres.Row[]> {
  const fn = new Function(...Object.keys(template.params), 'sql', 'return sql`' + template.content + '`;')
  return fn(...Object.values(template.params), sql)
}

/** The function for debug the sql */
// deno-lint-ignore no-explicit-any
export function showSql(connection: number, query: string, parameters: any[], paramTypes: any[]): void {
  console.log(`connection=${connection}, paramTypes=${paramTypes}\n  parameters=${parameters}\n  query=${query}`)
}

/**
 * Convert string conditions to a partial query.
 *
 * Rules:
 * - Force column mapping to avoid sql injection by {@link options.columnMapper}, otherwise throw {@link Error}.
 * - Mix search-condition by `['fuzzy', 'f', , ,]` with {@link options.fuzzyColumns}.
 * - Default {@link options.valueParser} use {@link DEFAULT_VALUE_PARSER}.
 * - Default {@link options.paramMarker} use {@link DOLLAR_WRAPPED_PARAM_MARKER}.
 * - Default {@link options.fuzzyName} use `fuzzy`.
 */
export function toPartialQuery(
  sql: postgres.Sql,
  stringConditions: ArrayStringCondition[],
  options: {
    columnMapper?: Record<string, string>
    fuzzyColumns?: string[]
    fuzzyName?: string
    valueParser?: ValueParser
    paramMarker?: ParamMarker
  } = {},
): postgres.PendingQuery<postgres.Row[]> {
  if (!stringConditions.length) return undefined
  const {
    columnMapper = {},
    fuzzyColumns = [],
    fuzzyName = 'fuzzy',
    valueParser = DEFAULT_VALUE_PARSER,
    paramMarker = DOLLAR_WRAPPED_PARAM_MARKER,
  } = options

  // take out search-condition
  const searchStringConds = stringConditions.filter((c) => c[0] === fuzzyName)
  const otherStringConds = stringConditions.filter((c) => c[0] !== fuzzyName)

  // validate columnMapper to avoid sql injection
  otherStringConds.forEach((c) => {
    if (!Object.hasOwn(columnMapper, c[0])) throw new Error(`Missing column mapping for "${c[0]}"`)
  })

  // convert string-condition to native-condition
  const conds: Condition[] = otherStringConds.map((c) =>
    parseStringCondition([columnMapper[c[0]] as string, c[1], c[2], c[3]], { valueParser })
  )
  if (searchStringConds.length) {
    if (!fuzzyColumns.length) throw new Error('Missing fuzzy columns config')
    searchStringConds.forEach((c) =>
      conds.push(parseSearchCondition(c[1] as string, fuzzyColumns, { ignoreCase: true }))
    )
  }

  // gen partial query
  return createPartialQuery(sql, createQueryTemplate(conds, { paramMarker }))
}
