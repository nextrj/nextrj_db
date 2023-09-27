import { assertEquals } from '../deps.ts'
import { CombineType, Operator } from './condition.ts'
import createQueryTemplate from './template.ts'

Deno.test('convert raw condition', async (t) => {
  await t.step('=', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.EQ, value: 'v1' }),
      { content: 'c1 = :param', params: { param: 'v1' } },
    )
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.EQ, value: 1 }),
      { content: 'c1 = :param', params: { param: 1 } },
    )
  })
  await t.step('!=', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.NOT_EQ, value: 1 }),
      { content: 'c1 != :param', params: { param: 1 } },
    )
  })
  await t.step('>', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.GT, value: 1 }),
      { content: 'c1 > :param', params: { param: 1 } },
    )
  })
  await t.step('>=', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.GTE, value: 1 }),
      { content: 'c1 >= :param', params: { param: 1 } },
    )
  })
  await t.step('<', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.LT, value: 1 }),
      { content: 'c1 < :param', params: { param: 1 } },
    )
  })
  await t.step('<=', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.LTE, value: 1 }),
      { content: 'c1 <= :param', params: { param: 1 } },
    )
  })
  await t.step('in', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.IN, value: [1, 2] }),
      { content: 'c1 in (:param_0, :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
  await t.step('not in', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.NOT_IN, value: [1, 2] }),
      { content: 'c1 not in (:param_0, :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
  await t.step('is null', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.IS_NULL }),
      { content: 'c1 is null', params: {} },
    )
  })
  await t.step('is not null', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.IS_NOT_NULL }),
      { content: 'c1 is not null', params: {} },
    )
  })
  await t.step('like', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.LIKE, value: '%v1%' }),
      { content: 'c1 like :param', params: { param: '%v1%' } },
    )
  })
  await t.step('ilike', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.ILIKE, value: '%v1' }),
      { content: 'c1 ilike :param', params: { param: '%v1' } },
    )
  })
  await t.step('[]', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.RANGE_EQ_EQ, value: [1, 2] }),
      { content: '(c1 >= :param_0 and c1 <= :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
  await t.step('[)', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.RANGE_EQ_LT, value: [1, 2] }),
      { content: '(c1 >= :param_0 and c1 < :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
  await t.step('(]', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.RANGE_GT_EQ, value: [1, 2] }),
      { content: '(c1 > :param_0 and c1 <= :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
  await t.step('()', () => {
    assertEquals(
      createQueryTemplate({ name: 'c1', operator: Operator.RANGE_GT_LT, value: [1, 2] }),
      { content: '(c1 > :param_0 and c1 < :param_1)', params: { param_0: 1, param_1: 2 } },
    )
  })
})

Deno.test('convert combined condition', async (t) => {
  await t.step('and', () => {
    assertEquals(
      createQueryTemplate({
        type: CombineType.And,
        conditions: [{ name: 'c1', operator: Operator.EQ, value: 'v1' }],
      }),
      { content: 'c1 = :param_0', params: { param_0: 'v1' } },
    )
    assertEquals(
      createQueryTemplate({
        type: CombineType.And,
        conditions: [
          { name: 'c1', operator: Operator.EQ, value: 'v1' },
          { name: 'c2', operator: Operator.LIKE, value: 'v%' },
        ],
      }),
      { content: '(c1 = :param_0 and c2 like :param_1)', params: { param_0: 'v1', param_1: 'v%' } },
    )
  })
  await t.step('or', () => {
    assertEquals(
      createQueryTemplate({
        type: CombineType.Or,
        conditions: [{ name: 'c1', operator: Operator.EQ, value: 'v1' }],
      }),
      { content: 'c1 = :param_0', params: { param_0: 'v1' } },
    )
    assertEquals(
      createQueryTemplate({
        type: CombineType.Or,
        conditions: [
          { name: 'c1', operator: Operator.EQ, value: 'v1' },
          { name: 'c2', operator: Operator.LT, value: 2 },
          { name: 'c3', operator: Operator.IN, value: ['3', '4'] },
        ],
      }),
      {
        content: '(c1 = :param_0 or c2 < :param_1 or c3 in (:param_2_0, :param_2_1))',
        params: { param_0: 'v1', param_1: 2, param_2_0: '3', param_2_1: '4' },
      },
    )
  })
  await t.step('nested', () => {
    assertEquals(
      createQueryTemplate({
        type: CombineType.Or,
        conditions: [
          { name: 'c1', operator: Operator.EQ, value: 'v1' },
          {
            type: CombineType.And,
            conditions: [
              { name: 'c2', operator: Operator.GT, value: 2 },
              { name: 'c3', operator: Operator.LT, value: 3 },
            ],
          },
        ],
      }),
      {
        content: '(c1 = :param_0 or (c2 > :param_1_0 and c3 < :param_1_1))',
        params: { param_0: 'v1', param_1_0: 2, param_1_1: 3 },
      },
    )
  })
})

Deno.test('convert array conditions', async (t) => {
  await t.step('two raw conditions', () => {
    assertEquals(
      createQueryTemplate([
        { name: 'c1', operator: Operator.EQ, value: 'v1' },
        { name: 'c2', operator: Operator.LT, value: 2 },
      ]),
      { content: '(c1 = :param_0 and c2 < :param_1)', params: { param_0: 'v1', param_1: 2 } },
    )
  })
  await t.step('raw+combined conditions', () => {
    assertEquals(
      createQueryTemplate([
        { name: 'c1', operator: Operator.EQ, value: 'v1' },
        {
          type: CombineType.Or,
          conditions: [
            { name: 'c2', operator: Operator.GT, value: 2 },
            { name: 'c3', operator: Operator.LT, value: 3 },
          ],
        },
      ]),
      {
        content: '(c1 = :param_0 and (c2 > :param_1_0 or c3 < :param_1_1))',
        params: { param_0: 'v1', param_1_0: 2, param_1_1: 3 },
      },
    )
    assertEquals(
      createQueryTemplate([
        { name: 'c1', operator: Operator.EQ, value: 'v1' },
        {
          type: CombineType.And,
          conditions: [
            { name: 'c2', operator: Operator.GT, value: 2 },
            { name: 'c3', operator: Operator.LT, value: 3 },
          ],
        },
      ]),
      {
        content: '(c1 = :param_0 and (c2 > :param_1_0 and c3 < :param_1_1))',
        params: { param_0: 'v1', param_1_0: 2, param_1_1: 3 },
      },
    )
  })
  await t.step('raw+combined+nested conditions', () => {
    assertEquals(
      createQueryTemplate([
        { name: 'c1', operator: Operator.EQ, value: 'v1' },
        {
          type: CombineType.And,
          conditions: [
            { name: 'c2', operator: Operator.GT, value: 2 },
            { name: 'c3', operator: Operator.LT, value: 3 },
            {
              type: CombineType.Or,
              conditions: [
                { name: 'c4', operator: Operator.GT, value: 4 },
                { name: 'c5', operator: Operator.LT, value: 5 },
              ],
            },
          ],
        },
      ]),
      {
        content:
          '(c1 = :param_0 and (c2 > :param_1_0 and c3 < :param_1_1 and (c4 > :param_1_2_0 or c5 < :param_1_2_1)))',
        params: { param_0: 'v1', param_1_0: 2, param_1_1: 3, param_1_2_0: 4, param_1_2_1: 5 },
      },
    )
  })
})
