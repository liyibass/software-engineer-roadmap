# [E-2-1] npm 是什麼？package.json 完整解析

> **這篇在說什麼**：深入認識 npm 這個套件管理工具，搞懂 package.json 每個欄位的意思，以及版本號那三個數字代表什麼。

## 概念說明

想像你在開一家餐廳。

你不可能自己種菜、自己養雞、自己磨麵粉——你去跟食材供應商進貨。供應商有個目錄，你看一看，下訂單，食材就送到你廚房。

npm 就是軟體界的「食材批發市場」。

你要做一個網站，不需要從零開始寫「怎麼驗證 email 格式」、「怎麼加密密碼」——有人早就寫好了，放在 npm 上，你下個指令就拿來用。

**npm 的全名是 Node Package Manager**（Node 套件管理工具），目前是全世界最大的軟體套件倉庫，上面有超過 **200 萬個**套件（截至 2024 年）。

---

### npm 是誰在管？

有一段有趣的小歷史。

npm 最早由 Isaac Z. Schlueter 在 2010 年創立，一開始只是 Node.js 的配套工具。後來成立了 npm, Inc. 這家公司專門維護它。

2020 年，GitHub 宣布收購 npm, Inc.。而 GitHub 本身在 2018 年就被 Microsoft 收購了。所以現在的 npm，背後的金主其實是微軟。

有點諷刺——因為早年微軟跟開源社群的關係並不友好，但現在他們反而在維護全世界最大的開源套件倉庫之一。時代真的變了。

---

## 深入一點

### package.json 完整解析

每個 Node.js 專案都有一個 `package.json`，這是這個專案的「身分證 + 購物清單」。

來看一個完整的範例：

```json
{
  "name": "my-awesome-app",
  "version": "1.3.2",
  "description": "一個很厲害的 Todo App",
  "main": "index.js",
  "keywords": ["todo", "productivity"],
  "author": "Liyi Lu <liyi@example.com>",
  "license": "MIT",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@types/express": "^4.17.21"
  }
}
```

逐欄說明：

**`name`**：這個專案的名稱。如果你要把這個套件發布到 npm 上，這個名稱必須是全球唯一的。如果只是自己用，隨便取都行，但建議取個有意義的名字。

**`version`**：版本號，格式是 `主版本.次版本.修補版本`（下面有專門說明）。

**`description`**：一句話說明這個專案是做什麼的。

**`main`**：這個套件的「入口點」——當別人 `require('你的套件')` 時，Node.js 會去載入哪個檔案。

**`keywords`**：關鍵字，方便別人在 npm 上搜尋到你的套件。

**`author`**：作者資訊。

**`license`**：授權條款。`MIT` 是最寬鬆的開源授權，基本上就是「你愛怎麼用就怎麼用，但不要告我」。

---

### scripts：讓 npm 幫你記住常用指令

`scripts` 是 package.json 裡最實用的欄位之一。

你可以把常用的指令存在這裡，然後用 `npm run 指令名稱` 來執行：

```bash
npm run dev    # 等同於執行 nodemon index.js
npm run build  # 等同於執行 tsc
npm test       # 注意：test 和 start 可以省略 run，直接 npm test
```

好處是：新人加入專案，不需要問「這個要怎麼跑」——直接看 scripts 就知道了。這是一個很好的習慣。

---

### dependencies vs devDependencies：這兩個有什麼差？

這個差別很重要，很多初學者搞混。

**`dependencies`（相依套件）**：你的程式在**正式上線後也需要**的套件。

例如 `express` 是你的 web 框架——網站跑起來就需要它，沒有它就不能運作。

**`devDependencies`（開發用相依套件）**：只在**開發過程中**需要，上線之後不需要的套件。

例如：
- `typescript`：把 TypeScript 編譯成 JavaScript，編譯完就不需要了
- `jest`：跑測試用的，正式環境不跑測試
- `@types/express`：TypeScript 的型別定義，只有開發時需要

安裝時的差別：
```bash
npm install express           # 裝進 dependencies
npm install --save-dev jest   # 裝進 devDependencies（簡寫：npm i -D jest）
```

在正式部署時，你可以只安裝 `dependencies`，跳過 `devDependencies`，讓伺服器保持精簡：

```bash
npm install --production
```

---

### Semantic Versioning（語意化版本）：那三個數字不是隨便決定的

`1.3.2` 這三個數字各有名字和意義：

```
  1    .    3    .    2
主版本      次版本    修補版本
(major)   (minor)  (patch)
```

- **修補版本（patch）**：`1.3.2 → 1.3.3` — 修了 bug，沒有新功能，可以放心更新
- **次版本（minor）**：`1.3.2 → 1.4.0` — 加了新功能，但舊的功能還在，通常也可以放心更新
- **主版本（major）**：`1.3.2 → 2.0.0` — 有重大變動，舊的用法可能不再相容，更新前要小心檢查

這個規則叫做 **Semantic Versioning（semver）**，是開源社群的共同約定。

---

### 版本範圍符號：`^` 和 `~` 是什麼意思？

package.json 裡的版本號前面常常有 `^` 或 `~`，這是在告訴 npm「可以接受哪個範圍的版本」：

| 寫法 | 意思 | 例子 |
|------|------|------|
| `^1.2.3` | 接受次版本和修補版本更新，主版本不動 | 接受 `1.3.0`、`1.9.9`，不接受 `2.0.0` |
| `~1.2.3` | 只接受修補版本更新 | 接受 `1.2.4`、`1.2.99`，不接受 `1.3.0` |
| `1.2.3` | 只接受剛好這個版本 | 嚴格鎖定，不接受任何更新 |

最常見的是 `^`（脫字號），`npm install` 預設就是這個。它的邏輯是：「次版本和修補版本的更新通常是安全的，讓我可以自動拿到 bug 修復。」

```
^1.2.3 能接受的版本範圍：
✅ 1.2.4  (patch 更新)
✅ 1.3.0  (minor 更新)
✅ 1.9.9  (minor 更新)
❌ 2.0.0  (major 更新，可能有 breaking changes)
```

---

### package-lock.json：不要手動改，但一定要 commit

你第一次 `npm install` 之後，除了 `package.json`，還會多出一個 `package-lock.json`。

這個檔案記錄了「這次安裝時，每個套件確切裝了哪個版本」。

為什麼需要它？因為 `^1.2.3` 只是一個範圍，不是精確版本。你今天裝是 `1.5.0`，一個月後你同事 clone 你的專案再裝，可能就變成 `1.8.0` 了——如果這個版本有 bug，你同事的環境就會出問題，而你的不會。

有了 `package-lock.json`，`npm install` 就會嚴格照裡面記錄的版本安裝，確保每個人的環境完全一致。

兩個重要原則：
1. **不要手動編輯 `package-lock.json`**，讓 npm 自己管
2. **一定要把 `package-lock.json` commit 到 Git**，這樣大家才能重現一樣的環境

---

### npm vs yarn vs pnpm：選哪個？

市場上有幾個套件管理工具：

| 工具 | 特色 |
|------|------|
| npm | Node.js 官方內建，最普遍 |
| yarn | Facebook 出的，曾經比 npm 快很多（現在差距縮小了） |
| pnpm | 用硬連結共享套件，省磁碟空間，速度快 |
| bun | 全新工具，套件管理 + 執行環境合一，速度極快 |

這門課統一用 npm，夠用且不需要額外安裝。等你更熟悉之後，可以再探索其他工具。

---

## 延伸閱讀

- 好奇 `node_modules` 為什麼裝完動不動就幾百個資料夾？ → [課外讀物 E-2-3：node_modules 為什麼那麼大？](./E-2-3-node-modules-size.md)
