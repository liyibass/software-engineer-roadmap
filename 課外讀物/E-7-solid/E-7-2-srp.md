# [E-7-2] S — Single Responsibility Principle

> **這篇在說什麼**：Single Responsibility Principle 說的是「一個模組只有一個改變的理由」——這句話聽起來簡單，但真正理解它，能讓你的程式碼品質跳一個量級。

## 概念說明

想像一個傳奇員工——他負責公司的會計、IT 設備管理、行銷文案、還有辦公室維修。聽起來很厲害，對吧？

但現實是：每次辦公室需要搬遷，你要打斷他的會計工作。每次 IT 政策改變，行銷計畫就必須暫停。每次會計系統升級，他的 IT 工作堆成山。這個人的每一個職責，都可能因為其他完全不相關的事情被影響到。

這就是違反 Single Responsibility 的樣子——**一個模組被太多不同的事情牽動著。**

SRP 的核心定義是：

> **一個模組，只有一個改變的理由（reason to change）。**

注意關鍵詞是「**改變的理由**」，不只是「做一件事」。這個細節很重要。

## 深入一點

### 「一個改變的理由」到底是什麼意思？

假設你有一個 `UserReport` 模組，它負責：
1. 從資料庫查詢使用者資料
2. 把資料格式化成報表
3. 把報表輸出成 PDF

這個模組有幾個「改變的理由」？

- 資料庫 schema 改了 → 模組要改（理由一）
- 報表格式規格改了 → 模組要改（理由二）
- PDF 產生方式換成不同的套件 → 模組要改（理由三）

三個不相關的事情，都會導致這個模組被修改。**這就是違反 SRP 的特徵。**

---

### TypeScript 例子：違反 SRP 的 `UserService`

```typescript
// ❌ 這個 class 做了太多不相關的事
class UserService {
  // 驗證邏輯——如果驗證規則改了，這個 class 要動
  validateUserData(user: User): boolean {
    if (!user.email.includes('@')) return false
    if (user.password.length < 8) return false
    return true
  }

  // 資料庫操作——如果換成不同的 ORM，這個 class 要動
  saveToDatabase(user: User): void {
    db.query('INSERT INTO users VALUES (?)', [user])
  }

  // 發送 email——如果換成不同的 email 服務，這個 class 要動
  sendWelcomeEmail(email: string): void {
    emailClient.send({ to: email, subject: '歡迎！' })
  }

  // 記錄日誌——如果 logging 格式改了，這個 class 要動
  logUserActivity(userId: number): void {
    console.log(`[${new Date().toISOString()}] 使用者 ${userId} 已建立`)
  }

  // 格式化輸出——如果前端需要的格式改了，這個 class 要動
  formatUserForDisplay(user: User): string {
    return `${user.name} (${user.email})`
  }
}
```

數一下：這個 `UserService` 有**五個不同的改變理由**。

---

### 拆開之後的樣子

```typescript
// ✅ 每個 class 只有一個改變的理由

// 只在「驗證規則改變」時才需要修改
class UserValidator {
  validate(user: User): boolean {
    if (!user.email.includes('@')) return false
    if (user.password.length < 8) return false
    return true
  }
}

// 只在「資料庫實作改變」時才需要修改
class UserRepository {
  save(user: User): void {
    db.query('INSERT INTO users VALUES (?)', [user])
  }

  findById(userId: number): User | null {
    return db.query('SELECT * FROM users WHERE id = ?', [userId])
  }
}

// 只在「email 服務改變」時才需要修改
class EmailService {
  sendWelcome(email: string): void {
    emailClient.send({ to: email, subject: '歡迎！' })
  }
}

// 只在「日誌格式改變」時才需要修改
class ActivityLogger {
  logUserCreated(userId: number): void {
    console.log(`[${new Date().toISOString()}] 使用者 ${userId} 已建立`)
  }
}

// 只在「顯示格式改變」時才需要修改
class UserFormatter {
  formatForDisplay(user: User): string {
    return `${user.name} (${user.email})`
  }
}
```

---

### 拆開之後，組合起來的地方

拆成這麼多小的 class 之後，你要怎麼「組合」它們完成一個完整的使用者註冊流程？

```typescript
// 這個 class 負責「編排」——把各個小 class 組合起來完成一件事
class UserRegistrationService {
  constructor(
    private readonly validator: UserValidator,
    private readonly repository: UserRepository,
    private readonly emailService: EmailService,
    private readonly logger: ActivityLogger,
  ) {}

  async register(userData: User): Promise<void> {
    if (!this.validator.validate(userData)) {
      throw new Error('使用者資料驗證失敗')
    }

    this.repository.save(userData)
    await this.emailService.sendWelcome(userData.email)
    this.logger.logUserCreated(userData.id)
  }
}
```

這個 `UserRegistrationService` 的職責是「知道註冊流程的步驟是什麼」——而不是「知道每個步驟怎麼實作」。

---

### 什麼時候應該拆，什麼時候不要過度拆？

SRP 有個常見的誤用：把每一行程式碼都拆成獨立的函式或 class，搞到最後程式碼讀起來跳來跳去，比原來更難理解。

一個實用的判斷方式：

**問自己：「這些東西，會因為同一個原因而改變嗎？」**

```typescript
// 這兩個方法雖然是不同的操作，但它們改變的理由是一樣的
// （資料庫 schema 或資料庫連線方式改變）
// → 放在同一個 class 是合理的
class UserRepository {
  save(user: User): void { ... }
  findById(userId: number): User | null { ... }
  findByEmail(email: string): User | null { ... }
  delete(userId: number): void { ... }
}
```

這四個方法都屬於「資料庫操作」這個職責，它們的「改變理由」是相同的。放在一起是合理的——不需要拆成四個 class。

---

### SRP 讓測試變得超簡單

這是 SRP 最立竿見影的好處。拆開後，每個 class 都可以被獨立測試：

```typescript
// 測試 UserValidator 完全不需要資料庫、不需要 email 服務
describe('UserValidator', () => {
  const validator = new UserValidator()

  test('email 格式錯誤時回傳 false', () => {
    const invalidUser = { email: 'not-an-email', password: 'password123' }
    expect(validator.validate(invalidUser as User)).toBe(false)
  })

  test('密碼太短時回傳 false', () => {
    const weakPasswordUser = { email: 'test@example.com', password: '123' }
    expect(validator.validate(weakPasswordUser as User)).toBe(false)
  })
})
```

如果 `validateUserData` 還在原本的大型 `UserService` 裡，測試它就需要初始化整個 `UserService`，包含資料庫連線、email 設定等等——完全不必要的複雜度。

## 延伸閱讀

> 回到 SOLID 的完整總覽 → [E-7-1 SOLID 總覽：五個原則一次看懂](./E-7-1-solid-overview.md)

> 繼續看下一個原則 → [E-7-3 O — Open/Closed Principle](./E-7-3-ocp.md)
