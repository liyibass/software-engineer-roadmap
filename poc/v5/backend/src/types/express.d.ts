// 擴充 Express 的 Request 型別，加上認證中介層會掛上去的欄位。
// 用 ?: 是因為只有「通過 requireAuth 的請求」才會有這些值。

import type { Role } from "../../../shared/types"

declare global {
  namespace Express {
    interface Request {
      userId?: number
      userRole?: Role
    }
  }
}

export {}
