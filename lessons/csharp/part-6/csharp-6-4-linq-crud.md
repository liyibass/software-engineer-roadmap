# [csharp-6-4] 用 LINQ 做 CRUD 查詢

> **本章目標**：學會用 EF Core + LINQ 對資料庫做完整的 CRUD（新增、查詢、更新、刪除）——把你會的 LINQ 用在真實資料庫上。

## 你會學到

- 用 EF Core 做新增、查詢、更新、刪除
- `SaveChangesAsync` 與「變更追蹤」
- 常用查詢操作（過濾、排序、分頁）
- 非同步查詢（呼應 async）

## 概念說明

### 你已經會 LINQ 了

好消息——EF Core 查資料庫**用的就是你在 [csharp-3-2] 學的 LINQ**！差別只在「對象從記憶體集合變成資料庫」，EF Core 自動把 LINQ 轉成 SQL（[csharp-6-1]）。所以這章學起來會很順。

兩個關鍵概念先講：

```
① 變更追蹤（change tracking）：DbContext 會「追蹤你對查出來的物件做了什麼改動」
   你改了物件的屬性 → SaveChanges 時自動產生對應的 UPDATE
② SaveChangesAsync：真正「把變更寫進資料庫」的動作
   在此之前，新增/修改都只在記憶體的 DbContext 裡「暫存」
   呼叫它才真的執行 SQL（且是 async，csharp-3-4）
```

## 程式碼範例

以下都在一個注入了 `AppDbContext _db` 的服務裡（[csharp-6-2]）。

### C — 新增（Create）

```csharp
public async Task<TodoItem> CreateAsync(string title)
{
    var todo = new TodoItem
    {
        Title = title,
        IsDone = false,
        CreatedAt = DateTime.UtcNow,
    };
    _db.Todos.Add(todo);              // 加到 DbContext（還沒寫進 DB）
    await _db.SaveChangesAsync();     // 真正執行 INSERT；之後 todo.Id 會被填上
    return todo;
}
```

說明：`Add` 把物件加進 DbContext（暫存），`SaveChangesAsync` 才真正 INSERT。存完後 EF Core 會自動把資料庫生成的 `Id` 填回 `todo.Id`。

### R — 查詢（Read）

查詢用 LINQ（[csharp-3-2]），但用 **Async 版的結尾方法**：

```csharp
// 查全部
var all = await _db.Todos.ToListAsync();

// 查單一（用主鍵，最快）
var one = await _db.Todos.FindAsync(id);    // 找不到回 null

// 條件查詢 + 排序（你會的 LINQ！）
var pending = await _db.Todos
    .Where(t => !t.IsDone)               // 篩選未完成
    .OrderByDescending(t => t.CreatedAt) // 依建立時間排序
    .ToListAsync();

// 分頁（呼應課外讀物 E-11-4：別一次撈全部）
var page2 = await _db.Todos
    .OrderBy(t => t.Id)
    .Skip(20)                            // 跳過前 20 筆
    .Take(20)                            // 取 20 筆
    .ToListAsync();

// 聚合
var count = await _db.Todos.CountAsync(t => !t.IsDone);   // 計數
var any = await _db.Todos.AnyAsync(t => t.IsDone);        // 有沒有
```

說明：`Where`、`OrderBy`、`Skip`、`Take`、`Count`、`Any` 全是你會的 LINQ！只是結尾用 `ToListAsync`、`FindAsync`、`CountAsync` 等**非同步版**（資料庫是 I/O，用 async，[csharp-3-4]）。EF Core 把這些轉成高效的 SQL（例如 `Skip/Take` 變成 SQL 的分頁）。

> **分頁很重要**——別用 `ToListAsync()` 一次撈整張表（資料一大會慢、佔記憶體），用 `Skip/Take` 分頁（呼應 [課外讀物 E-11-4 資料庫效能](../../../課外讀物/E-11-performance/E-11-4-database-performance.md)）。

### U — 更新（Update）

靠「變更追蹤」——查出來、改屬性、存檔：

```csharp
public async Task<bool> MarkDoneAsync(int id)
{
    var todo = await _db.Todos.FindAsync(id);
    if (todo == null) return false;

    todo.IsDone = true;               // 改屬性（DbContext 在追蹤這個改動）
    await _db.SaveChangesAsync();     // 自動產生 UPDATE（只更新有變的欄位）
    return true;
}
```

說明：**你不用寫 UPDATE**——查出來的物件被 DbContext「追蹤」，你改了 `IsDone`，`SaveChangesAsync` 時 EF Core 自動偵測「這個變了」並產生對應的 UPDATE。這就是「變更追蹤」的便利。

### D — 刪除（Delete）

```csharp
public async Task<bool> DeleteAsync(int id)
{
    var todo = await _db.Todos.FindAsync(id);
    if (todo == null) return false;

    _db.Todos.Remove(todo);           // 標記刪除
    await _db.SaveChangesAsync();     // 執行 DELETE
    return true;
}
```

說明：`Remove` 標記刪除，`SaveChangesAsync` 執行 DELETE。

### 看 EF Core 生成的 SQL

```
ORM 雖方便，但建議偶爾看它「實際生成的 SQL」（可開啟 EF Core 的日誌）：
   ① 確認沒生出低效的查詢
   ② 學習、除錯
→ 呼應 csharp-6-1 的「懂底層 SQL 依然重要」。
```

## 小練習

1. 為 `Product` 寫完整的 CRUD 服務方法（Create/GetAll/GetById/Update/Delete），全用 async。
2. 寫一個查詢：找出「價格大於 100、依價格排序、取前 10 筆」的商品（用 Where/OrderBy/Take）。
3. 思考題：為什麼「更新」不用自己寫 UPDATE SQL？（提示：變更追蹤。）為什麼查詢結尾要用 `ToListAsync` 而非 `ToList`？

<details>
<summary>參考解答</summary>

**第 1 題：`Product` 的完整 CRUD 服務（全 async）**

假設沿用 csharp-6-2 的 `Product`（`Id`、`Name`、`Price`）與注入的 `AppDbContext _db`：

```csharp
public class ProductService
{
    private readonly AppDbContext _db;
    public ProductService(AppDbContext db) => _db = db;

    // C — 新增
    public async Task<Product> CreateAsync(string name, decimal price)
    {
        var product = new Product { Name = name, Price = price };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();      // 存完後 product.Id 會被填上
        return product;
    }

    // R — 查全部
    public async Task<List<Product>> GetAllAsync()
    {
        return await _db.Products
            .OrderBy(p => p.Id)
            .ToListAsync();
    }

    // R — 查單一（用主鍵，找不到回 null）
    public async Task<Product?> GetByIdAsync(int id)
    {
        return await _db.Products.FindAsync(id);
    }

    // U — 更新（靠變更追蹤，不用手寫 UPDATE）
    public async Task<bool> UpdateAsync(int id, string name, decimal price)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;     // 找不到，回報失敗

        product.Name = name;
        product.Price = price;
        await _db.SaveChangesAsync();          // 自動產生 UPDATE
        return true;
    }

    // D — 刪除
    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return false;

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();          // 執行 DELETE
        return true;
    }
}
```

重點：每個方法都回傳 `Task<...>` 並用 `async/await`；更新和刪除都先 `FindAsync` 檢查存不存在，找不到就回 `false` 讓呼叫端能給出正確的回應（例如 404），而不是直接爆例外。

**第 2 題：價格大於 100、依價格排序、取前 10 筆**

```csharp
var topProducts = await _db.Products
    .Where(p => p.Price > 100)        // 篩選：價格大於 100
    .OrderBy(p => p.Price)            // 依價格排序（低到高）
    .Take(10)                         // 取前 10 筆
    .ToListAsync();
```

注意這幾個 LINQ 操作會被 EF Core 一起翻成一句 SQL（大致是 `SELECT ... WHERE price > 100 ORDER BY price LIMIT 10`），篩選與排序都發生在資料庫端，而不是把整張表撈回記憶體再處理——這才有效率。如果題目要「由高到低取最貴的前 10 筆」，把 `OrderBy` 換成 `OrderByDescending(p => p.Price)` 即可。

**第 3 題（思考題）**

*為什麼「更新」不用自己寫 UPDATE SQL？*

因為 DbContext 有「**變更追蹤（change tracking）**」。當你用 `FindAsync`／查詢把一個物件撈出來，這個物件就被 DbContext「盯著」了——它記得這個物件原本長什麼樣。當你改了 `product.Price`，呼叫 `SaveChangesAsync()` 時，EF Core 會比對「現在的值」和「當初撈出來的值」，發現 `Price` 變了，就自動幫你產生對應的 `UPDATE`（而且聰明到只更新有變的欄位）。所以你只要「改物件屬性 + 存檔」，UPDATE SQL 由 EF Core 代勞。

*為什麼結尾用 `ToListAsync` 而非 `ToList`？*

因為查資料庫是 **I/O 操作**（要等網路、等磁碟）。`ToList` 是同步版——它會「卡住」目前這條執行緒直到資料庫回應，這段等待期間執行緒什麼事都不能做、白白被佔住。在 Web 伺服器上，執行緒是有限資源，這樣很快就會撐不住高流量。`ToListAsync` 是非同步版——在等資料庫回應的期間，執行緒會被釋放去服務其他請求，資料回來了再繼續。結果就是同樣的機器能撐更多併發請求，伺服器更高效（呼應 csharp-3-4 的 async）。

</details>

## 課外讀物

> 你會的 LINQ → [csharp-3-2]；非同步 → [csharp-3-4]

> 分頁、N+1、資料庫效能 → [課外讀物 E-11-4：資料庫效能](../../../課外讀物/E-11-performance/E-11-4-database-performance.md)、[課外讀物 E-4-4](../../../課外讀物/E-4-database/E-4-4-n-plus-one.md)

> 下一步：實體之間的關聯（一對多、多對多）→ [csharp-6-5]
