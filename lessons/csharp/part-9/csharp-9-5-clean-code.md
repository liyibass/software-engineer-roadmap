# [csharp-9-5] C# 慣例與 Clean Code

> **本章目標**：整理 C# 的命名慣例與 Clean Code 原則，讓你寫出「別人（和未來的你）一看就懂、好維護」的 C# 程式碼。

## 你會學到

- C# 的命名慣例
- C# 特有的 Clean Code 實踐
- 善用現代 C# 寫出簡潔程式碼
- 工具：格式化與分析器

## 概念說明

### Clean Code：寫給人看的程式碼

程式碼給電腦執行，但**更多時間是給人讀的**（呼應 [課外讀物 E-6](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)）。寫出乾淨、好懂的程式碼，是專業工程師的基本功。前面各章已散落很多 Clean Code 實踐，這章整理 **C# 特有的部分**。

### C# 命名慣例

C# 有明確的命名慣例，遵守它讓你的程式碼「看起來就像 C#」（呼應 [課外讀物 E-6-2 命名](../../../課外讀物/E-6-best-practices/E-6-2-naming.md)）：

```
PascalCase（大駝峰）：
   類別、介面、方法、屬性、列舉、命名空間
   class TodoService、interface IRepository、void CalculateTotal()、public string Name
   （介面額外以 I 開頭：IUserRepository）

camelCase（小駝峰）：
   區域變數、方法參數
   var userName、int itemCount、void Foo(string firstName)

_camelCase（底線小駝峰）：
   private 欄位（慣例加底線）
   private readonly ITodoRepository _repo;

UPPER_CASE 或 PascalCase：常數
   const int MaxRetryCount = 3;  （C# 常數常用 PascalCase）
```

注意——**C# 和 JavaScript/TypeScript 不同**：C# 的「方法、屬性」用 PascalCase（TS 用 camelCase）。這是 C# 新手（尤其來自 JS/TS）最常搞錯的。遵守慣例讓團隊程式碼一致、好讀。

### C# 特有的 Clean Code 實踐

把前面學的整理成 C# 的乾淨寫法：

```
① 善用屬性而非 public 欄位（csharp-2-2）：用 { get; set; } 而非裸欄位
② 善用 record 表達不可變資料（csharp-3-6）：DTO、值物件用 record
③ 善用可空參考型別（csharp-3-6）：用 ? 標註可能 null，讓編譯器幫你抓
④ 善用 LINQ（csharp-3-2）：用宣告式 Where/Select 取代冗長迴圈（但別過度鏈接到難讀）
⑤ async 一路到底（csharp-3-4）：IO 操作用 async，別混用阻塞
⑥ 依賴介面 + DI（csharp-4-4）：鬆耦合、好測試
⑦ 用 using 管理資源：自動釋放（如資料庫連線、檔案）
⑧ 表達式主體成員：簡單方法用 => 簡寫
```

### 善用現代語法寫簡潔程式

```csharp
// ❌ 囉嗦
public string GetName()
{
    return _name;
}
public bool IsAdult(int age)
{
    if (age >= 18) { return true; } else { return false; }
}

// ✅ 簡潔（現代 C#）
public string GetName() => _name;              // 表達式主體
public bool IsAdult(int age) => age >= 18;     // 直接回傳布林運算

// ✅ 用 record 取代一堆樣板（csharp-3-6）
public record TodoDto(int Id, string Title, bool IsDone);

// ✅ 用模式比對取代一堆 if（csharp-3-6）
public string Describe(int score) => score switch
{
    >= 90 => "優",
    >= 60 => "及格",
    _ => "不及格"
};
```

說明：現代 C# 提供很多「讓程式更簡潔」的語法。簡潔通常更好讀——但**簡潔不等於賣弄**，原則永遠是「**好懂優先**」（[課外讀物 E-6-1](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)）。別為了炫技把程式寫得難懂。

### 註解：解釋「為什麼」

```csharp
// ❌ 廢話註解（程式碼已經說了）
i++;   // i 加一

// ✅ 解釋「為什麼」（程式碼說不出的）
// 必須先排序才能用二分搜尋
items.Sort();
```

呼應 [課外讀物 E-6-5 註解](../../../課外讀物/E-6-best-practices/E-6-5-comments.md)、rust [rust-7-4]——**註解解釋「為什麼這樣做」，而非「做了什麼」**（做什麼讓程式碼自己說）。

### 工具：讓機器幫你

```
dotnet format：自動格式化程式碼（縮排、空白統一）
.editorconfig：定義團隊的程式碼風格規則（大家一致）
Roslyn 分析器 / Warnings as Errors：編譯時抓出壞味道、潛在問題
→ 善用工具，讓「保持乾淨」自動化，不靠人工盯。
```

### 別教條化

```
Clean Code 是「讓程式更好維護」的手段，不是目的本身。
   遵守慣例、保持簡潔、命名清楚 → 因為這讓團隊協作順暢、未來好改
   但別為了「遵守規則」而過度設計（呼應 csharp-2-5、dsa-0-3）
→ 核心精神：寫「未來的你和同事會感謝你」的程式碼。
```

## 小練習

1. 檢查你之前寫的 Todo API 程式碼，找出命名不符 C# 慣例的地方（如方法用了 camelCase）並修正。
2. 把一個冗長的 if-else 或迴圈，用「表達式主體 / switch 表達式 / LINQ」改寫得更簡潔（但確保更好讀）。
3. 跑 `dotnet format` 格式化你的專案，觀察它統一了哪些東西。

<details>
<summary>參考解答</summary>

**練習 1：找出不符 C# 命名慣例的地方並修正**

檢查重點（C# 慣例）：**方法、屬性、類別、介面用 PascalCase**；區域變數、參數用 camelCase；private 欄位用 `_camelCase`；介面加 `I` 開頭。來自 JS/TS 的人最常把「方法、屬性」寫成 camelCase——這是這題要抓的。

```csharp
// ❌ 不符 C# 慣例（像 JS/TS 的寫法）
public class todoService                       // 類別應 PascalCase
{
    private ITodoRepository repo;              // private 欄位應 _camelCase
    public async Task<List<TodoDto>> getAll()  // 方法應 PascalCase
    {
        var TodoList = await repo.GetAllAsync(); // 區域變數應 camelCase
        return TodoList.Select(toDto).ToList();
    }
}

// ✅ 符合 C# 慣例
public class TodoService
{
    private readonly ITodoRepository _repo;    // _camelCase + readonly
    public async Task<List<TodoDto>> GetAllAsync()  // PascalCase，async 方法慣例加 Async 後綴
    {
        var todoList = await _repo.GetAllAsync();
        return todoList.Select(ToDto).ToList();
    }
}
```

驗收：類別/方法/屬性 = PascalCase、區域變數/參數 = camelCase、private 欄位 = `_` 開頭、介面 = `I` 開頭、async 方法習慣加 `Async` 後綴。開啟編輯器的 .NET 命名分析器（或 IDE 提示）也會幫你標出這些。

**練習 2：把冗長 if-else / 迴圈改簡潔**

改寫的目標是「更好讀」，不是「更短就好」。幾種常見改法：

```csharp
// ❌ 冗長的 if-else
public string Grade(int score)
{
    if (score >= 90) { return "優"; }
    else if (score >= 60) { return "及格"; }
    else { return "不及格"; }
}

// ✅ switch 表達式（依「範圍」分支，一目了然）
public string Grade(int score) => score switch
{
    >= 90 => "優",
    >= 60 => "及格",
    _     => "不及格"
};

// ❌ 冗長迴圈：篩選 + 轉換
var result = new List<string>();
foreach (var t in todos)
{
    if (t.IsDone)
        result.Add(t.Title);
}

// ✅ LINQ（宣告式：先篩再取，讀起來就像在描述意圖）
var result = todos.Where(t => t.IsDone).Select(t => t.Title).ToList();

// ❌ 一行 getter 卻寫成完整方法本體
public string GetName() { return _name; }
// ✅ 表達式主體成員
public string GetName() => _name;
```

驗收：改完後別人一眼看得懂「在做什麼」。提醒——LINQ 別鏈太長到難讀、switch 表達式記得有 `_` 兜底；簡潔的前提永遠是「好懂優先」，不是炫技。

**練習 3：跑 `dotnet format`（動手題）**

做法：在專案根目錄跑 `dotnet format`（或 `dotnet format --verify-no-changes` 先看會改哪些而不實際改）。它依 `.editorconfig` 的規則統一風格。

它通常會統一：縮排（空格/tab 與層數）、行尾多餘空白、大括號位置、`using` 的排序與移除未使用的、多餘空行、運算子前後空白等——都是**純格式、不改變程式行為**的東西。

驗收點：跑完用 `git diff` 看改了哪些，會發現全是排版差異、邏輯沒變。建議搭配 `.editorconfig` 定義團隊風格，並在 CI 用 `dotnet format --verify-no-changes` 把「保持乾淨」自動化，不靠人工盯。

> ⚠️ 動手題，實際改了哪些請自行在專案跑並用 `git diff` 觀察驗證。

</details>

## 課外讀物

> Clean Code 完整 → [課外讀物 E-6：Clean Code 總覽](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)、[命名](../../../課外讀物/E-6-best-practices/E-6-2-naming.md)、[註解](../../../課外讀物/E-6-best-practices/E-6-5-comments.md)、[後端 Clean Code](../../../課外讀物/E-6-best-practices/E-6-8-backend-clean-code.md)

> 別過度設計 → [csharp-2-5]、**dsa 課程 [dsa-0-3]**；對照 Rust 的慣例 → **rust 課程 [rust-7-4]**

> 本 Part 完成！下一步：部署上線 → [csharp-10-1]
