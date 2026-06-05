// POC V5 前端 —— 登入流程 + 帶 token 的請求。
//
// 跟 V4 比，最大的差別：所有待辦請求都要附上 JWT；多了登入/註冊/登出的狀態切換。

import "./style.css"
import type { AuthResponse, PublicUser, Todo } from "../../shared/types"

const API_BASE = import.meta.env.VITE_API_BASE
const TOKEN_KEY = "todo-v5-token"
const USER_KEY = "todo-v5-user"

// --- 畫面元素 ---
const authSection = document.getElementById("auth-section") as HTMLElement
const appSection = document.getElementById("app-section") as HTMLElement
const emailInput = document.getElementById("email-input") as HTMLInputElement
const passwordInput = document.getElementById("password-input") as HTMLInputElement
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement
const registerBtn = document.getElementById("register-btn") as HTMLButtonElement
const authError = document.getElementById("auth-error") as HTMLParagraphElement
const whoami = document.getElementById("whoami") as HTMLSpanElement
const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement
const todoInput = document.getElementById("todo-input") as HTMLInputElement
const addBtn = document.getElementById("add-btn") as HTMLButtonElement
const list = document.getElementById("todo-list") as HTMLUListElement
const emptyHint = document.getElementById("empty-hint") as HTMLParagraphElement

// --- 登入狀態的存取（沿用 localStorage，入門夠用）---
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
function saveSession(data: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
}
function getStoredUser(): PublicUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as PublicUser) : null
}
function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// 統一的 fetch 包裝：自動附上 Authorization 標頭。
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data.error ?? `狀態碼 ${response.status}`
  } catch {
    return `狀態碼 ${response.status}`
  }
}

// --- 認證 ---
async function authenticate(path: "/auth/login" | "/auth/register"): Promise<void> {
  authError.textContent = ""
  try {
    const response = await apiFetch(path, {
      method: "POST",
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value,
      }),
    })
    if (!response.ok) throw new Error(await readError(response))

    const data: AuthResponse = await response.json()
    saveSession(data)
    showApp(data.user)
    await loadTodos()
  } catch (error) {
    authError.textContent = error instanceof Error ? error.message : "操作失敗"
  }
}

function logout(): void {
  clearSession()
  appSection.style.display = "none"
  authSection.style.display = "block"
}

// --- 畫面切換 ---
function showApp(user: PublicUser): void {
  authSection.style.display = "none"
  appSection.style.display = "block"
  const roleLabel = user.role === "admin" ? "（管理員，可看所有人的待辦）" : ""
  whoami.textContent = `${user.email} ${roleLabel}`
}

// --- 待辦 CRUD ---
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
    const response = await apiFetch("/todos")
    // token 失效（過期/無效）→ 後端回 401 → 把使用者帶回登入頁
    if (response.status === 401) return logout()
    if (!response.ok) throw new Error(await readError(response))
    render(await response.json())
  } catch (error) {
    console.error("載入失敗：", error)
  }
}

async function addTodo(): Promise<void> {
  const text = todoInput.value.trim()
  if (!text) return
  try {
    const response = await apiFetch("/todos", {
      method: "POST",
      body: JSON.stringify({ text }),
    })
    if (response.status === 401) return logout()
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
    todoInput.value = ""
    todoInput.focus()
  } catch (error) {
    alert(`新增失敗：${error instanceof Error ? error.message : "未知錯誤"}`)
  }
}

async function toggleTodo(id: number, completed: boolean): Promise<void> {
  try {
    const response = await apiFetch(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
    })
    if (response.status === 401) return logout()
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
  } catch (error) {
    alert(`更新失敗：${error instanceof Error ? error.message : "未知錯誤"}`)
    await loadTodos()
  }
}

async function deleteTodo(id: number): Promise<void> {
  try {
    const response = await apiFetch(`/todos/${id}`, { method: "DELETE" })
    if (response.status === 401) return logout()
    if (!response.ok) throw new Error(await readError(response))
    await loadTodos()
  } catch (error) {
    alert(`刪除失敗：${error instanceof Error ? error.message : "未知錯誤"}`)
  }
}

// --- 事件綁定 ---
loginBtn.addEventListener("click", () => authenticate("/auth/login"))
registerBtn.addEventListener("click", () => authenticate("/auth/register"))
logoutBtn.addEventListener("click", logout)
addBtn.addEventListener("click", addTodo)
todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTodo()
})

// --- 啟動：如果上次登入的 session 還在，直接進 App（省去重新登入）---
const savedUser = getStoredUser()
if (getToken() && savedUser) {
  showApp(savedUser)
  loadTodos() // 若 token 其實已過期，loadTodos 收到 401 會自動登出
}
