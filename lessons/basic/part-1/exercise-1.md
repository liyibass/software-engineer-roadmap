# Exercise-1：設計並實作電影票價計算器

> **練習目標**：再次練習「需求 → 虛擬碼 → 實作 → 測試」的完整流程，鞏固三種基本結構與函式抽象化的概念。
>
> **對應章節**：[1-2 什麼是演算法] · [1-3 三種基本結構] · [1-4 抽象化] · [1-5 從需求到程式碼]

---

## 你將完成什麼

設計並實作一個「電影票價計算器」：

- 根據觀眾的年齡和票種計算票價
- 套用各種折扣和加成規則
- 計算一群人購票的總金額

---

## 步驟

### 步驟 1：理解需求

票價規則如下：

```
基本票價：
  12 歲以下（兒童）→ 200 元
  13-64 歲（成人） → 350 元
  65 歲以上（長者）→ 250 元

特殊加成：
  週末（星期六、日）→ 所有票價再加 50 元

折扣規則：
  同行 5 人以上 → 全體打 9 折（折扣在加成後計算）
  學生證優惠（成人才能用）→ 票價打 85 折（不與人數折扣疊加，取較優惠者）
```

閱讀完後，思考：如果你要教同學怎麼用這個規則算票價，你會怎麼說明？

### 步驟 2：寫虛擬碼

在紙上或 `notes.txt` 寫出你的虛擬碼，嘗試解決這個問題：

```
// 先自己試試看，再看下面的方向提示

// 方向提示（不是唯一解法）：

計算單人票價的步驟：
  取得 年齡
  如果 年齡 <= 12：
      基本票價 = 200
  否則 如果 年齡 <= 64：
      基本票價 = 350
  否則：
      基本票價 = 250

  如果 是週末：
      基本票價 = 基本票價 + 50

  回傳 基本票價

計算一群人總票價的步驟：
  初始化 票價清單 = []
  對每一個人：
      計算該人的單人票價
      加入票價清單
  計算 小計 = 票價清單的總和

  如果 人數 >= 5：
      套用 9 折
  如果 有學生證 且 人數 < 5：
      套用 85 折

  回傳 最終總額
```

### 步驟 3：辨識三種基本結構

在你的虛擬碼裡標記：
- **循序**：計算步驟的哪些部分是一步一步執行？
- **選擇**：年齡判斷、週末判斷、折扣判斷在哪裡？
- **迭代**：計算每個人的票價用到什麼結構？

### 步驟 4：建立專案

```bash
mkdir ticket-calculator
cd ticket-calculator
npm init -y
code .
```

### 步驟 5：實作票價邏輯

建立 `ticket.js`，**手動逐字輸入**：

```javascript
// 根據年齡取得基本票價
function getBasePrice(age) {
  if (age <= 12) return 200;
  if (age <= 64) return 350;
  return 250;
}

// 計算單一觀眾的票價（套用週末加成）
function calculateSingleTicket(age, isWeekend) {
  const basePrice = getBasePrice(age);
  const weekendSurcharge = isWeekend ? 50 : 0;
  return basePrice + weekendSurcharge;
}

// 計算最優惠的折扣率
function getBestDiscount(ticketCount, hasStudentId) {
  const groupDiscount = ticketCount >= 5 ? 0.9 : 1;
  const studentDiscount = hasStudentId ? 0.85 : 1;

  // 取較優惠的折扣（數字較小 = 折扣較多）
  return Math.min(groupDiscount, studentDiscount);
}

// 計算一群人的總票價
function calculateTotal(ages, isWeekend, hasStudentId) {
  if (ages.length === 0) {
    console.log("錯誤：沒有購票人資料");
    return 0;
  }

  let subtotal = 0;
  for (let i = 0; i < ages.length; i++) {
    subtotal = subtotal + calculateSingleTicket(ages[i], isWeekend);
  }

  const discount = getBestDiscount(ages.length, hasStudentId);
  const total = subtotal * discount;

  return Math.round(total);
}

// 顯示購票結果
function showTicketResult(label, ages, isWeekend, hasStudentId) {
  const total = calculateTotal(ages, isWeekend, hasStudentId);
  const dayType = isWeekend ? "週末" : "平日";
  const studentNote = hasStudentId ? "（持學生證）" : "";
  console.log(`${label}${studentNote}｜${dayType}｜${ages.length} 人 → 總票價：${total} 元`);
}
```

### 步驟 6：測試各種情況

在 `ticket.js` 底部新增測試案例：

```javascript
console.log("=== 購票結果 ===");

// 一般家庭（2 大 1 小），平日
showTicketResult("王家三口", [35, 38, 8], false, false);

// 學生獨自看（成人持學生證），週末
showTicketResult("學生小陳", [20], true, true);

// 五人團體，平日
showTicketResult("五人團", [25, 30, 22, 28, 31], false, false);

// 五人含學生證，週末（人數折扣 vs 學生折扣，哪個好？）
showTicketResult("五人週末團", [20, 22, 25, 28, 30], true, true);

// 祖父母帶孫子，週末
showTicketResult("祖孫出遊", [70, 72, 10], true, false);
```

執行程式：

```bash
node ticket.js
```

手動驗算「王家三口，平日」這個案例：
- 爸爸（35歲）：350 元，平日不加 → 350
- 媽媽（38歲）：350 元，平日不加 → 350
- 小孩（8歲）：200 元，平日不加 → 200
- 小計：900 元
- 人數未達 5 人，無學生證 → 不打折
- 總計：**900 元**

確認你的程式輸出是否和手算一致。

### 步驟 7：思考函式職責

回顧你寫的函式：
- 如果票價結構改了（例如兒童票從 200 漲到 250），只需改哪個函式？
- 如果折扣規則改了（例如 3 人以上就打折），只需改哪個函式？
- 如果新增「假日特別場加收 100 元」的規則，要改哪個函式？

每個問題都應該只涉及**一個函式**——這就是好設計。

---

## 完成確認

- [ ] 動手寫程式前，有先完成虛擬碼
- [ ] 能辨識程式中三種基本結構各在哪裡
- [ ] `node ticket.js` 能正確輸出五個測試案例
- [ ] 手動驗算「王家三口」結果與程式一致
- [ ] 能說出修改不同規則時，各自只需要改哪個函式

---

## 延伸挑戰

1. 新增「會員卡」折扣（打 8 折），並讓它能和其他折扣比較，取最優惠的那個
2. 新增一個功能：列出每一位觀眾的個別票價（顯示年齡、類型、原價、折後價）
3. 如果某個測試案例輸出不符合預期，你能找出哪個函式有問題嗎？試著用 `console.log` 在各函式裡印出中間結果來除錯
