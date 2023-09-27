import { assertEquals } from '../deps.ts'
import { COLON_PREFIX_PARAM_MARKER, DOLLAR_WRAPPED_PARAM_MARKER } from './param_marker.ts'

Deno.test('COLON_PREFIX_PARAM_MARKER', () => {
  assertEquals(COLON_PREFIX_PARAM_MARKER('abc'), ':abc')
})

Deno.test('DOLLAR_WRAPPED_PARAM_MARKER', () => {
  assertEquals(DOLLAR_WRAPPED_PARAM_MARKER('abc'), '${abc}')
})
