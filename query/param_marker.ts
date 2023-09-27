/**
 * Parse a param name to a query param marker.
 *
 * Suce as `:paramName` or `${paramName}`
 */
export type ParamMarker = (paramName: string) => string

/** Colon prefix param marker, such as `:paramName` */
export const COLON_PREFIX_PARAM_MARKER: ParamMarker = (paramName: string) => `:${paramName}`

/** Dollar wrapped param marker, such as `${paramName}` */
export const DOLLAR_WRAPPED_PARAM_MARKER: ParamMarker = (paramName: string) => `\${${paramName}}`
