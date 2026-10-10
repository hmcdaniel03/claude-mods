import { expect, test } from 'claude-code/testing'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`draws the badge ahead of the footer's modes on ${surface}`, async ($, on) => {
    on('session.model', () => ({ value: 'claude-opus-5-5' }))
    on('ui.render', { component: 'SessionMode' }, ($, e) => {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>{e.props.modes.join(' & ')}</Text>
    })
    on('session.start', (_, e) => ({ cwd: e.cwd }))

    await $.session.start({ cwd: '/tmp', surface, isInteractive: false })
    const ui = await $.ui.mount({
      plugin: 'model-badge',
      surface,
      component: 'SessionMode',
      props: { modes: ['focus'] },
      viewport: { columns: 120, rows: 40 },
    })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('Opus 5.5')
    expect(drawn).toContain('focus')
  })
}

test('/model redraws the badge with the new model at once', async ($, on) => {
  let current = 'claude-opus-5-5'
  on('session.model', () => ({ value: current }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.run', { command: 'model' }, () => ({ text: '' }))
  on('ui.render', { component: 'SessionMode' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.modes.join(' & ')}</Text>
  })

  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: false })
  const ui = await $.ui.mount({
    plugin: 'model-badge',
    surface: 'terminal',
    component: 'SessionMode',
    props: { modes: [] },
    viewport: { columns: 120, rows: 40 },
  })
  expect(JSON.stringify(await ui.drawn())).toContain('Opus 5.5')

  current = 'claude-fable-5-1'
  await $.command.run({
    command: 'model',
    args: 'fable',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })
  await ui.redraw()
  expect(JSON.stringify(await ui.drawn())).toContain('Fable 5.1')
})
