/**
 * Utilities for [postgresjs](https://deno.land/x/postgresjs).
 *
 * @module
 */
import { postgres } from '../../deps.ts'
import { QueryTemplate } from '../template.ts'

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
 * ```ts
 * const partialQuery = (age1, age2) => sql`age > ${age1} and age < ${ag2}`
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
