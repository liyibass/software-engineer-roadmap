// 使用者資料層 —— 只負責「使用者怎麼存取」，不含商業規則。
//
// 注意 StoredUser 帶著 passwordHash，這是「後端內部」的型別，不對外。
// 對前端公開的是 shared/types 裡的 PublicUser（不含密碼）。

import type { Role } from "../../../shared/types"

interface StoredUser {
  id: number
  email: string
  passwordHash: string
  role: Role
}

const users: StoredUser[] = []
let nextId = 1

export const userRepository = {
  count(): number {
    return users.length
  },

  findByEmail(email: string): StoredUser | undefined {
    return users.find((user) => user.email === email)
  },

  create(params: { email: string; passwordHash: string; role: Role }): StoredUser {
    const newUser: StoredUser = { id: nextId++, ...params }
    users.push(newUser)
    return newUser
  },
}

export type { StoredUser }
