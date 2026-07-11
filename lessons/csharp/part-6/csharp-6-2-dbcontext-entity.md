# [csharp-6-2] DbContext 與實體模型（Entity Model）

> **本章目標**：學會用 C# class 定義「實體（資料表的對應）」，並用 DbContext 作為「操作資料庫的入口」。

## 你會學到

- 實體（Entity）：對應資料表的 class
- DbContext：操作資料庫的入口
- 怎麼設定連線、註冊 DbContext
- 慣例：EF Core 怎麼從 class 推斷資料表

## 概念說明

### 實體：資料表的對應

在 EF Core，**實體（Entity）** 就是「**一個對應到資料表的 C# class**」——class 對應「表」，class 的屬性對應「欄位」，class 的一個實例對應「一列」：

```
class TodoItem（實體）  ←→  todos 資料表
   public int Id        ←→  id 欄位
   public string Title  ←→  title 欄位
   public bool IsDone   ←→  is_done 欄位
一個 TodoItem 物件      ←→  表裡的一列資料
```

實體其實就是你在 [csharp-2] 寫的那種 class（[csharp-5-6] 的 `TodoItem` 就快是了）——EF Core 會依「慣例」自動把它對應到資料表。

### DbContext：操作資料庫的入口

**DbContext** 是「**你和資料庫之間的橋樑/入口**」——透過它做所有資料庫操作。你定義一個繼承 `DbContext` 的 class，裡面用 `DbSet<實體>` 宣告「有哪些表」：

```
DbContext 像「資料庫的遙控器」：
   裡面每個 DbSet<T> 對應一張表（一個「頻道」）
   透過它來新增、查詢、更新、刪除
   它還幫你「追蹤變更」——你改了物件，SaveChanges 時自動生對應的 SQL
```

## 程式碼範例

### 定義實體

```csharp
public class TodoItem
{
    public int Id { get; set; }            // 慣例：叫 Id 的屬性自動成為主鍵
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

說明：就是個普通 class。EF Core 的**慣例（convention）** 會自動處理很多事——例如「**名為 `Id`（或 `類別名+Id`）的屬性，自動成為主鍵**」。慣例讓你少寫設定（[cs Part 7-3 的主鍵概念]）。

### 定義 DbContext

```csharp
using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    // 建構子：接收設定（連線資訊等），透過 DI 注入（csharp-4-4）
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    // 每個 DbSet<T> 對應一張表
    public DbSet<TodoItem> Todos => Set<TodoItem>();
    // 之後有更多實體就加更多 DbSet：
    // public DbSet<User> Users => Set<User>();
}
```

說明：

- `class AppDbContext : DbContext`：繼承 `DbContext`。
- `public DbSet<TodoItem> Todos`：宣告「有一張 Todos 表（對應 `TodoItem` 實體）」——之後用 `_db.Todos` 操作它。
- 建構子接收 `DbContextOptions`——連線設定從外面（DI）注入進來（不寫死，呼應 [csharp-4-5]）。

### 註冊 DbContext（接上連線）

在 `Program.cs` 註冊 DbContext，並設定連線（用 PostgreSQL）：

```csharp
// === Program.cs ===
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")  // 從設定讀
    ));
```

`appsettings.json`（連線字串的「非機密」部分；密碼走環境變數/User Secrets，[csharp-4-5]）：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=mydb;Username=myuser;Password=從環境變數來"
  }
}
```

說明：`AddDbContext` 把 DbContext 註冊到 DI 容器（[csharp-4-4]），並用 `UseNpgsql` 指定「用 PostgreSQL + 這個連線」。連線字串從設定讀（[csharp-4-5]）——**密碼絕不寫死在這、不進 Git**（[csharp-9-3]、課外讀物 E-10）。

> DbContext 通常註冊成 **Scoped**（每個請求一個，[csharp-4-4]）——`AddDbContext` 預設就是 Scoped，確保每個請求有獨立的 context。

### 在服務裡注入並使用

```csharp
public class TodoService
{
    private readonly AppDbContext _db;
    public TodoService(AppDbContext db)    // 注入 DbContext（csharp-4-4）
    {
        _db = db;
    }

    public async Task<List<TodoItem>> GetAllAsync()
    {
        return await _db.Todos.ToListAsync();   // 透過 DbContext 查詢
    }
}
```

說明：透過 DI 注入 `AppDbContext`，就能用 `_db.Todos` 操作資料庫。[csharp-6-4] 會詳細講各種 CRUD 查詢。現在你已經搭好「實體 + DbContext + 連線」的骨架——但資料庫裡還沒有對應的表，這要靠下一章的 Migration 建立。

## 小練習

1. 為一個 `Product`（Id、Name、Price）定義實體 class，並在 `AppDbContext` 加一個 `DbSet<Product> Products`。
2. 在 `Program.cs` 註冊 `AppDbContext`，連線字串放 `appsettings.json`（密碼先放佔位符，提醒自己之後要走環境變數）。
3. 思考題：為什麼 DbContext 該註冊成「Scoped」（每個請求一個）而非 Singleton？（提示：呼應 csharp-4-4、cs Part 5-2 請求隔離。）

<details>
<summary>參考解答</summary>

**第 1 題：定義 `Product` 實體並加到 `AppDbContext`**

實體就是個普通 class，`Id` 依慣例自動成為主鍵；再在 DbContext 加一個對應的 `DbSet`：

```csharp
public class Product
{
    public int Id { get; set; }            // 慣例：Id 自動成為主鍵
    public string Name { get; set; } = "";
    public decimal Price { get; set; }     // 金額用 decimal，別用 double（避免浮點誤差）
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<TodoItem> Todos => Set<TodoItem>();
    public DbSet<Product> Products => Set<Product>();   // 新增這行
}
```

小提醒：價格用 `decimal` 而非 `double`——金額計算要精確，浮點數（`double`）會有捨入誤差，這在處理錢的時候是不能接受的。

**第 2 題：在 `Program.cs` 註冊、連線字串放 `appsettings.json`**

```csharp
// === Program.cs ===
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));
```

```json
// === appsettings.json ===
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=mydb;Username=myuser;Password=__放環境變數__"
  }
}
```

密碼這裡先放個明顯的佔位符（`__放環境變數__`）提醒自己：真正的密碼絕不寫死在 `appsettings.json`、也不進 Git，正式上線要走環境變數或 User Secrets（csharp-4-5、csharp-9-3）。實際跑起來時，可以用環境變數 `ConnectionStrings__DefaultConnection` 覆蓋整段連線字串，或在連線字串裡只把 `Password` 那段從環境變數組進去。

> 需自行實機驗證：這題請在自己專案跑一次 `dotnet run`，確認 App 能正常啟動、沒有噴連線設定相關的錯誤（此時還沒 Migration，只要 App 起得來即可）。

**第 3 題（思考題）：為什麼 DbContext 要 Scoped 而非 Singleton？**

關鍵在於 **DbContext 不是執行緒安全的，而且它會「追蹤變更」帶有狀態**：

1. **請求隔離**：Scoped 代表「每個 HTTP 請求拿到一個全新的 DbContext」。A 使用者的請求和 B 使用者的請求各自有獨立的 context，A 暫存未存檔的變更不會混到 B 身上（呼應 cs Part 5-2 的請求隔離）。
2. **執行緒安全**：Web 伺服器同時處理很多請求（多執行緒）。DbContext 不是 thread-safe，若做成 Singleton，多個請求共用同一個 context 併發存取，就會出現變更追蹤錯亂、甚至例外。
3. **變更追蹤會累積**：DbContext 會一直記著你查過、改過的物件。Singleton 的話這些追蹤狀態永遠不釋放，越積越多——既吃記憶體，也讓不同請求互相污染。

所以正確做法是 Scoped：每個請求開一個、請求結束就丟掉。而 `AddDbContext` 預設註冊的生命週期剛好就是 Scoped，不用你自己特別指定。

</details>

## 課外讀物

> 主鍵、資料表、關聯式模型 → **cs 課程 Part 7-3**、[課外讀物 E-4](../../../課外讀物/E-4-database/E-4-1-what-is-index.md)

> DI 與 Scoped 生命週期 → [csharp-4-4]；連線字串別寫死 → [csharp-4-5]

> 下一步：用 Migration 建立/管理資料庫結構 → [csharp-6-3]
