// POC V4 後端 —— 功能同 V3，但工程升級：共用型別 + 環境變數驅動的 CORS。

// 在最頂端載入 .env 裡的環境變數到 process.env（檔案不存在也不會報錯）
import "dotenv/config"
import express from "express"
import cors from "cors"
import type { Request, Response, NextFunction } from "express"
// 共用型別：和前端引用的是同一份定義（import type 在編譯時會被完全抹除）
import type { Todo } from "../../shared/types"

const app = express()
const PORT = 3000

// CORS 來源改用環境變數，而不是寫死。開發時沒設就退回預設的 Vite 埠號。
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"
app.use(cors({ origin: FRONTEND_ORIGIN }))

app.use(express.json())

let todos: Todo[] = [{ id: 1, text: "用 Vite 升級前端", completed: true }]
let nextId = 2

function findTodo(id: number): Todo | undefined {
  return todos.find((item) => item.id === id)
}

app.get("/todos", (request, response) => {
  response.json(todos)
})

app.get("/todos/:id", (request, response) => {
  const id = Number(request.params.id)
  const todo = findTodo(id)
  if (!todo) {
    response.status(404).json({ error: `找不到 id 為 ${id} 的待辦` })
    return
  }
  response.json(todo)
})

app.post("/todos", (request, response) => {
  const text: string = request.body.text
  if (!text || text.trim() === "") {
    response.status(400).json({ error: "text 不可為空" })
    return
  }
  const newTodo: Todo = { id: nextId++, text: text.trim(), completed: false }
  todos.push(newTodo)
  response.status(201).json(newTodo)
})

app.put("/todos/:id", (request, response) => {
  const id = Number(request.params.id)
  const todo = findTodo(id)
  if (!todo) {
    response.status(404).json({ error: `找不到 id 為 ${id} 的待辦` })
    return
  }
  const completed = request.body.completed
  if (typeof completed !== "boolean") {
    response.status(400).json({ error: "completed 必須是布林值" })
    return
  }
  todo.completed = completed
  response.json(todo)
})

app.delete("/todos/:id", (request, response) => {
  const id = Number(request.params.id)
  const index = todos.findIndex((item) => item.id === id)
  if (index === -1) {
    response.status(404).json({ error: `找不到 id 為 ${id} 的待辦` })
    return
  }
  todos.splice(index, 1)
  response.status(204).send()
})

function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  console.error("未預期的錯誤：", error)
  response.status(500).json({ error: "伺服器發生未預期的錯誤，請稍後再試" })
}

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`後端已啟動，正在 http://localhost:${PORT} 待命`)
  console.log(`允許的前端來源（CORS）：${FRONTEND_ORIGIN}`)
})
