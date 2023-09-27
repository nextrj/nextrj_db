/** Parse a string representation value to the specific type value */
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
      return !['0', 'false', 'f', 'F', 'FALSE'].includes(value)
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
