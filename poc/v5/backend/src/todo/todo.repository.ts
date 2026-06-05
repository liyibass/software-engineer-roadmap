// 待辦資料層 —— 只負責資料存取，不含「誰能做什麼」的規則（那是 Service 的事）。

import type { Todo } from "../../../shared/types"

const todos: Todo[] = []
let nextId = 1

export const todoRepository = {
  findAll(): Todo[] {
    return todos
  },

  findByOwner(ownerId: number): Todo[] {
    return todos.filter((todo) => todo.ownerId === ownerId)
  },

  findById(id: number): Todo | undefined {
    return todos.find((todo) => todo.id === id)
  },

  create(ownerId: number, text: string): Todo {
    const newTodo: Todo = { id: nextId++, text, completed: false, ownerId }
    todos.push(newTodo)
    return newTodo
  },

  remove(id: number): void {
    const index = todos.findIndex((todo) => todo.id === id)
    if (index !== -1) todos.splice(index, 1)
  },
}
