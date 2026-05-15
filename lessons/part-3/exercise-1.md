# Exercise-1：建立瀏覽器版記帳本 App

> **練習目標**：再次練習 HTML、CSS、DOM 操作與事件驅動程式設計，並加入非同步思維——用 `setTimeout` 模擬資料儲存，用 `localStorage` 保存資料。
>
> **對應章節**：[3-2 HTML 與 DOM] · [3-3 CSS 基礎] · [3-4 DOM 操作] · [3-5 事件驅動程式設計] · [3-6 非同步思維]

---

## 你將完成什麼

建立一個「個人記帳本 App」，功能包含：

- 新增收入或支出記錄（含金額和說明）
- 即時計算並顯示總餘額
- 刪除個別記錄
- 模擬非同步儲存操作（顯示「儲存中...」狀態）
- 用 localStorage 保存資料，重新整理後不消失

---

## 步驟

### 步驟 1：建立專案資料夾

```bash
mkdir expense-tracker
cd expense-tracker
code .
```

建立三個檔案：`index.html`、`style.css`、`app.js`

### 步驟 2：建立 HTML 結構

建立 `index.html`，**手動逐字輸入**：

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>記帳本</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <h1>💰 記帳本</h1>

      <div class="balance-card">
        <p class="balance-label">目前餘額</p>
        <p id="balance" class="balance-amount">NT$ 0</p>
      </div>

      <div class="stats-row">
        <div class="stat income">
          <span class="stat-label">收入</span>
          <span id="total-income" class="stat-value">NT$ 0</span>
        </div>
        <div class="stat expense">
          <span class="stat-label">支出</span>
          <span id="total-expense" class="stat-value">NT$ 0</span>
        </div>
      </div>

      <div class="form-section">
        <h2>新增記錄</h2>
        <div class="form-group">
          <label for="desc-input">說明</label>
          <input type="text" id="desc-input" placeholder="例如：午餐、薪水" autocomplete="off" />
        </div>
        <div class="form-group">
          <label for="amount-input">金額（正數為收入，負數為支出）</label>
          <input type="number" id="amount-input" placeholder="例如：150 或 -150" />
        </div>
        <button id="add-button">新增記錄</button>
        <span id="save-status" class="save-status"></span>
      </div>

      <div class="history-section">
        <h2>記帳記錄</h2>
        <ul id="record-list"></ul>
        <p id="empty-hint" class="empty-hint">還沒有任何記錄</p>
      </div>
    </div>

    <script src="app.js"></script>
  </body>
</html>
```

### 步驟 3：加入 CSS 樣式

建立 `style.css`，**手動逐字輸入**：

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Helvetica Neue", Arial, sans-serif;
  background-color: #f0f4f8;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

.container {
  width: 100%;
  max-width: 480px;
}

h1 {
  font-size: 1.8rem;
  color: #1a202c;
  margin-bottom: 24px;
}

h2 {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 16px;
}

.balance-card {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 16px;
  text-align: center;
}

.balance-label {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 2.2rem;
  font-weight: bold;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.stat {
  flex: 1;
  background-color: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-label {
  font-size: 0.85rem;
  color: #718096;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.income .stat-value {
  color: #38a169;
}

.expense .stat-value {
  color: #e53e3e;
}

.form-section,
.history-section {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  font-size: 0.9rem;
  color: #4a5568;
  margin-bottom: 6px;
}

input[type="text"],
input[type="number"] {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #4299e1;
}

#add-button {
  width: 100%;
  padding: 12px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 8px;
}

#add-button:hover {
  background-color: #3182ce;
}

.save-status {
  font-size: 0.85rem;
  color: #718096;
}

#record-list {
  list-style: none;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: #f7fafc;
}

.record-desc {
  flex: 1;
  font-size: 0.95rem;
  color: #2d3748;
}

.record-amount {
  font-weight: 600;
  font-size: 1rem;
  margin-right: 12px;
}

.record-amount.income {
  color: #38a169;
}

.record-amount.expense {
  color: #e53e3e;
}

.delete-record-button {
  background: none;
  border: none;
  color: #fc8181;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-record-button:hover {
  background-color: #fed7d7;
}

.empty-hint {
  color: #a0aec0;
  font-size: 0.9rem;
  text-align: center;
  padding: 16px 0;
  display: none;
}

.empty-hint.visible {
  display: block;
}
```

### 步驟 4：實作 JavaScript 邏輯

建立 `app.js`，**手動逐字輸入**：

```javascript
// 選取 DOM 元素
const descInput = document.getElementById("desc-input");
const amountInput = document.getElementById("amount-input");
const addButton = document.getElementById("add-button");
const recordList = document.getElementById("record-list");
const balanceEl = document.getElementById("balance");
const totalIncomeEl = document.getElementById("total-income");
const totalExpenseEl = document.getElementById("total-expense");
const saveStatus = document.getElementById("save-status");
const emptyHint = document.getElementById("empty-hint");

// 從 localStorage 讀取已儲存的記錄
let records = JSON.parse(localStorage.getItem("expense-records") || "[]");
let nextId = records.length > 0
  ? Math.max(...records.map(function (r) { return r.id; })) + 1
  : 1;

// 格式化金額顯示
function formatAmount(amount) {
  const prefix = amount >= 0 ? "+" : "";
  return `NT$ ${prefix}${amount.toLocaleString()}`;
}

// 更新餘額和統計數字
function updateStats() {
  const income = records
    .filter(function (r) { return r.amount > 0; })
    .reduce(function (sum, r) { return sum + r.amount; }, 0);

  const expense = records
    .filter(function (r) { return r.amount < 0; })
    .reduce(function (sum, r) { return sum + r.amount; }, 0);

  const balance = income + expense;

  balanceEl.textContent = `NT$ ${balance.toLocaleString()}`;
  balanceEl.style.color = balance < 0 ? "#fed7d7" : "white";

  totalIncomeEl.textContent = `NT$ ${income.toLocaleString()}`;
  totalExpenseEl.textContent = `NT$ ${Math.abs(expense).toLocaleString()}`;

  emptyHint.className = records.length === 0 ? "empty-hint visible" : "empty-hint";
}

// 模擬非同步儲存（用 setTimeout 模擬）
function saveToStorage() {
  saveStatus.textContent = "儲存中...";

  setTimeout(function () {
    localStorage.setItem("expense-records", JSON.stringify(records));
    saveStatus.textContent = "已儲存 ✓";

    setTimeout(function () {
      saveStatus.textContent = "";
    }, 2000);
  }, 600);
}

// 建立一筆記錄的 DOM 元素
function createRecordElement(record) {
  const li = document.createElement("li");
  li.className = "record-item";
  li.dataset.id = record.id;

  const descSpan = document.createElement("span");
  descSpan.className = "record-desc";
  descSpan.textContent = record.desc;

  const amountSpan = document.createElement("span");
  amountSpan.className = "record-amount " + (record.amount >= 0 ? "income" : "expense");
  amountSpan.textContent = formatAmount(record.amount);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-record-button";
  deleteButton.textContent = "✕";
  deleteButton.title = "刪除此記錄";

  deleteButton.addEventListener("click", function () {
    const index = records.findIndex(function (r) { return r.id === record.id; });
    records.splice(index, 1);
    li.remove();
    updateStats();
    saveToStorage();
  });

  li.appendChild(descSpan);
  li.appendChild(amountSpan);
  li.appendChild(deleteButton);
  return li;
}

// 新增記錄
function addRecord() {
  const desc = descInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (desc === "") {
    descInput.focus();
    alert("請輸入說明");
    return;
  }

  if (isNaN(amount) || amount === 0) {
    amountInput.focus();
    alert("請輸入不為 0 的金額");
    return;
  }

  const record = { id: nextId++, desc: desc, amount: amount };
  records.push(record);

  const element = createRecordElement(record);
  recordList.insertBefore(element, recordList.firstChild);

  descInput.value = "";
  amountInput.value = "";
  descInput.focus();

  updateStats();
  saveToStorage();
}

// 初始化：把 localStorage 裡的記錄顯示出來
function initialize() {
  records.forEach(function (record) {
    const element = createRecordElement(record);
    recordList.appendChild(element);
  });
  updateStats();
}

// 事件監聽
addButton.addEventListener("click", addRecord);

descInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    amountInput.focus();
  }
});

amountInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addRecord();
  }
});

// 啟動
initialize();
```

### 步驟 5：測試功能

用瀏覽器打開 `index.html`，手動測試：

1. 新增一筆「薪水」收入：說明輸入「薪水」，金額輸入 `30000`，點新增
2. 新增一筆「午餐」支出：說明輸入「午餐」，金額輸入 `-150`，點新增
3. 觀察餘額、收入、支出數字的變化
4. 新增記錄時，觀察下方出現「儲存中...」然後變成「已儲存 ✓」
5. **重新整理頁面**，確認資料沒有消失
6. 刪除一筆記錄，確認餘額也跟著更新
7. 測試：說明空白時按新增，應該彈出提示
8. 測試：金額填 0 時按新增，應該彈出提示

### 步驟 6：理解非同步的部分

找到 `saveToStorage` 函式，思考以下問題：

- 如果沒有 `setTimeout`，直接同步儲存，使用者體驗有什麼不同？
- 「儲存中...」這個文字在哪一行消失？消失的時機是什麼？
- 這個「先顯示儲存中、再改成已儲存、再清空」的模式，跟 3-6 提到的哪個概念有關？

打開 DevTools 的 Application 頁籤 → Local Storage，找到你的儲存資料，確認 JSON 格式正確。

---

## 完成確認

- [ ] 頁面在瀏覽器中正確顯示，有樣式
- [ ] 能新增收入（正數）和支出（負數）記錄
- [ ] 餘額、收入、支出統計能即時更新
- [ ] 刪除記錄後數字正確更新
- [ ] 新增記錄時出現「儲存中...」和「已儲存 ✓」的狀態提示
- [ ] 重新整理頁面後，之前的記錄還在
- [ ] DevTools Console 沒有錯誤訊息

---

## 延伸挑戰

1. 新增「清除所有記錄」按鈕，點擊前要先用 `confirm()` 詢問使用者確認
2. 讓每筆記錄顯示新增的時間（用 `new Date().toLocaleString("zh-TW")`）
3. 用 `fetch` 呼叫一個真實的 API（例如台灣央行匯率 API），顯示今日美元對台幣匯率，讓使用者知道記錄的金額大約是多少美元（這會用到 `async/await`）
