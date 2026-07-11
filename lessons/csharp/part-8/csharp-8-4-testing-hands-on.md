# [csharp-8-4] 🔧 動手做：為你的服務寫一套測試

> **本章目標**：整合 Part 8，為你的 Todo API 寫一套完整測試——單元測試（業務邏輯）+ 整合測試（API 端點），建立「敢改程式」的安全網。

## 你會學到

- 規劃一套測試該測什麼
- 整合單元測試與整合測試
- 怎麼測「業務規則」與「邊界情況」
- 用測試驅動信心

## 概念說明

### 規劃：該測什麼

為服務寫測試，先想「**哪些是最該測的**」（依測試金字塔 [csharp-8-1]，重點放單元測試）：

```
單元測試（多）：測「業務邏輯」與「規則」
   ✓ 正常情況（happy path）
   ✓ 邊界情況（空、極值、剛好的臨界）← 最容易藏 bug
   ✓ 錯誤情況（無效輸入該丟例外/回錯誤）
整合測試（適量）：測「關鍵 API 端點」的完整流程
   ✓ CRUD 走得通
   ✓ 認證授權有效（沒 token 被擋、不能動別人的）
```

重點放「**業務規則**」和「**邊界**」——這些最有價值、最容易出錯。

## 程式碼範例

### 假設我們有業務邏輯要測

把 [csharp-7-4] 的「授權檢查」抽成可測的服務方法（順便預習 [csharp-9-1] 分層）：

```csharp
public class TodoService
{
    private readonly ITodoRepository _repo;
    public TodoService(ITodoRepository repo) => _repo = repo;

    // 業務規則：使用者只能刪自己的待辦，管理員能刪任何
    public bool CanDelete(TodoItem todo, int userId, bool isAdmin)
    {
        return isAdmin || todo.UserId == userId;
    }

    public async Task<bool> DeleteAsync(int todoId, int userId, bool isAdmin)
    {
        var todo = await _repo.FindByIdAsync(todoId);
        if (todo == null) return false;
        if (!CanDelete(todo, userId, isAdmin))
            throw new UnauthorizedAccessException("無權刪除");
        await _repo.DeleteAsync(todo);
        return true;
    }
}
```

### 單元測試：測業務規則的各種情況

```csharp
public class TodoServiceTests
{
    [Fact]
    public void CanDelete_OwnTodo_ReturnsTrue()           // 正常：刪自己的
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.True(service.CanDelete(todo, userId: 1, isAdmin: false));
    }

    [Fact]
    public void CanDelete_OthersTodo_ReturnsFalse()        // 規則：不能刪別人的
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.False(service.CanDelete(todo, userId: 2, isAdmin: false));
    }

    [Fact]
    public void CanDelete_AdminAnyTodo_ReturnsTrue()       // 規則：管理員能刪任何
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.True(service.CanDelete(todo, userId: 999, isAdmin: true));
    }

    [Fact]
    public async Task DeleteAsync_OthersTodo_ThrowsUnauthorized()   // 錯誤情況
    {
        // Arrange：用 Moq 設定假 repo 回傳一個「別人的」todo（csharp-8-2）
        var mockRepo = new Mock<ITodoRepository>();
        mockRepo.Setup(r => r.FindByIdAsync(5))
                .ReturnsAsync(new TodoItem { Id = 5, UserId = 1 });
        var service = new TodoService(mockRepo.Object);

        // Act + Assert：user 2 刪 user 1 的 → 該丟例外
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.DeleteAsync(5, userId: 2, isAdmin: false));
    }
}
```

說明：這套單元測試涵蓋了「**業務規則的各種情況**」——刪自己的（正常）、刪別人的（被擋）、管理員（例外放行）、無權刪（丟例外）。**把關鍵規則的每個分支都測到**，這樣未來改動時，任何一條規則被破壞都會立刻被抓到。用 Moq 隔離 repository（[csharp-8-2]），不碰真資料庫。

### 整合測試：測 API 端點 + 認證

```csharp
public class TodosApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public TodosApiTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task GetTodos_WithoutToken_Returns401()    // 認證：沒 token 被擋
    {
        var response = await _client.GetAsync("/api/todos");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);   // 401
    }

    [Fact]
    public async Task FullFlow_RegisterLoginCreateGet()      // 完整流程
    {
        // 註冊 → 登入拿 token → 帶 token 新增 → 查回來
        await _client.PostAsJsonAsync("/api/register", new { username = "test", password = "Pass123!" });
        var loginResp = await _client.PostAsJsonAsync("/api/login", new { username = "test", password = "Pass123!" });
        var auth = await loginResp.Content.ReadFromJsonAsync<TokenResponse>();

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth!.Token);     // 帶上 token

        var createResp = await _client.PostAsJsonAsync("/api/todos", new { title = "測試待辦" });
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
    }
}
```

說明：整合測試驗證「**認證授權真的有效**」（沒 token 回 401）和「**完整使用流程走得通**」（註冊→登入→帶 token 操作）。這些是 [csharp-7-4] 的功能，現在用測試自動驗證——以後改認證邏輯，測試會幫你確認沒搞壞。

### 跑全部測試

```bash
dotnet test
# 跑出類似：
# Passed!  - Failed: 0, Passed: 8, Skipped: 0
```

說明：`dotnet test` 一次跑所有測試。全綠 = 業務規則正確、API 流程正常、認證有效——你**有信心**這次的改動沒弄壞東西。這套測試之後能接進 CI/CD（[csharp-10-4]），每次推程式自動跑。

## 小練習

1. 為你的 Todo 服務的「業務規則」寫一組單元測試，涵蓋正常、邊界、錯誤三類情況。
2. 寫一個整合測試驗證「沒帶 token 存取受保護端點回 401」。
3. 體驗安全網：故意改壞一條業務規則（如把 `CanDelete` 邏輯弄反），跑 `dotnet test`，看測試「抓到你改壞了」。

<details>
<summary>參考解答</summary>

**1. 為業務規則寫一組單元測試（正常、邊界、錯誤三類）**

以本章的 `TodoService` 為例，把「正常 / 邊界 / 錯誤」三類都涵蓋。用 Moq 隔離 repository，不碰真資料庫：

```csharp
public class TodoServiceTests
{
    // ---- 正常情況（happy path）----
    [Fact]
    public void CanDelete_OwnTodo_ReturnsTrue()            // 刪自己的 → 可以
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.True(service.CanDelete(todo, userId: 1, isAdmin: false));
    }

    [Fact]
    public void CanDelete_AdminAnyTodo_ReturnsTrue()       // 管理員刪任何 → 可以
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.True(service.CanDelete(todo, userId: 999, isAdmin: true));
    }

    // ---- 邊界情況：非管理員刪別人的（權限的臨界）----
    [Fact]
    public void CanDelete_OthersTodo_ReturnsFalse()
    {
        var service = new TodoService(Mock.Of<ITodoRepository>());
        var todo = new TodoItem { UserId = 1 };
        Assert.False(service.CanDelete(todo, userId: 2, isAdmin: false));
    }

    // ---- 邊界情況：找不到那筆 todo（DeleteAsync 回 false，不丟例外）----
    [Fact]
    public async Task DeleteAsync_TodoNotFound_ReturnsFalse()
    {
        var mockRepo = new Mock<ITodoRepository>();
        mockRepo.Setup(r => r.FindByIdAsync(404)).ReturnsAsync((TodoItem?)null);
        var service = new TodoService(mockRepo.Object);

        var result = await service.DeleteAsync(404, userId: 1, isAdmin: false);
        Assert.False(result);
    }

    // ---- 錯誤情況：無權刪別人的 → 該丟例外 ----
    [Fact]
    public async Task DeleteAsync_OthersTodo_ThrowsUnauthorized()
    {
        var mockRepo = new Mock<ITodoRepository>();
        mockRepo.Setup(r => r.FindByIdAsync(5))
                .ReturnsAsync(new TodoItem { Id = 5, UserId = 1 });
        var service = new TodoService(mockRepo.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.DeleteAsync(5, userId: 2, isAdmin: false));
    }
}
```

驗收點：五個測試涵蓋了「自己的、管理員（正常）」「別人的、找不到（邊界）」「無權刪（錯誤丟例外）」。`dotnet test` 全綠即代表每條規則分支都被守住。
（動手題——請自行實機跑 `dotnet test` 確認全綠。）

**2. 整合測試：沒帶 token 存取受保護端點回 401**

```csharp
public class TodosApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public TodosApiTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task GetTodos_WithoutToken_Returns401()
    {
        // Act：故意「不帶」Authorization header
        var response = await _client.GetAsync("/api/todos");

        // Assert：受保護端點應回 401 Unauthorized
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
```

驗收點：`_client` 沒設 `DefaultRequestHeaders.Authorization`，端點回 401，證明認證中介軟體確實有把關（呼應 [csharp-7-4]）。
（動手題——請自行實機執行確認；若你的 `/api/todos` 尚未加上 `[Authorize]`，會回 200 而非 401，那要先補上授權。）

**3. 體驗安全網：故意改壞規則，看測試抓到**

做法：

1. 把 `TodoService.CanDelete` 的邏輯故意弄反，例如：

   ```csharp
   // 原本：return isAdmin || todo.UserId == userId;
   // 改壞：把「自己的」判斷弄反
   public bool CanDelete(TodoItem todo, int userId, bool isAdmin)
       => isAdmin || todo.UserId != userId;   // 故意用 != 弄反
   ```

2. 跑 `dotnet test`。

預期結果（驗收點）：`CanDelete_OwnTodo_ReturnsTrue` 會**變紅**（因為現在刪自己的反而回 false），`CanDelete_OthersTodo_ReturnsFalse` 也可能變紅。輸出類似：

```
Failed!  - Failed: 1, Passed: 4, Skipped: 0
  Failed CanDelete_OwnTodo_ReturnsTrue
  Assert.True() Failure
  Expected: True
  Actual:   False
```

這就是**安全網當場接住你**——你才剛把規則改壞，測試立刻紅、還指出是哪個測試、哪條規則出問題。改回正確邏輯後再跑，會回到全綠。體會這一紅一綠，就懂了「有測試才敢改程式」的踏實感。

（動手題——請自行實機操作、觀察那一次紅燈，這裡看不到你的執行畫面。記得體驗完把邏輯改回來。）

</details>

## 課外讀物

> 測試完整觀念 → [課外讀物 E-9：測試](../../../課外讀物/E-9-testing/E-9-1-why-test.md)；單元/整合 → [csharp-8-2]、[csharp-8-3]

> 測試讓你敢重構 → [課外讀物 E-9-5：TDD](../../../課外讀物/E-9-testing/E-9-5-tdd.md)；CI 自動跑測試 → [csharp-10-4]

> 本 Part 完成！下一步：工程實務與架構 → [csharp-9-1]
