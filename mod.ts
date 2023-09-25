/**
 * Utilities for build database partial query.
 *
 * @module
 */

/**
 * Query condition.
 *
 * Such as `["name", "NextRJ", "string", "="]`
 *
 * - [0] - id
 * - [1] - value
 * - [3] - type
 * - [4] - {@link Operator}
 */
export type Condition = [string, string | string[], string?, Operator?]

/** Relation type */
export enum RelationType {
  And = 'and',
  Or = 'or',
}

/** Operators enum */
export enum Operator {
  EQ = '=',
  NOT_EQ = '!=',
  GT = '>',
  GTE = '>=',
  LT = '<',
  LTE = '<=',
  IN = 'in',
  NOT_IN = 'not in',
  RANGE_EQ_EQ = '[]',
  RANGE_EQ_LT = '[)',
  RANGE_GT_EQ = '(]',
  RANGE_GT_LT = '()',
}

/** Fuzzy value.
 * 1. A+B as And relation
 * 2. A B as Or relation
 * 3. Each values include '%' symbol
 */
export type FuzzyValue = {
  /** fuzzy type */
  type: RelationType
  /** fuzzy values */
  values: string[]
}

/** Query template */
export type QueryTemplate = {
  /** sql template string */
  content: string
  /** binding key-value pairs */
  params: Record<string, unknown>
}

/**
 * Parse the search value to a FuzzyValue structure.
 * 1. 'A+B' deal as And relation
 * 2. 'A B' deal as Or relation
 * @param search the raw fuzzy value
 */
export function toFuzzyValue(search: string): FuzzyValue {
  // split raw value by '+' or ' '
  const isOr = !search.includes('+')
  const sourceValues = isOr
    ? search.split(' ') // 'A B' deal as Or relation
    : search.split('+') // 'A+B' deal as And relation

  // combine
  return {
    type: isOr ? RelationType.Or : RelationType.And,
    // auto fill '%' symbol
    values: sourceValues.map((it) => it.includes('%') ? it : `%${it}%`),
  } as FuzzyValue
}

/**
 * Parse a param name to a sql param marker.
 *
 * Suce as `:paramName` or `${paramName}`
 */
export type ParamMarker = (paramName: string, index?: number) => string
/** ParamMarker with a colon prifix like `:paramName` */
export const colonPrefixParamMarker: ParamMarker = (paramName: string) => `:${paramName}`
/** ParamMarker with a dollar wrapped like `${paramName}` */
export const dollarWrappedParamMarker: ParamMarker = (paramName: string) => `\${${paramName}}`

/**
 * Parse the fuzzy value and generate a fuzzy sql template and its binding params.
 *
 * The binding param marker format generated by {@link ParamMarker}, default use {@link colonPrefixParamMarker}
 *
 * @param[search] the raw fuzzy value, single, 'A+B' or 'A B' mode
 * @param[columns] the sql column names to fuzzy search
 * @param[options] the optional options
 * @options[paramName] default 'search'
 * @options[ignoreCase] default true
 * @options[paramMarker] default {@link colonPrefixParamMarker}
 */
export function toFuzzyQueryTemplate(
  search: string,
  columns: string[],
  options: { paramName?: string; ignoreCase?: boolean; paramMarker?: ParamMarker } = {},
): QueryTemplate {
  // check arguments
  if (columns.length === 0) throw Error('param alias could not be empty.')
  const { paramName = 'search', ignoreCase = true, paramMarker = colonPrefixParamMarker } = options

  // parse values
  const fuzzyValue = toFuzzyValue(search)

  // generate sql-part and its bind value
  const symbol = ignoreCase ? 'ilike' : 'like'
  const params: Record<string, string> = {}
  const sqlParts: string[] = []
  const partPrefix = columns.length === 1 ? '' : '(' // single column not need ()
  const partPostfix = columns.length === 1 ? '' : ')'
  fuzzyValue.values.forEach((value, i) => {
    // each alias use 'or' match, such as "(t.c1 ilike ${search0} or t.c2 ilike ${search0})"
    sqlParts.push(
      partPrefix + columns.map((c) => `${c} ${symbol} ${paramMarker(`${paramName}_${i}`)}`).join(' or ') + partPostfix,
    )

    // record bind paramName and value
    params[`${paramName}_${i}`] = value
  })

  const resultPrefix = fuzzyValue.values.length === 1 ? '' : '(' // single value not need ()
  const resultPostfix = fuzzyValue.values.length === 1 ? '' : ')'
  return {
    content: resultPrefix + sqlParts.join(` ${fuzzyValue.type.toString()} `) + resultPostfix,
    params,
  }
}

/**
 * Convert conditions to QueryTemplate.
 *
 * All conditions cloumn should has mapping to avoid sql inject attack, otherwise throw Error.
 *
 * Default {@link options}:
 *
 * - options.paramName - default 'param'
 * - options.paramMarker - default use {@link colonPrefixParamMarker}
 * - options.valueParser - default use {@link DEFAULT_VALUE_PARSER}
 */
export function toConditionsQueryTemplate(
  conditions: Condition[],
  columnMapper: Record<string, string>,
  options: { paramName?: string; fuzzyColumns?: string[]; paramMarker?: ParamMarker; valueParser?: ValueParser } = {},
): QueryTemplate {
  if (!conditions.length) throw new Error('Empty conditions')
  const {
    paramName = 'param',
    fuzzyColumns,
    paramMarker = colonPrefixParamMarker,
    valueParser = DEFAULT_VALUE_PARSER,
  } = options

  // check to avoid sql inject attack:
  // 1. each column must has mapping
  // 2. each operator must valid
  for (const [column, value, _type, operator] of conditions) {
    if (!column || !value) {
      throw new Error(`Missing condition's column and value`)
    }
    if (column !== 'fuzzy' && !Object.hasOwn(columnMapper, column)) {
      throw new Error(`Missing column '${column}' mapping`)
    }
    if (!Object.values(Operator).includes(operator || Operator.EQ)) {
      throw new Error(`Invalid operator '${operator}'`)
    }
  }

  // build condition template
  const templates: QueryTemplate[] = []
  for (const [i, [column, value, type, operator]] of conditions.entries()) {
    templates.push(
      toConditionQueryTemplate([columnMapper[column] || column, value, type, operator], {
        paramName: `${paramName}_${i}`,
        fuzzyColumns,
        paramMarker,
        valueParser,
      }),
    )
  }

  // combine condition temnplate
  return templates.reduce((pre, cur) => ({
    content: `${pre.content ? pre.content + '\nand ' : ''}${cur.content}`,
    params: Object.assign(pre.params, cur.params),
  }), { content: '', params: {} } as QueryTemplate)
}

/** Parse a string value to specific type value */
export type ValueParser = (value: string, type?: string) => unknown

/**
 * Default value parser.
 *
 * Supported value type:
 *
 * - boolean - Parse '0', 'false', 'f', 'F', 'FALSE' to false, otherwise true
 * - int - Parse string to int by `parseInt(string)` method
 * - float - Parse string to float by `parseFloat(string)` method
 * - number, double，money - Parse string to number by `new Number(any)` method
 * - string - The default type, return the original string value
 */
export const DEFAULT_VALUE_PARSER: ValueParser = (value: string, type = 'string') => {
  if (value === '') return undefined
  switch (type) {
    case 'boolean':
      return ['0', 'false', 'f', 'F', 'FALSE'].includes(value)
    case 'int':
      return parseInt(value)
    case 'float':
      return parseFloat(value)
    case 'number':
    case 'double':
    case 'money':
      return new Number(value)
    default: // string
      return value
  }
}

/**
 * Convert a condition to a QueryTemplate.
 *
 * Default {@link options}:
 *
 * - options.paramName - default 'param'
 * - options.ignoreCase - default true for fuzzy search condition (with id=fuzzy)
 * - options.paramMarker - default use {@link colonPrefixParamMarker}
 * - options.valueParser - default use {@link DEFAULT_VALUE_PARSER}
 */
export function toConditionQueryTemplate(
  condition: Condition,
  options: {
    paramName?: string
    fuzzyColumns?: string[]
    ignoreCase?: boolean
    paramMarker?: ParamMarker
    valueParser?: ValueParser
  } = {},
): QueryTemplate {
  const [column, value, type, operator] = condition
  const {
    paramName = 'param',
    fuzzyColumns,
    ignoreCase = true,
    paramMarker = colonPrefixParamMarker,
    valueParser = DEFAULT_VALUE_PARSER,
  } = options

  // fuzzy condition
  if (column === 'fuzzy') {
    if (!fuzzyColumns || !fuzzyColumns.length) throw new Error('Missing fuzzy columns config')
    return toFuzzyQueryTemplate(value as string, fuzzyColumns as string[], { ignoreCase, paramName, paramMarker })
  }

  // not fuzzy condition
  const params: Record<string, unknown> = {}
  const values = Array.isArray(value) ? value.map((v) => valueParser(v, type)) : valueParser(value, type)
  if (!Array.isArray(value)) {
    // single value compare
    params[paramName] = values
    return {
      content: `${column} ${operator || '='} ${paramMarker(`${paramName}`)}`,
      params,
    }
  } else {
    // multiple values compare
    if ([Operator.IN, Operator.NOT_IN].includes(operator || Operator.EQ)) {
      // in, not in
      ;(values as unknown[]).forEach((v, i) => params[`${paramName}_${i}`] = v)
      return {
        // such as "age in (:p1, :p2)"
        content: `${column} ${operator} (${value.map((_, i) => paramMarker(`${paramName}_${i}`)).join(', ')})`,
        params,
      }
    } else {
      // range compare
      const vs = values as unknown[]
      const has0 = vs[0] !== undefined && vs[0] !== null
      const has1 = vs[1] !== undefined && vs[1] !== null
      const both = has0 && has1
      const contens: string[] = []
      if (has0) {
        params[paramName + '_0'] = vs[0]
        contens.push(`${column} ${operator?.startsWith('[') ? '>=' : '>'} ${paramMarker(`${paramName}_0`)}`)
      }
      if (has1) {
        params[paramName + '_1'] = vs[1]
        contens.push(`${column} ${operator?.endsWith(']') ? '<=' : '<'} ${paramMarker(`${paramName}_1`)}`)
      }
      return {
        content: (both ? '(' : '') + contens.join(' and ') + (both ? ')' : ''),
        params,
      }
    }
  }
}
