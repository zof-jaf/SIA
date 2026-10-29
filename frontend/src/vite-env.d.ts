/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_ENABLE_DEMO_ACCOUNTS?: string
  readonly VITE_DEMO_PASSWORD?: string
  readonly VITE_DEMO_ESTUDIANTE_EMAIL?: string
  readonly VITE_DEMO_PROFESOR_EMAIL?: string
  readonly VITE_DEMO_ADMINISTRADOR_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
