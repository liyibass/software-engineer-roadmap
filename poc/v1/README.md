# POC V1 — 靜態互動頁面（純前端 Todo App）

> **解鎖條件**：完成 Part 3（前端原生開發）後

這是整個漸進式 POC 的起點。接下來每完成一個關鍵 Part，我們就會把這個 Todo App 升級一次，最終變成一個部署上線的全端作品。先把這版跑起來，感受一下「純前端」能做到什麼、又有什麼限制。

---

## 這個版本做了什麼

一個可以實際操作的待辦清單 App，功能包含：

- 新增待辦事項
- 勾選 / 取消勾選（切換完成狀態，有刪除線樣式）
- 刪除單筆待辦
- 顯示「還有幾件未完成」的計數
- **資料存在瀏覽器的 `localStorage`**，重新整理或關掉瀏覽器再打開，資料都還在

用到的全是 Part 1~3 教過的東西：TypeScript 型別、`interface`、DOM 操作、事件驅動、`localStorage`。

---

## 這版的定位與限制（為什麼還需要 V2）

```
V1 架構：
┌─────────────────────┐
│   你的瀏覽器          │
│   index.html        │
│   dist/main.js      │  ← 由 src/main.ts 編譯而來
│   localStorage      │  ← 資料存在這裡
└─────────────────────┘
（還沒有後端、沒有資料庫）
```

資料存在 `localStorage` 的意思是——它**只活在你這台電腦的這個瀏覽器裡**：

- 換一台電腦打開 → 看不到你的待辦
- 換一個瀏覽器（Chrome 換 Safari）→ 看不到
- 想跟朋友分享你的清單 → 做不到

這正是 **V2 要引入「後端」的理由**：把資料從「單一台瀏覽器」搬到「一台大家都連得到的伺服器」上。

> 這個限制會在 [Part 4-A：HTTP / Express / fetch](../../lessons/basic/part-4/4-A-1-what-is-http.md) 開始解決。

---

## 如何跑起來

這版用 TypeScript 寫，但瀏覽器看不懂 `.ts`，所以要先用 `tsc` 把 `src/main.ts` **編譯**成 `dist/main.js`，HTML 再載入它。

> 為什麼瀏覽器不直接懂 TypeScript？這個痛點會在 Part 4-C「為什麼需要打包工具」展開，到時我們用 Vite 讓這一步自動化。V1 先用最原始的方式，親手感受編譯這件事。

```bash
# 進到這個資料夾
cd poc/v1

# 安裝 TypeScript 編譯器
npm install

# 編譯一次（產生 dist/main.js）
npm run build
```

編譯完成後，**用瀏覽器直接打開 `index.html`** 就能看到畫面（直接雙擊檔案，或在 VS Code 用 Live Server 外掛）。

開發時可以開另一個終端機跑 watch 模式，存檔就自動重新編譯：

```bash
npm run dev
```

---

## 專案結構

```
poc/v1/
├── README.md          # 你正在看的這份
├── package.json       # 專案設定與 npm 指令
├── tsconfig.json      # TypeScript 編譯設定（strict 模式）
├── index.html         # 頁面結構，載入 dist/main.js
├── style.css          # 樣式
├── src/
│   └── main.ts        # 所有邏輯：狀態、渲染、事件
└── dist/              # 編譯產物（npm run build 後才出現，不進版本控制）
    └── main.js
```

---

## 程式碼導覽

`src/main.ts` 的結構，由上而下：

1. **`interface Todo`** — 先定義一筆待辦長什麼樣（`id` / `text` / `completed`），後面的程式碼才有依據。
2. **`todos` 陣列** — 整個 App 的「唯一資料來源」。畫面永遠是這份資料的反映。
3. **`loadTodos` / `saveTodos`** — 跟 `localStorage` 之間的讀寫。`localStorage` 只能存字串，所以用 `JSON.stringify` / `JSON.parse` 轉換。
4. **`createTodoElement`** — 把「一筆資料」變成「一段畫面（`<li>`）」。
5. **`render`** — 清空畫面後依資料重畫，確保畫面跟資料永遠一致。
6. **`addTodo` / `toggleTodo` / `deleteTodo`** — 三個改動資料的操作，每個都遵循同樣的節奏：**改資料 → `saveTodos()` → `render()`**。

這個「改資料 → 存檔 → 重畫」的模式，正是之後 React（Part 6）`UI = f(state)` 思想的雛形——你會發現我們早就在這樣思考了。

---

## 學到了什麼

- 用 `interface` 描述資料的形狀，讓型別替你擋掉一整類錯誤
- DOM 操作：`createElement` / `appendChild` / `classList` / `addEventListener`
- 事件驅動：使用者操作 → 觸發函式 → 更新資料與畫面
- `localStorage` 的用法與它的根本限制（資料綁在單一瀏覽器）
- TypeScript 要先編譯成 JavaScript 瀏覽器才看得懂（為 Part 4-C 的打包工具鋪路）

---

## 動手玩玩看

1. 新增幾筆待辦，勾選其中幾個，然後**重新整理頁面**——資料還在嗎？
2. 打開 DevTools → Application → Local Storage，找到 `todos-v1`，看看資料是怎麼被存成 JSON 的。
3. 試試看用**另一個瀏覽器**打開同一個 `index.html`——你會發現待辦不見了。想一想：為什麼？這個問題 V2 會怎麼解決？
