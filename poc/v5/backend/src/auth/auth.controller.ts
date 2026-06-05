// 認證控制器 —— 只負責 HTTP：讀請求、把結果或錯誤翻成狀態碼。

import type { Request, Response } from "express"
import { authService } from "./auth.service"

export const authController = {
  async register(request: Request, response: Response): Promise<void> {
    try {
      const { email, password } = request.body
      const result = await authService.register(email, password)
      response.status(201).json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "註冊失敗"
      response.status(400).json({ error: message })
    }
  },

  async login(request: Request, response: Response): Promise<void> {
    try {
      const { email, password } = request.body
      const result = await authService.login(email, password)
      response.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "登入失敗"
      // 認證失敗回 401
      response.status(401).json({ error: message })
    }
  },
}
