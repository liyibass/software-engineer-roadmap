# [2-5] 函式：輸入 → 處理 → 輸出 的思維

> **本章目標**：學會替函式的參數和回傳值加上型別，並理解「純函式」和「單一職責」這兩個讓程式碼好維護的核心概念。

## 你會學到

- 如何為函式的參數與回傳值加上型別標記
- 箭頭函式（arrow function）的型別寫法
- 選填參數與預設值參數的使用方式
- 什麼是「純函式」，為什麼它讓程式更好測試
- 為什麼一個函式只應該做一件事

---

## 概念說明

### 函式是程式的基本積木

在 1-4 章我們談過「抽象化」——把重複的步驟封裝起來，給它一個名字。函式就是這個概念最直接的體現。

想像一台自動販賣機：

```
投入金額（輸入）
  ↓
機器計算找零、彈出飲料（處理）
  ↓
拿到飲料和找零（輸出）
```

函式就是這台機器。你不需要知道機器內部怎麼運作，只需要知道：**放什麼進去，會拿到什麼出來**。

TypeScript 讓我們把這個「放什麼、拿什麼」寫清楚，變成程式碼層面的合約。

---

### 加上型別的函式

沒有型別標記的 JavaScript 函式：

```
function add(a, b):
    回傳 a + b
```

你不知道 `a` 和 `b` 是數字還是字串。`add(1, 2)` 是 `3`，但 `add("1", "2")` 是 `"12"`——同樣的函式，不同的行為，這是 bug 的溫床。

TypeScript 版本：

```typescript
function add(a: number, b: number): number {
  return a + b
}
```

現在任何人一眼就看懂：這個函式接受兩個數字，回傳一個數字。如果你傳了字串進去，TypeScript 在你打完的瞬間就會警告你。

**原則**：函式參數的型別**一定要標記**。回傳型別 TypeScript 通常可以自動推斷，但明確寫出來更容易閱讀（這份課程的範例都會寫出回傳型別）。

---

### 箭頭函式

箭頭函式是另一種定義函式的語法，在 React 和現代 JavaScript 中非常常見：

```
// 一般函式
function multiply(a, b) { 回傳 a * b }

// 箭頭函式（更簡短）
const multiply = (a, b) => a * b
```

加上型別之後：

```typescript
// 一般函式
function multiply(a: number, b: number): number {
  return a * b
}

// 箭頭函式
const multiply = (a: number, b: number): number => a * b
```

兩種寫法效果幾乎相同。簡短的單行邏輯用箭頭函式，複雜的多行邏輯用一般函式，比較好讀。

---

### 選填參數與預設值

有時候某個參數「可以不傳」：

```typescript
// 「?」讓參數變成選填
function greet(name: string, title?: string): string {
  if (title) {
    return `Hello, ${title} ${name}`
  }
  return `Hello, ${name}`
}

greet("Alice")          // "Hello, Alice"
greet("Alice", "Dr.")   // "Hello, Dr. Alice"
```

或者你想給一個「沒傳的時候就用這個值」的預設值：

```typescript
function createGuest(name: string, role: string = "guest"): string {
  return `${name} 的身份是 ${role}`
}

createGuest("Bob")           // "Bob 的身份是 guest"
createGuest("Alice", "admin") // "Alice 的身份是 admin"
```

預設值和選填參數不能同時用——有預設值的參數本身就已經是「選填」的了。

---

### 函式型別

函式也是一種值，可以存在變數裡、當作參數傳入另一個函式。當函式變成「資料」的時候，我們就需要描述它的型別。

用 `type` 定義一個「函式型別」（也叫函式簽名）：

```
Formatter 的定義：
  接受一個字串
  回傳一個字串
```

```typescript
type Formatter = (value: string) => string

// 任何符合這個形狀的函式，都可以當作 Formatter 使用
const toUpperCase: Formatter = (s) => s.toUpperCase()
const trim: Formatter = (s) => s.trim()
const addPrefix: Formatter = (s) => `[LOG] ${s}`
```

這在之後學 React 時很實用——React 的 `onClick`、`onChange` 等屬性，都是函式型別。

---

### 純函式（Pure Function）

這是軟體工程中一個非常重要的概念，理解它之後，你寫的程式碼會好維護很多。

**純函式的兩個條件**：
1. 相同的輸入，**永遠**產生相同的輸出
2. 不修改函式外部的任何東西（沒有「副作用」Side Effect）

用生活類比：計算機上的加法就是純函式。你按 `3 + 5`，永遠得到 `8`。它不會因為「現在幾點鐘」或「你之前算過什麼」而給你不同的答案，也不會改變你桌上的任何東西。

```typescript
// 純函式 ✅
// 相同的 a 和 b，永遠回傳相同的值
function add(a: number, b: number): number {
  return a + b
}

// 純函式 ✅
// 只用傳入的資料，不動外面的東西
function formatName(firstName: string, lastName: string): string {
  return `${lastName} ${firstName}`
}
```

```typescript
// 不純的函式 ❌
// 它修改了外部的 total 變數——「副作用」
let total = 0

function addToTotal(n: number): void {
  total += n  // 改了外部狀態
}

addToTotal(5)  // total 變成 5
addToTotal(5)  // total 變成 10
// 傳同樣的 5，但效果不一樣——這很容易造成 bug
```

```typescript
// 不純的函式 ❌
// 依賴外部的「現在時間」，同樣的呼叫在不同時間點回傳不同結果
function getGreeting(name: string): string {
  const hour = new Date().getHours()  // 依賴外部狀態
  if (hour < 12) return `早安，${name}`
  return `午安，${name}`
}
```

**為什麼要盡量寫純函式？**
- **好測試**：不需要準備複雜的環境，只要給輸入、驗證輸出就好
- **好推理**：看到函式呼叫，你馬上知道結果，不用擔心它偷改了別的東西
- **好組合**：純函式可以自由地串接、組合，不會互相干擾

當然，程式不可能全都是純函式——讀資料庫、發送 Email、更新畫面，這些本來就是「副作用」。重點是**把有副作用的部分集中管理，其餘邏輯盡量寫純函式**。

---

### 一個函式，只做一件事

現在來看單一職責（Single Responsibility）這個概念在函式層面的應用。

想像你請一個廚師，他不只要炒菜，還要洗碗、收銀、打掃——任何一件事出問題，整個餐廳都停擺。分工明確的廚房，各司其職，問題容易找、容易修。

函式也是一樣：

```typescript
// ❌ 這個函式做了太多事
// 驗證、儲存、發信、統計——四件完全不同的事硬塞在一起
function processUserRegistration(name: string, email: string): void {
  // 驗證 email 格式
  if (!email.includes("@")) {
    throw new Error("Email 格式不正確")
  }

  // 儲存到資料庫（假設）
  console.log(`儲存 ${name} 到資料庫`)

  // 發送歡迎信
  console.log(`發送歡迎信到 ${email}`)

  // 更新統計數字
  console.log("更新新用戶統計")
}
```

這樣的函式有什麼問題？
- 你想「只測試 email 驗證」，但沒辦法，因為它跟儲存資料庫的邏輯混在一起
- 發信的邏輯改了，你要去這個函式裡面找
- 這個函式的名字叫 `process`，但它做的事情太多了，名字根本說不清楚

拆開之後：

```typescript
// ✅ 每個函式只做一件事，名字精確描述它的工作
function validateEmail(email: string): boolean {
  return email.includes("@")
}

function saveUserToDatabase(name: string, email: string): void {
  // 專注於儲存邏輯
  console.log(`儲存 ${name} (${email}) 到資料庫`)
}

function sendWelcomeEmail(email: string): void {
  // 專注於發信邏輯
  console.log(`發送歡迎信到 ${email}`)
}

function trackNewUserSignup(): void {
  // 專注於統計邏輯
  console.log("更新新用戶統計")
}

// 最後在「上層」把這些小函式組合起來
function registerUser(name: string, email: string): void {
  if (!validateEmail(email)) {
    throw new Error("Email 格式不正確")
  }
  saveUserToDatabase(name, email)
  sendWelcomeEmail(email)
  trackNewUserSignup()
}
```

拆開之後，每個函式：
- 名字清楚說明它做什麼
- 可以獨立測試
- 可以在其他地方重複使用（`validateEmail` 在其他功能也用得到）

---

## 程式碼範例

### 範例一：完整的型別化函式

這個範例模擬一個購物車折扣計算，展示多種函式特性：

```typescript
interface CartItem {
  name: string
  price: number
  quantity: number
}

// 純函式：計算單項小計
function calculateItemSubtotal(item: CartItem): number {
  return item.price * item.quantity
}

// 純函式：計算折扣後金額，折扣有預設值
function applyDiscount(amount: number, discountRate: number = 0): number {
  // discountRate 是 0 到 1 之間的小數，例如 0.1 代表 9 折
  return amount * (1 - discountRate)
}

// 純函式：格式化金額顯示，貨幣符號有預設值
function formatPrice(amount: number, currency: string = "TWD"): string {
  return `${currency} ${amount.toFixed(0)}`
}

// 組合上面的純函式
function calculateFinalPrice(item: CartItem, discountRate?: number): string {
  const subtotal = calculateItemSubtotal(item)
  const discounted = applyDiscount(subtotal, discountRate)
  return formatPrice(discounted)
}

const book: CartItem = { name: "TypeScript 入門", price: 500, quantity: 2 }

console.log(calculateFinalPrice(book))         // "TWD 1000"（無折扣）
console.log(calculateFinalPrice(book, 0.1))    // "TWD 900"（九折）
```

---

### 範例二：函式型別的實際應用

這個範例示範如何把函式當作值傳遞——這是 JavaScript 最強大的特性之一：

```typescript
type TextTransformer = (text: string) => string

// 三個符合 TextTransformer 型別的函式
const toUpperCase: TextTransformer = (text) => text.toUpperCase()
const removeSpaces: TextTransformer = (text) => text.replace(/\s/g, "")
const addBrackets: TextTransformer = (text) => `[${text}]`

// 接受「函式陣列」的函式：依序套用所有轉換
function applyTransformers(text: string, transformers: TextTransformer[]): string {
  return transformers.reduce((current, transform) => transform(current), text)
}

const result = applyTransformers("hello world", [
  toUpperCase,    // "HELLO WORLD"
  removeSpaces,   // "HELLOWORLD"
  addBrackets     // "[HELLOWORLD]"
])

console.log(result)  // "[HELLOWORLD]"
```

> 這裡的 `applyTransformers` 接受一個函式陣列——每個函式都做一件事，組合起來完成複雜的任務。這正是「每個函式只做一件事」的威力。

---

## 小練習

**練習 1**：寫一個純函式 `celsiusToFahrenheit(celsius: number): number`，把攝氏溫度轉換成華氏（公式：`(celsius × 9/5) + 32`）。確認它是純函式：對同樣的輸入永遠回傳同樣的輸出，且不修改任何外部狀態。

**練習 2**：定義一個 `type Validator = (value: string) => boolean`。然後寫三個符合這個型別的函式：`isNotEmpty`（不為空字串）、`isValidEmail`（包含 `@`）、`isLongEnough`（長度至少 8 個字元）。最後寫一個 `validate(value: string, validators: Validator[]): boolean` 函式，只有當所有 validator 都回傳 `true` 時才回傳 `true`。

**練習 3**：下面的函式違反了「一個函式只做一件事」的原則，請把它拆分成多個小函式，再用一個上層函式組合起來：

```typescript
// 請重構這個函式
function handleBlogPost(title: string, content: string, authorEmail: string): void {
  // 驗證：標題不能為空
  if (title.trim() === "") {
    throw new Error("標題不能為空")
  }
  // 驗證：內容至少 100 個字
  if (content.length < 100) {
    throw new Error("內容太短，至少需要 100 個字")
  }
  // 儲存文章
  console.log(`儲存文章：${title}`)
  // 通知作者
  console.log(`通知 ${authorEmail}：你的文章已發布`)
}
```

---

## 課外讀物

> 這章的函式拆分方式，正是 SOLID 裡的 S 原則 → [課外讀物 E-7-1：SOLID 總覽：五個原則一次看懂](../../../課外讀物/E-7-solid/E-7-1-solid-overview.md)

> 想深入了解 Single Responsibility → [課外讀物 E-7-2：S — Single Responsibility Principle](../../../課外讀物/E-7-solid/E-7-2-srp.md)

> 想了解函式設計的最佳實踐 → [課外讀物 E-6-3：函式設計：Single Responsibility 與純函式](../../../課外讀物/E-6-best-practices/E-6-3-function-design.md)
