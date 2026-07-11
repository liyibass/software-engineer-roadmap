# [csharp-9-2] Logging 與健康檢查

> **本章目標**：學會在 ASP.NET Core 記錄日誌與設定健康檢查——讓你的服務「跑在線上時看得見、查得到問題」，這是可靠營運的基礎。

## 你會學到

- 為什麼 logging 對線上服務至關重要
- ASP.NET Core 的 logging 與日誌等級
- 結構化日誌的概念
- 健康檢查（health check）端點

## 概念說明

### Logging：讓服務「看得見」

服務上線後跑在伺服器上，你看不到它內部發生什麼。**日誌（logging）** 是它的「黑盒子記錄器」——記下「發生了什麼、何時、出了什麼錯」，讓你能在事後查問題（呼應 **sre 課程**觀測性、**cs 課程 Part 5** 系統記錄）：

```
沒有日誌：線上出包 → 你完全不知道發生什麼、從哪查 → 抓瞎
有日誌：   能看到「幾點幾分、哪個請求、出了什麼錯」 → 快速定位
→ 日誌是線上事故排查的命脈。後端服務「沒日誌等於沒眼睛」。
```

### 日誌等級

日誌分**等級**，依嚴重度分類（讓你能過濾「只看重要的」）：

```
Trace / Debug：很細的除錯資訊（開發用，正式環境通常關掉）
Information：一般資訊（如「使用者 X 登入」「處理了請求 Y」）
Warning：警告（不正常但還能運作，如「重試了一次」）
Error：錯誤（某操作失敗，如「無法連資料庫」）
Critical：嚴重（系統快掛了）
```

正式環境通常設「Information 以上才記」（[csharp-4-5] 用 appsettings 設定），開發環境記更細。

## 程式碼範例

### 用 ILogger 記日誌

ASP.NET Core 內建 logging，透過 DI 注入 `ILogger<T>`（[csharp-4-4]）：

```csharp
public class TodosController : ControllerBase
{
    private readonly ILogger<TodosController> _logger;   // 注入 logger
    private readonly TodoService _service;

    public TodosController(ILogger<TodosController> logger, TodoService service)
    {
        _logger = logger;
        _service = service;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("使用者嘗試刪除待辦 {TodoId}", id);   // 結構化日誌

        try
        {
            await _service.DeleteAsync(id, GetCurrentUserId(), IsAdmin);
            _logger.LogInformation("成功刪除待辦 {TodoId}", id);
            return NoContent();
        }
        catch (NotFoundException)
        {
            _logger.LogWarning("待辦 {TodoId} 不存在", id);
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "刪除待辦 {TodoId} 時發生未預期錯誤", id);  // 記下例外
            throw;
        }
    }
}
```

說明：

- `_logger.LogInformation/LogWarning/LogError(...)`：依等級記日誌。
- **結構化日誌**：`"刪除待辦 {TodoId}", id` 的 `{TodoId}` 不只是字串插值——它讓日誌系統能「**把 TodoId 當成可查詢的欄位**」（之後能「篩出所有 TodoId=5 的日誌」）。這比純文字日誌強大太多（呼應 sre 課程、ELK）。
- `LogError(ex, ...)`：記錄例外時把 `ex` 傳進去，會記下完整堆疊追蹤，方便查 bug。

### 好的日誌習慣

```
✓ 記「有用的脈絡」：哪個使用者、哪個資源、什麼操作（如上面的 TodoId）
✓ 用對等級：一般流程 Info、可疑 Warning、失敗 Error
✓ 用結構化日誌：欄位可查詢，不只是純文字
✗ 別記敏感資料：密碼、token、個資別寫進日誌！（資安，課外讀物 E-10）
✗ 別記太多噪音：每行都 log 會淹沒重要訊息
```

### 健康檢查：服務還活著嗎

**健康檢查（health check）** 是一個「**回報服務是否正常**」的端點——讓監控系統、負載平衡器能「**定期問：你還好嗎？**」（呼應 **infra 課程 Part 7**、**sre 課程**）：

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();    // 檢查資料庫連得上

var app = builder.Build();
app.MapHealthChecks("/health");            // 提供 /health 端點
```

說明：`MapHealthChecks("/health")` 提供一個端點——存取它會回報「服務（和它依賴的資料庫等）是否正常」。用途：

```
負載平衡器：定期打 /health，若不健康 → 不要把流量導給這台（infra Part 9）
監控系統：/health 失敗 → 發告警通知維運（sre 課程）
容器編排（K8s）：用它判斷容器是否該重啟（aws Part 7）
→ 健康檢查讓「自動化的可靠性」成為可能。
```

這是讓服務「能被自動監控、自動處理故障」的基礎——連接到你之後的 infra/aws/sre。

## 小練習

1. 在你的 Controller 注入 `ILogger`，在關鍵操作（登入、刪除）記下結構化日誌（含相關 ID）。
2. 故意觸發一個錯誤，用 `LogError(ex, ...)` 記錄，觀察日誌裡的堆疊追蹤。
3. 加一個 `/health` 健康檢查端點（含資料庫檢查），存取它看回報。思考：負載平衡器和監控系統會怎麼用它？

<details>
<summary>參考解答</summary>

**第 1 題（動手題）：在關鍵操作記結構化日誌。**

注入 `ILogger<T>`，在登入、刪除等關鍵點記下「含相關 ID」的結構化日誌：

```csharp
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly AuthService _auth;

    public AuthController(ILogger<AuthController> logger, AuthService auth)
    {
        _logger = logger;
        _auth = auth;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        // 用 {UserName} 佔位符 → 結構化欄位，可事後查詢
        _logger.LogInformation("使用者 {UserName} 嘗試登入", dto.UserName);

        var result = await _auth.LoginAsync(dto.UserName, dto.Password);
        if (result is null)
        {
            _logger.LogWarning("使用者 {UserName} 登入失敗（帳密錯誤）", dto.UserName);
            return Unauthorized();
        }

        _logger.LogInformation("使用者 {UserName} 登入成功", dto.UserName);
        return Ok(result);
    }
}
```

**重點**：用 `{UserName}` 這種「佔位符」而不是字串插值 `$"...{dto.UserName}"`——佔位符會讓日誌系統把 UserName 存成「可查詢的欄位」。**驗收點**：跑起來後在 console／日誌輸出裡看到含 ID 的訊息。切記別把密碼、token 寫進日誌。

**第 2 題（動手題）：用 `LogError(ex, ...)` 記例外。**

故意觸發錯誤（例如刪除一個不存在的、或存取一個會丟例外的操作），在 catch 裡記錄：

```csharp
try
{
    await _service.DeleteAsync(id, GetCurrentUserId(), IsAdmin);
    return NoContent();
}
catch (Exception ex)
{
    // 第一個參數傳 ex → 會連同「完整堆疊追蹤」一起記錄
    _logger.LogError(ex, "刪除待辦 {TodoId} 時發生未預期錯誤", id);
    throw;
}
```

**驗收點**：觀察日誌輸出裡除了你的訊息，還有一整段 `Exception` 的堆疊追蹤（stack trace）——包含例外型別、訊息、以及是「哪個檔案第幾行」丟出來的。這正是 `LogError(ex, ...)` 把 `ex` 當第一個參數的價值：`LogError("...")`（不傳 ex）就沒有堆疊追蹤，查 bug 會很痛苦。需自行實機觸發並觀察。

**第 3 題（動手題 + 思考）：加 `/health` 端點。**

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();     // 檢查資料庫連得上

var app = builder.Build();
app.MapHealthChecks("/health");
```

**驗收點**：啟動後用瀏覽器或 `curl http://localhost:5000/health` 存取，正常會回 `Healthy`（HTTP 200）；把資料庫關掉再打，會回 `Unhealthy`（HTTP 503）。需自行實機驗證。

**思考——負載平衡器和監控系統怎麼用它？**

- **負載平衡器（load balancer）**：定期（例如每幾秒）打每台伺服器的 `/health`。若某台回 `Unhealthy`，就**把它從流量池移除**，不再把使用者請求導給這台壞掉的機器；等它恢復健康再放回來。這讓「一台壞掉」不會影響使用者。
- **監控系統**：`/health` 持續失敗就**觸發告警**（發 Slack／簡訊給維運），讓人及時介入。
- **容器編排（如 K8s）**：用它當 liveness/readiness probe——不健康就**自動重啟容器**或**暫不導流**。

一句話：`/health` 讓「偵測故障」變成機器可自動做的事，是自動化可靠性（infra／sre）的基礎。

</details>

## 課外讀物

> 觀測性、日誌、監控 → **sre 課程 Part 3**、**infra 課程 Part 7**、[課外讀物 E-14：觀測性](../../../課外讀物/E-14-observability/E-14-2-three-pillars.md)

> 別把敏感資料寫進日誌 → [課外讀物 E-10：Web Security](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)

> 下一步：設定管理與 Secrets → [csharp-9-3]
