/**
 * Utilities for codition query.
 *
 * @module
 */

// value parser
export { DEFAULT_VALUE_PARSER } from './value_parser.ts'
export type { ValueParser } from './value_parser.ts'

// param marker
export { COLON_PREFIX_PARAM_MARKER, DOLLAR_WRAPPED_PARAM_MARKER } from './param_marker.ts'
export type { ParamMarker } from './param_marker.ts'

// condition
export { and, default as parseStringCondition, Operator, or, parseSearchCondition } from './condition.ts'
export type {
  ArrayStringCondition,
  CombineType,
  Condition,
  ObjectStringCondition,
  StringCondition,
} from './condition.ts'

// query template
export { default as createQueryTemplate } from './template.ts'
export type { QueryTemplate } from './template.ts'
