# [csharp-3-2] LINQ：用宣告式語法優雅地操作資料集合

> **本章目標**：掌握 LINQ——C# 最強大、最受喜愛的特性之一，讓你用「描述你要什麼」的方式優雅地查詢與轉換資料集合。

## 你會學到

- LINQ 是什麼、解決什麼
- 常用操作：Where、Select、OrderBy…
- 兩種語法：方法語法 vs 查詢語法
- 「延遲執行」概念

## 概念說明

### 從「怎麼做」到「要什麼」

假設要「從一堆數字中，挑出偶數、各乘以 10、排好序」。用迴圈（命令式）要寫好幾步、管中間變數。**LINQ（Language Integrated Query，語言整合查詢）** 讓你用「**描述你要什麼**」的宣告式風格一氣呵成：

```
把 numbers → 篩出偶數 → 各乘以 10 → 排序
```

這和 **rust 課程 [rust-6-4] 的迭代器**、函式式風格（cs 課程 Part 8-3）是同一個精神——資料像水流過一連串轉換。LINQ 是 C# 開發者每天都用的利器。

## 程式碼範例

### 方法語法（最常用）

LINQ 用一連串方法串接，每個方法吃一個**Lambda**（小函式，[csharp-3-3] 詳講，這裡先用）：

```csharp
using System.Linq;       // LINQ 在這個命名空間

List<int> numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8 };

var result = numbers
    .Where(n => n % 2 == 0)      // 篩出偶數：[2,4,6,8]
    .Select(n => n * 10)         // 各乘 10：[20,40,60,80]
    .OrderByDescending(n => n)   // 由大到小排序：[80,60,40,20]
    .ToList();                   // 轉成 List

Console.WriteLine(string.Join(", ", result));   // 80, 60, 40, 20
```

逐項說明：

- `.Where(n => 條件)`：篩選——保留條件為真的（對照 rust 的 `filter`）。
- `.Select(n => 轉換)`：轉換——把每個元素變成新值（對照 rust 的 `map`）。
- `.OrderBy` / `.OrderByDescending`：排序。
- `n => n * 10` 是 **Lambda**——「給一個 n，回傳 n*10」的精簡小函式。
- `.ToList()`：把結果收集成 List（對照 rust 的 `collect`）。

### 常用 LINQ 操作一覽

```csharp
var nums = new List<int> { 3, 1, 4, 1, 5, 9, 2, 6 };

nums.Where(n => n > 3);              // 篩選
nums.Select(n => n * 2);            // 轉換
nums.OrderBy(n => n);              // 排序
nums.First(n => n > 3);            // 第一個符合的：4
nums.FirstOrDefault(n => n > 100);  // 第一個符合的，沒有就回預設(0)
nums.Any(n => n > 8);             // 有沒有符合的：true
nums.All(n => n > 0);            // 是否全部符合：true
nums.Count(n => n > 3);          // 符合的個數
nums.Sum();                     // 總和
nums.Max();                     // 最大值
nums.Average();                  // 平均
```

說明：LINQ 提供大量現成操作——`First`、`Any`、`All`、`Count`、`Sum`、`Max`… 幾乎你想對集合做的事都有對應方法（呼應 rust 課程 [rust-6-4] 的迭代器方法）。⚠️ `First` 找不到會丟例外，`FirstOrDefault` 找不到回預設值——不確定有沒有時用後者較安全。

### 查詢語法（另一種寫法）

LINQ 還有一種「像 SQL」的查詢語法（同樣的事、不同寫法）：

```csharp
var result = from n in numbers
             where n % 2 == 0
             orderby n descending
             select n * 10;
```

說明：`from ... where ... select ...` 讀起來像 SQL（呼應 cs 課程 Part 7-3 / [csharp-6-4] EF Core 的 LINQ 查資料庫）。**方法語法和查詢語法可互換**——多數人用方法語法（更靈活），查詢語法在複雜查詢（含 join）時有時更清楚。

### 延遲執行

LINQ 是**延遲執行（lazy）** 的（呼應 rust [rust-6-4]）——`Where`、`Select` 本身不馬上跑，**直到你「真正用結果」（如 `ToList()`、`foreach`、`Count()`）才執行**：

```csharp
var query = numbers.Where(n => n > 3);   // 還沒執行！只是「定義了查詢」
var list = query.ToList();               // 這時才真正跑
```

延遲執行的好處是高效（不產生用不到的中間結果）、也能組合查詢。但要注意——如果在 `ToList()` 前改了原集合，結果會反映改動後的。實務上想「定案結果」就早點 `.ToList()`。

## 小練習

1. 給一個 `List<string>` 名字清單，用 LINQ 篩出「長度大於 3 的」、轉成大寫、排序，印出來。
2. 用 LINQ 對一個數字 List 算出「大於 5 的數字的總和」（提示：Where + Sum）。
3. 用 `FirstOrDefault` 找「第一個大於 100 的數」（清單裡沒有），觀察它回傳預設值而非當掉，對比 `First` 會丟例外。

<details>
<summary>參考解答</summary>

**第 1 題：篩長度 > 3、轉大寫、排序**

用一連串方法串接：`Where` 篩選 → `Select` 轉大寫 → `OrderBy` 排序 → `ToList` 收集：

```csharp
using System.Linq;

List<string> names = new List<string> { "Amy", "Robert", "Bo", "Charlie", "Ed" };

var result = names
    .Where(name => name.Length > 3)     // 長度大於 3：Robert, Charlie
    .Select(name => name.ToUpper())      // 轉大寫：ROBERT, CHARLIE
    .OrderBy(name => name)               // 字母序排序：CHARLIE, ROBERT
    .ToList();

Console.WriteLine(string.Join(", ", result));   // CHARLIE, ROBERT
```

驗收點：只保留長度大於 3 的名字、全部變大寫、且照字母順序排好。注意 `.Length > 3` 是「嚴格大於」，長度剛好 3 的（如 `Amy`）不會留下。

**第 2 題：大於 5 的數字總和**

先 `Where` 篩出大於 5 的，再 `Sum` 加總。也可以直接把條件寫進 `Sum` 的 Lambda，但拆成兩步比較清楚：

```csharp
List<int> numbers = new List<int> { 3, 7, 2, 9, 5, 11, 4 };

int total = numbers
    .Where(n => n > 5)      // 7, 9, 11
    .Sum();                 // 7 + 9 + 11 = 27

Console.WriteLine(total);   // 27
```

驗收點：印出 `27`（只加總大於 5 的 7、9、11；等於 5 的不算）。

**第 3 題：`FirstOrDefault` vs `First`**

`FirstOrDefault` 找不到符合的元素時**回傳該型別的預設值**（`int` 的預設值是 `0`），不會當掉；`First` 找不到則**丟出 `InvalidOperationException`**：

```csharp
List<int> numbers = new List<int> { 3, 7, 2, 9, 5 };

// FirstOrDefault：清單裡沒有 > 100 的，回傳 int 的預設值 0，不當掉
int safe = numbers.FirstOrDefault(n => n > 100);
Console.WriteLine(safe);        // 0

// First：找不到會丟例外，要用 try/catch 才不會讓程式崩潰
try
{
    int risky = numbers.First(n => n > 100);
    Console.WriteLine(risky);
}
catch (InvalidOperationException ex)
{
    Console.WriteLine($"First 找不到就丟例外：{ex.Message}");
}
```

驗收點：`FirstOrDefault` 印出 `0`；`First` 進入 catch 區塊印出例外訊息。結論：**不確定有沒有符合的元素時，用 `FirstOrDefault` 較安全**；只有在「保證一定有」時才用 `First`。

</details>

## 課外讀物

> LINQ = 函式式風格 → **rust 課程 [rust-6-4] 迭代器**、**cs 課程 Part 8-3：函式式典範**

> LINQ 查資料庫（EF Core）→ [csharp-6-4]；SQL 概念 → **cs 課程 Part 7-3**

> 下一步：LINQ 裡那個 `n => ...` 是什麼——委派、Lambda → [csharp-3-3]
