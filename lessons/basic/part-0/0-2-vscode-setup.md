# [0-2] VS Code 設定：讓編輯器變成你的好隊友

> **本章目標**：把 VS Code 設定成一個真正懂你在寫什麼、會幫你抓錯誤、讓你寫得更快的環境。

## 你會學到

- VS Code 最重要的幾個區域是什麼
- 安裝哪些延伸套件（Extensions）最值得
- 開啟哪些設定讓寫程式更順手
- 幾個讓效率翻倍的快捷鍵

---

## 概念說明

### VS Code 的四個區域

剛打開 VS Code，你會看到很多東西。先認識最重要的四塊：

```
┌─────────────────────────────────────────────────────┐
│  左側欄          │  編輯區                            │
│  ─────────────  │  ──────────────────────────────── │
│  📁 檔案總管     │  你寫程式碼的地方                   │
│  🔍 搜尋         │                                   │
│  🔀 Git 狀態     │                                   │
│  🧩 延伸套件     │                                   │
│                 │                                   │
│─────────────────┴───────────────────────────────────│
│  終端機（Terminal）                                   │
│  你可以在這裡執行指令，不用離開 VS Code                │
└─────────────────────────────────────────────────────┘
```

**最重要的習慣**：讓 Terminal 一直開著在下方。按 `` Ctrl + ` ``（Backtick，Tab 鍵上面那個）可以開關它。

---

## 延伸套件（Extensions）安裝

延伸套件是別人幫你做好的工具，裝上去之後 VS Code 就多了新能力。

按左側欄的 🧩 圖示，或按 `Cmd + Shift + X` 開啟套件市場。

### 必裝清單

#### 1. Prettier — 自動排版

```
搜尋：Prettier - Code formatter
作者：Prettier
```

它會把你亂七八糟的縮排、引號、分號，自動整理成一致的風格。

你不需要手動對齊，存檔的瞬間它就幫你整理好了。

#### 2. ESLint — 抓程式碼問題

```
搜尋：ESLint
作者：Microsoft
```

在你執行之前就發現問題——例如變數宣告了但沒有用、少了必要的參數等等。

紅色底線 = 錯誤，黃色底線 = 警告。

#### 3. Error Lens — 讓錯誤直接顯示在程式碼旁邊

```
搜尋：Error Lens
作者：Alexander
```

沒裝之前：錯誤訊息躲在畫面最下方，要點開才看得到。

裝了之後：錯誤訊息直接出現在那一行的右邊，一眼就看到。

```javascript
const name = "Alice"
consle.log(name)   // ← 這裡直接顯示紅字：consle is not defined
```

#### 4. GitLens — 在程式碼旁邊看到 Git 歷史

```
搜尋：GitLens
作者：GitKraken
```

把游標放到任意一行，右邊就會淡淡地顯示「誰、什麼時候、做了什麼改動」。在 Part 0-4 學 Git 之後會更有感。

---

## 重要設定

按 `Cmd + ,` 開啟設定，或用 `Cmd + Shift + P` 輸入 `Open Settings (JSON)` 切換到 JSON 模式。

把以下內容複製進去（如果 JSON 檔案裡已經有 `{}`，把這些設定放進去就好）：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.minimap.enabled": false,
  "editor.wordWrap": "on",
  "files.autoSave": "onFocusChange",
  "terminal.integrated.fontSize": 14
}
```

**每個設定在做什麼：**

```
formatOnSave       → 存檔時自動排版（靠 Prettier）
defaultFormatter   → 指定用 Prettier 排版
tabSize            → 縮排用 2 個空格（業界主流）
minimap            → 關掉右側那個迷你地圖（不實用，占空間）
wordWrap           → 程式碼太長會自動換行，不用水平捲動
autoSave           → 切換視窗時自動存檔
terminal.fontSize  → 讓 Terminal 字型大小舒服一點
```

---

## 程式碼範例

### 看看 Prettier 做了什麼

安裝並設定好之後，試著把這段亂掉的程式碼貼進 VS Code，然後按 `Cmd + S` 存檔：

```javascript
// 存檔前（亂的）
const greeting="Hello"
    const name =   'World'
console.log(greeting+name)
```

存檔後，Prettier 會自動整理成：

```javascript
// 存檔後（Prettier 整理完）
const greeting = "Hello"
const name = "World"
console.log(greeting + name)
```

不用手動對齊，不用記引號要用單引還是雙引——存檔就好。

---

## 快捷鍵備忘錄

這幾個快捷鍵用熟之後，手幾乎不需要離開鍵盤：

| 動作 | 快捷鍵 |
|------|--------|
| 開關 Terminal | `` Ctrl + ` `` |
| 開啟設定 | `Cmd + ,` |
| 開啟指令面板 | `Cmd + Shift + P` |
| 搜尋檔案 | `Cmd + P` |
| 多行同時編輯 | `Option + Click` |
| 複製這一行 | `Opt + Shift + ↓` |
| 刪除這一行 | `Cmd + Shift + K` |
| 格式化（手動）| `Opt + Shift + F` |
| 存檔 | `Cmd + S` |

> 不用全部背起來。每次用到就查，用幾次就自然記住了。

---

## 小練習

1. 安裝上面列出的四個延伸套件，確認它們出現在左側欄的套件區
2. 把設定 JSON 複製進去，確認存檔後沒有出現錯誤
3. 建立一個新的 `test.js` 檔案，隨便寫幾行縮排亂掉的程式碼，存檔後觀察 Prettier 有沒有自動整理

<details>
<summary>參考解答</summary>

這三題都是動手操作，需要你在自己的 VS Code 裡實做，下面給正確做法與驗收檢查點，**最終仍需自行實機驗證**。

**第 1 題：安裝四個延伸套件**

按左側欄的 🧩 或 `Cmd + Shift + X` 打開套件市場，依序搜尋並安裝：`Prettier - Code formatter`、`ESLint`、`Error Lens`、`GitLens`。搜尋時記得認一下作者（例如 ESLint 是 Microsoft、Prettier 是 Prettier），避免裝到同名的仿冒套件。

- **驗收檢查點**：把套件市場切到「INSTALLED（已安裝）」清單，四個套件都在裡面就成功了。

**第 2 題：貼進設定 JSON**

用 `Cmd + Shift + P` 輸入 `Open Settings (JSON)`，把課程給的那段設定貼進去。如果檔案原本已經有 `{ }`，就把設定內容放進大括號裡，**注意每個項目之間要有逗號、最後一項後面不要多逗號**（JSON 對逗號很嚴格）。

- **驗收檢查點**：存檔後，如果 JSON 格式沒問題，畫面上不會出現紅色波浪線或錯誤提示。若有紅線，多半是逗號或引號漏掉了。

**第 3 題：測試 Prettier**

新增 `test.js`，故意寫得很亂，例如：

```javascript
const greeting="Hi"
      const name=   'VSCode'
console.log(greeting+name)
```

按 `Cmd + S` 存檔。

- **驗收檢查點**：存檔的瞬間，縮排會被對齊成 2 個空格、引號會被統一、運算子兩邊會補上空格，變成整齊的樣子。
- **如果沒反應**：檢查三件事——(1) `editor.formatOnSave` 有沒有設成 `true`；(2) `editor.defaultFormatter` 是不是 `esbenp.prettier-vscode`；(3) 右下角的語言模式是不是 JavaScript。也可以先手動按 `Opt + Shift + F` 測試 Prettier 本身有沒有作用。

</details>

---

## 接下來

VS Code 設定好了。下一章（0-3）會介紹 Node.js 和 npm——你裝的那些套件是怎麼被管理的，以及為什麼工程師都在用 `npm install`。
