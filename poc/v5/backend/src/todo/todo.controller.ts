// 待辦控制器 —— 只負責 HTTP。把 token 解出的身分傳給 Service，
// 並把 Service 拋出的語意錯誤翻譯成對應狀態碼。

import type { Request, Response } from "express"
import { todoService } from "./todo.service"
import { ForbiddenError, NotFoundError, ValidationError } from "../errors"
import type { Role } from "../../../shared/types"

// requireAuth 中介層已把登入者資訊掛在 request 上
function getCaller(request: Request): { userId: number; role: Role } {
  return { userId: request.userId!, role: request.userRole! }
}

// 把 Service 的語意錯誤對應到 HTTP 狀態碼，避免每個方法重複寫
function sendError(response: Response, error: unknown): void {
  if (error instanceof ValidationError) {
    response.status(400).json({ error: error.message })
  } else if (error instanceof NotFoundError) {
    response.status(404).json({ error: error.message })
  } else if (error instanceof ForbiddenError) {
    response.status(403).json({ error: error.message })
  } else {
    // 沒預期到的，交給全域錯誤處理（500）
    throw error
  }
}

export const todoController = {
  getAll(request: Request, response: Response): void {
    response.json(todoService.getTodos(getCaller(request)))
  },

  create(request: Request, response: Response): void {
    try {
      const todo = todoService.createTodo(getCaller(request), request.body.text)
      response.status(201).json(todo)
    } catch (error) {
      sendError(response, error)
    }
  },

  update(request: Request, response: Response): void {
    try {
      const todo = todoService.setCompleted(
        getCaller(request),
        Number(request.params.id),
        request.body.completed,
      )
      response.json(todo)
    } catch (error) {
      sendError(response, error)
    }
  },

  remove(request: Request, response: Response): void {
    try {
      todoService.deleteTodo(getCaller(request), Number(request.params.id))
      response.status(204).send()
    } catch (error) {
      sendError(response, error)
    }
  },
}
