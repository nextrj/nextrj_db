import { DEFAULT_VALUE_PARSER, ValueParser } from './value_parser.ts'

/** Query operator */
export enum Operator {
  EQ = '=',
  NOT_EQ = '!=',
  GT = '>',
  GTE = '>=',
  LT = '<',
  LTE = '<=',
  IN = 'in',
  NOT_IN = 'not in',
  IS_NULL = 'is null',
  IS_NOT_NULL = 'is not null',
  LIKE = 'like',
  ILIKE = 'ilike',
  RANGE_EQ_EQ = '[]',
  RANGE_EQ_LT = '[)',
  RANGE_GT_EQ = '(]',
  RANGE_GT_LT = '()',
}

/** Condition combine type, 'and' or 'or' */
export enum CombineType {
  And = 'and',
  Or = 'or',
}

/** Native raw condition */
export type RawCondition = {
  name: string
  operator: Operator
  value?: unknown
}

/** Combined condition */
export type CombinedCondition = {
  type: CombineType
  conditions: (RawCondition | CombinedCondition)[]
}

/** Unify condition */
export type Condition = RawCondition | CombinedCondition

export function isCombinedCondition(condition: Condition): boolean {
  return Object.hasOwn(condition, 'type')
}

/** Combine condition with type 'and' */
export function and(cond: Condition, ...conds: Condition[]): CombinedCondition {
  return {
    type: CombineType.And,
    conditions: [cond, ...conds],
  }
}

/** Combine condition with type 'or' */
export function or(cond: Condition, ...conds: Condition[]): CombinedCondition {
  return {
    type: CombineType.Or,
    conditions: [cond, ...conds],
  }
}

/** String value representation condition */
export type ObjectStringCondition = {
  name: string
  value?: string | string[] | null
  /** Default 'string' */
  valueType?: string
  /** Default {@link Operator.EQ} */
  operator?: Operator
}
/**
 * String value representation condition.
 * - [0] - name
 * - [1] - value
 * - [2] - valueType
 * - [3] - operator
 */
export type ArrayStringCondition = [
  string,
  string | string[] | undefined | null,
  string | undefined,
  Operator | undefined,
]
/** String value representation condition */
export type StringCondition = ObjectStringCondition | ArrayStringCondition

/** Parse a {@link StringCondition}  to a {@link RawCondition} */
export default function parseStringCondition(
  condition: StringCondition,
  options: { valueParser?: ValueParser } = {},
): RawCondition {
  const { valueParser = DEFAULT_VALUE_PARSER } = options
  const cond: ObjectStringCondition = Array.isArray(condition)
    ? { name: condition[0], value: condition[1], valueType: condition[2], operator: condition[3] }
    : condition
  return {
    name: cond.name,
    operator: cond.operator || Operator.EQ,
    value: Array.isArray(cond.value)
      ? cond.value.map((v) => valueParser(v, cond.valueType || 'string'))
      : cond.value !== undefined && cond.value !== null
      ? valueParser(cond.value as string, cond.valueType || 'string')
      : cond.value,
  }
}

/**
 * Parse a fuzzy search value to a {@link CombinedCondition}.
 *
 * @param[search] The Fuzzy search value
 * @param[columns] The Fuzzy search columns
 */
export function parseSearchCondition(
  search: string,
  columns: string[],
  options: { ignoreCase?: boolean } = {},
): CombinedCondition {
  // check arguments
  if (columns.length === 0) throw Error('Fuzzy search columns could not be empty.')
  const { ignoreCase = false } = options
  const operator = ignoreCase ? Operator.ILIKE : Operator.LIKE

  // split raw value by '+' or ' '
  const isOr = !search.includes('+')
  const sourceValues = isOr
    ? search.split(' ') // 'A B' deal as Or relation
    : search.split('+') // 'A+B' deal as And relation

  // combine '%'
  const values = sourceValues.map((it) => it.includes('%') ? it : `%${it}%`)

  // single value search
  if (values.length === 1) {
    const value = values[0]
    return {
      type: CombineType.Or,
      conditions: columns.map((name) => ({ name, operator, value })),
    }
  }

  // 'A+B' or 'A B' search
  return {
    type: isOr ? CombineType.Or : CombineType.And,
    conditions: values.map((value) => ({
      type: CombineType.Or,
      conditions: columns.map((name) => ({ name, operator, value })),
    })),
  }
}
