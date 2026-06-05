import { defineConfig } from "vite"

// Vite 設定檔。我們的需求很單純，幾乎用預設即可。
// 這裡明確寫出開發伺服器的埠號，讓它和後端 CORS 設定的 5173 對得上。
export default defineConfig({
  server: {
    port: 5173,
  },
})
