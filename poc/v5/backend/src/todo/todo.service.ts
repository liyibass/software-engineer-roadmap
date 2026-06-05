// 待辦服務層 —— 商業邏輯與授權規則都在這裡。
//
// 授權規則：一般使用者只能存取「自己的」待辦；admin 可以存取所有人的。
// Service 用自訂錯誤表達語意，不碰 HTTP（HTTP 是 Controller 的事）。

import { todoRepository } from "./todo.repository"
import { ForbiddenError, NotFoundError, ValidationError } from "../errors"
import type { Role, Todo } from "../../../shared/types"

// 呼叫者的身分，由 Controller 從 token 取出後傳進來
interface Caller {
  userId: number
  role: Role
}

export const todoService = {
  // admin 看所有人的；一般使用者只看自己的
  getTodos(caller: Caller): Todo[] {
    return caller.role === "admin"
      ? todoRepository.findAll()
      : todoRepository.findByOwner(caller.userId)
  },

  createTodo(caller: Caller, text: string): Todo {
    const trimmed = (text ?? "").trim()
    if (trimmed === "") {
      throw new ValidationError("text 不可為空")
    }
    return todoRepository.create(caller.userId, trimmed)
  },

  setCompleted(caller: Caller, id: number, completed: boolean): Todo {
    if (typeof completed !== "boolean") {
      throw new ValidationError("completed 必須是布林值")
    }
    const todo = this.getOwnedTodo(caller, id) // 內含「存在 + 有權限」的檢查
    todo.completed = completed
    return todo
  },

  deleteTodo(caller: Caller, id: number): void {
    this.getOwnedTodo(caller, id)
    todoRepository.remove(id)
  },

  // 取出一筆待辦，同時檢查「存在」與「呼叫者有沒有權限碰它」。
  // 把這段重複的守衛邏輯集中起來，三個操作共用。
  getOwnedTodo(caller: Caller, id: number): Todo {
    const todo = todoRepository.findById(id)
    if (!todo) {
      throw new NotFoundError(`找不到 id 為 ${id} 的待辦`)
    }
    // admin 暢行無阻；一般使用者只能碰自己的
    if (caller.role !== "admin" && todo.ownerId !== caller.userId) {
      throw new ForbiddenError("你沒有權限操作這筆待辦")
    }
    return todo
  },
}
