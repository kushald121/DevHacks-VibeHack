interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  webkitSpeechRecognition?: new () => {
    lang: string
    interimResults: boolean
    continuous: boolean
    onresult: ((event: unknown) => void) | null
    onerror: (() => void) | null
    onend: (() => void) | null
    start: () => void
    stop: () => void
  }
}

declare module 'virtual:pwa-register' {
  export function registerSW(options?: { immediate?: boolean }): () => void
}
