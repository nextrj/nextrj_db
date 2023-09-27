# NextRJ Database encasulation

## Condition query

### Generate a fuzzy search query template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import {
  Condition,
  createQueryTemplate,
  parseSearchCondition,
  QueryTemplate,
} from 'https://deno.land/x/nextrj_db/query/mod.ts'

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
```

> Use the `QueryTemplate.content|params` to build the conditional sql.

### Convert one condition to query template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import {
  createQueryTemplate,
  Operator,
  parseStringCondition,
  StringCondition,
} from 'https://deno.land/x/nextrj_db/query/mod.ts'

// string-condition to query template
const stringCond: StringCondition = ['c', '1', 'int', '=' as Operator]
let cond = parseStringCondition(stringCond)
let tpl = createQueryTemplate(cond)
assertEquals(tpl, { content: 'c = :param', params: { param: 1 } })

// custom condition to query template
cond = { name: 'c', value: 1, operator: Operator.EQ }
tpl = createQueryTemplate(cond)
assertEquals(tpl, { content: 'c = :param', params: { param: 1 } })
```

### Convert multiple conditions to query template

```ts
import { assertEquals } from 'https://deno.land/std/assert/mod.ts'
import {
  createQueryTemplate,
  Operator,
  parseStringCondition,
  StringCondition,
} from 'https://deno.land/x/nextrj_db/query/mod.ts'

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
```
