# [csharp-6-3] Migration：用程式碼管理資料庫結構（IaC 的精神）

> **本章目標**：學會用 EF Core 的 Migration——把「資料庫結構的變更」用程式碼管理、版本控制，這是現代資料庫管理的最佳實踐。

## 你會學到

- Migration 解決什麼問題
- 怎麼建立並套用 Migration
- Migration 怎麼版本化資料庫結構
- 這背後的「IaC」精神

## 概念說明

### 問題：資料庫結構怎麼管理

[csharp-6-2] 定義了實體和 DbContext，但**資料庫裡還沒有對應的表**。你可能想「手動去資料庫建表」——但這有問題：

```
手動改資料庫結構的問題：
   ① 沒記錄：誰、何時、改了什麼？無從追蹤
   ② 難同步：你建了表，隊友的資料庫怎麼跟上？正式環境怎麼套用？
   ③ 易出錯：手動下 SQL 建表，容易和程式碼的實體不一致
   ④ 難回復：改錯了想退回上一版？很麻煩
```

**Migration（遷移）** 解決這些——**把「資料庫結構的每次變更」變成「程式碼檔案」，可以版本控制、可重複套用、可回復**。

### Migration：資料庫結構的版本控制

Migration 的核心點子——**你改 C# 實體（[csharp-6-2]），EF Core 自動產生「對應的資料庫變更」成一個 Migration 檔，這個檔案進 Git**：

```mermaid
graph LR
    ENTITY["改 C# 實體<br/>(加欄位、加表...)"] -->|"dotnet ef migrations add"| MIG["產生 Migration 檔<br/>(描述『怎麼改資料庫』的程式碼)"]
    MIG -->|"dotnet ef database update"| DB["套用到資料庫<br/>(真的建表/改欄位)"]
    MIG -->|"進 Git"| GIT["版本控制<br/>隊友/正式環境照著套用"]
```

這張圖在說：改實體 → 產生 Migration（記錄變更）→ 套用到資料庫，且 Migration 檔進 Git。這樣**資料庫結構的演進有完整歷史**，每個人/每個環境都能套用同樣的變更——資料庫結構和程式碼一起被版本控制。

## 程式碼範例

### 安裝 EF Core 工具

```bash
# 安裝 dotnet ef 命令列工具（一次性）
dotnet tool install --global dotnet-ef
```

### 建立第一個 Migration

定義好實體和 DbContext（[csharp-6-2]）後，產生第一個 Migration：

```bash
dotnet ef migrations add InitialCreate
```

說明：`migrations add InitialCreate` 比對「你的實體」和「資料庫目前狀態」，產生一個叫 `InitialCreate` 的 Migration 檔（在 `Migrations/` 資料夾）。打開它會看到「怎麼建立這些表」的 C# 程式碼：

```csharp
// EF Core 自動產生的 Migration（簡化示意）
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Up：套用此 migration 要做的事（建立 Todos 表）
        migrationBuilder.CreateTable(
            name: "Todos",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false).Annotation("...", true),
                Title = table.Column<string>(maxLength: 100, nullable: false),
                IsDone = table.Column<bool>(nullable: false),
                CreatedAt = table.Column<DateTime>(nullable: false),
            },
            constraints: table => table.PrimaryKey("PK_Todos", x => x.Id));
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Down：回復此 migration（刪掉 Todos 表）—— 讓你能退回上一版！
        migrationBuilder.DropTable(name: "Todos");
    }
}
```

說明：每個 Migration 有 **`Up`（套用變更）** 和 **`Down`（回復變更）**——所以能前進也能退回。你不用手寫，EF Core 從實體自動產生。

### 套用 Migration 到資料庫

```bash
dotnet ef database update
```

說明：這會把「還沒套用的 Migration」實際執行到資料庫——真的建立 `Todos` 表。現在資料庫裡有表了，[csharp-6-4] 就能存取資料。

### 後續變更：改實體 → 加 Migration → 更新

之後每次改資料庫結構，都走同一流程：

```bash
# 例：你在 TodoItem 加了一個 Priority 屬性
dotnet ef migrations add AddPriority    # 產生「加 Priority 欄位」的 migration
dotnet ef database update               # 套用
```

說明：**改實體 → `migrations add` → `database update`**——這個循環讓資料庫結構跟著程式碼演進，每步都有記錄、可版本控制、可在各環境重複套用。

### 這背後是 IaC 精神

Migration 體現了 **IaC（Infrastructure as Code，基礎設施即程式碼）** 的精神——**用程式碼管理基礎設施（這裡是資料庫結構）**，而非手動操作：

```
手動改資料庫 = 沒記錄、難重現、易出錯
用 Migration（程式碼）= 有版本、可重現、可審查、可回復
→ 這和 infra/aws 課程的「用 Terraform 管理雲端資源」是同一個思想
  （aws 課程 Part 9 IaC、rust 課程 [rust-9-4] 提的「程式碼管結構」）。
```

## 小練習

1. 為 [csharp-6-2] 的實體建立 `InitialCreate` migration、套用到資料庫，用資料庫工具確認表真的建好了。
2. 在實體加一個新屬性，產生新的 migration、套用，觀察資料庫多了那個欄位。
3. 思考題：為什麼「用 Migration 管理資料庫結構」比「手動去資料庫改」好？列三個理由（呼應 IaC）。

<details>
<summary>參考解答</summary>

**第 1 題：建立 `InitialCreate` migration、套用、確認表建好**

做法（在專案根目錄執行）：

```bash
# 若還沒裝過 dotnet ef 工具（一次性）
dotnet tool install --global dotnet-ef

# 依目前的實體與 DbContext 產生第一個 Migration
dotnet ef migrations add InitialCreate

# 套用到資料庫（真的建表）
dotnet ef database update
```

驗收點：

- `Migrations/` 資料夾出現 `xxxxxxxx_InitialCreate.cs`，打開能看到 `Up()` 裡有 `CreateTable("Todos", ...)`、`Down()` 裡有 `DropTable("Todos")`。
- 用資料庫工具（psql、DBeaver、TablePlus 等）連上去，能看到 `Todos` 表，欄位與實體一致（`Id`、`Title`、`IsDone`、`CreatedAt`）。
- 另外會多一張 `__EFMigrationsHistory` 表，EF Core 用它記錄「哪些 Migration 已套用過」。

> 需自行實機驗證：這題要真的連上你自己的資料庫，用資料庫工具「肉眼確認」表和欄位都在。

**第 2 題：加一個新屬性、產生新 Migration、套用、觀察欄位**

以在 `TodoItem` 加一個 `Priority`（優先順序）為例：

```csharp
public class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public bool IsDone { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Priority { get; set; }      // ← 新增這個屬性
}
```

```bash
dotnet ef migrations add AddPriority   # 產生「只加 Priority 欄位」的 Migration
dotnet ef database update              # 套用
```

驗收點：新的 Migration 檔 `Up()` 裡是 `AddColumn<int>("Priority", "Todos", ...)`（注意它只描述「這次的差異」，不會整張表重建）；套用後用資料庫工具看 `Todos` 表，會多出 `Priority` 欄位。

> 需自行實機驗證：一樣要連上資料庫確認欄位真的多了。

**第 3 題（思考題）：Migration 比手動改資料庫好在哪？列三個理由**

1. **有版本、可追蹤**：每次結構變更都是一個進 Git 的檔案，誰、何時、改了什麼一目了然，還能 code review。手動下 SQL 改則完全沒記錄。
2. **可重現、可同步**：同一批 Migration 檔，隊友、測試環境、正式環境都照著 `database update` 跑一遍，就能得到一模一樣的結構。手動改則每個環境都要有人記得重下一次 SQL，極易漏掉或不一致。
3. **可回復**：每個 Migration 都有 `Down()`，改錯了可以退回上一版（`dotnet ef database update 上一個Migration名`）。手動改要退回得自己記得反向 SQL 怎麼寫。
4. （加分）**和程式碼同源、不易失準**：Migration 由實體自動產生，資料庫結構跟著程式碼一起演進、一起版控，比較不會出現「程式碼的實體」和「資料庫實際結構」對不上的情況。

這正是 IaC（Infrastructure as Code）的精神——用程式碼（可版控、可審查、可重現）管理基礎設施，而不是靠手動點按操作。和 aws/infra 課程用 Terraform 管雲端資源是同一套思想。

</details>

## 課外讀物

> IaC（基礎設施即程式碼）的精神 → **aws 課程 Part 9（Terraform）**、**infra 課程 Part 6**

> 資料庫結構、主鍵、欄位 → **cs 課程 Part 7-3**、[課外讀物 E-4](../../../課外讀物/E-4-database/E-4-1-what-is-index.md)

> 下一步：用 LINQ 做 CRUD 查詢 → [csharp-6-4]
