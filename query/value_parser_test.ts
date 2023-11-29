import { assertEquals, assertStrictEquals } from '../deps.ts'
import { DEFAULT_VALUE_PARSER } from './value_parser.ts'

Deno.test('DEFAULT_VALUE_PARSER', async (t) => {
  await t.step('empty string', () => {
    assertStrictEquals(DEFAULT_VALUE_PARSER('', 'string'), '')
  })
  await t.step('undefined', () => {
    assertStrictEquals(DEFAULT_VALUE_PARSER(undefined, 'string'), undefined)
  })
  await t.step('null', () => {
    assertStrictEquals(DEFAULT_VALUE_PARSER(null, 'string'), null)
  })
  await t.step('string', () => {
    assertEquals(DEFAULT_VALUE_PARSER('abc', 'string'), 'abc')
  })
  await t.step('boolean', () => {
    assertEquals(DEFAULT_VALUE_PARSER('0', 'boolean'), false)
    assertEquals(DEFAULT_VALUE_PARSER('false', 'boolean'), false)
    assertEquals(DEFAULT_VALUE_PARSER('f', 'boolean'), false)
    assertEquals(DEFAULT_VALUE_PARSER('F', 'boolean'), false)
    assertEquals(DEFAULT_VALUE_PARSER('FALSE', 'boolean'), false)
    assertEquals(DEFAULT_VALUE_PARSER('1', 'boolean'), true)
    assertEquals(DEFAULT_VALUE_PARSER('t', 'boolean'), true)
    assertEquals(DEFAULT_VALUE_PARSER('true', 'boolean'), true)
    assertEquals(DEFAULT_VALUE_PARSER('T', 'boolean'), true)
    assertEquals(DEFAULT_VALUE_PARSER('TRUE', 'boolean'), true)
    assertEquals(DEFAULT_VALUE_PARSER('abc', 'boolean'), true)
  })
  await t.step('int', () => {
    assertEquals(DEFAULT_VALUE_PARSER('123', 'int'), 123)
  })
  await t.step('float', () => {
    assertEquals(DEFAULT_VALUE_PARSER('123.45', 'float'), 123.45)
  })
  await t.step('number', () => {
    assertEquals(DEFAULT_VALUE_PARSER('123', 'number'), new Number(123))
  })
  await t.step('double', () => {
    assertEquals(DEFAULT_VALUE_PARSER('123.45', 'double'), new Number(123.45))
  })
  await t.step('money', () => {
    assertEquals(DEFAULT_VALUE_PARSER('123.45', 'money'), new Number(123.45))
  })
})
