# [E-6-2] 命名的藝術：讓名字說話

> **這篇在說什麼**：好的命名讓程式碼不需要注解就能看懂，壞的命名讓人看了三秒還不知道在做什麼。

## 概念說明

你有沒有看過這樣的程式碼：

```typescript
const x = getData(d, f)
```

`x` 是什麼？`getData` 拿到什麼資料？`d` 是 date 還是 data 還是 document？`f` 又是誰？

看到這段程式碼的人（包括三個月後的你自己）只能開始猜測，或是往上滾動找這些變數在哪裡被定義。這就是壞命名的代價：**強迫每個讀程式碼的人在腦子裡執行一次偵探遊戲**。

好的命名是什麼感覺？

```typescript
const activeUser = getUserBySessionToken(sessionToken, filterOptions)
```

不需要注解，名字本身就是說明書。

---

有個真實的慘劇：一個後端工程師離職了，留下一份幾千行的程式碼，裡面充斥著 `d`、`u`、`p`、`tmp`、`res2`、`finalFinal`。接手的人花了三週想搞清楚這份程式碼在做什麼，最終放棄，從頭重寫。

三週的工作時間，因為命名不好。

> 一個好的名字，讓注解變成多餘的。  
> 一個壞的名字，讓注解變成必要的——但注解還是沒有名字直接。

## 深入一點

### 依類型分類的命名規則

**變數：描述它「裝著什麼」**

```typescript
// ❌ 不好
const data = await fetch('/api/users')
const age2 = user.age
const loginStatus = true

// ✅ 好
const userList = await fetch('/api/users')
const userAge = user.age
const isLoggedIn = true
```

原則：看名字就知道裡面放什麼，不需要追蹤它從哪裡來。

---

**布林值：用 `is / has / can / should` 開頭**

```typescript
// ❌ 讀起來很奇怪
const loading = true
const error = false
const deletePermission = true

// ✅ 讀起來像一個問題的回答
const isLoading = true
const hasError = false
const canDelete = true
const shouldRetry = false
```

當你寫 `if (isLoading)` 的時候，語意非常清楚。但 `if (loading)` 呢？`loading` 是一個動作？一個狀態？一個物件？

---

**函式：一定要用動詞開頭**

函式是「做某件事」的，所以名字要以動詞起始：

```typescript
// ❌ 不知道它會做什麼
function user(id: number) { ... }
function emailCheck(email: string) { ... }

// ✅ 清楚說明這個函式的動作
function getUserById(id: number) { ... }
function validateEmail(email: string) { ... }
function sendWelcomeNotification(userId: number) { ... }
function formatDateToISO(date: Date) { ... }
```

動詞的選擇也有學問：
- `get` — 取得某個值，通常是同步的
- `fetch` — 從遠端或非同步來源取得
- `create` / `build` — 建立一個新的東西
- `validate` / `check` — 驗證，通常回傳 boolean
- `format` / `parse` — 轉換資料格式
- `send` / `emit` — 發送某個訊號或請求
- `update` / `set` — 修改既有的狀態

---

**常數：`UPPER_SNAKE_CASE`，用於真正不會改變的值**

```typescript
// ❌ 看起來像普通變數，不知道它是固定的設定值
const maxRetry = 3
const apiUrl = 'https://api.example.com'

// ✅ 一看就知道這是固定常數，不應該被修改
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_PAGE_SIZE = 20
```

---

**Class 與 Interface：`PascalCase`，用名詞**

```typescript
// ❌ 動詞或小寫
class processUser { ... }
interface userProfile { ... }

// ✅ PascalCase 名詞
class UserService { ... }
interface UserProfile { ... }
interface ApiResponse { ... }
class OrderItem { ... }
```

---

### 常見反模式（看到要馬上改掉）

**`data`、`info`、`temp`、`result`——太模糊**

```typescript
// ❌ 這些名字什麼都沒說
const data = await getUser(id)
const info = processOrder(order)
const temp = user.name.split(' ')
const result = validateForm(form)

// ✅ 說出它到底是什麼
const user = await getUser(id)
const processedOrder = processOrder(order)
const nameParts = user.name.split(' ')
const isFormValid = validateForm(form)
```

---

**`userInfoData`——贅字堆疊**

```typescript
// ❌ info 和 data 是同義詞，為什麼要同時用？
const userInfoData = { ... }
const getUserInfo = (id: number) => { ... }

// ✅ 選一個最準確的詞
const userProfile = { ... }
const getUser = (id: number) => { ... }
```

---

**單字縮寫（除了 `i`、`j` 這類慣例）**

```typescript
// ❌ u? p? d?
function getU(u: number) { ... }
const p = user.profile

// ✅ 完整拼出來，TypeScript 有自動補全，打字不是問題
function getUserById(userId: number) { ... }
const userProfile = user.profile

// 例外：迴圈計數器 i、j、k 是慣例，大家都懂
for (let i = 0; i < items.length; i++) { ... }
```

---

### 「報紙標題測試」

想像你把每一行程式碼的變數和函式名稱都印成報紙標題，讀起來能不能理解發生什麼事？

```typescript
// 壞的版本，讀起來像亂碼
const x = getData(d, f)
if (flag) { proc(x) }

// 好的版本，讀起來像新聞
const currentUser = getUserByToken(authToken, requestFilter)
if (isAuthenticated) { renderDashboard(currentUser) }
```

讀好的版本，你不需要去查任何變數定義，光看這兩行就知道：「如果使用者已認證，就用取得的使用者資料渲染儀表板。」

這就是命名的終極目標：**讓程式碼本身成為文件**。

## 延伸閱讀

> 命名規則弄清楚之後，下一步是設計好的函式 → [E-6-3] 函式設計：Single Responsibility 與純函式](./E-6-3-function-design.md)
