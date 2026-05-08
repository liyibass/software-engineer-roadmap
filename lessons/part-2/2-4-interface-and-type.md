# [2-4] 介面（Interface）與型別別名（Type Alias）：描述資料的形狀

> **本章目標**：學會用 `interface` 和 `type` 幫資料形狀取名字，讓程式碼不再塞滿一長串型別標記。

## 你會學到

- 為什麼行內物件型別標記（inline annotation）會讓程式碼變難讀
- 用 `interface` 定義並重複使用物件結構
- 用 `extends` 讓介面繼承另一個介面
- 用 `type` 定義聯合型別與其他非物件型別
- 什麼時候該選 `interface`，什麼時候該選 `type`

---

## 概念說明

### 先從問題開始

在上一章，我們學了物件型別標記。現在假設你要寫一個函式，接收一個「使用者」物件：

```
function greet(使用者):
    回傳 "Hello, " + 使用者.名字
```

這樣的 pseudo code 看起來很清楚。但翻成 TypeScript 之後：

```typescript
function greet(user: { name: string; age: number; email: string }): string {
  return `Hello, ${user.name}!`
}
```

物件型別直接塞在參數裡，已經有點醜了。如果有三個函式都需要同樣的「使用者」結構，你就得複製貼上三次。之後只要多一個欄位，三個地方都要改。

這就像你在餐廳點餐，每次都要把菜單從頭念一遍，而不是說「我要套餐 A」。

**介面就是那個「套餐名稱」**——你先定義好有哪些欄位，之後直接用名字引用。

---

### Interface：表單模板

想像你在設計一張報名表單，規定每個報名者必須填寫哪些欄位。介面就是這張空白表單：

```
使用者表單模板：
  - 姓名（必填，文字）
  - 年齡（必填，數字）
  - Email（必填，文字）
  - 是否為管理員（選填，是/否）
```

翻成 TypeScript：

```typescript
interface User {
  name: string
  age: number
  email: string
  isAdmin?: boolean  // 「?」代表選填
}
```

`?` 代表這個欄位是可選的（optional）。填了也可以，不填也可以，TypeScript 都不會報錯。

#### 使用介面

定義好之後，直接把介面名稱當作型別用：

```typescript
interface User {
  name: string
  age: number
  email: string
  isAdmin?: boolean
}

function greet(user: User): string {
  return `Hello, ${user.name}!`
}

function getUserAge(user: User): number {
  return user.age
}

// 兩個函式都用同一個 User 介面，不需要重複寫型別
```

現在如果 `User` 多了一個 `phone` 欄位，你只需要改一個地方——介面的定義。

---

### 用 `extends` 繼承介面

有時候你有一個「基礎」介面，想在它的基礎上加更多欄位。就像一般員工和主管都有名字和 Email，但主管多了「管理的部門」這個欄位。

```
動物（基礎）：
  - 名字
  - 叫聲

狗（繼承動物）：
  - 名字（繼承自動物）
  - 叫聲（繼承自動物）
  - 品種（狗特有的）
```

用 `extends` 來繼承：

```typescript
interface Animal {
  name: string
  sound: string
}

interface Dog extends Animal {
  breed: string  // 狗特有的欄位
}

// Dog 同時擁有 name、sound、breed 三個欄位
const myDog: Dog = {
  name: "小黑",
  sound: "汪汪",
  breed: "柴犬"
}
```

這樣做的好處：修改 `Animal` 的基礎欄位，`Dog` 也會自動更新。不需要重複定義共同的欄位。

---

### Type Alias：幫任何型別取名字

`type` 是另一種定義「具名型別」的方式。它更靈活，可以幫各種型別取名——包括 `interface` 做不到的聯合型別（union type）。

還記得上一章學的聯合型別嗎？

```typescript
// 「使用者 ID 可以是字串或數字」
type UserId = string | number

// 「帳號狀態只能是這三種字串之一」
type AccountStatus = "active" | "inactive" | "banned"
```

這樣的型別用 `interface` 是寫不出來的，`interface` 只能描述物件結構。

你也可以用 `type` 定義物件結構（效果跟 `interface` 類似）：

```typescript
type Point = {
  x: number
  y: number
}
```

---

### Interface vs Type Alias：選哪個？

這是 TypeScript 新手最常問的問題。依照本課程的規範，原則很簡單：

| 情況 | 使用 |
|------|------|
| 描述物件結構 | `interface` |
| 聯合型別（A 或 B） | `type` |
| 交叉型別（A 且同時是 B） | `type` |
| 字串字面值等常數集合 | `type` |
| 函式型別 | `type` 或 `interface`，兩者都行 |

記法：**物件形狀用 `interface`，其他用 `type`**。

為什麼物件形狀偏好 `interface`？因為 `interface` 支援 `extends` 繼承，語意上更清楚地表達「這是一個可以被擴充的合約」。

---

## 程式碼範例

### 範例一：從行內型別重構為介面

以下是一段「重構前」的程式碼。三個函式都重複定義了同樣的物件型別：

```typescript
// 重構前：每個函式都自己寫型別，又臭又長
function displayUser(user: { name: string; email: string; age: number }): void {
  console.log(`${user.name} (${user.email}), 年齡 ${user.age}`)
}

function isAdult(user: { name: string; email: string; age: number }): boolean {
  return user.age >= 18
}
```

用介面重構：

```typescript
// 重構後：定義一次，到處使用
interface User {
  name: string
  email: string
  age: number
}

function displayUser(user: User): void {
  console.log(`${user.name} (${user.email}), 年齡 ${user.age}`)
}

function isAdult(user: User): boolean {
  return user.age >= 18
}
```

程式碼不只更短，語意也更清楚：這兩個函式都是在處理「使用者」資料。

---

### 範例二：選填欄位與介面繼承

這個範例模擬一個部落格系統，有「基本文章」和「精選文章」兩種資料：

```typescript
interface Article {
  id: number
  title: string
  content: string
  publishedAt: string
}

interface FeaturedArticle extends Article {
  // 精選文章繼承所有 Article 的欄位
  // 再加上精選文章特有的欄位
  coverImageUrl: string
  featuredUntil: string
}

function printArticleTitle(article: Article): void {
  // 這個函式只需要基本資訊，接受 Article 或 FeaturedArticle 都沒問題
  console.log(article.title)
}

const featured: FeaturedArticle = {
  id: 1,
  title: "TypeScript 入門指南",
  content: "...",
  publishedAt: "2025-01-01",
  coverImageUrl: "https://example.com/cover.jpg",
  featuredUntil: "2025-12-31"
}

printArticleTitle(featured)  // ✅ 沒問題，FeaturedArticle 包含所有 Article 的欄位
```

---

### 範例三：Type Alias 實戰

```typescript
// 用 type 定義聯合型別和字面值型別
type UserId = string | number
type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled"

interface Order {
  id: UserId            // 可以是字串或數字
  status: OrderStatus   // 只能是這五種狀態之一
  total: number
  createdAt: string
}

function updateOrderStatus(orderId: UserId, newStatus: OrderStatus): void {
  console.log(`訂單 ${orderId} 狀態更新為：${newStatus}`)
}

// TypeScript 會在你打錯狀態名稱時立刻警告你
updateOrderStatus(123, "shipped")    // ✅
updateOrderStatus("ORD-456", "paid") // ✅
// updateOrderStatus(789, "done")   // ❌ "done" 不在 OrderStatus 裡，TypeScript 報錯
```

---

### 範例四：交叉型別（`type` 的強項）

有時候你想合併兩個型別，要求「必須同時滿足 A 和 B」：

```typescript
interface HasTimestamps {
  createdAt: string
  updatedAt: string
}

interface Product {
  id: number
  name: string
  price: number
}

// 交叉型別：同時具備 Product 和 HasTimestamps 的所有欄位
type ProductRecord = Product & HasTimestamps

const laptop: ProductRecord = {
  id: 1,
  name: "MacBook Pro",
  price: 60000,
  createdAt: "2025-01-01",
  updatedAt: "2025-06-15"
}
```

---

> **常見錯誤** — 很多人會把所有欄位塞進一個大介面：
>
> ```typescript
> // ❌ 一個介面什麼都有，難以維護
> interface Everything {
>   userId: number
>   userName: string
>   productId: number
>   productName: string
>   orderId: number
>   orderStatus: string
> }
> ```
>
> 問題是：當你的函式只需要「使用者資訊」，卻得傳入一個包含產品和訂單資訊的物件，這個介面就變成了一個負擔。
>
> 正確做法：讓每個介面只描述一件事（使用者就是使用者，產品就是產品），需要的時候再用 `extends` 或交叉型別組合。

> 這裡談到的「介面只做一件事」，正是介面設計的核心原則 → [課外讀物 E-7-5：I — Interface Segregation Principle](../../課外讀物/E-7-solid/E-7-5-isp.md)

---

## 小練習

**練習 1**：定義一個 `Book` 介面，包含 `id`（數字）、`title`（字串）、`author`（字串）、`pageCount`（數字）、`isbn`（選填字串）。然後寫一個函式 `describeBook(book: Book): string`，回傳一段描述文字。

**練習 2**：定義一個 `Vehicle` 介面（`brand`、`model`、`year`），再用 `extends` 定義一個 `ElectricVehicle` 介面，加上 `batteryCapacityKwh`（數字）和 `rangeKm`（數字）兩個欄位。建立一個 `ElectricVehicle` 物件，確認 TypeScript 不報錯。

**練習 3**：用 `type` 定義一個 `PaymentMethod`，只允許 `"credit_card" | "bank_transfer" | "crypto"` 三種值。再定義一個 `Payment` 介面，包含 `amount`（數字）、`method`（`PaymentMethod`）、`completedAt`（選填字串）。寫一個函式 `processPayment(payment: Payment): void`，印出付款資訊。

---

## 課外讀物

> 這裡用到了介面設計的原則 → [課外讀物 E-7-5：I — Interface Segregation Principle](../../課外讀物/E-7-solid/E-7-5-isp.md)
