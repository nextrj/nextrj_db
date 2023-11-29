import { assert, assertEquals, assertFalse } from '../deps.ts'
import parseStringCondition, {
  and,
  ArrayStringCondition,
  CombineType,
  isCombinedCondition,
  Operator,
  or,
  parseSearchCondition,
} from './condition.ts'

Deno.test('isCombinedCondition', () => {
  assert(isCombinedCondition({ type: CombineType.And, conditions: [] }))
  assertFalse(isCombinedCondition({ name: 'c1', operator: Operator.EQ, value: 'v1' }))
})

Deno.test('and', () => {
  const cond1 = { name: 'c1', operator: Operator.EQ, value: 'v1' }
  const cond2 = { name: 'c2', operator: Operator.LT, value: 'v2' }
  const cond3 = { name: 'c3', operator: Operator.LT, value: 'v3' }
  assertEquals(and(cond1), { type: CombineType.And, conditions: [cond1] })
  assertEquals(and(cond1, cond2), { type: CombineType.And, conditions: [cond1, cond2] })
  assertEquals(and(cond1, cond2, cond3), { type: CombineType.And, conditions: [cond1, cond2, cond3] })
})

Deno.test('or', () => {
  const cond1 = { name: 'c1', operator: Operator.EQ, value: 'v1' }
  const cond2 = { name: 'c2', operator: Operator.LT, value: 'v2' }
  const cond3 = { name: 'c3', operator: Operator.LT, value: 'v3' }
  assertEquals(or(cond1), { type: CombineType.Or, conditions: [cond1] })
  assertEquals(or(cond1, cond2), { type: CombineType.Or, conditions: [cond1, cond2] })
  assertEquals(or(cond1, cond2, cond3), { type: CombineType.Or, conditions: [cond1, cond2, cond3] })
})

Deno.test('parse object string condition', async (t) => {
  await t.step('string', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: 'v1', valueType: 'string' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 'v1' })
  })
  await t.step('int', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: '1', valueType: 'int' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 1 })
  })
  await t.step('float', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: '1.46', valueType: 'float' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 1.46 })
  })
  await t.step('number', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: '1', valueType: 'number' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: new Number(1) })
  })
  await t.step('boolean true', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: '1', valueType: 'boolean' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: true })
  })
  await t.step('boolean false', () => {
    const cond = { name: 'c1', operator: Operator.EQ, value: 'F', valueType: 'boolean' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: false })
  })
  await t.step('in int[]', () => {
    const cond = { name: 'c1', operator: Operator.IN, value: ['1', '2'], valueType: 'int' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1, 2] })
  })
  await t.step('range int[]', () => {
    const cond = { name: 'c1', operator: Operator.RANGE_GT_LT, value: ['1', '2'], valueType: 'int' }
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.RANGE_GT_LT, value: [1, 2] })
  })
})

Deno.test('parse array string condition', async (t) => {
  await t.step('undefined value 1', () => {
    const cond: ArrayStringCondition = ['c1', undefined, undefined, Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: undefined })
  })
  await t.step('undefined value 2', () => {
    const cond: ArrayStringCondition = ['c1', , , undefined]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: undefined })
  })
  await t.step('null value', () => {
    const cond: ArrayStringCondition = ['c1', null, undefined, Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: null })
  })
  await t.step('empty string value', () => {
    const cond: ArrayStringCondition = ['c1', '', undefined, Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: '' })
  })
  await t.step('string', () => {
    const cond: ArrayStringCondition = ['c1', 'v1', 'string', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 'v1' })
  })
  await t.step('int', () => {
    const cond: ArrayStringCondition = ['c1', '1', 'int', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 1 })
  })
  await t.step('float', () => {
    const cond: ArrayStringCondition = ['c1', '1.46', 'float', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: 1.46 })
  })
  await t.step('number', () => {
    const cond: ArrayStringCondition = ['c1', '1.46', 'number', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: new Number(1.46) })
  })
  await t.step('boolean true', () => {
    const cond: ArrayStringCondition = ['c1', '1.46', 'boolean', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: true })
  })
  await t.step('boolean false', () => {
    const cond: ArrayStringCondition = ['c1', '0', 'boolean', Operator.EQ]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.EQ, value: false })
  })
  await t.step('in int["1"]', () => {
    const cond: ArrayStringCondition = ['c1', ['1'], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1] })
  })
  await t.step('in int["1", "2"]', () => {
    const cond: ArrayStringCondition = ['c1', ['1', '2'], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1, 2] })
  })
  await t.step('in int["1", null]', () => {
    const cond: ArrayStringCondition = ['c1', ['1', null], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1] })
  })
  await t.step('in int["1", undefined]', () => {
    const cond: ArrayStringCondition = ['c1', ['1', undefined], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1] })
  })
  await t.step('in int["1",]', () => {
    const cond: ArrayStringCondition = ['c1', ['1', undefined], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [1] })
  })
  await t.step('in int[undefined, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [, '2'], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [2] })
  })
  await t.step('in int[null, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [, '2'], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [2] })
  })
  await t.step('in int[, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [, '2'], 'int', Operator.IN]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.IN, value: [2] })
  })
  await t.step('range int["1", "2"]', () => {
    const cond: ArrayStringCondition = ['c1', ['1', '2'], 'int', Operator.RANGE_GT_LT]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.RANGE_GT_LT, value: [1, 2] })
  })
  await t.step('range int[null, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [null, '2'], 'int', Operator.RANGE_GT_LT]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.RANGE_GT_LT, value: [null, 2] })
  })
  await t.step('range int[undefined, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [undefined, '2'], 'int', Operator.RANGE_GT_LT]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.RANGE_GT_LT, value: [undefined, 2] })
  })
  await t.step('range int[, "2"]', () => {
    const cond: ArrayStringCondition = ['c1', [, '2'], 'int', Operator.RANGE_GT_LT]
    assertEquals(parseStringCondition(cond), { name: 'c1', operator: Operator.RANGE_GT_LT, value: [undefined, 2] })
  })
})

Deno.test('parse search condition', async (t) => {
  await t.step('single value', () => {
    assertEquals(parseSearchCondition('v1', ['c1', 'c2']), {
      type: CombineType.Or,
      conditions: [
        { name: 'c1', operator: Operator.LIKE, value: '%v1%' },
        { name: 'c2', operator: Operator.LIKE, value: '%v1%' },
      ],
    })
  })
  await t.step('single value with %', () => {
    assertEquals(parseSearchCondition('v1%', ['c1', 'c2']), {
      type: CombineType.Or,
      conditions: [
        { name: 'c1', operator: Operator.LIKE, value: 'v1%' },
        { name: 'c2', operator: Operator.LIKE, value: 'v1%' },
      ],
    })
  })
  await t.step('single value ignore case', () => {
    assertEquals(parseSearchCondition('v1', ['c1', 'c2'], { ignoreCase: true }), {
      type: CombineType.Or,
      conditions: [
        { name: 'c1', operator: Operator.ILIKE, value: '%v1%' },
        { name: 'c2', operator: Operator.ILIKE, value: '%v1%' },
      ],
    })
  })
  await t.step('A+B', () => {
    assertEquals(parseSearchCondition('v1+v2%', ['c1', 'c2']), {
      type: CombineType.And,
      conditions: [
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.LIKE, value: '%v1%' },
            { name: 'c2', operator: Operator.LIKE, value: '%v1%' },
          ],
        },
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.LIKE, value: 'v2%' },
            { name: 'c2', operator: Operator.LIKE, value: 'v2%' },
          ],
        },
      ],
    })
  })
  await t.step('A+B ignore case', () => {
    assertEquals(parseSearchCondition('v1+v2%', ['c1', 'c2'], { ignoreCase: true }), {
      type: CombineType.And,
      conditions: [
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.ILIKE, value: '%v1%' },
            { name: 'c2', operator: Operator.ILIKE, value: '%v1%' },
          ],
        },
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.ILIKE, value: 'v2%' },
            { name: 'c2', operator: Operator.ILIKE, value: 'v2%' },
          ],
        },
      ],
    })
  })
  await t.step('A B', () => {
    assertEquals(parseSearchCondition('v1 %v2', ['c1', 'c2']), {
      type: CombineType.Or,
      conditions: [
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.LIKE, value: '%v1%' },
            { name: 'c2', operator: Operator.LIKE, value: '%v1%' },
          ],
        },
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.LIKE, value: '%v2' },
            { name: 'c2', operator: Operator.LIKE, value: '%v2' },
          ],
        },
      ],
    })
  })
  await t.step('A B ignore case', () => {
    assertEquals(parseSearchCondition('v1 %v2', ['c1', 'c2'], { ignoreCase: true }), {
      type: CombineType.Or,
      conditions: [
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.ILIKE, value: '%v1%' },
            { name: 'c2', operator: Operator.ILIKE, value: '%v1%' },
          ],
        },
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c1', operator: Operator.ILIKE, value: '%v2' },
            { name: 'c2', operator: Operator.ILIKE, value: '%v2' },
          ],
        },
      ],
    })
  })
})
