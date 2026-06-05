/// <reference types="vite/client" />

// 讓 TypeScript 知道我們自訂的環境變數型別（import.meta.env.VITE_API_BASE）
interface ImportMetaEnv {
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
