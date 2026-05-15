# Exercise-0：建立個人開發環境與第一個 Git 專案

> **練習目標**：從零開始設定開發環境，建立一個 npm 專案，用 Git 追蹤程式碼，並推送到 GitHub。
>
> **對應章節**：[0-1 開發環境總覽] · [0-2 VS Code 設定] · [0-3 Node.js 與 npm] · [0-4 Git 是什麼] · [0-5 Git 基本操作] · [0-6 GitHub 入門]

---

## 你將完成什麼

建立一個叫做 `my-notes` 的個人筆記專案，完成後你會有：

- 設定好的 VS Code 編輯器環境
- 一個可以執行的 Node.js 程式
- 第一個 Git commit 紀錄
- 推送到 GitHub 的線上倉庫

---

## 步驟

### 步驟 1：確認 VS Code 擴充功能

打開 VS Code，按 `Cmd+Shift+X`（Mac）或 `Ctrl+Shift+X`（Windows）進入擴充功能頁面。

搜尋並安裝以下四個擴充功能（如果還沒安裝的話）：

- `Prettier - Code formatter`
- `ESLint`
- `Error Lens`
- `GitLens`

接著確認 VS Code 的 settings.json 設定正確。按 `Cmd+Shift+P` → 輸入 `Open User Settings (JSON)`，確認有這幾行：

```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 步驟 2：建立專案資料夾並初始化 npm

打開 Terminal，手動輸入以下指令（**一行一行輸入，不要一次貼上**）：

```bash
mkdir my-notes
cd my-notes
npm init -y
```

確認有產生 `package.json`：

```bash
ls
```

你應該看到 `package.json` 出現在清單裡。

### 步驟 3：建立第一個程式

用 VS Code 打開這個資料夾：

```bash
code .
```

在 VS Code 裡建立新檔案 `index.js`，**手動逐字輸入**以下程式碼：

```javascript
const notes = [];

function addNote(content) {
  const note = {
    id: notes.length + 1,
    content: content,
    createdAt: new Date().toISOString()
  };
  notes.push(note);
  console.log(`新增筆記：${content}`);
}

function showAllNotes() {
  console.log(`\n目前共有 ${notes.length} 則筆記：`);
  notes.forEach(function (note) {
    console.log(`  ${note.id}. ${note.content}`);
  });
}

addNote("今天學了 Git 的基本操作");
addNote("npm 是 Node.js 的套件管理工具");
addNote("VS Code 讓我寫程式更有效率");
showAllNotes();
```

回到 Terminal，執行這個程式：

```bash
node index.js
```

預期輸出：

```
新增筆記：今天學了 Git 的基本操作
新增筆記：npm 是 Node.js 的套件管理工具
新增筆記：VS Code 讓我寫程式更有效率

目前共有 3 則筆記：
  1. 今天學了 Git 的基本操作
  2. npm 是 Node.js 的套件管理工具
  3. VS Code 讓我寫程式更有效率
```

如果輸出正確，繼續下一步。

### 步驟 4：建立 .gitignore

在 VS Code 建立 `.gitignore` 檔案，輸入：

```
node_modules/
.DS_Store
```

### 步驟 5：初始化 Git 並完成第一次 commit

在 Terminal 輸入：

```bash
git init
git config user.name "你的名字"
git config user.email "你的Email"
```

查看目前狀態（**注意看輸出的顏色和說明**）：

```bash
git status
```

你應該看到三個未追蹤的檔案（紅色）：`package.json`、`index.js`、`.gitignore`。

把這三個檔案加入暫存區：

```bash
git add index.js
git add package.json
git add .gitignore
```

再次查看狀態，確認三個檔案都變成綠色（已暫存）：

```bash
git status
```

建立 commit：

```bash
git commit -m "feat: 初始化筆記專案，新增基本的新增與顯示功能"
```

查看 commit 紀錄確認成功：

```bash
git log --oneline
```

### 步驟 6：推送到 GitHub

1. 打開瀏覽器，登入 [GitHub](https://github.com)
2. 點右上角 `+` → `New repository`
3. Repository name 填 `my-notes`
4. 選 `Public`
5. **不要**勾選「Add a README file」（我們已有本地檔案）
6. 點 `Create repository`

GitHub 會顯示一段指令。回到 Terminal，輸入（把 `你的帳號` 換成你的 GitHub 帳號名）：

```bash
git remote add origin https://github.com/你的帳號/my-notes.git
git branch -M main
git push -u origin main
```

重新整理 GitHub 頁面，確認三個檔案都出現了。

---

## 完成確認

- [ ] VS Code 已安裝 Prettier、ESLint、Error Lens、GitLens 四個擴充功能
- [ ] `npm init -y` 成功產生 `package.json`
- [ ] `node index.js` 能正確輸出三則筆記
- [ ] `git log --oneline` 顯示一個 commit 紀錄
- [ ] GitHub 上的 `my-notes` 倉庫能看到 `index.js` 和 `package.json`

---

## 延伸挑戰

完成基本步驟後，試試看：

1. 在 `index.js` 新增一個 `deleteNote(id)` 函式，能夠刪除指定 id 的筆記
2. 修改 `package.json` 的 `scripts` 欄位，加入 `"start": "node index.js"`，然後用 `npm start` 執行看看
3. 把這次修改 commit 起來，訊息寫 `"feat: 新增刪除筆記功能"`，再 push 到 GitHub
