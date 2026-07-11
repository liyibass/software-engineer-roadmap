# [csharp-3-6] 現代 C#：Nullable 參考型別、`record`、pattern matching

> **本章目標**：認識幾個現代 C# 的重要特性，它們讓程式更安全、更簡潔——你會在現代 .NET 專案大量看到。

## 你會學到

- 可空參考型別（nullable reference types）：對抗 null 災難
- `record`：簡潔的不可變資料型別
- pattern matching（模式比對）的進化
- 這些特性怎麼讓現代 C# 更好

## 概念說明

C# 持續演進，加入很多讓程式「更安全、更簡潔」的特性。這章挑三個你會常遇到的重點。

### ① 可空參考型別：對抗 null

`null`（空參考）是 bug 大宗——你以為有值，結果是 null，一存取就 `NullReferenceException`（呼應 rust 課程 [rust-3-4] 的「十億美元錯誤」、cs 課程的概念）。現代 C# 用**可空參考型別（nullable reference types）** 對抗它：

```csharp
string name = "Amy";       // 「不可為 null」——編譯器保證
string? nickname = null;   // 加 ? 才「可以為 null」

Console.WriteLine(name.Length);       // OK，name 保證有值
Console.WriteLine(nickname.Length);   // ⚠️ 編譯器警告！nickname 可能是 null
```

說明：開啟這個功能後（現代專案預設開），**型別預設「不可為 null」**，要可為 null 得明確加 `?`。編譯器會在你「可能存取到 null」時警告——把「忘記檢查 null」的錯誤提早抓出來（呼應 rust 的 `Option`，但 C# 是用 `?` 標註 + 編譯器警告的方式）。處理可空值的安全寫法：

```csharp
string? input = Console.ReadLine();
// 安全存取：?. 如果是 null 就回 null 而不爆炸
int? length = input?.Length;
// 或給預設值：?? 「左邊是 null 就用右邊」
string safe = input ?? "（預設值）";
```

`?.`（null 條件運算子）和 `??`（null 合併運算子）是處理可空值的利器。

### ② record：簡潔的不可變資料型別

很多時候你只是要一個「**單純裝資料的型別**」（像 DTO、值物件）。用一般 class 要寫一堆樣板（屬性、建構子、相等比較…）。**`record`** 讓這變成一行：

```csharp
// 一行定義一個不可變的資料型別！
record Person(string Name, int Age);

var amy = new Person("Amy", 28);
Console.WriteLine(amy.Name);        // Amy
Console.WriteLine(amy);             // Person { Name = Amy, Age = 28 }（自動好看的輸出）

// record 自動有「以值比較相等」
var amy2 = new Person("Amy", 28);
Console.WriteLine(amy == amy2);     // true！（內容相同就相等，不像 class 比參考）

// record 預設不可變，要「改」是產生新的（with）
var olderAmy = amy with { Age = 29 };   // 複製一份、只改 Age
```

說明：`record` 一行就有了——屬性、建構子、好看的 ToString、**以值比較相等**（兩個內容相同的 record 就相等，對比一般 class 是比參考 [csharp-1-2]）、`with` 複製修改。它**預設不可變**（呼應 rust 的不可變傾向、函式式風格）。`record` 超適合做 [csharp-5-4] 的 DTO、領域裡的「值物件」。

### ③ Pattern Matching：強大的模式比對

現代 C# 的**模式比對**讓「依資料的樣子分支」更優雅（呼應 rust 課程 [rust-3-5] match）：

```csharp
// switch 表達式 + 模式（csharp-1-3 看過基礎，這裡更進階）
string Describe(object obj) => obj switch
{
    int n when n > 0 => $"正整數 {n}",       // when 加條件
    int n => $"非正整數 {n}",
    string s => $"字串「{s}」",               // 依「型別」比對
    Person { Age: > 18 } => "成年人",         // 依「屬性」比對！
    null => "空值",
    _ => "其他"
};

Console.WriteLine(Describe(5));                    // 正整數 5
Console.WriteLine(Describe("hi"));                // 字串「hi」
Console.WriteLine(Describe(new Person("Bob", 20))); // 成年人
```

說明：模式比對能依「型別」（`int n`）、「條件」（`when n > 0`）、「屬性」（`Person { Age: > 18 }`）來分支——非常強大且好讀。它讓很多原本要寫一堆 `if-else + 轉型` 的程式碼變簡潔。

### 這些特性讓現代 C# 更好

```
可空參考型別 → 更安全（編譯期抓 null 問題）
record → 更簡潔（資料型別一行搞定）+ 鼓勵不可變（更好推理、少 bug）
pattern matching → 更優雅（依樣貌分支）
→ 現代 C#（含這些特性）兼具「強型別的安全」和「現代語言的簡潔」。
  你在新專案會大量看到它們，認得就不陌生。
```

## 小練習

1. 用 `record` 定義一個 `Product(string Name, decimal Price)`，建立兩個內容相同的，用 `==` 確認它們相等。用 `with` 產生一個「只改價格」的新 product。
2. 寫一段處理 `string?`（可能 null）的程式，用 `?.` 和 `??` 安全地取得它的長度或預設值。
3. 用 switch 表達式 + 模式比對，寫一個函式依輸入（int / string / null）回傳不同描述。

<details>
<summary>參考解答</summary>

**練習 1：`record`、`==`、`with`**

`record` 一行就有了「以值比較相等」和 `with` 複製修改，這題正好把兩個特性都用上：

```csharp
record Product(string Name, decimal Price);

var a = new Product("咖啡", 120m);        // decimal 字面值加 m
var b = new Product("咖啡", 120m);        // 內容和 a 完全一樣

Console.WriteLine(a == b);                // True！record 比的是「內容」不是「參考」

// with：複製一份、只改 Price，原本的 a 不受影響（record 預設不可變）
var discounted = a with { Price = 99m };
Console.WriteLine(discounted);            // Product { Name = 咖啡, Price = 99 }
Console.WriteLine(a);                     // Product { Name = 咖啡, Price = 120 }（沒被改到）
```

重點推導：一般 `class` 的 `==` 比的是「兩個變數是不是指向同一個物件」（參考相等），所以 `a == b` 會是 `false`；`record` 幫你改成「內容相同就相等」，這正是資料型別想要的行為。`with` 不是「就地修改」，而是「複製後改指定欄位」，所以原本的 `a` 一定不會被動到。

**練習 2：用 `?.` 和 `??` 安全處理 `string?`**

`Console.ReadLine()` 的回傳型別本來就是 `string?`（使用者可能沒輸入 / 串流結束時是 null），拿它當例子最自然：

```csharp
string? input = Console.ReadLine();

// ?. 如果 input 是 null，整條就短路成 null，不會丟 NullReferenceException
int? length = input?.Length;

// ?? 「左邊是 null 就用右邊」，把可能 null 的值收斂成一定有值
string safe = input ?? "（沒有輸入）";
int lengthOrZero = input?.Length ?? 0;    // 先 ?. 再 ?? 給預設值，很常見的組合

Console.WriteLine($"長度：{lengthOrZero}，內容：{safe}");
```

重點：`?.` 負責「存取時遇到 null 就安全短路」，`??` 負責「把 null 換成預設值」，兩個常常一起用（`input?.Length ?? 0`）。這樣編譯器就不會再警告你「可能存取到 null」。

**練習 3：switch 表達式 + 模式比對**

依「型別」和「null」分支，正是模式比對最擅長的：

```csharp
string Describe(object? value) => value switch
{
    int n when n > 0 => $"正整數 {n}",   // 型別比對 + when 條件
    int n            => $"非正整數 {n}",
    string s         => $"字串「{s}」",
    null             => "空值",
    _                => "其他型別"        // 一定要有 _ 兜底，否則可能漏掉分支
};

Console.WriteLine(Describe(5));      // 正整數 5
Console.WriteLine(Describe(-1));     // 非正整數 -1
Console.WriteLine(Describe("hi"));   // 字串「hi」
Console.WriteLine(Describe(null));   // 空值
```

注意參數寫成 `object?` 才能接受 `null`；分支順序有意義（`int n when n > 0` 要放在無條件的 `int n` 前面，否則永遠比不到），最後用 `_` 兜底避免遺漏。

</details>

## 課外讀物

> 對抗 null（Option 概念）、不可變、模式比對 → **rust 課程 [rust-3-4] Option、[rust-1-1] 不可變、[rust-3-5] match**

> record 的不可變呼應函式式 → **cs 課程 Part 8-3**

> 本 Part 完成！語言基礎打好了，下一步進入後端實戰：ASP.NET Core → [csharp-4-1]
