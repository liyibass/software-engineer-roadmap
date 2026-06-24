# [dsa-0-2] 環境準備：用 TypeScript 練習 DSA

> **本章目標**：準備好用 TypeScript 練習資料結構與演算法的環境，並了解這門課的程式碼怎麼讀、怎麼動手跑。

## 你會學到

- 為什麼這門課用 TypeScript
- 怎麼快速跑 TypeScript 程式
- 這門課程式碼範例的風格約定
- 怎麼動手驗證你的解法

## 概念說明

### 為什麼用 TypeScript？

學資料結構與演算法，語言其實不是重點——重點是「思維」。但範例總要用一種語言寫，這門課選 **TypeScript**，原因：

```
① 和 basic 課程一致：你若學過 basic，能無縫銜接，不用再學新語言
② 強型別：型別標註讓「資料的形狀」很清楚，讀演算法更好懂
③ 普及：前端後端都用得到，學了不浪費
```

如果你完全沒碰過 TypeScript，建議搭配 **basic 課程**；但本課的範例會盡量簡單，配合 pseudo code 與註解，沒學過也能讀懂概念。

> TypeScript 基礎、型別 → **basic 課程 Part 2**、[課外讀物 E-6-4：TypeScript 最佳實踐](../../../課外讀物/E-6-best-practices/E-6-4-typescript-best-practices.md)

### 怎麼跑 TypeScript

最快的方式有幾種，挑一個順手的：

```
方式一（最簡單）：線上 Playground
   到 TypeScript 官方 Playground 網站，貼上程式碼直接跑，零安裝。
   很適合練小演算法。

方式二（本機）：裝 Node.js + 用 tsx/ts-node 直接跑 .ts 檔
   裝好 Node 後：npx tsx your-algo.ts
   （Node、npm 的概念見課外讀物 E-2）
```

> Node.js、npm 環境 → [課外讀物 E-2：npm 與套件生態](../../../課外讀物/E-2-npm/E-2-1-npm-intro.md)、**basic 課程 Part 0**

對學演算法來說，**方式一（線上 Playground）通常就夠了**——你只是要驗證一小段邏輯，不用建整個專案。

## 程式碼範例

### 這門課的程式碼風格

本課範例會遵循這些約定，讓你讀起來一致：

```typescript
// 函式會清楚標註型別，讓「輸入輸出的形狀」一目了然
function binarySearch(sortedArray: number[], target: number): number {
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);   // 取中間
    if (sortedArray[mid] === target) {
      return mid;            // 找到，回傳位置
    } else if (sortedArray[mid] < target) {
      low = mid + 1;         // 目標在右半
    } else {
      high = mid - 1;        // 目標在左半
    }
  }
  return -1;                 // 沒找到
}
```

說明：這就是 [dsa-0-1] 的「二分搜尋」的真實程式碼（Part 6 會詳講）。注意風格——清楚的型別（`number[]`、`: number`）、有意義的變數名（`low`/`high`/`mid` 而非 `a`/`b`/`c`）、關鍵步驟有註解說明「為什麼」。這呼應 [課外讀物 E-6（Clean Code）](../../../課外讀物/E-6-best-practices/E-6-2-naming.md) 的好習慣——**學演算法的同時，也養成寫乾淨程式的習慣**。

### 怎麼驗證你的解法

寫完一個演算法，怎麼確認它對？**用幾組輸入測試它**：

```typescript
// 簡單地用 console.log 驗證
console.log(binarySearch([1, 3, 5, 7, 9], 7));   // 預期 3（位置）
console.log(binarySearch([1, 3, 5, 7, 9], 4));   // 預期 -1（找不到）
console.log(binarySearch([], 1));                // 預期 -1（空陣列邊界）
```

養成「**寫完就測幾組案例**」的習慣，尤其要測「**邊界情況**」（空輸入、只有一個元素、目標在頭/尾）——這些最容易出 bug。更正式的做法是寫測試（[課外讀物 E-9](../../../課外讀物/E-9-testing/E-9-1-why-test.md)）。

## 小練習

1. 選一個跑 TypeScript 的方式（推薦先用線上 Playground），把上面的 `binarySearch` 貼進去跑跑看。
2. 自己多加幾組測試案例驗證 `binarySearch`：找陣列第一個、最後一個元素，各預期回傳什麼？
3. 觀察 `binarySearch` 的程式碼（先不用完全懂），對照 [dsa-0-1] 的「每次砍一半」描述，找出「砍一半」對應的是哪幾行。

## 課外讀物

> TypeScript 基礎與型別 → **basic 課程 Part 2**、[課外讀物 E-6-4：TypeScript 最佳實踐](../../../課外讀物/E-6-best-practices/E-6-4-typescript-best-practices.md)

> 命名與乾淨程式碼 → [課外讀物 E-6-2：命名的藝術](../../../課外讀物/E-6-best-practices/E-6-2-naming.md)

> 驗證演算法正確性靠測試 → [課外讀物 E-9：測試](../../../課外讀物/E-9-testing/E-9-1-why-test.md)

> 下一步：怎麼判斷一個解法「好不好」 → [dsa-0-3]
