# NextRJ Database query encasulation

## Condition encasulation

```ts
/**
 * Query condition.
 *
 * Such as:
 * - `["name", "NextRJ", "string", "="]` means `name="NextRJ"`.
 * - `["age", ["22", "40"], "number", "(]"]` means `age > 20 and age <=40`.
 *
 * - [0] - id
 * - [1] - value
 * - [3] - type
 * - [4] - operator
 */
export type Condition = [string, string | string[], string?, Operator?]
```

## Generate a fuzzy search sql template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { toFuzzyQueryTemplate } from 'https://deno.land/x/nextrj_query/mod.ts'

const queryTemplate = toFuzzyQueryTemplate('v', ['c1', 'c2'], { ignoreCase: false })
assertEquals(
  queryTemplate,
  { content: 'c1 like :search_0 or c2 like :search_0', params: { search_0: '%v%' } },
)
```

## Convert one condition to sql template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { Operator, toConditionQueryTemplate } from 'https://deno.land/x/nextrj_query/mod.ts'

// fuzzy
let queryTemplate = toConditionQueryTemplate(['fuzzy', 'v', { fuzzyColumns: ['c1', 'c2'] }])
assertEquals(
  queryTemplate,
  { content: 'c1 ilike :param_0_0 or c2 ilike :param_0_0', params: { param_0_0: '%v%' } },
)

// =
queryTemplate = toConditionQueryTemplate(['c', '1', 'int', Operator.EQ])
assertEquals(
  queryTemplate,
  { content: 'c = :param', params: { param: 1 } },
)

// in
queryTemplate = toConditionQueryTemplate(['c', ['1', '2'], 'int', Operator.IN])
assertEquals(
  queryTemplate,
  { content: 'c in (:param_0, :param_1)', params: { param_0: 1, param_1: 2 } },
)

// range [) - >= and <
queryTemplate = toConditionQueryTemplate(['c', ['1', '10'], 'int', Operator.RANGE_EQ_LT])
assertEquals(
  queryTemplate,
  { content: '(c >= :param_0 and c < :param_1)', params: { param_0: 1, param_1: 10 } },
)
```

## Convert multiple conditions to sql template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import { Operator, toConditionsQueryTemplate } from 'https://deno.land/x/nextrj_query/mod.ts'

const queryTemplate = toConditionsQueryTemplate(
  [
    ['fuzzy', 'v'],
    ['c3', '1', 'int', Operator.EQ],
    ['c4', ['2', '3'], 'int', Operator.IN],
    ['c5', ['4', '10'], 'int', Operator.RANGE_EQ_LT],
  ],
  { fuzzyColumns: ['c1', 'c2'] },
)
assertEquals(
  queryTemplate,
  {
    content: [
      'c1 ilike :param_0_0 or c2 ilike :param_0_0',
      'c3 = :param_1',
      'c4 in (:param_2_0, :param_2_1)',
      '(c5 >= :param_3_0 and c < :param_3_1)',
    ].join('\n'),
    params: {
      param_0_0: '%v%',
      param_1: 1,
      param_2_0: 2,
      param_2_1: 3,
      param_3_0: 4,
      param_3_1: 10,
    },
  },
)
```
