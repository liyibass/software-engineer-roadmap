# 全端工程師養成課程 — 撰寫規範

這份文件規範所有課程章節的寫作標準。每次新增或修改課程內容時，必須遵守以下規範。

---

## 課程結構

```
programming-tutorial/
├── 課程大綱.md          # 總覽，不放實際教學內容
├── CLAUDE.md
├── lessons/             # 多套課程（「多本書」），一個子資料夾一套
│   ├── basic/           # 基礎程式學習（原本的主線課程）
│   │   ├── intro/
│   │   ├── part-0/
│   │   │   ├── 0-1-xxx.md
│   │   │   └── ...
│   │   ├── part-1/
│   │   └── ...
│   ├── aws/             # AWS 系列
│   ├── infra/           # Infra 系列
│   └── ...              # 未來可再新增其他主題
├── 課外讀物/             # 跨課程共用的延伸閱讀（E-1 ~ E-13）
│   ├── E-1-terminal/
│   ├── E-2-npm/
│   ├── E-3-network/
│   ├── E-4-database/
│   └── E-5-fun-facts/
└── poc/
    ├── v1/
    ├── v2/
    └── ...
```

> **課程分類說明**：`lessons/` 底下每個子資料夾是一套獨立課程（像一本書）。`basic/` 是原本的基礎程式課；`aws/`、`infra/` 為後續主題。`課外讀物/` 是所有課程共用的通用知識庫，固定放在頂層。

---

## 章節結構模板

每個 `lessons/` 下的章節 `.md` 檔案**必須包含以下區塊**，順序不變：

```markdown
# [章節編號] 標題

> **本章目標**：一句話說明學完這章你能做什麼或理解什麼。

## 你會學到

- 條列 3~5 個具體的學習點

## 概念說明

先用 pseudo code 或日常語言描述，再帶出正式概念。
必要時使用 Mermaid 圖表視覺化。

## 程式碼範例

每個範例前說明「這段程式碼在做什麼」，不只貼程式碼。

## 小練習

1~3 個動手題，難度漸進。

## 課外讀物

> 如果你對 XXX 感興趣，可以參考 **[課外讀物 E-X-X] 標題**

（沒有對應的課外讀物可省略此區塊）
```

---

## 寫作風格指南

### 語氣
- 口語化但不失精確，像在跟朋友解釋
- 不用「我們知道...」、「顯然地...」這類假設讀者已懂的語氣
- 碰到新術語，**第一次出現就立刻解釋**，不要等讀者自己去查

### 抽象概念的呈現順序
1. 先用**生活類比或 pseudo code** 說明概念
2. 再用 **Mermaid 圖表**視覺化結構或流程
3. 最後才給出**正式程式碼**

```
錯誤示範：
直接貼 TypeScript interface，然後說「這就是介面的定義方式」

正確示範：
先說「介面就像一張表單，規定你要填哪些欄位」
→ 用 pseudo code 寫出表單欄位
→ 再對應到 TypeScript interface
```

### Mermaid 換行規則
Mermaid node label 裡換行一律用 `<br/>`，**不用 `\n`**（`\n` 在多數渲染器會顯示成文字而非換行）：
```
正確：A["第一行<br/>第二行"]
錯誤：A["第一行\n第二行"]
```

### Mermaid 圖表使用時機
- **流程/步驟**：用 `flowchart` 或 `graph`
- **時序互動**：用 `sequenceDiagram`（例如前後端 request/response）
- **資料結構關聯**：用 `erDiagram`
- **架構圖**：用 `graph TB` 或 `graph LR`
- 每張圖下方加一句話說明「這張圖在表達什麼」

### Pseudo Code 格式
使用縮排 + 中文描述，不使用特定語言語法：

```
// 好的 pseudo code
如果 使用者已登入：
    取得使用者資料
    顯示歡迎畫面
否則：
    跳轉到登入頁
```

### 避免的寫法
- 不要連續貼超過 30 行程式碼而不解釋
- 不要假設讀者知道縮寫（第一次出現要寫全名，例如 API → Application Programming Interface）
- 不要在一個章節塞超過一個核心概念

---

## 課外讀物引用格式

統一使用標準 Markdown 連結，確保在 Obsidian 和任何 Markdown 閱讀器中都可點擊跳轉。

### 路徑規則

所有課程章節位於 `lessons/{課程}/part-X/filename.md`（例如 `lessons/basic/part-4/...`，距離根目錄三層），課外讀物位於 `課外讀物/E-X-xxx/filename.md`，因此：

- **課程章節 → 課外讀物**：路徑固定為 `../../../課外讀物/E-X-xxx/filename.md`（三層 `../`）
- **課外讀物 → 同系列其他章節**：`./filename.md`
- **課外讀物 → 其他系列**：`../E-X-xxx/filename.md`

> ⚠️ 注意：課程章節從原本的 `lessons/part-X/` 改為分類在 `lessons/{課程}/part-X/`（多一層），所以引用課外讀物從 `../../` 改為 `../../../`。

### 引用格式

```markdown
> 想深入了解 XXX → [課外讀物 E-X-X：完整標題](../../../課外讀物/E-X-xxx/E-X-X-filename.md)
```

例如：
```markdown
> 好奇瀏覽器輸入網址後發生什麼事 → [課外讀物 E-3-1：網際網路是怎麼運作的？](../../../課外讀物/E-3-network/E-3-1-how-internet-works.md)
```

課外讀物章節末尾引導其他課外讀物：
```markdown
> 這個原則在後端架構也很重要 → [課外讀物 E-7-6：D — Dependency Inversion Principle](../E-7-solid/E-7-6-dip.md)
```

### 檔名命名規則
課外讀物檔名格式：`{編號}-{english-slug}.md`
例如：`E-3-1-how-internet-works.md`、`E-7-2-single-responsibility.md`

課外讀物本身的章節結構比主線課程輕鬆，不需要「小練習」區塊，但仍需要：
- 目標說明
- 概念說明（可多用類比和趣味故事）
- 圖表（有的話）

---

## POC 版本連動說明

POC 版本（V1~V7）與主線 Part 的對應：

| POC 版本 | 解鎖條件 | 程式碼位置 |
|---------|---------|-----------|
| V1 | Part 3 完成後 | `poc/v1/` |
| V2 | Part 4-A 完成後 | `poc/v2/` |
| V3 | Part 4-B 完成後 | `poc/v3/` |
| V4 | Part 4-C 完成後 | `poc/v4/` |
| V5 | Part 5 完成後 | `poc/v5/` |
| V6 | Part 6 完成後 | `poc/v6/` |
| V7 | Part 7 完成後 | `poc/v7/` |

### 每個 POC 目錄的規範
每個 `poc/vN/` 目錄必須包含：
- `README.md`：說明這個版本新增了什麼、怎麼跑起來
- 可執行的完整程式碼（不是片段）
- 明確標示與上一版本的差異（`## 相較於 VN-1 的改變`）

### 在主線課程引用 POC 的格式
```markdown
## POC V2 — 前後端通了！

> **你現在要做的事**：把 V1 的 Todo App 加上後端。
> 程式碼在 `poc/v2/`，先跑起來看看效果，再回來看說明。
```

---

## 程式碼品質標準

課程中所有程式碼範例（包含 POC）都必須遵守以下標準。目的是讓學習者從第一行程式碼開始就養成好習慣。

### 命名原則
- 名稱要能說明「是什麼」，不需要看實作才懂
- 變數與函式：`camelCase`（`getUserById`、`isLoggedIn`）
- 型別、介面、Class：`PascalCase`（`UserProfile`、`ApiResponse`）
- 常數：`UPPER_SNAKE_CASE`（`MAX_RETRY_COUNT`）
- 布林值用肯定句命名（`isLoading`、`hasError`，避免 `notReady`）
- 禁止無意義命名：`data`、`info`、`temp`、`x`、`foo`（教學 pseudo code 除外）

### 函式原則
- 一個函式只做一件事（Single Responsibility）
- 長度超過 20 行就思考是否能拆分
- 優先寫純函式（相同輸入永遠產生相同輸出，不改變外部狀態）
- 參數超過 3 個時，改用 object 傳入

```typescript
// 不好
function createUser(name: string, age: number, email: string, role: string) {}

// 好
function createUser(params: { name: string; age: number; email: string; role: string }) {}
```

### TypeScript 規範
- 永遠開啟 `strict` 模式
- 禁止使用 `any`（教學中要特別說明為什麼）
- 優先用 `interface` 描述物件結構，用 `type` 處理聯合型別
- 非必要不寫型別註解——讓 TypeScript 自己推斷（`const name = "Alice"` 不需要寫 `: string`）
- `async` 函式的回傳型別寫 `Promise<T>`

### 注解原則
- 注解解釋「為什麼」，不解釋「做什麼」（程式碼本身就說明做什麼）
- 好的注解：`// 必須先排序才能用二分搜尋`
- 壞的注解：`// 對陣列排序`（程式碼已經說了）
- 暫時性的 workaround 要標記 `// TODO:` 或 `// FIXME:`

### 錯誤處理
- 錯誤訊息要對人有意義（`"找不到 ID 為 ${id} 的使用者"` 而非 `"error"`）
- 不要吃掉 error（`catch (e) {}` 是禁止的）
- API 回應要有一致的錯誤格式

### 反模式（課程中遇到時要明確指出這是壞習慣）
| 反模式 | 說明 | 課程中出現在 |
|--------|------|------------|
| Magic Number | `if (status === 3)` 不說明 3 是什麼 | Part 2 |
| 巢狀地獄 | 超過 3 層縮排的 callback | Part 2-6 |
| 直接改參數 | 函式內修改傳入的 object | Part 2 |
| 過早最佳化 | 還沒有效能問題就開始優化 | Part 4 |
| 上帝物件 | 一個 class/object 管所有事 | Part 4-D |
| `any` 濫用 | 用 `any` 逃避型別問題 | Part 2 |

### 在課程中呈現反模式的格式

```markdown
> **常見錯誤** — 很多人會這樣寫：
> （壞的程式碼）
> 問題是...（解釋為什麼不好）
> 正確做法：（好的程式碼）
```

---

## SOLID 與 Best Practice 引導規則

撰寫課程內容時，當程式碼範例或概念涉及以下情境，**必須**在該段落結尾加上對應的課外讀物引導。

### SOLID 原則觸發時機

| 情境 | 對應原則 | 引導格式 |
|------|---------|---------|
| 函式或模組做了超過一件事 | SRP | `→ [課外讀物 E-7-2]` |
| 新增功能需要修改現有程式碼 | OCP | `→ [課外讀物 E-7-3]` |
| TypeScript 介面設計 | ISP | `→ [課外讀物 E-7-5]` |
| 模組之間的依賴關係 | DIP | `→ [課外讀物 E-7-6]` |
| 第一次介紹 SOLID 任一原則 | 總覽 | `→ [課外讀物 E-7-1]` |

### Clean Code 觸發時機

| 情境 | 課外讀物 |
|------|---------|
| 介紹命名規則、討論變數名稱好壞 | `→ [課外讀物 E-6-2]` |
| 函式設計、Single Responsibility | `→ [課外讀物 E-6-3]` |
| TypeScript `any`、`strict` 相關 | `→ [課外讀物 E-6-4]` |
| 出現反模式（magic number、巢狀等） | `→ [課外讀物 E-6-6]` |
| React 元件設計原則 | `→ [課外讀物 E-6-7]` |
| API 錯誤處理設計 | `→ [課外讀物 E-6-8]` |

### 引導的標準格式

輕量提示（課程中隨文附上）：
```markdown
> 這裡用到了 Single Responsibility Principle 的概念 → **[課外讀物 E-7-2] S — Single Responsibility Principle**
```

章節末尾較完整的引導（當整章都與某原則相關）：
```markdown
## 課外讀物

> 這章寫的函式拆分方式，正是 SOLID 裡「S」原則的體現 → **[課外讀物 E-7-2] S — Single Responsibility Principle**
> 想看更多違反這個原則的反例 → **[課外讀物 E-7-8] SOLID 反例大賞**
```

---

## 新增章節的 checklist

在提交新章節前，確認以下項目：

- [ ] 檔案放在正確的 `lessons/part-X/` 或 `課外讀物/E-X/` 目錄
- [ ] 包含「本章目標」說明
- [ ] 抽象概念有 pseudo code 或類比先行
- [ ] 適當使用 Mermaid 圖表
- [ ] 有程式碼範例且每段範例前有說明
- [ ] 有小練習（主線章節）
- [ ] 有課外讀物引用（如果有對應的話）
- [ ] 如果這章是 POC 解鎖點，有 POC 引導區塊
- [ ] 程式碼涉及函式拆分 → 有引導至 E-7-2（SRP）或 E-6-3
- [ ] 程式碼涉及 TypeScript 介面設計 → 有引導至 E-7-5（ISP）
- [ ] 程式碼涉及模組依賴 → 有引導至 E-7-6（DIP）
- [ ] 出現反模式 → 有「常見錯誤」區塊並引導至 E-6-6
- [ ] 涉及 Git 操作 → 有引導至 E-8 對應章節
- [ ] 涉及測試概念 → 有引導至 E-9 對應章節
