import { assertEquals, parseArgs, postgres } from '../deps.ts'
import { dollarWrappedParamMarker, Operator, toConditionQueryTemplate } from '../mod.ts'
import { toQuery } from './mod.ts'
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

Deno.test('toQuery - condition', { ignore }, async () => {
  await beforeEach()

  const sql = getSql()
  const columns = ['t.c1', 't.c2']
  const queryTemplate = toConditionQueryTemplate(['t.c1', ['v1', 'v2'], 'string', Operator.IN], {
    paramMarker: dollarWrappedParamMarker,
  })

  const r = await sql`
      select ${sql(columns)}
      from t1 as t
      where ${toQuery(sql, queryTemplate)}
      order by t.c1 desc
    `
  // console.log(r.statement)
  assertEquals(r.length, 1)
  assertEquals(r[0], { c1: 'v1', c2: 'v2' })

  await afterEach()
})
