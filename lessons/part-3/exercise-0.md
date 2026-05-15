# Exercise-0：建立瀏覽器版購物清單 App

> **練習目標**：從零開始用 HTML、CSS、JavaScript 建立一個可以在瀏覽器執行的購物清單 App，實際應用 DOM 操作與事件驅動程式設計。
>
> **對應章節**：[3-1 瀏覽器怎麼運作] · [3-2 HTML 與 DOM] · [3-3 CSS 基礎] · [3-4 DOM 操作] · [3-5 事件驅動程式設計]

---

## 你將完成什麼

建立一個「購物清單 App」，功能包含：

- 在輸入框打字後按 Enter 或點按鈕，新增品項
- 點擊品項可以切換「已購買」狀態（劃掉文字）
- 點擊刪除按鈕移除品項
- 顯示「還有幾項未購買」的統計

---

## 步驟

### 步驟 1：建立專案資料夾

```bash
mkdir shopping-list
cd shopping-list
code .
```

這次不需要 npm，直接建立三個檔案：
- `index.html`
- `style.css`
- `app.js`

### 步驟 2：建立 HTML 結構

建立 `index.html`，**手動逐字輸入**：

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>購物清單</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <div class="container">
      <h1>🛒 購物清單</h1>

      <div class="input-area">
        <input
          type="text"
          id="item-input"
          placeholder="新增品項，例如：牛奶"
          autocomplete="off"
        />
        <button id="add-button">新增</button>
      </div>

      <p id="summary" class="summary">清單是空的</p>

      <ul id="shopping-list"></ul>
    </div>

    <script src="app.js"></script>
  </body>
</html>
```

用瀏覽器打開這個檔案（雙擊 `index.html`）。你應該看到一個標題和輸入框，但還沒有樣式。

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
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
}

.container {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 1.6rem;
  margin-bottom: 24px;
  color: #1a202c;
}

.input-area {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

#item-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

#item-input:focus {
  border-color: #4299e1;
}

#add-button {
  padding: 10px 20px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

#add-button:hover {
  background-color: #3182ce;
}

.summary {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 16px;
}

#shopping-list {
  list-style: none;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background-color: #f7fafc;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: #edf2f7;
}

.item-name {
  flex: 1;
  font-size: 1rem;
  color: #2d3748;
  cursor: pointer;
}

.item-name.bought {
  text-decoration: line-through;
  color: #a0aec0;
}

.delete-button {
  background: none;
  border: none;
  color: #fc8181;
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-button:hover {
  background-color: #fed7d7;
}
```

存檔後重新整理瀏覽器，現在頁面應該有樣式了。

### 步驟 4：實作 JavaScript 邏輯

建立 `app.js`，**手動逐字輸入**：

```javascript
// 選取 DOM 元素
const itemInput = document.getElementById("item-input");
const addButton = document.getElementById("add-button");
const shoppingList = document.getElementById("shopping-list");
const summary = document.getElementById("summary");

// 儲存所有品項的陣列
const items = [];
let nextId = 1;

// 更新統計文字
function updateSummary() {
  const remaining = items.filter(function (item) {
    return !item.bought;
  }).length;

  if (items.length === 0) {
    summary.textContent = "清單是空的";
  } else if (remaining === 0) {
    summary.textContent = "太棒了！所有品項都購買完畢 🎉";
  } else {
    summary.textContent = `還有 ${remaining} 項未購買（共 ${items.length} 項）`;
  }
}

// 建立一個清單項目的 DOM 元素
function createListItemElement(item) {
  const li = document.createElement("li");
  li.className = "list-item";
  li.dataset.id = item.id;

  const nameSpan = document.createElement("span");
  nameSpan.className = "item-name" + (item.bought ? " bought" : "");
  nameSpan.textContent = item.name;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.textContent = "✕";
  deleteButton.title = "刪除";

  // 點擊品項名稱 → 切換購買狀態
  nameSpan.addEventListener("click", function () {
    item.bought = !item.bought;
    nameSpan.classList.toggle("bought");
    updateSummary();
  });

  // 點擊刪除按鈕 → 移除品項
  deleteButton.addEventListener("click", function () {
    const index = items.findIndex(function (i) {
      return i.id === item.id;
    });
    items.splice(index, 1);
    li.remove();
    updateSummary();
  });

  li.appendChild(nameSpan);
  li.appendChild(deleteButton);
  return li;
}

// 新增品項到清單
function addItem() {
  const name = itemInput.value.trim();

  if (name === "") {
    itemInput.focus();
    return;
  }

  const item = { id: nextId++, name: name, bought: false };
  items.push(item);

  const listItemElement = createListItemElement(item);
  shoppingList.appendChild(listItemElement);

  itemInput.value = "";
  itemInput.focus();
  updateSummary();
}

// 事件監聽
addButton.addEventListener("click", addItem);

itemInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addItem();
  }
});

// 初始化畫面
updateSummary();
```

### 步驟 5：測試功能

重新整理瀏覽器，手動測試以下情境：

1. 在輸入框輸入「牛奶」，按 **Enter** → 應該出現在清單中
2. 輸入「麵包」，點 **新增** 按鈕 → 應該出現在清單中
3. 點擊「牛奶」這個文字 → 應該劃掉並顯示灰色
4. 觀察上方統計文字的變化
5. 把兩個品項都劃掉 → 應該顯示「太棒了！所有品項都購買完畢」
6. 點擊「✕」刪除一個品項 → 清單和統計都應該更新
7. 在輸入框什麼都不輸入，直接按新增 → 不應該新增空白品項

打開瀏覽器的 DevTools（`F12`），切換到 Console，確認沒有紅色錯誤訊息。

### 步驟 6：找到 DOM 操作的對應章節知識點

對照你的程式碼，找出以下每一行是在應用哪個章節的哪個概念：

```javascript
// 這行用了哪個 DOM 選取方法？對應 3-4 的哪個部分？
const itemInput = document.getElementById("item-input");

// 這裡用了什麼方法建立新元素？對應 3-4 的哪個部分？
const li = document.createElement("li");

// 這裡是什麼類型的事件？對應 3-5 的哪個部分？
nameSpan.addEventListener("click", function () { ... });

// 這行觸發了什麼 DOM 操作？對應 3-4 的哪個部分？
li.remove();
```

---

## 完成確認

- [ ] `index.html` 在瀏覽器中顯示正常，有樣式
- [ ] 按 Enter 和點按鈕都能新增品項
- [ ] 點擊品項文字能切換購買狀態（劃線/取消劃線）
- [ ] 點擊 ✕ 能刪除品項
- [ ] 統計文字（還有幾項未購買）能正確更新
- [ ] 空白輸入不會新增品項
- [ ] DevTools Console 沒有錯誤訊息

---

## 延伸挑戰

1. 新增「清空所有已購買品項」的按鈕
2. 讓使用者可以在清單中雙擊品項名稱來編輯它（提示：用 `contenteditable` 或切換成 `<input>` 元素）
3. 用 `localStorage.setItem` 把清單資料存到瀏覽器，讓頁面重新整理後資料不消失（提示：用 `JSON.stringify` 儲存，`JSON.parse` 讀取）
