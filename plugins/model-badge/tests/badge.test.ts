import { expect, test } from 'claude-code/testing'

import { displayName, effortLevel, label } from '../hooks/register'

test('model ids come out as short display names', () => {
  expect(displayName('claude-opus-5-5')).toBe('Opus 5.5')
  expect(displayName('claude-fable-5-1')).toBe('Fable 5.1')
  expect(displayName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(displayName('claude-opus-4-20250514')).toBe('Opus 4')
  expect(displayName('claude-3-5-sonnet-20241022')).toBe('Sonnet 3.5')
  expect(displayName('claude-sonnet-5-5[1m]')).toBe('Sonnet 5.5 1M')
  expect(displayName('Opus 5.5')).toBe('Opus 5.5')
  expect(displayName('opus')).toBe('Opus')
  expect(displayName('gpt-oss')).toBe('gpt-oss')
})

test('effort is a known level or nothing', () => {
  expect(effortLevel('xhigh')).toBe('xhigh')
  expect(effortLevel(32000)).toBe(null)
  expect(effortLevel(undefined)).toBe(null)
})

test('the badge drops effort, then itself, as the footer narrows', () => {
  expect(label('Opus 5.5', 'high', 120)).toBe('Opus 5.5 · high')
  expect(label('Opus 5.5', 'high', undefined)).toBe('Opus 5.5 · high')
  expect(label('Opus 5.5', null, 120)).toBe('Opus 5.5')
  expect(label('Opus 5.5', 'high', 50)).toBe('Opus 5.5')
  expect(label('Opus 5.5', 'high', 30)).toBe(null)
  expect(label(null, 'high', 120)).toBe(null)
})
