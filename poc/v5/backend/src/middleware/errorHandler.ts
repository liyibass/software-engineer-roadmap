// 全域錯誤處理中介層（安全網）—— 接住所有沒被預期到的意外，統一回乾淨的 500。

import type { Request, Response, NextFunction } from "express"

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  console.error("未預期的錯誤：", error)
  response.status(500).json({ error: "伺服器發生未預期的錯誤，請稍後再試" })
}
