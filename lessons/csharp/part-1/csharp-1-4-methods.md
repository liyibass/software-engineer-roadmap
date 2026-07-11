# [csharp-1-4] 方法（Method）：參數、回傳值、多載（overload）

> **本章目標**：學會在 C# 定義與呼叫方法，掌握參數、回傳型別、預設參數，以及 C# 的特色「方法多載」。

## 你會學到

- 方法的定義與呼叫
- 回傳型別與 `void`
- 預設參數與具名參數
- 方法多載（overload）

## 概念說明

### 方法：包起來的一段工作

**方法（method）** 就是其他語言講的「函式」——把一段做某件事的程式碼包起來、給個名字。在 C#，因為一切都在 class 裡（[csharp-1-1]），所以函式都叫「方法」（class 裡的函式）。

定義方法要講清楚：**回傳型別、名稱、參數型別**（強型別嘛）：

```
回傳型別 方法名稱(參數型別 參數名, ...)
{
    方法主體
    return 回傳值;
}
```

C# 慣例：**方法名用 PascalCase**（大駝峰，如 `CalculateTotal`），這和變數的 camelCase 不同——是 C# 的命名慣例（[csharp-9-5] 會整理）。

## 程式碼範例

### 基本方法

```csharp
// int 是回傳型別，Add 是方法名，(int a, int b) 是參數
int Add(int a, int b)
{
    return a + b;
}

// 呼叫
int sum = Add(3, 5);        // 8
Console.WriteLine(sum);
```

說明：參數一定要寫型別（`int a`）、回傳值的型別寫在最前面（`int Add`）。對照 rust（型別在後 `a: i32`）、TypeScript（`add(a: number): number`）——位置不同，精神一樣。

### void：不回傳值

如果方法「只做事、不回傳東西」，回傳型別寫 `void`：

```csharp
void Greet(string name)
{
    Console.WriteLine($"你好，{name}");    // 只印出，不回傳
}

Greet("Amy");       // 你好，Amy
```

說明：`void` 表示「沒有回傳值」。`$"...{name}..."` 是**字串插值**——把變數直接嵌進字串（像 TS 的反引號、rust 的 `{name}`），超好用。

### 預設參數與具名參數

C# 支援「參數預設值」和「呼叫時指定參數名」：

```csharp
// 預設參數：呼叫時不給就用預設值
double CalculatePrice(double basePrice, double taxRate = 0.05)
{
    return basePrice * (1 + taxRate);
}

CalculatePrice(100);              // 用預設稅率 0.05 → 105
CalculatePrice(100, 0.1);         // 指定稅率 0.1 → 110
CalculatePrice(100, taxRate: 0.2); // 具名參數，更清楚 → 120
```

說明：`taxRate = 0.05` 是預設值；`taxRate: 0.2` 是「具名參數」——呼叫時寫出參數名，讓程式更好讀（尤其參數多時）。

### 方法多載（Overload）

C# 的特色——**同一個方法名，可以有「不同參數」的多個版本**，編譯器依你傳的參數自動選對的。這叫**多載（overload）**：

```csharp
int Add(int a, int b)
{
    return a + b;
}

double Add(double a, double b)      // 同名，但參數型別不同
{
    return a + b;
}

string Add(string a, string b)      // 同名，字串版（接起來）
{
    return a + b;
}

Console.WriteLine(Add(3, 5));         // 8（用 int 版）
Console.WriteLine(Add(1.5, 2.5));     // 4（用 double 版）
Console.WriteLine(Add("Hello, ", "C#")); // Hello, C#（用 string 版）
```

說明：三個 `Add` 同名但參數不同，**編譯器依你傳的型別自動挑對的版本**。多載讓「概念上同一件事、但適用不同型別」能共用一個直覺的名字。.NET 標準庫大量用多載（例如 `Console.WriteLine` 能印各種型別，就是多載）。

> 注意別濫用多載——只在「真的是同一個操作的不同型別版本」時用。如果是「完全不同的事」，就該用不同的方法名（呼應 [課外讀物 E-6-2 命名](../../../課外讀物/E-6-best-practices/E-6-2-naming.md)）。

## 小練習

1. 寫一個方法 `Square(int n)` 回傳平方，和一個 `void` 方法 `PrintLine(string msg)` 印出訊息加驚嘆號（用字串插值 `$"..."`）。
2. 寫一個 `Greet` 方法，有預設參數 `greeting = "你好"`，呼叫時分別用預設值和具名參數各試一次。
3. 為 `Multiply` 寫兩個多載：一個吃兩個 `int`、一個吃兩個 `double`，各測試。

<details>
<summary>參考解答</summary>

**練習 1：Square 與 PrintLine**

`Square` 有回傳值（型別 `int`），`PrintLine` 只做事不回傳（型別 `void`），並用字串插值 `$"..."` 把訊息嵌進去、加上驚嘆號：

```csharp
int Square(int n)
{
    return n * n;
}

void PrintLine(string msg)
{
    Console.WriteLine($"{msg}!");   // 字串插值 + 驚嘆號
}

Console.WriteLine(Square(5));   // 25
PrintLine("Hello");             // Hello!
```

重點對照：`Square` 回傳型別寫在最前面（`int`），`PrintLine` 因為不回傳所以寫 `void`。

**練習 2：有預設參數的 Greet**

`greeting = "你好"` 就是預設值；呼叫時可以「不給」（用預設）或「用具名參數指定」：

```csharp
void Greet(string name, string greeting = "你好")
{
    Console.WriteLine($"{greeting}，{name}");
}

Greet("Amy");                      // 用預設值 → 你好，Amy
Greet("Bob", greeting: "早安");     // 具名參數 → 早安，Bob
```

具名參數（`greeting: "早安"`）的好處是「一眼看出這個引數是給哪個參數」，參數多的時候特別好讀。注意有預設值的參數要放在參數列後面。

**練習 3：Multiply 的兩個多載**

同名但參數型別不同，編譯器會依你傳的型別自動挑對的版本：

```csharp
int Multiply(int a, int b)
{
    return a * b;
}

double Multiply(double a, double b)   // 同名，參數型別不同
{
    return a * b;
}

Console.WriteLine(Multiply(3, 4));       // 12（用 int 版）
Console.WriteLine(Multiply(1.5, 2.0));   // 3（用 double 版）
```

`Multiply(3, 4)` 兩個引數都是整數，編譯器選 int 版；`Multiply(1.5, 2.0)` 是小數，選 double 版。這就是多載——「概念上同一件事（相乘），但適用不同型別」共用一個直覺的名字。

</details>

## 課外讀物

> 函式設計原則（一個方法只做一件事、命名清楚）→ [課外讀物 E-6-3：函式的設計](../../../課外讀物/E-6-best-practices/E-6-3-function-design.md)、[課外讀物 E-7-2：單一職責](../../../課外讀物/E-7-solid/E-7-2-srp.md)

> 下一步：存放多筆資料的集合 → [csharp-1-5]
