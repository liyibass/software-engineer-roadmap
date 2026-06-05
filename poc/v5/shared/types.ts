// 前後端共用型別 —— 唯一事實來源。

export type Role = "user" | "admin"

export interface Todo {
  id: number
  text: string
  completed: boolean
  ownerId: number // V5 新增：每筆待辦屬於哪個使用者
}

// 回給前端的使用者資訊。注意「不含密碼雜湊」——機密不該離開後端。
export interface PublicUser {
  id: number
  email: string
  role: Role
}

// 登入 / 註冊成功後的回應
export interface AuthResponse {
  token: string
  user: PublicUser
}
