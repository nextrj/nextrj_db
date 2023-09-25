import { assertEquals, assertThrows } from './deps.ts'
import {
  Operator,
  RelationType,
  toConditionQueryTemplate,
  toConditionsQueryTemplate,
  toFuzzyQueryTemplate,
  toFuzzyValue,
} from './mod.ts'

Deno.test('toFuzzyValue', async (t) => {
  await t.step('single', () => {
    assertEquals(toFuzzyValue('abc'), { type: RelationType.Or, values: ['%abc%'] })
  })

  await t.step('or', () => {
    assertEquals(toFuzzyValue('a b'), { type: RelationType.Or, values: ['%a%', '%b%'] })
    assertEquals(toFuzzyValue('a b c'), { type: RelationType.Or, values: ['%a%', '%b%', '%c%'] })
  })

  await t.step('and', () => {
    assertEquals(toFuzzyValue('a+b'), { type: RelationType.And, values: ['%a%', '%b%'] })
    assertEquals(toFuzzyValue('a+b+c'), { type: RelationType.And, values: ['%a%', '%b%', '%c%'] })
  })
})

Deno.test('toFuzzyQueryTemplate', async (t) => {
  await t.step('single column - single value', () => {
    // ilike
    assertEquals(
      toFuzzyQueryTemplate('v', ['c']),
      { content: 'c ilike :search_0', params: { search_0: '%v%' } },
    )
    // like
    assertEquals(
      toFuzzyQueryTemplate('v', ['c'], { ignoreCase: false }),
      { content: 'c like :search_0', params: { search_0: '%v%' } },
    )
    // custom paramName
    assertEquals(
      toFuzzyQueryTemplate('v', ['c'], { paramName: 'param' }),
      { content: 'c ilike :param_0', params: { param_0: '%v%' } },
    )
  })

  await t.step('single column - two values or', () => {
    assertEquals(
      toFuzzyQueryTemplate('v0 v1', ['c']),
      { content: '(c ilike :search_0 or c ilike :search_1)', params: { search_0: '%v0%', 'search_1': '%v1%' } },
    )
  })

  await t.step('single column - two values and', () => {
    assertEquals(
      toFuzzyQueryTemplate('v0+v1', ['c']),
      { content: '(c ilike :search_0 and c ilike :search_1)', params: { search_0: '%v0%', 'search_1': '%v1%' } },
    )
  })

  await t.step('two columns - single value', () => {
    // ilike
    assertEquals(
      toFuzzyQueryTemplate('v', ['c0', 'c1']),
      { content: '(c0 ilike :search_0 or c1 ilike :search_0)', params: { search_0: '%v%' } },
    )
    // like
    assertEquals(
      toFuzzyQueryTemplate('v', ['c0', 'c1'], { ignoreCase: false }),
      { content: '(c0 like :search_0 or c1 like :search_0)', params: { search_0: '%v%' } },
    )
  })

  await t.step('two columns - two values or', () => {
    assertEquals(
      toFuzzyQueryTemplate('v0 v1', ['c0', 'c1']),
      {
        content: '((c0 ilike :search_0 or c1 ilike :search_0) or (c0 ilike :search_1 or c1 ilike :search_1))',
        params: { search_0: '%v0%', 'search_1': '%v1%' },
      },
    )
  })

  await t.step('two columns - two values and', () => {
    assertEquals(
      toFuzzyQueryTemplate('v0+v1', ['c0', 'c1']),
      {
        content: '((c0 ilike :search_0 or c1 ilike :search_0) and (c0 ilike :search_1 or c1 ilike :search_1))',
        params: { search_0: '%v0%', 'search_1': '%v1%' },
      },
    )
  })
})

Deno.test('toConditionQueryTemplate', () => {
  // default string value and =
  assertEquals(
    toConditionQueryTemplate(['c', 'v']),
    { content: 'c = :param', params: { param: 'v' } },
  )
  // eq int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.EQ]),
    { content: 'c = :param', params: { param: 1 } },
  )
  // not eq int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.NOT_EQ]),
    { content: 'c != :param', params: { param: 1 } },
  )
  // gt int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.GT]),
    { content: 'c > :param', params: { param: 1 } },
  )
  // gte int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.GTE]),
    { content: 'c >= :param', params: { param: 1 } },
  )
  // gt number
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'number', Operator.GT]),
    { content: 'c > :param', params: { param: new Number(1) } },
  )
  // lt int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.LT]),
    { content: 'c < :param', params: { param: 1 } },
  )
  // lte int
  assertEquals(
    toConditionQueryTemplate(['c', '1', 'int', Operator.LTE]),
    { content: 'c <= :param', params: { param: 1 } },
  )
  // in
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '2'], 'int', Operator.IN]),
    { content: 'c in (:param_0, :param_1)', params: { param_0: 1, param_1: 2 } },
  )
  assertEquals(
    toConditionQueryTemplate(['c', ['1'], 'int', Operator.IN]),
    { content: 'c in (:param_0)', params: { param_0: 1 } },
  )
  // not in
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '2'], 'int', Operator.NOT_IN]),
    { content: 'c not in (:param_0, :param_1)', params: { param_0: 1, param_1: 2 } },
  )
  // [1,10]
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '10'], 'int', Operator.RANGE_EQ_EQ]),
    { content: '(c >= :param_0 and c <= :param_1)', params: { param_0: 1, param_1: 10 } },
  )
  // [1,10)
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '10'], 'int', Operator.RANGE_EQ_LT]),
    { content: '(c >= :param_0 and c < :param_1)', params: { param_0: 1, param_1: 10 } },
  )
  // (1,10]
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '10'], 'int', Operator.RANGE_GT_EQ]),
    { content: '(c > :param_0 and c <= :param_1)', params: { param_0: 1, param_1: 10 } },
  )
  // (1,10)
  assertEquals(
    toConditionQueryTemplate(['c', ['1', '10'], 'int', Operator.RANGE_GT_LT]),
    { content: '(c > :param_0 and c < :param_1)', params: { param_0: 1, param_1: 10 } },
  )
})

Deno.test('toConditionsQueryTemplate', () => {
  // fuzzy
  assertThrows(
    () => toConditionsQueryTemplate([['fuzzy', 'v']], {}),
    Error,
    'Missing fuzzy columns config',
  )
  assertEquals(
    toConditionsQueryTemplate([['fuzzy', 'v']], {}, { fuzzyColumns: ['c0', 'c1'] }),
    { content: '(c0 ilike :param_0_0 or c1 ilike :param_0_0)', params: { param_0_0: '%v%' } },
  )
  assertEquals(
    toConditionsQueryTemplate([['fuzzy', 'v%']], {}, { fuzzyColumns: ['c0', 'c1'] }),
    { content: '(c0 ilike :param_0_0 or c1 ilike :param_0_0)', params: { param_0_0: 'v%' } },
  )
  assertEquals(
    toConditionsQueryTemplate([['fuzzy', '%v']], {}, { fuzzyColumns: ['c0', 'c1'] }),
    { content: '(c0 ilike :param_0_0 or c1 ilike :param_0_0)', params: { param_0_0: '%v' } },
  )
  assertEquals(
    toConditionsQueryTemplate([['fuzzy', 'A+B']], {}, { fuzzyColumns: ['c0', 'c1'] }),
    {
      content: '((c0 ilike :param_0_0 or c1 ilike :param_0_0) and (c0 ilike :param_0_1 or c1 ilike :param_0_1))',
      params: { param_0_0: '%A%', param_0_1: '%B%' },
    },
  )
  assertEquals(
    toConditionsQueryTemplate([['fuzzy', 'A B']], {}, { fuzzyColumns: ['c0', 'c1'] }),
    {
      content: '((c0 ilike :param_0_0 or c1 ilike :param_0_0) or (c0 ilike :param_0_1 or c1 ilike :param_0_1))',
      params: { param_0_0: '%A%', param_0_1: '%B%' },
    },
  )
  // > 1
  assertThrows(
    () => toConditionsQueryTemplate([['c', '1', 'int', Operator.GT]], {}),
    Error,
    'Missing column \'c\' mapping',
  )
  assertEquals(
    toConditionsQueryTemplate([['c', '1', 'int', Operator.GT]], { c: 't.c' }),
    { content: 't.c > :param_0', params: { param_0: 1 } },
  )
  // =1 and fuzzy
  assertEquals(
    toConditionsQueryTemplate([['c', '1', 'int', Operator.EQ], ['fuzzy', 'v']], { c: 't.c' }, {
      fuzzyColumns: ['c0', 'c1'],
    }),
    {
      content: 't.c = :param_0\nand (c0 ilike :param_1_0 or c1 ilike :param_1_0)',
      params: { param_0: 1, param_1_0: '%v%' },
    },
  )
  // =1 and [2, 7]
  assertEquals(
    toConditionsQueryTemplate(
      [
        ['c0', '1', 'int', Operator.EQ],
        ['c1', ['2', '7'], 'int', Operator.RANGE_EQ_EQ],
      ],
      { c0: 't.c0', c1: 't.c1' },
    ),
    {
      content: 't.c0 = :param_0\nand (t.c1 >= :param_1_0 and t.c1 <= :param_1_1)',
      params: { param_0: 1, param_1_0: 2, param_1_1: 7 },
    },
  )
})
