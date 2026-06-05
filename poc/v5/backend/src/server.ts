// POC V5 後端入口 —— 只負責「組裝」：載入中介層、把路由對應到 Controller。
// 真正的邏輯都在各層（auth/ 與 todo/ 底下），這裡乾淨得像一張目錄。

import "dotenv/config"
import express from "express"
import cors from "cors"

import { authController } from "./auth/auth.controller"
import { todoController } from "./todo/todo.controller"
import { requireAuth } from "./middleware/auth"
import { errorHandler } from "./middleware/errorHandler"

const app = express()
const PORT = 3000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"

app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

// --- 認證相關：不需要登入就能呼叫 ---
app.post("/auth/register", authController.register)
app.post("/auth/login", authController.login)

// --- 待辦相關：全部用 requireAuth 上鎖，沒登入進不來 ---
app.get("/todos", requireAuth, todoController.getAll)
app.post("/todos", requireAuth, todoController.create)
app.put("/todos/:id", requireAuth, todoController.update)
app.delete("/todos/:id", requireAuth, todoController.remove)

// 安全網掛在所有路由之後
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`後端已啟動，正在 http://localhost:${PORT} 待命`)
  console.log(`允許的前端來源（CORS）：${FRONTEND_ORIGIN}`)
  console.log(`提示：第一個註冊的帳號會是 admin（可看所有人的待辦）`)
})
