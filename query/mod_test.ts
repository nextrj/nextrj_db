import { assertEquals } from '../deps.ts'
import {
  ArrayStringCondition,
  COLON_PREFIX_PARAM_MARKER,
  Condition,
  createQueryTemplate,
  DOLLAR_WRAPPED_PARAM_MARKER,
  Operator,
  ParamMarker,
  parseSearchCondition,
  parseStringCondition,
  QueryTemplate,
  StringCondition,
} from './mod.ts'

Deno.test('colon prefix param marker QueryTemplate', () => {
  test(COLON_PREFIX_PARAM_MARKER, {
    content:
      '((c1 ilike :param_0_0 or c2 ilike :param_0_1) and c3 = :param_1 and (c4 >= :param_2_0 and c4 <= :param_2_1))',
    params: { param_0_0: '%f%', param_0_1: '%f%', param_1: 'v', param_2_0: 2, param_2_1: 3 },
  })
})

Deno.test('dollar wrapped param marker QueryTemplate', () => {
  test(DOLLAR_WRAPPED_PARAM_MARKER, {
    content:
      '((c1 ilike ${param_0_0} or c2 ilike ${param_0_1}) and c3 = ${param_1} and (c4 >= ${param_2_0} and c4 <= ${param_2_1}))',
    params: { param_0_0: '%f%', param_0_1: '%f%', param_1: 'v', param_2_0: 2, param_2_1: 3 },
  })
})

function test(paramMarker: ParamMarker, expected: QueryTemplate) {
  // mock a web unify conditions from a query-param, such as `?c=[[...],...]`
  // c=[["fuzzy","f"],["c3","v"],["c4",["2","3"],"int","[]"]]
  const c = JSON.stringify([
    ['fuzzy', 'f'], // fuzzy search condition
    ['c3', 'v'], // equals condition
    ['c4', ['2', '3'], 'int', Operator.RANGE_EQ_EQ], // in condition
  ])
  //console.log(c)
  const fuzzyColumns = ['c1', 'c2'] // fuzzy search columns
  const stringConds: ArrayStringCondition[] = JSON.parse(c)

  // take out the search-condition
  const searchCond = stringConds.splice(0, 1)[0]

  // parse string-condition to real-condition
  const conds: Condition[] = stringConds.map((c) => parseStringCondition(c))

  // parse search-string-condition to real-condition and merge back into conds
  conds.splice(0, 0, parseSearchCondition(searchCond[1] as string, fuzzyColumns, { ignoreCase: true }))

  // convert conditions to query-template
  const tpl: QueryTemplate = createQueryTemplate(conds, { paramMarker })
  // console.log(JSON.stringify(tpl, null, 2))

  // verify
  assertEquals(tpl, expected)
}

Deno.test('README: Generate a fuzzy search query template', () => {
  // default not ignore case
  let cond: Condition = parseSearchCondition('v', ['c1', 'c2'])
  let tpl: QueryTemplate = createQueryTemplate(cond)
  assertEquals(
    tpl,
    {
      content: '(c1 like :param_0 or c2 like :param_1)',
      params: { param_0: '%v%', param_1: '%v%' },
    },
  )

  // ignore case
  cond = parseSearchCondition('v', ['c1', 'c2'], { ignoreCase: true })
  tpl = createQueryTemplate(cond)
  assertEquals(
    tpl,
    {
      content: '(c1 ilike :param_0 or c2 ilike :param_1)',
      params: { param_0: '%v%', param_1: '%v%' },
    },
  )
})

Deno.test('README: Convert one condition to query template', () => {
  // string-condition to query template
  const stringCond: StringCondition = ['c', '1', 'int', '=' as Operator]
  let cond = parseStringCondition(stringCond)
  let tpl = createQueryTemplate(cond)
  assertEquals(tpl, { content: 'c = :param', params: { param: 1 } })

  // raw condition to query template
  cond = { name: 'c', value: 1, operator: Operator.EQ }
  tpl = createQueryTemplate(cond)
  assertEquals(tpl, { content: 'c = :param', params: { param: 1 } })
})

Deno.test('README: Convert multiple conditions to query template', () => {
  // string-condition to query template
  const stringConds: StringCondition[] = [
    ['c1', 'v1', undefined, undefined], // c1 = 'v1'
    ['c2', '2', 'int', '>' as Operator], // c2 > 2
    ['c3', ['3', '4'], 'int', 'in' as Operator], // c3 in (3, 4)
    ['c4', ['5', '9'], 'int', '[)' as Operator], // c4 > 5 and c4 < 9
    ['c5', 'v5%', 'string', 'like' as Operator], // c5 like 'v5%'
    ['c6', undefined, undefined, 'is null' as Operator], // c6 is null
  ]
  const conds = stringConds.map((stringCond) => parseStringCondition(stringCond))
  const tpl = createQueryTemplate(conds)
  assertEquals(
    tpl,
    {
      content: '(' + [
        'c1 = :param_0',
        'c2 > :param_1',
        'c3 in (:param_2_0, :param_2_1)',
        '(c4 >= :param_3_0 and c4 < :param_3_1)',
        'c5 like :param_4',
        'c6 is null',
      ].join(' and ') + ')',
      params: {
        param_0: 'v1',
        param_1: 2,
        param_2_0: 3,
        param_2_1: 4,
        param_3_0: 5,
        param_3_1: 9,
        param_4: 'v5%',
      },
    },
  )
})
