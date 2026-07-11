# [csharp-3-3] 委派（Delegate）、Lambda、事件

> **本章目標**：搞懂上一章 LINQ 裡那個 `n => ...` 是什麼——Lambda 與它背後的「委派」，理解「把函式當值傳遞」這個強大概念。

## 你會學到

- 委派（delegate）：把「方法」當成可傳遞的值
- Lambda：精簡的匿名函式
- `Func` 與 `Action`：內建的委派型別
- 事件（event）概念

## 概念說明

### 委派：方法也能當值傳遞

一般你傳給方法的是「資料」（數字、字串）。但 C# 還能傳「**方法本身**」——這靠**委派（delegate）**。委派就是「**一個指向方法的參考**」，讓你能把方法當成值，存進變數、當參數傳遞。

為什麼有用？因為很多時候你想「**把『要做什麼』交給呼叫者決定**」：

```
LINQ 的 Where(n => n > 3)：
   Where 知道「怎麼篩選每個元素」，但「篩選的條件」由你決定
   → 你把「條件」這個方法傳給它 → 這就是委派/Lambda 的用途
```

比喻：委派像「外包合約」——「我負責跑流程，但『某一步具體做什麼』外包給你給的方法」。

### Lambda：精簡的匿名函式

每次都正式定義一個方法再傳，太囉嗦。**Lambda** 讓你「**就地寫一個沒名字的小函式**」（呼應 rust 的閉包 [rust-6-5]）：

```csharp
n => n * 2          // Lambda：給一個 n，回傳 n*2
(a, b) => a + b     // 多參數
n => {              // 多行用大括號
    var doubled = n * 2;
    return doubled + 1;
}
```

語法是 `參數 => 運算式`。`=>` 唸作「goes to」。LINQ（[csharp-3-2]）裡的 `n => n % 2 == 0` 就是 Lambda——一個「給 n、回傳是否為偶數」的小函式，傳給 `Where` 當篩選條件。

### Func 與 Action：內建委派型別

C# 提供兩個現成的委派型別，幾乎涵蓋所有需求：

```
Func<...>：有回傳值的方法
   Func<int, int>：吃一個 int、回傳一個 int
   Func<int, int, int>：吃兩個 int、回傳 int（最後一個型別是回傳值）
Action<...>：沒有回傳值（void）的方法
   Action<string>：吃一個 string、不回傳
```

```csharp
// Func：把方法存進變數
Func<int, int> square = n => n * n;       // 一個「吃 int 回傳 int」的方法
Console.WriteLine(square(5));              // 25

Func<int, int, int> add = (a, b) => a + b;
Console.WriteLine(add(3, 4));             // 7

// Action：沒有回傳值
Action<string> greet = name => Console.WriteLine($"你好，{name}");
greet("Amy");                             // 你好，Amy
```

說明：`Func`/`Action` 讓你把方法當值用——存變數、傳參數、回傳。這是「函式是一等公民」的體現（cs 課程 Part 8-3 函式式）。

### 把方法當參數傳

委派最常見的用途——**把「要做什麼」當參數傳給方法**：

```csharp
// 一個方法，接收「對每個元素要做什麼」當參數
void ForEach(List<int> list, Action<int> action)
{
    foreach (var item in list)
    {
        action(item);        // 執行傳進來的方法
    }
}

var nums = new List<int> { 1, 2, 3 };
ForEach(nums, n => Console.WriteLine(n * 10));   // 傳一個 Lambda 進去
// 10, 20, 30
```

說明：`ForEach` 負責「跑迴圈」，但「對每個元素做什麼」由你傳的 `action` 決定——這就是委派的彈性。LINQ、事件、回呼（callback）全靠這個機制。

### 事件（event）：概念認識

**事件（event）** 是委派的一種應用——「**當某件事發生時，自動通知（呼叫）所有『訂閱者』的方法**」。這是「發布-訂閱」模式（呼應 [課外讀物 E-12-5 觀察者模式](../../../課外讀物/E-12-design-patterns/E-12-5-observer.md)）：

```
比喻：YouTube 訂閱
   頻道「發布新片」（事件發生）→ 自動通知所有「訂閱者」
事件：按鈕「被點擊」→ 自動執行所有「註冊的處理方法」
```

事件在桌面 UI、遊戲（Unity）很常用。後端開發相對少用原生 event（更常用其他機制），所以這裡建立概念即可——知道「event 是委派的應用，用於『事情發生時通知多方』」。

## 小練習

1. 用 `Func<int, int, int>` 存一個「相乘」的 Lambda，呼叫它算 6×7。
2. 用 `Action<string>` 存一個「印出大寫」的 Lambda（提示：`s.ToUpper()`），呼叫測試。
3. 寫一個方法 `Transform(List<int> list, Func<int, int> fn)`，回傳「每個元素套用 fn 後的新 List」，傳不同的 Lambda（平方、加一）測試。

<details>
<summary>參考解答</summary>

**第 1 題：`Func<int, int, int>` 存「相乘」Lambda**

`Func<int, int, int>` 表示「吃兩個 int、回傳一個 int」（最後一個型別參數是回傳值）。把相乘的 Lambda 存進變數，再像呼叫方法一樣呼叫它：

```csharp
Func<int, int, int> multiply = (a, b) => a * b;
Console.WriteLine(multiply(6, 7));      // 42
```

驗收點：印出 `42`。

**第 2 題：`Action<string>` 存「印出大寫」Lambda**

`Action<string>` 表示「吃一個 string、沒有回傳值」（印出來就結束，不回傳東西）。用 `s.ToUpper()` 轉大寫再印出：

```csharp
Action<string> printUpper = s => Console.WriteLine(s.ToUpper());
printUpper("hello");        // HELLO
printUpper("Amy");          // AMY
```

驗收點：印出全大寫的字串。注意這裡用 `Action`（不是 `Func`），因為「印出」沒有回傳值。

**第 3 題：`Transform` 方法把 `Func` 當參數傳**

`Transform` 負責「跑迴圈、收集結果」，但「每個元素要怎麼轉換」由呼叫者傳進來的 `fn` 決定——這就是委派的彈性。建一個新 List 存結果（不要改到傳進來的原 list）：

```csharp
List<int> Transform(List<int> list, Func<int, int> fn)
{
    var result = new List<int>();
    foreach (var item in list)
    {
        result.Add(fn(item));       // 對每個元素套用傳進來的 fn
    }
    return result;
}

var nums = new List<int> { 1, 2, 3, 4 };

var squared = Transform(nums, n => n * n);      // 平方
Console.WriteLine(string.Join(", ", squared));  // 1, 4, 9, 16

var plusOne = Transform(nums, n => n + 1);      // 加一
Console.WriteLine(string.Join(", ", plusOne));  // 2, 3, 4, 5
```

驗收點：同一個 `Transform` 方法，傳「平方」Lambda 得到 `1, 4, 9, 16`，傳「加一」Lambda 得到 `2, 3, 4, 5`。這其實就是 LINQ `Select` 的簡化版——把「要做什麼」外包給呼叫者。

</details>

## 課外讀物

> Lambda = 閉包概念 → **rust 課程 [rust-6-5]**；函式式典範 → **cs 課程 Part 8-3**

> 事件 = 觀察者模式 → [課外讀物 E-12-5：觀察者模式](../../../課外讀物/E-12-design-patterns/E-12-5-observer.md)

> 下一步：後端最關鍵的技能——非同步 async/await → [csharp-3-4]
