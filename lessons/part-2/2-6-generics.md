# [2-6] 泛型（Generics）：讓程式碼可以「留空」

> **本章目標**：理解泛型的核心概念，學會寫出可以適用於多種型別的通用函式與介面。

## 你會學到

- 為什麼沒有泛型會讓程式碼充滿重複
- 用 `<T>` 語法定義泛型函式
- 用泛型定義可重複使用的介面
- 用 `extends` 限制泛型的範圍
- 看懂你早就在用的內建泛型：`Array<T>` 和 `Promise<T>`

---

## 概念說明

### 先從一個無聊的問題開始

假設你要寫一個函式，取出陣列的第一個元素。

如果只有字串陣列：

```typescript
function getFirstString(arr: string[]): string {
  return arr[0]
}
```

但如果還需要支援數字陣列呢？你只好再寫一個：

```typescript
function getFirstNumber(arr: number[]): number {
  return arr[0]
}
```

這兩個函式的**邏輯完全相同**，只有型別不同。如果之後還要支援布林值、物件、自訂型別……你就得不斷複製貼上，只改型別名稱。這違反了程式設計裡「不要重複自己」（DRY，Don't Repeat Yourself）的基本原則。

有人可能想到：那就用 `any` 吧？

```typescript
function getFirst(arr: any[]): any {  // ❌ 不要這樣做
  return arr[0]
}
```

可以動，但所有型別資訊都消失了。你傳進字串陣列，拿出來的是 `any`，TypeScript 不知道它是字串，也就沒辦法幫你檢查後續的操作。這等於自廢武功。

**泛型的出現就是為了解決這個問題**：讓函式的型別「可以填入，而不是固定死」。

---

### 類比：可以裝任何東西的袋子

想像一個購物袋。這個袋子本身的設計（開口、提把、容量）是固定的，但你「要放什麼」是在使用時才決定的：

```
購物袋<蘋果>  → 裝蘋果，拿出來也是蘋果
購物袋<書>    → 裝書，拿出來也是書
購物袋<衣服>  → 裝衣服，拿出來也是衣服
```

泛型就是這個「`<>`」裡面的空白——你先設計好「袋子的結構」，等到真正使用時才決定裡面裝什麼型別。

另一個類比：**泛型像一張留白的表單**。表單的格式（欄位名稱、排列方式）是固定的，但欄位的「資料型別」等你填寫時才確定。

---

### 泛型函式的語法

用 `<T>` 宣告一個「型別參數」（T 只是慣例，可以取任何名字）：

```
定義：取出陣列第一個元素
  型別參數：T（等使用時才決定是什麼）
  輸入：一個「T 的陣列」
  輸出：一個「T」
```

```typescript
function getFirst<T>(arr: T[]): T {
  return arr[0]
}
```

TypeScript 可以**自動推斷** `T` 是什麼：

```typescript
getFirst(["Alice", "Bob", "Carol"])  // TypeScript 推斷 T = string，回傳值是 string
getFirst([10, 20, 30])               // TypeScript 推斷 T = number，回傳值是 number
getFirst([true, false, true])        // TypeScript 推斷 T = boolean，回傳值是 boolean
```

一個函式，適用所有型別，而且型別資訊完整保留。

---

### `T` 只是習慣，名字可以更有意義

```typescript
// T 是慣例，但你可以取更有語意的名字
function wrap<Value>(value: Value): { data: Value } {
  return { data: value }
}

const wrapped = wrap("hello")  // { data: "hello" }，型別是 { data: string }
```

常見的慣例名稱：
- `T`：最通用的型別參數（Type 的縮寫）
- `K`、`V`：key 和 value（常用於 Map 類型）
- `TItem`、`TData`：需要更明確語意時

---

### 泛型介面

介面也可以用泛型。最常見的用途是 API 回應格式：

每個 API 的回應都有固定的「外殼」（狀態碼、訊息），但「資料內容」根據不同 API 而不同：

```
API 回應的結構：
  - data：（這一塊根據 API 不同而不同）
  - status：數字
  - message：字串
```

```typescript
interface ApiResponse<T> {
  data: T        // T 是「資料內容」的型別，等使用時才決定
  status: number
  message: string
}

interface User {
  name: string
  age: number
  email: string
}

interface Product {
  id: number
  name: string
  price: number
}

// 同一個 ApiResponse 介面，適用於不同的資料型別
const userResponse: ApiResponse<User> = {
  data: { name: "Alice", age: 25, email: "alice@example.com" },
  status: 200,
  message: "OK"
}

const productResponse: ApiResponse<Product> = {
  data: { id: 1, name: "MacBook Pro", price: 60000 },
  status: 200,
  message: "OK"
}
```

`ApiResponse<User>` 和 `ApiResponse<Product>` 都是從同一個介面「填入」不同型別產生的。

---

### 限制泛型的範圍：`extends`

有時候你不需要「任何型別都接受」，而是「只接受有某些欄位的型別」。

例如，你想寫一個「從清單中找到特定 ID 的項目」的函式。這個函式需要知道每個項目都有 `id` 欄位，但不在乎其他欄位是什麼。

```
找到 ID 的函式：
  我不管你傳什麼型別的清單
  但清單裡的每個項目，必須要有「id（數字）」這個欄位
```

```typescript
interface HasId {
  id: number
}

// T extends HasId：T 必須至少包含 HasId 的所有欄位
function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id)
}

interface User {
  id: number
  name: string
  email: string
}

interface Product {
  id: number
  name: string
  price: number
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
]

const products: Product[] = [
  { id: 10, name: "鍵盤", price: 2000 },
  { id: 11, name: "滑鼠", price: 800 }
]

findById(users, 1)       // 回傳 User | undefined，TypeScript 知道它是 User
findById(products, 10)   // 回傳 Product | undefined，TypeScript 知道它是 Product
```

---

### 你早就在用泛型了

學完這個概念，回頭看看之前接觸過的型別，你會發現它們其實都是泛型：

```typescript
// string[] 其實是 Array<string> 的語法糖
const names: string[] = ["Alice", "Bob"]
const namesLong: Array<string> = ["Alice", "Bob"]  // 一樣的東西

// Promise<T> — 非同步操作，T 是完成後的值的型別
async function fetchUser(): Promise<User> {
  // ...
}
```

`Array<T>` 和 `Promise<T>` 都是用泛型設計的內建型別。你不需要知道陣列是怎麼實作的，只需要知道「放什麼型別的元素進去」就好。

---

## 程式碼範例

### 範例一：Result 型別——錯誤處理的通用模式

這是真實專案中非常常見的模式。當一個操作可能成功或失敗，用 `Result<T>` 來明確表達：

```
Result 的形狀：
  成功：{ success: true, data: T }
  失敗：{ success: false, error: 字串 }
```

```typescript
// Result<T> 是一個泛型聯合型別
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// 除法可能失敗（除以零），用 Result 來表達這種不確定性
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { success: false, error: "不能除以零" }
  }
  return { success: true, data: a / b }
}

const result = divide(10, 2)

// TypeScript 強迫你先判斷成功或失敗，才能取用 data
if (result.success) {
  console.log(`結果是 ${result.data}`)  // TypeScript 知道這裡 data 是 number
} else {
  console.log(`發生錯誤：${result.error}`)  // TypeScript 知道這裡有 error
}
```

`Result<T>` 的美妙之處：呼叫這個函式的人**不可能忘記處理錯誤情況**，因為型別強迫你判斷 `success` 之後才能拿到 `data`。

---

### 範例二：泛型讓函式可以重複使用

以下示範幾個常見的泛型工具函式，這類函式在真實專案中隨處可見：

```typescript
// 取出陣列最後一個元素
function getLast<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1]
}

// 從陣列中移除重複項目（適用任何可比較的型別）
function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

// 把兩個同型別的物件合併（後面的欄位覆蓋前面的）
function merge<T>(base: T, override: Partial<T>): T {
  return { ...base, ...override }
}

// 實際使用
getLast(["apple", "banana", "cherry"])  // "cherry"（string）
getLast([10, 20, 30])                   // 30（number）

unique([1, 2, 2, 3, 3, 3])            // [1, 2, 3]
unique(["a", "b", "a", "c"])          // ["a", "b", "c"]

interface Config {
  theme: string
  language: string
  fontSize: number
}

const defaultConfig: Config = { theme: "light", language: "zh-TW", fontSize: 16 }
const userOverride = { theme: "dark" }

merge(defaultConfig, userOverride)
// { theme: "dark", language: "zh-TW", fontSize: 16 }
```

> **注意** `Partial<T>` 是 TypeScript 的內建泛型工具型別，意思是「T 的所有欄位都變成選填」。你不需要自己定義它，直接用就好。

---

## 小練習

**練習 1**：寫一個泛型函式 `last<T>(arr: T[]): T | undefined`，回傳陣列的最後一個元素。如果陣列是空的，回傳 `undefined`。用字串陣列和數字陣列分別測試。

**練習 2**：定義一個泛型介面 `PaginatedResponse<T>`，包含以下欄位：
- `items`：型別為 `T[]`（資料清單）
- `total`：數字（總筆數）
- `page`：數字（目前頁碼）
- `pageSize`：數字（每頁筆數）

然後定義一個 `Product` 介面（至少包含 `id`、`name`、`price`），建立一個 `PaginatedResponse<Product>` 物件，確認 TypeScript 不報錯。

**練習 3**：寫一個泛型函式 `findByProperty<T>(items: T[], key: keyof T, value: T[keyof T]): T | undefined`，從陣列中找到第一個符合條件的項目。

提示：
- `keyof T` 代表「T 所有欄位名稱的聯合型別」
- `T[keyof T]` 代表「T 任何欄位的值的型別」
- 用 `item[key] === value` 來比較

測試方式：
```typescript
interface User {
  id: number
  name: string
  email: string
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
]

findByProperty(users, "name", "Bob")  // 應該回傳 Bob 的資料
findByProperty(users, "id", 1)        // 應該回傳 Alice 的資料
```
