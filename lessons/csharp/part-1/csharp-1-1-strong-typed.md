# [csharp-1-1] C# 與你學過的語言：強型別、編譯式（對照 TypeScript）

> **本章目標**：透過和 TypeScript 的對照，快速建立對 C# 語法的第一印象，並理解它「強型別、編譯式、物件導向」的核心性格。

## 你會學到

- C# 的基本程式結構
- 和 TypeScript 的語法對照
- 強型別在 C# 怎麼體現
- 傳統的 class / Main 寫法（補上 [csharp-0-3] 的精簡版）

## 概念說明

### C# 的性格

C# 有三個核心性格，貫穿整門課：

```
強型別：每個變數都有明確的型別，編譯器嚴格檢查（像 TypeScript，但更嚴）
編譯式：先編譯成 IL 再執行（csharp-0-2），編譯時就抓很多錯
物件導向：以 class 和物件為核心（Part 2 主題）
```

如果你學過 **basic 課程的 TypeScript**，會發現 C# 非常親切——它們是「遠房表親」，很多概念直接互通。下面用對照表快速建立印象。

### C# vs TypeScript：語法對照

| 概念 | TypeScript | C# |
|------|-----------|-----|
| 宣告變數（明確型別）| `let name: string = "Amy"` | `string name = "Amy";` |
| 型別推斷 | `let age = 28` | `var age = 28;` |
| 印出 | `console.log(x)` | `Console.WriteLine(x);` |
| 函式/方法 | `function add(a: number, b: number): number` | `int Add(int a, int b)` |
| 註解 | `// 註解` | `// 註解`（一樣）|

看出來了嗎——**型別寫的位置不同**（TS 型別在後 `name: string`，C# 型別在前 `string name`），但精神一樣：都要講清楚型別。如果你會 TS，學 C# 主要是「習慣型別寫前面 + 學 .NET 的標準庫」。

## 程式碼範例

### 傳統的完整結構

[csharp-0-3] 用了精簡的「頂層語句」。但你會在很多 C# 程式（尤其大型專案）看到**傳統的完整結構**，理解它很重要：

```csharp
using System;                      // 引入 System 命名空間（才能用 Console）

namespace HelloApp                  // 命名空間：組織程式碼（像資料夾）
{
    class Program                   // 一切都包在 class 裡（C# 是物件導向）
    {
        static void Main(string[] args)   // Main 方法：程式進入點
        {
            Console.WriteLine("Hello, C#!");
        }
    }
}
```

逐項說明：

- `using System;`：引入「命名空間」，才能用裡面的東西（`Console` 在 `System` 裡）。類似 TS 的 `import`、rust 的 `use`。
- `namespace HelloApp { }`：**命名空間**用來組織、分類程式碼，避免命名衝突（[csharp-2] 之後常見）。
- `class Program { }`：C# **所有程式碼都要放在 class 裡**——因為它是徹底的物件導向語言（Part 2 詳講）。
- `static void Main(...)`：`Main` 是**程式進入點**（像其他語言的 main）。CPU 從這裡開始跑（呼應 cs 課程 Part 4-5）。

**精簡版 vs 完整版**：現代 C#（[csharp-0-3] 的頂層語句）讓你省略 `class`/`Main` 的樣板，編譯器自動幫你補上。兩者本質相同——精簡版適合小程式、學習；完整版你會在正式專案看到。

### 強型別的體現

C# 的強型別讓你「型別寫錯，編譯就不過」：

```csharp
int age = 28;          // age 是整數
age = "thirty";        // ❌ 編譯錯誤！不能把字串塞進 int
                       //    錯誤在「編譯時」就被抓出來，不會等到執行才爆
```

這就是強型別的價值（呼應 [課外讀物 E-6-4](../../../課外讀物/E-6-best-practices/E-6-4-typescript-best-practices.md)、cs 課程 Part 4-3 語意分析）——**很多 bug 在你按下執行之前就被擋下**。如果你來自 TypeScript，這完全是熟悉的感覺；如果來自 Python/JavaScript（弱型別），會覺得 C# 更「囉嗦但安全」。

## 小練習

1. 把 [csharp-0-3] 的「頂層語句」版 Hello World，改寫成「傳統的 class + Main」完整版，`dotnet run` 確認一樣能跑。
2. 對照表裡挑三個概念，各寫出 TypeScript 和 C# 的寫法，比較差異。
3. 故意寫 `int x = "hello";`，`dotnet build`，讀讀強型別擋下你的錯誤訊息。

<details>
<summary>參考解答</summary>

**練習 1：把頂層語句版改寫成傳統 class + Main**

頂層語句版通常只有一行 `Console.WriteLine("Hello, C#!");`。改寫成傳統完整版就是把那行「包」進 `namespace → class → Main` 三層裡：

```csharp
using System;

namespace HelloApp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello, C#!");
        }
    }
}
```

做法：把上面存成 `Program.cs`，在專案資料夾 `dotnet run`。你會看到印出 `Hello, C#!`，跟精簡版一模一樣——因為精簡版只是「編譯器自動幫你補上 class/Main 的樣板」，本質相同。

> 動手題，請自行實機驗證。驗收點：`dotnet run` 輸出 `Hello, C#!`，且沒有編譯錯誤。

**練習 2：挑三個概念比較 TS 與 C#**

以「宣告變數（明確型別）」「印出」「函式/方法」三個為例：

| 概念 | TypeScript | C# | 差異重點 |
|------|-----------|-----|---------|
| 宣告變數 | `let name: string = "Amy";` | `string name = "Amy";` | 型別位置：TS 在變數名「後面」用冒號，C# 在「前面」 |
| 印出 | `console.log(x);` | `Console.WriteLine(x);` | C# 用 `Console.WriteLine`（大寫、來自 System 命名空間） |
| 函式/方法 | `function add(a: number, b: number): number { return a + b; }` | `int Add(int a, int b) { return a + b; }` | 回傳型別：TS 寫在參數列後面，C# 寫在方法名最前面；C# 方法名慣例用 PascalCase |

一句話總結：兩者「都要講清楚型別」，精神一致，差別主要在「型別寫的位置」和「命名慣例」。

**練習 3：故意寫型別錯誤，讀編譯錯誤訊息**

```csharp
int x = "hello";   // ❌ 想把字串塞進 int
```

`dotnet build` 會失敗，錯誤訊息類似：

```
error CS0029: Cannot implicitly convert type 'string' to 'int'
```

`CS0029` 是 C# 編譯器的錯誤代碼，意思是「無法把 string 隱式轉成 int」。重點是：這個錯誤出現在**編譯階段**（build 時），程式根本沒開始跑就被擋下來了——這正是強型別的價值，很多 bug 在你按下執行之前就被抓出來。

> 動手題，請自行實機驗證。驗收點：`dotnet build` 回報 CS0029（或類似「無法轉換型別」）錯誤、build 失敗。

</details>

## 課外讀物

> 強型別的好處（TS 對照）→ [課外讀物 E-6-4：TypeScript 最佳實踐](../../../課外讀物/E-6-best-practices/E-6-4-typescript-best-practices.md)

> 程式進入點 Main、命名空間在編譯/執行的角色 → **cs 課程 Part 4**

> 下一步：C# 的變數與型別系統 → [csharp-1-2]
