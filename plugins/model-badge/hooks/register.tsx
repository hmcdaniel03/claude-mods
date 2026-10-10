import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Effort } from '../types'

const FAMILIES = ['opus', 'sonnet', 'haiku', 'fable'] as const
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max']
// Below these widths the badge drops the effort, then hides altogether.
const FULL_COLUMNS = 60
const NAME_COLUMNS = 40
const POLL_MS = 2000

const model = atom({ plugin: 'model-badge', key: 'model' } as const, null)
const effort = atom({ plugin: 'model-badge', key: 'effort' } as const, null)

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

// `claude-opus-5-5`, `opus`, `Opus 5.5`, `claude-3-5-sonnet-20241022` and
// `claude-haiku-4-5-20251001[1m]` all come out as a short display name.
export function displayName(raw: string) {
  const isLong = /\[1m\]/i.test(raw)
  const id = raw.replace(/\[1m\]/gi, '').trim()
  const lower = id.toLowerCase()
  const family = FAMILIES.find(name => lower.includes(name))
  if (family === undefined) return id

  const after = lower.match(new RegExp(`${family}[-_ ]?(\\d+)(?:[-.](\\d{1,2}))?(?!\\d)`))
  const before = lower.match(new RegExp(`(\\d+)[-.](\\d{1,2})[-_ ]${family}`))
  const match = after?.[1] !== undefined && after[1].length < 4 ? after : before
  const version = match ? [match[1], match[2]].filter(part => part !== undefined).join('.') : ''

  return [capitalize(family), version, isLong ? '1M' : ''].filter(Boolean).join(' ')
}

export function effortLevel(value: unknown): Effort {
  return typeof value === 'string' && LEVELS.includes(value) ? value : null
}

// The badge's text for the room the footer has; null when there is none.
export function label(name: string | null, level: Effort, columns: number | undefined) {
  if (name === null) return null
  const width = columns ?? FULL_COLUMNS
  if (width < NAME_COLUMNS) return null
  if (level === null || width < FULL_COLUMNS) return name

  return `${name} · ${level}`
}

// Re-reads the session's model; true when it moved since the last read.
async function refresh($: EngineInterface) {
  const name = displayName(await $.session.model())
  const previous = await read($, model)
  if (previous === name) return false
  await update($, model, () => name)

  return previous !== null
}

export const register: Register = on => {
  let poll: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    await refresh($)

    // `/model`, `--model`, a settings change or a fallback: whatever moved it,
    // the next tick redraws the badge and flashes the change top-right.
    if (e.isInteractive) {
      poll?.cancel()
      poll = $.clock.every(POLL_MS, async () => {
        if (!(await refresh($))) return
        const text = label(await read($, model), await read($, effort), undefined)
        if (text !== null) $.ui.toast(text, { timeoutMs: 2500 })
      })
    }

    return next(e)
  })

  on('session.end', ($, e, next) => {
    poll?.cancel()
    poll = undefined

    return next(e)
  })

  // `/model` and `/effort` redraw at once rather than on the next tick.
  on('command.run', { command: 'model' }, async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('command.run', { command: 'effort' }, async ($, e, next) => {
    const result = await next(e)
    const level = effortLevel(e.args.trim().toLowerCase())
    if (level !== null) await update($, effort, () => level)

    return result
  })

  // The main loop's requests carry the effort actually sent, after any
  // downgrade for the model; subagents' steps are left alone.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const level = effortLevel(e.effort)
      if ((await read($, effort)) !== level) await update($, effort, () => level)
    }

    return yield* next(e)
  })

  // The footer's right-hand corner, ahead of whatever the plugins beneath
  // (context-bar) or the engine draw there.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const text = label(await read($, model), await read($, effort), e.viewport?.columns)
    const rest = await next(e)
    if (text === null) return rest

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap={1}>
        <Text dimColor inverse wrap="truncate">
          {` ${text} `}
        </Text>
        {rest}
      </Box>
    )
  })
}

