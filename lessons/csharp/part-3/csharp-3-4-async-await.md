# [csharp-3-4] 非同步程式設計：`async` / `await`（後端的關鍵技能）

> **本章目標**：掌握 async/await——後端開發最關鍵的技能之一，理解它怎麼讓伺服器「等待時不浪費資源」，能同時服務大量請求。

## 你會學到

- 為什麼後端需要非同步
- `async` / `await` 語法
- `Task` 與 `Task<T>` 是什麼
- 非同步的使用原則

## 概念說明

### 後端為什麼需要非同步

後端伺服器大部分時間在「**等**」——等資料庫回應、等外部 API、等檔案讀取。這些等待中，如果執行緒「**傻等**」（阻塞），就浪費了——它本可以去服務其他請求。

回憶 **cs 課程 Part 5-7（中斷）、rust 課程 [rust-8-5]（async）**——非同步的精神是「**遇到要等的事，先去做別的，等好了再回來**」。對伺服器這代表：

```
傻等（阻塞）：100 個請求都在等資料庫 → 要 100 個執行緒站著乾等 → 浪費
非同步：一個執行緒，在「等資料庫」的空檔去服務別的請求
   → 少量執行緒就能同時招呼大量請求 → 高並發、省資源
```

這就是為什麼 **ASP.NET Core 的資料庫存取、外部呼叫幾乎都用非同步**——它讓伺服器能高效地扛大量同時連線。**async 是現代後端的必備技能**。

### async / await 語法

C# 的 async/await 讓非同步寫起來「**像同步一樣直覺**」：

```csharp
// async 標記「這是非同步方法」；回傳 Task<T>
async Task<string> FetchDataAsync()
{
    // await：等待一個非同步操作完成，但「等待時讓出執行緒去做別的」
    string data = await SomeSlowOperationAsync();
    return data;
}
```

說明：

- **`async`**：標記方法是非同步的。
- **`await`**：放在非同步操作前，意思是「等它完成，但**等待期間讓出執行緒**（不傻等）」。這是關鍵——`await` 的「等」不浪費資源。
- 慣例：非同步方法名以 **`Async`** 結尾（如 `FetchDataAsync`），讓人一看就知道要 await。

### Task 與 Task&lt;T&gt;

非同步方法回傳的是 **`Task`**（呼應 rust 的 Future、JS 的 Promise）——代表「**一個還在進行、未來會完成的工作**」：

```
Task：非同步操作，「沒有回傳值」（像 async void 的正確版）
Task<T>：非同步操作，「未來會回傳一個 T」
   例：Task<string> = 「未來會給你一個 string」的非同步工作
```

```mermaid
graph LR
    CALL["呼叫 FetchDataAsync()"] --> TASK["立刻回傳一個 Task<string><br/>(工作還沒做完)"]
    TASK -->|"await 它"| RESULT["等它完成，取出 string 結果<br/>(等待期間執行緒去做別的)"]
```

這張圖在說：呼叫非同步方法**立刻回傳一個 `Task`**（代表進行中的工作），你 `await` 它來取得最終結果，而等待期間執行緒不被佔住。

## 程式碼範例

### 完整例子

```csharp
using System.Threading.Tasks;

// 模擬一個慢操作（如查資料庫）
async Task<string> GetUserNameAsync(int id)
{
    await Task.Delay(1000);        // 模擬等 1 秒（真實情況是等資料庫/網路）
    return $"使用者{id}";
}

// 呼叫非同步方法：用 await
async Task RunAsync()
{
    Console.WriteLine("開始查詢...");
    string name = await GetUserNameAsync(5);    // 等它，但不傻等
    Console.WriteLine($"查到：{name}");
}

await RunAsync();
```

說明：`Task.Delay(1000)` 模擬「要等的操作」。`await GetUserNameAsync(5)` 等它完成、取出結果，但**等待的那 1 秒，執行緒可以去做別的事**（在真實伺服器就是去服務別的請求）。注意 async 會「傳染」——呼叫 async 方法的方法通常自己也要是 async（用 await）。

### 一個常見的真實場景

```csharp
// ASP.NET Core 裡，查資料庫幾乎都長這樣（csharp-6 會大量用）
async Task<User> GetUserAsync(int id)
{
    // await 資料庫查詢——等待時執行緒去服務其他請求
    var user = await _dbContext.Users.FindAsync(id);
    return user;
}
```

說明：這是你之後在 Part 6（EF Core）會一直寫的模式——**資料庫操作用 await**。`FindAsync` 是非同步版的查詢。整個 ASP.NET Core 的請求處理鏈都是非同步的，所以伺服器能用少量執行緒扛高並發。

### 使用原則

```
✓ I/O 操作（資料庫、網路、檔案）→ 用非同步（這是 async 的主場）
✓ 非同步方法名加 Async 後綴、回傳 Task / Task<T>
✓ 呼叫 async 方法要 await（別忘了，否則工作沒等完）
✗ 純 CPU 密集計算（不是在「等」）→ async 沒幫助（那要用多執行緒，rust 課程 [rust-8-3]）
⚠️ 避免 async void（除了事件處理），用 async Task——才能正確處理錯誤與等待
```

## 小練習

1. 寫一個 `async Task<int> AddAsync(int a, int b)`，裡面 `await Task.Delay(500)` 後回傳 a+b，用 await 呼叫它。
2. 寫兩個非同步方法，用 await 依序呼叫，觀察「開始 → 等 → 完成」的流程。
3. 思考題：為什麼「查資料庫」適合用 async，但「計算一百萬個數字的總和」不適合？（提示：一個在「等」、一個在「算」，呼應 rust 課程 [rust-8-5]。）

<details>
<summary>參考解答</summary>

**第 1 題：`AddAsync` 非同步相加**

方法標 `async`、回傳 `Task<int>`（未來會回傳一個 int），裡面 `await Task.Delay(500)` 模擬「要等的事」，等完再回傳 `a + b`。呼叫時用 `await` 取出結果：

```csharp
using System.Threading.Tasks;

async Task<int> AddAsync(int a, int b)
{
    await Task.Delay(500);      // 模擬 0.5 秒的等待（等待期間讓出執行緒）
    return a + b;
}

// 呼叫端自己也要是 async，才能 await
int sum = await AddAsync(3, 4);
Console.WriteLine(sum);         // 7
```

驗收點：約 0.5 秒後印出 `7`。注意回傳型別是 `Task<int>` 而不是 `int`——`await` 會幫你把 `Task<int>` 裡的 `int` 取出來。

**第 2 題：依序 await 兩個非同步方法**

用兩個 `await` 依序呼叫，第二個會等第一個完成後才開始。透過 `Console.WriteLine` 就能觀察「開始 → 等 → 完成」的順序：

```csharp
async Task<string> StepOneAsync()
{
    Console.WriteLine("步驟一：開始");
    await Task.Delay(1000);             // 等 1 秒
    Console.WriteLine("步驟一：完成");
    return "結果一";
}

async Task<string> StepTwoAsync()
{
    Console.WriteLine("步驟二：開始");
    await Task.Delay(1000);
    Console.WriteLine("步驟二：完成");
    return "結果二";
}

async Task RunAsync()
{
    var r1 = await StepOneAsync();      // 先等步驟一整個做完
    var r2 = await StepTwoAsync();      // 再開始步驟二
    Console.WriteLine($"全部完成：{r1}, {r2}");
}

await RunAsync();
```

驗收點：輸出順序是「步驟一：開始 → 步驟一：完成 → 步驟二：開始 → 步驟二：完成 → 全部完成」。因為是**依序 await**，步驟二一定在步驟一完成後才開始。（延伸想一想：若改用 `Task.WhenAll` 同時啟動兩個，就能並行、總時間接近 1 秒而非 2 秒——這需要自己實機跑跑看時間差。）

**第 3 題（思考題）：為什麼查資料庫適合 async、算總和不適合？**

關鍵在於這件事到底是在「**等**」還是在「**算**」：

- **查資料庫是 I/O 密集（在「等」）**：發出查詢後，你的程式其實沒在做任何運算，只是在等資料庫那頭處理完、把資料透過網路送回來。這段等待時間裡，`await` 能把執行緒**讓出去服務別的請求**——所以 async 大有幫助，這正是它的主場。

- **算一百萬個數字總和是 CPU 密集（在「算」）**：CPU 從頭到尾都在忙著做加法運算，沒有任何「空檔」可以讓出去。把它包成 async 並不會讓運算變快，也沒有可以讓出的等待時間——`async` 幫不上忙。要加速這種工作得靠**多執行緒／平行運算**（把工作切給多顆 CPU 核心一起算，rust 課程 [rust-8-3]），那是另一回事。

一句話：**async 解決的是「等待浪費」，不是「運算太慢」**。在「等」的用 async，在「算」的用多執行緒。

</details>

## 課外讀物

> 非同步的底層原理（IO 密集 vs CPU 密集）→ **rust 課程 [rust-8-5]**、**cs 課程 Part 5-7（中斷）**

> 非同步是高並發後端的關鍵 → [csharp-4-1] ASP.NET Core、**sre 課程**

> 下一步：錯誤怎麼處理——例外處理 → [csharp-3-5]
