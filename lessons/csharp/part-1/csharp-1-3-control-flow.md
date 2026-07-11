# [csharp-1-3] 流程控制與運算子：if / switch / 迴圈

> **本章目標**：學會 C# 控制程式走向的工具——條件判斷與迴圈，並認識 C# 較現代的 switch 寫法。

## 你會學到

- `if / else if / else` 與比較/邏輯運算子
- `switch` 與現代的 switch 表達式
- 三種迴圈：`for` / `while` / `foreach`
- `foreach` 為什麼最常用、最安全

## 概念說明

控制流程的概念你在 cs 課程、其他語言都見過（做選擇 + 重複做），C# 的寫法和 C 家族語言（含 TypeScript）幾乎一樣。這章重點在「C# 的具體語法」和「較現代的特性」。

## 程式碼範例

### if / else 與運算子

```csharp
int score = 72;

if (score >= 90)
{
    Console.WriteLine("優等");
}
else if (score >= 60)
{
    Console.WriteLine("及格");
}
else
{
    Console.WriteLine("不及格");
}
```

說明：條件要用括號 `(...)`，區塊用大括號 `{ }`。常用運算子：

```
比較：==（等於）、!=（不等於）、>、<、>=、<=
邏輯：&&（且，呼應 cs 課程 Part 2 AND）、||（或，OR）、!（非，NOT）
```

例如 `if (isMember && (hasCoupon || isBirthday))`——這些邏輯運算正是 cs 課程 Part 2 邏輯閘的程式版。

### switch：多分支

當要根據「一個值的多種情況」分支，`switch` 比一長串 `else if` 清楚：

```csharp
// 傳統 switch
string day = "Mon";
switch (day)
{
    case "Mon":
    case "Tue":
        Console.WriteLine("工作日");
        break;              // 別忘了 break！
    case "Sat":
    case "Sun":
        Console.WriteLine("週末");
        break;
    default:
        Console.WriteLine("其他");
        break;
}
```

現代 C# 有更簡潔的 **switch 表達式**（直接算出一個值）：

```csharp
string type = day switch
{
    "Mon" or "Tue" => "工作日",
    "Sat" or "Sun" => "週末",
    _ => "其他",                 // _ 是「其餘」（像 rust 的 _）
};
Console.WriteLine(type);
```

說明：switch 表達式更精簡（不用 break、直接回傳值），是現代 C# 推薦寫法。`_` 代表「其他所有情況」（呼應 rust 課程 [rust-3-5] match）。

### 三種迴圈

```csharp
// for：跑固定次數
for (int i = 0; i < 5; i++)
{
    Console.WriteLine(i);       // 0,1,2,3,4
}

// while：條件成立就繼續
int n = 3;
while (n > 0)
{
    Console.WriteLine(n);
    n--;
}

// foreach：走訪集合每個元素（最常用、最安全）
string[] fruits = { "蘋果", "香蕉", "橘子" };
foreach (var fruit in fruits)
{
    Console.WriteLine(fruit);
}
```

說明：`for` 跑固定次數、`while` 看條件、**`foreach` 走訪集合的每個元素**。和 cs 課程 Part 5、rust [rust-1-5] 一樣——**`foreach` 最常用也最安全**，因為它直接走訪元素、不用手動管索引，避免「索引算錯而越界」的經典 bug。處理 `List`、陣列、`Dictionary`（[csharp-1-5]）時，`foreach` 是首選。

## 小練習

1. 用 `for` 印出 1 到 10，並對每個數用 `if` 判斷奇偶、印出「X 是奇數/偶數」。
2. 用「switch 表達式」寫一個函式，輸入月份數字（1-12），回傳季節（春夏秋冬）。
3. 用 `foreach` 走訪一個水果陣列，算出總共有幾個字（每個水果名長度相加）。

<details>
<summary>參考解答</summary>

**練習 1：for 印 1 到 10，判斷奇偶**

判斷奇偶的關鍵是「除以 2 的餘數」——用 `%`（取餘數運算子）。餘數為 0 就是偶數，否則是奇數：

```csharp
for (int i = 1; i <= 10; i++)
{
    if (i % 2 == 0)
    {
        Console.WriteLine($"{i} 是偶數");
    }
    else
    {
        Console.WriteLine($"{i} 是奇數");
    }
}
```

注意迴圈條件用 `i <= 10`（含 10），從 `i = 1` 開始。輸出會是「1 是奇數、2 是偶數 …… 10 是偶數」。

**練習 2：用 switch 表達式，月份數字回傳季節**

這裡示範用 switch 表達式的「模式合併」（`or`）把多個月份歸到同一季。以北半球常見的分法（3-5 春、6-8 夏、9-11 秋、12/1/2 冬）：

```csharp
string GetSeason(int month)
{
    return month switch
    {
        3 or 4 or 5   => "春",
        6 or 7 or 8   => "夏",
        9 or 10 or 11 => "秋",
        12 or 1 or 2  => "冬",
        _ => "無效的月份",   // 1-12 以外
    };
}

Console.WriteLine(GetSeason(4));    // 春
Console.WriteLine(GetSeason(8));    // 夏
Console.WriteLine(GetSeason(13));   // 無效的月份
```

`_` 是「其餘所有情況」，用來接住不在 1-12 範圍內的輸入，避免漏掉狀況。季節怎麼分是開放的（也有人把 12-2 當冬），只要邏輯一致、有處理無效輸入即可。

**練習 3：foreach 算水果名總字數**

用一個累加變數 `totalLength`，每次迴圈把當前水果名的長度（`.Length`）加上去：

```csharp
string[] fruits = { "蘋果", "香蕉", "橘子" };
int totalLength = 0;

foreach (var fruit in fruits)
{
    totalLength += fruit.Length;   // 每個名字的字數累加
}

Console.WriteLine($"總共 {totalLength} 個字");   // 總共 6 個字
```

三個水果各 2 個字，相加是 6。這裡用 `foreach` 最自然——我們只想「一個個走訪元素」，不需要索引，也就不會有算錯索引而越界的風險。

</details>

## 課外讀物

> 邏輯運算（&&、||、!）的底層 → **cs 課程 Part 2-1：邏輯閘**

> switch 的模式比對精神（對照 match）→ **rust 課程 [rust-3-5]**

> 巢狀太多層的條件是反模式 → [課外讀物 E-6-6：程式碼異味與反模式](../../../課外讀物/E-6-best-practices/E-6-6-anti-patterns.md)

> 下一步：把程式碼組織成方法 → [csharp-1-4]
