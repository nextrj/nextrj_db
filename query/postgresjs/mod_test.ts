import { assertEquals, parseArgs, postgres } from '../../deps.ts'
import parseCondition, { Condition, Operator, parseSearchCondition, StringCondition } from '../condition.ts'
import { DOLLAR_WRAPPED_PARAM_MARKER } from '../param_marker.ts'
import parseQueryTemplate from '../template.ts'
import { QueryTemplate } from '../template.ts'
import createPartialQuery from './mod.ts'
async function beforeEach() {
  await initDb()
}
async function afterEach() {
  await cleanDb()
  await getSql().end({ timeout: 5 })
}
let cacheSql: postgres.Sql
function getSql(): postgres.Sql {
  if (cacheSql) return cacheSql
  cacheSql = postgres({
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'tester',
    password: 'password',
    debug: true,
  })
  return cacheSql
}
async function initDb() {
  const sql = getSql()
  await sql`drop table if exists t1;`
  await sql`
      create table t1(
        c1 text not null,
        c2 text,
        c3 text,
        c4 text,
        c5 text
      );`
  await sql`insert into t1 (c1, c2) values ('v1', 'v2');`
}
async function cleanDb() {
  const sql = getSql()
  await sql`drop table if exists t1;`
}

// whether to ignore real database connect test
const ignore = parseArgs(Deno.args, { default: { 'nodb': false }, boolean: 'nodb' })['nodb']

Deno.test('createPartialQuery', { ignore }, async () => {
  await beforeEach()

  const sql = getSql()
  const columns = ['t.c1', 't.c2']
  const conds: Condition[] = [
    ['t.c1', 'v1', , ,] as StringCondition,
    ['t.c2', ['v1', 'v2'], 'string', Operator.IN] as StringCondition,
  ].map((c) => parseCondition(c))
  conds.push(parseSearchCondition('v1', columns))
  const tpl: QueryTemplate = parseQueryTemplate(conds, { paramMarker: DOLLAR_WRAPPED_PARAM_MARKER })
  // console.log(JSON.stringify(tpl, null, 2))
  const r = await sql`
      select ${sql(columns)}
      from t1 as t
      where ${createPartialQuery(sql, tpl)}
      order by t.c1 desc
    `
  // console.log(r.statement)
  assertEquals(r.length, 1)
  assertEquals(r[0], { c1: 'v1', c2: 'v2' })

  await afterEach()
})
