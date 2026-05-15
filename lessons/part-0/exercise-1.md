# Exercise-1：練習 Git 工作流程與多次 Commit

> **練習目標**：建立一個新的 npm 專案，練習進行多次有意義的 Git commit，並學習用 `git diff` 和 `git log` 追蹤程式碼變化。
>
> **對應章節**：[0-3 Node.js 與 npm] · [0-5 Git 基本操作] · [0-6 GitHub 入門]

---

## 你將完成什麼

建立一個叫做 `my-journal` 的日記管理專案，完成後你會有：

- 一個有三次 commit 的 Git 倉庫
- 學會用 `git diff` 查看每次修改的內容
- 學會用 `git log` 回顧程式的演變歷程
- 推送到 GitHub 並看到完整的 commit 歷史

---

## 步驟

### 步驟 1：建立專案

在 Terminal 輸入：

```bash
mkdir my-journal
cd my-journal
npm init -y
code .
```

在 VS Code 建立 `.gitignore`，輸入：

```
node_modules/
.DS_Store
```

### 步驟 2：第一次 commit — 基本結構

建立 `journal.js`，**手動逐字輸入**：

```javascript
const entries = [];

function addEntry(title, content) {
  const entry = {
    id: entries.length + 1,
    title: title,
    content: content,
    date: new Date().toLocaleDateString("zh-TW")
  };
  entries.push(entry);
}

addEntry("第一天", "今天開始學程式設計，感覺既興奮又緊張。");
addEntry("第二天", "學了 Git 的基本概念，commit 就像是遊戲存檔。");

console.log("目前共有", entries.length, "篇日記");
```

在 Terminal 執行確認沒問題：

```bash
node journal.js
```

初始化 Git 並完成第一次 commit：

```bash
git init
git add journal.js
git add package.json
git add .gitignore
git commit -m "feat: 初始化日記系統，支援新增日記功能"
```

### 步驟 3：新增功能，第二次 commit

在 `journal.js` **底部**繼續新增（不要動原有的程式碼）：

```javascript
function showAllEntries() {
  console.log("\n=== 我的日記 ===");
  entries.forEach(function (entry) {
    console.log(`\n[${entry.date}] ${entry.title}`);
    console.log(`  ${entry.content}`);
  });
  console.log("\n================");
}

showAllEntries();
```

執行確認：

```bash
node journal.js
```

**在 commit 之前，先查看這次改了什麼**：

```bash
git diff
```

仔細閱讀輸出：
- 以 `+` 開頭的行（綠色）是**新增**的內容
- 以 `-` 開頭的行（紅色）是**刪除**的內容

確認改動正確後，進行第二次 commit：

```bash
git add journal.js
git commit -m "feat: 新增顯示所有日記功能"
```

### 步驟 4：修改既有功能，第三次 commit

現在想讓日記格式更漂亮，**修改** `showAllEntries` 函式裡的顯示格式。

找到這兩行：

```javascript
    console.log(`[${entry.date}] ${entry.title}`);
    console.log(`  ${entry.content}`);
```

改成：

```javascript
    console.log(`📅 ${entry.date}`);
    console.log(`📝 標題：${entry.title}`);
    console.log(`   內容：${entry.content}`);
```

執行確認格式有改變：

```bash
node journal.js
```

**再次用 diff 確認改動**：

```bash
git diff
```

你應該看到舊的兩行被刪除（紅色），新的三行被新增（綠色）。

進行第三次 commit：

```bash
git add journal.js
git commit -m "refactor: 改善日記的顯示格式，更清楚易讀"
```

### 步驟 5：回顧完整歷史

查看所有 commits 的簡短摘要：

```bash
git log --oneline
```

你應該看到三個 commits，從最新到最舊排列。

查看包含完整時間和作者的詳細資訊：

```bash
git log
```

按 `q` 離開。

查看第一個和第二個 commit 之間的差異（用你自己的 commit hash）：

```bash
# 先用 git log --oneline 找到 hash
git log --oneline

# 比較兩個 commit，把 [舊hash] 和 [新hash] 換成你實際的 hash 前 7 碼
git diff [最舊的hash] [中間的hash]
```

### 步驟 6：推送到 GitHub

1. 在 GitHub 建立 `my-journal` 倉庫（**不要**勾選 Add README）
2. 在 Terminal 輸入：

```bash
git remote add origin https://github.com/你的帳號/my-journal.git
git branch -M main
git push -u origin main
```

3. 打開 GitHub 上的 `my-journal` 倉庫，點 `3 commits` 查看 commit 歷史，確認三個 commits 都在。

---

## 完成確認

- [ ] `node journal.js` 能正確顯示日記內容
- [ ] `git log --oneline` 顯示三個有意義的 commits
- [ ] 能用 `git diff` 查看每次修改的內容
- [ ] GitHub 上的 `my-journal` 倉庫有三個 commit 歷史

---

## 延伸挑戰

1. 在 `journal.js` 新增 `searchEntry(keyword)` 函式，能搜尋標題或內容包含關鍵字的日記
2. 新增兩筆日記，然後測試搜尋功能
3. 寫一個「刪除日記」的功能，並用好的 commit 訊息記錄這次改動
4. 把所有改動 push 到 GitHub，GitHub 上應該有超過 3 個 commits
