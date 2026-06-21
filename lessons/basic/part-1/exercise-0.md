# Exercise-0：設計並實作成績計算器

> **練習目標**：用「需求 → 虛擬碼 → 實作 → 測試」的流程，設計一個包含三種基本結構的成績計算程式。
>
> **對應章節**：[1-2 什麼是演算法] · [1-3 三種基本結構] · [1-4 抽象化] · [1-5 從需求到程式碼]

---

## 你將完成什麼

從零開始設計並實作一個「學生成績計算器」：

- 輸入多科成績 → 計算平均 → 輸出等第（A/B/C/D/F）
- 在實作前先寫虛擬碼，找出三種基本結構在哪裡
- 把計算邏輯抽象成獨立的函式

---

## 步驟

### 步驟 1：理解需求

這個成績計算器的規則如下：

```
需求：
- 接受一個學生的多科成績（數字陣列）
- 計算平均分數
- 根據平均分數給出等第：
    90 以上 → A
    80-89  → B
    70-79  → C
    60-69  → D
    60 以下 → F
- 如果有任何一科低於 40 分，無論平均多高，直接判 F（當掉）
```

在動手寫程式之前，先思考這個問題 30 秒：如果你要「教別人」怎麼完成這件事，你會怎麼用中文說明步驟？

### 步驟 2：寫虛擬碼

拿出紙筆（或在 VS Code 開一個 `notes.txt`），用中文描述計算步驟：

```
// 試著自己先寫，再看下面的範例

// 範例（你的可以跟這個不一樣）：
取得 成績陣列

如果 成績陣列是空的：
    輸出錯誤訊息，結束

計算 總分 = 把所有成績加起來
計算 平均 = 總分 ÷ 成績數量

如果 任何一科 < 40：
    等第 = "F"
否則 如果 平均 >= 90：
    等第 = "A"
否則 如果 平均 >= 80：
    等第 = "B"
否則 如果 平均 >= 70：
    等第 = "C"
否則 如果 平均 >= 60：
    等第 = "D"
否則：
    等第 = "F"

輸出 平均分數 和 等第
```

### 步驟 3：辨識三種基本結構

在你的虛擬碼旁邊，標記出三種基本結構各出現在哪裡：

- **循序**：哪些步驟是一步接一步執行的？
- **選擇**：哪裡有「如果...否則...」的判斷？
- **迭代**：哪裡需要重複處理每一科成績？

（可以在紙上圈起來，或在 `notes.txt` 裡標記）

### 步驟 4：建立專案

在 Terminal 輸入：

```bash
mkdir grade-calculator
cd grade-calculator
npm init -y
code .
```

### 步驟 5：實作計算邏輯

建立 `grade.js`，**手動逐字輸入**以下程式碼：

```javascript
// 判斷是否有科目不及格（低於 40 分）
function hasCriticalFail(scores) {
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] < 40) {
      return true;
    }
  }
  return false;
}

// 計算所有科目的平均分數
function calculateAverage(scores) {
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    total = total + scores[i];
  }
  return total / scores.length;
}

// 根據平均分數決定等第
function getGrade(average) {
  if (average >= 90) return "A";
  if (average >= 80) return "B";
  if (average >= 70) return "C";
  if (average >= 60) return "D";
  return "F";
}

// 主要計算函式：整合所有邏輯
function calculateResult(studentName, scores) {
  if (scores.length === 0) {
    console.log(`${studentName}：沒有成績資料`);
    return;
  }

  if (hasCriticalFail(scores)) {
    console.log(`${studentName}：有科目低於 40 分，直接判 F`);
    return;
  }

  const average = calculateAverage(scores);
  const grade = getGrade(average);

  console.log(`${studentName}：平均 ${average.toFixed(1)} 分，等第 ${grade}`);
}
```

### 步驟 6：測試各種情況

在 `grade.js` 底部繼續新增測試案例：

```javascript
// 測試案例
console.log("=== 成績計算結果 ===");
calculateResult("小明", [85, 92, 78, 90]);
calculateResult("小華", [72, 68, 75, 80]);
calculateResult("小美", [55, 48, 62, 58]);
calculateResult("阿強", [30, 85, 90, 95]);
calculateResult("阿珍", []);
```

執行程式：

```bash
node grade.js
```

預期輸出：

```
=== 成績計算結果 ===
小明：平均 86.3 分，等第 B
小華：平均 73.8 分，等第 C
小美：平均 55.8 分，等第 F
阿強：有科目低於 40 分，直接判 F
阿珍：沒有成績資料
```

### 步驟 7：確認函式職責

回顧你寫的四個函式，思考以下問題（不需要動程式，只需要想）：

- `hasCriticalFail` 做了什麼事？只做了這一件事嗎？
- `calculateAverage` 做了什麼事？它依賴 `getGrade` 嗎？
- 如果老師想改等第標準（例如 85 才給 A），你只需要改哪個函式？
- 如果老師想把「不及格門檻」從 40 改成 50，你只需要改哪個函式？

這就是**抽象化**的好處：每個函式只負責一件事，修改時不會影響其他部分。

---

## 完成確認

- [ ] 在動手寫程式之前，有先寫出虛擬碼
- [ ] 能說出三種基本結構各出現在程式的哪裡
- [ ] `node grade.js` 輸出結果符合預期
- [ ] 四個測試案例（正常、低分等第、當掉、有科目低於40、空陣列）都有正確處理

---

## 延伸挑戰

1. 新增一個 `showDetailedReport(studentName, scores)` 函式，除了平均和等第，還要列出每一科的分數和是否及格
2. 試著在不改動 `calculateResult` 的前提下，讓等第標準從 90/80/70/60 改成 85/75/65/55
3. 用 `console.log` 以外的方式呈現結果，例如把結果存到一個 `results` 陣列，最後一起顯示
