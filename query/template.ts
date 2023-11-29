import { CombinedCondition, CombineType, Condition, isCombinedCondition, Operator, RawCondition } from './condition.ts'
import { COLON_PREFIX_PARAM_MARKER, ParamMarker } from './param_marker.ts'

/** Query template */
export type QueryTemplate = {
  /** sql template string */
  content: string
  /** binding key-value pairs */
  params: Record<string, unknown>
}

/**
 * Convert a raw condition to a query template.
 *
 * Default {@link options}:
 *
 * - options.paramName - default 'param'
 * - options.paramMarker - default use {@link COLON_PREFIX_PARAM_MARKER}
 */
function parseRawCondition(
  condition: RawCondition,
  options: { paramName?: string; paramMarker?: ParamMarker } = {},
): QueryTemplate {
  const {
    paramName = 'param',
    paramMarker = COLON_PREFIX_PARAM_MARKER,
  } = options
  const { name, operator, value } = condition
  const params: Record<string, unknown> = {}

  // is null, is not null
  if (operator === Operator.IS_NULL || operator === Operator.IS_NOT_NULL) {
    return {
      content: `${name} ${operator}`,
      params: params,
    }
  }

  // in, not in
  if (operator === Operator.IN || operator === Operator.NOT_IN) {
    const values = value as unknown[]
    values.forEach((v, i) => params[`${paramName}_${i}`] = v)
    return {
      // such as "age in (:param_0, :param_1)"
      content: `${name} ${operator} (${values.map((_, i) => paramMarker(`${paramName}_${i}`)).join(', ')})`,
      params,
    }
  }

  // [], [), (], ()
  if (
    operator === Operator.RANGE_EQ_EQ || operator === Operator.RANGE_EQ_LT ||
    operator === Operator.RANGE_GT_EQ || operator === Operator.RANGE_GT_LT
  ) {
    const values = value as unknown[]
    const has0 = values[0] !== undefined && values[0] !== null && values[0] !== ''
    const has1 = values[1] !== undefined && values[1] !== null && values[1] !== ''
    const both = has0 && has1
    const contens: string[] = []
    if (has0) {
      params[paramName + '_0'] = values[0]
      contens.push(`${name} ${operator?.startsWith('[') ? '>=' : '>'} ${paramMarker(`${paramName}_0`)}`)
    }
    if (has1) {
      params[paramName + '_1'] = values[1]
      contens.push(`${name} ${operator?.endsWith(']') ? '<=' : '<'} ${paramMarker(`${paramName}_1`)}`)
    }
    return {
      content: (both ? '(' : '') + contens.join(' and ') + (both ? ')' : ''),
      params,
    }
  }

  // otherwise single value compare condition
  params[paramName] = value
  return {
    content: `${name} ${operator} ${paramMarker(`${paramName}`)}`,
    params,
  }
}

/**
 * Convert a combined condition to a query template.
 *
 * Default {@link options}:
 *
 * - options.paramName - default 'param'
 * - options.paramMarker - default use {@link COLON_PREFIX_PARAM_MARKER}
 */
function parseCombinedCondition(
  condition: CombinedCondition,
  options: { paramName?: string; paramMarker?: ParamMarker } = {},
): QueryTemplate {
  const templates: QueryTemplate[] = []
  condition.conditions.forEach((cond, i) => {
    const opt = {
      paramName: options.paramName ? `${options.paramName}_${i}` : `param_${i}`,
      paramMarker: options.paramMarker,
    }
    if (isCombinedCondition(cond)) templates.push(parseCombinedCondition(cond as CombinedCondition, opt))
    else templates.push(parseRawCondition(cond as RawCondition, opt))
  })

  // combine condition temnplate
  const len = templates.length
  return templates.reduce((pre, cur, i) => {
    return {
      content: `${i === 0 && len > 1 ? '(' : ''}${
        pre.content ? pre.content + ' ' + condition.type + ' ' : ''
      }${cur.content}${i === len - 1 && len > 1 ? ')' : ''}`,
      params: Object.assign(pre.params, cur.params),
    }
  }, { content: '', params: {} } as QueryTemplate)
}

/** Convert condition to query template */
export default function createQueryTemplate(
  condition: Condition | Condition[],
  options: { paramName?: string; paramMarker?: ParamMarker } = {},
): QueryTemplate {
  if (Array.isArray(condition)) {
    return parseCombinedCondition({ type: CombineType.And, conditions: condition }, options)
  } else {
    if (isCombinedCondition(condition)) return parseCombinedCondition(condition as CombinedCondition, options)
    else return parseRawCondition(condition as RawCondition, options)
  }
}
