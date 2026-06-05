// 認證服務層 —— 商業邏輯：註冊規則、登入驗證、簽發 token。
// 密碼一律經過 bcrypt 雜湊，明文用完即丟、絕不儲存（見課程 4-D-4）。

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { userRepository } from "./user.repository"
import type { AuthResponse, PublicUser, Role } from "../../../shared/types"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me"
const TOKEN_TTL = "1h"

// token 裡攜帶的內容（claims）。只放識別資訊，不放機密。
interface TokenPayload {
  userId: number
  role: Role
}

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

// 驗證 token，回傳裡面的 payload；不合法會 throw。給認證中介層用。
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    if (!email || !password) {
      throw new Error("email 與 password 不可為空")
    }
    if (userRepository.findByEmail(email)) {
      throw new Error("這個 email 已經註冊過了")
    }

    // 第一個註冊的人給 admin，方便在這個 POC 示範角色權限；其餘都是一般 user
    const role: Role = userRepository.count() === 0 ? "admin" : "user"

    const passwordHash = await bcrypt.hash(password, 10)
    const user = userRepository.create({ email, passwordHash, role })

    return this.buildAuthResponse(user.id, user.email, user.role)
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = userRepository.findByEmail(email)

    // 找不到使用者、或密碼不對 → 一律回同樣的模糊錯誤，避免洩漏「哪些 email 存在」
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error("帳號或密碼錯誤")
    }

    return this.buildAuthResponse(user.id, user.email, user.role)
  },

  buildAuthResponse(id: number, email: string, role: Role): AuthResponse {
    const publicUser: PublicUser = { id, email, role }
    const token = signToken({ userId: id, role })
    return { token, user: publicUser }
  },
}
