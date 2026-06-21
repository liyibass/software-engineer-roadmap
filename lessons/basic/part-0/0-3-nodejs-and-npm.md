# [0-3] Node.js 與 npm：JavaScript 的執行環境

> **本章目標**：搞懂 Node.js 讓 JavaScript 能在瀏覽器外面跑的原理，以及 npm 如何讓你站在別人的肩膀上寫程式。

## 你會學到

- Node.js 是什麼，跟瀏覽器的關係
- npm 是什麼，為什麼工程師都在用 `npm install`
- `package.json` 是什麼，怎麼建立一個新專案
- `node_modules` 為什麼那麼大、為什麼不能傳給別人

---

## 概念說明

### JavaScript 的兩個家

JavaScript 原本只住在瀏覽器裡。瀏覽器有一個引擎負責讀懂 JavaScript，Google Chrome 用的引擎叫 **V8**。

2009 年，有個工程師把 V8 引擎從 Chrome 裡面拔出來，讓它可以在任何地方獨立跑 JavaScript——這就是 **Node.js** 的誕生。

```
以前：JavaScript 只能在瀏覽器裡跑
         瀏覽器
        ┌───────┐
        │  V8   │ ← JavaScript 的家
        └───────┘

現在：Node.js 讓 JavaScript 搬到外面住
         瀏覽器          你的電腦（Terminal）
        ┌───────┐        ┌──────────────────┐
        │  V8   │        │  Node.js（也是V8）│
        └───────┘        └──────────────────┘
```

這就是為什麼你在 `0-1` 可以用 `node hello.js` 直接執行 JavaScript——不需要打開瀏覽器。

**Node.js 讓 JavaScript 能做到的事：**
- 讀寫電腦上的檔案
- 建立 HTTP 伺服器（後端）
- 連接資料庫
- 執行系統指令

這些在瀏覽器裡的 JavaScript 都做不到（基於安全考量），但 Node.js 可以。

---

### npm 是什麼？

寫程式有一個原則：**不要重複發明輪子**。

如果你要在程式裡處理日期，有人已經寫好了一個超完整的日期工具，為什麼要自己從頭寫？

**npm（Node Package Manager）** 就是一個裝滿別人寫好的工具的倉庫。目前有超過 200 萬個套件可以直接取用，而且大多數是免費的。

```
npm ≈ App Store for code

差別：
  App Store → 大多要付費，有審核
  npm       → 大多免費，任何人都可以上傳
```

你在 `0-2` 裝的那些 VS Code 套件，其實背後很多都是從 npm 抓下來的。

---

### package.json — 專案的身份證

每個 Node.js 專案都有一個 `package.json`，它記錄了這個專案的所有資訊：

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "我的第一個專案",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

把它想成這個專案的**食材清單**：

```
package.json 的重要欄位：

name         → 專案名稱
version      → 目前版本號
scripts      → 自訂的「快捷指令」（像別名）
dependencies → 這個專案「上線後」還需要的套件
devDependencies → 只有「開發時」需要的套件（TypeScript、測試工具等）
```

---

## 程式碼範例

### 建立第一個專案

打開 Terminal，建立一個新資料夾並進入：

```bash
mkdir my-first-project
cd my-first-project
```

初始化 npm 專案（`-y` 表示全部用預設值，不用一直按 Enter）：

```bash
npm init -y
```

你會看到資料夾裡多了一個 `package.json`，內容類似：

```json
{
  "name": "my-first-project",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

### 安裝第一個套件

`dayjs` 是一個處理日期的套件，比 JavaScript 內建的 `Date` 好用很多：

```bash
npm install dayjs
```

執行後發生了三件事：

1. `package.json` 多了 `dependencies`
2. 多了一個 `package-lock.json`（記錄精確版本）
3. 多了一個 `node_modules` 資料夾

建立 `index.js`，使用這個套件：

```javascript
const dayjs = require("dayjs")

const today = dayjs()
console.log("今天是：", today.format("YYYY-MM-DD"))
console.log("明天是：", today.add(1, "day").format("YYYY-MM-DD"))
console.log("一週後是：", today.add(7, "day").format("YYYY-MM-DD"))
```

執行：

```bash
node index.js
```

你會看到類似：

```
今天是： 2024-01-15
明天是： 2024-01-16
一週後是： 2024-01-22
```

---

### 自訂 scripts

在 `package.json` 的 `scripts` 欄位加上：

```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

這樣就可以用 `npm start` 代替 `node index.js`：

```bash
npm start
```

`scripts` 的用途是把常用的指令變成有意義的名稱。之後你會看到 `npm run dev`、`npm run build`、`npm run test` 等等，都是這個原理。

---

### node_modules 是什麼？

`node_modules` 是 npm 把下載的套件放在這裡的資料夾。

這個資料夾可能很大——即使你只裝了 `dayjs` 一個套件，node_modules 裡面可能會有幾十個資料夾。這是因為 `dayjs` 可能依賴其他套件，那些套件又依賴別的套件。

```
你安裝了 A → A 需要 B → B 需要 C → C 需要 D...
```

**node_modules 的重要特性：**

```
✅ 可以隨時刪除   → 只要有 package.json，執行 npm install 就能重建
❌ 不要傳給別人   → 太大了，幾百 MB 甚至 GB
❌ 不要上傳 Git  → 用 .gitignore 排除（之後會學）
```

這就是為什麼把專案傳給別人時，你只傳程式碼和 `package.json`，不傳 `node_modules`。收到的人只需要執行 `npm install`，npm 就會照著 `package.json` 把套件全部重新裝好。

---

## 小練習

1. 建立一個新資料夾，執行 `npm init -y`，打開 `package.json` 看看裡面有什麼

2. 安裝 `chalk` 套件（讓 Terminal 輸出有顏色的文字），寫幾行程式碼讓它印出紅色、綠色、藍色的文字

3. 把 `node_modules` 資料夾刪掉，然後執行 `npm install`，確認它能被完整重建

---

## 課外讀物

> 想深入了解 npm 生態系、`package-lock.json` 的意義、版本號規則 → [課外讀物 E-2-1：npm 是什麼？package.json 解析](../../../課外讀物/E-2-npm/E-2-1-npm-intro.md)

> 想了解為什麼 node_modules 那麼大，背後的依賴樹是怎麼運作的 → [課外讀物 E-2-3：node_modules 為什麼那麼大？](../../../課外讀物/E-2-npm/E-2-3-node-modules-size.md)
