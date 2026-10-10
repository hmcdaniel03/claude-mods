export type Effort = string | null

declare module 'claude-code' {
  interface PluginState {
    'model-badge': { model: string | null; effort: Effort }
  }
}
