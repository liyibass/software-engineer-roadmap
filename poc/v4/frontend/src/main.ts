// POC V4 前端 —— 功能同 V3，但用 Vite + 共用型別 + 環境變數。

import "./style.css"
// 共用型別：和後端用的是同一份 shared/types.ts（單一事實來源）
import type { Todo } from "../../shared/types"

// API 網址改從環境變數讀取，不再寫死。值定義在 .env 的 VITE_API_BASE。
const API_BASE = import.meta.env.VITE_API_BASE

const input = document.getElementById("todo-input") as HTMLInputElement
const addBtn = document.getElementById("add-btn") as HTMLButtonElement
const list = document.getElementById("todo-list") as HTMLUListElement
const emptyHint = document.getElementById("empty-hint") as HTMLParagraphElement

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.error ?? `狀態碼 ${response.status}`
  } catch {
    return `狀態碼 ${response.status}`
  }
}

function createTodoElement(todo: Todo): HTMLLIElement {
  const li = document.createElement("li")
  li.className = todo.completed ? "todo-item completed" : "todo-item"

  const checkbox = document.createElement("input")
  checkbox.type = "checkbox"
  checkbox.checked = todo.completed
  checkbox.addEventListener("change", () => toggleTodo(todo.id, checkbox.checked))

  const textSpan = document.createElement("span")
  textSpan.className = "todo-text"
  textSpan.textContent = todo.text

  const deleteBtn = document.createElement("button")
  deleteBtn.className = "delete-btn"
  deleteBtn.textContent = "✕"
  deleteBtn.title = "刪除這筆待辦"
  deleteBtn.addEventListener("click", () => deleteTodo(todo.id))

  li.appendChild(checkbox)
  li.appendChild(textSpan)
  li.appendChild(deleteBtn)
  return li
}

function render(todos: Todo[]): void {
  list.innerHTML = ""
  todos.forEach((todo) => list.appendChild(createTodoElement(todo)))
  emptyHint.className = todos.length === 0 ? "empty-hint visible" : "empty-hint"
}

async function loadTodos(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/todos`)
    if (!response.ok) throw new Error(await readError(response))
    const todos: Todo[] = await response.json()
    render(todos)
  } catch (error) {
    console.error("載入失敗：", error)
    alert("載入失敗，請確認後端有沒有啟動")
  }
}

async function addTodo(): Promise<void> {
  const text = input.value.trim()
  if (!text) return
  try {
    const response = await fetch(`${API_BASE}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
    input.value = ""
    input.focus()
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知的錯誤"
    alert(`新增失敗：${message}`)
  }
}

async function toggleTodo(id: number, completed: boolean): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知的錯誤"
    alert(`更新失敗：${message}`)
    await loadTodos()
  }
}

async function deleteTodo(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/todos/${id}`, { method: "DELETE" })
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知的錯誤"
    alert(`刪除失敗：${message}`)
  }
}

addBtn.addEventListener("click", addTodo)
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTodo()
})

loadTodos()
