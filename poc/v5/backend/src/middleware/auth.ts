// 認證與授權中介層。
//   requireAuth      —— 驗證 token，確認「你是誰」（沒登入 → 401）
//   requireRole(role) —— 確認「你的角色夠不夠」（登入了但角色不對 → 403）

import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../auth/auth.service"
import type { Role } from "../../../shared/types"

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authHeader = request.headers.authorization
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null

  if (!token) {
    response.status(401).json({ error: "請先登入" })
    return
  }

  try {
    const payload = verifyToken(token)
    request.userId = payload.userId
    request.userRole = payload.role
    next()
  } catch {
    response.status(401).json({ error: "登入已失效，請重新登入" })
  }
}

// 會回傳一個「只放行指定角色」的中介層。疊在 requireAuth 後面使用。
export function requireRole(role: Role) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (request.userRole !== role) {
      // 403：你登入了（認證過），但沒這個權限（授權不過）
      response.status(403).json({ error: "權限不足" })
      return
    }
    next()
  }
}
