# [csharp-8-2] 單元測試：用 xUnit + Moq 測試業務邏輯

> **本章目標**：學會用 xUnit 寫單元測試，並用 Moq 製造「假的依賴」來隔離測試——這是測試業務邏輯的核心技能。

## 你會學到

- 用 xUnit 寫測試、用 `dotnet test` 執行
- AAA 模式：Arrange / Act / Assert
- 為什麼單元測試要「隔離」依賴
- 用 Moq 製造假的依賴

## 概念說明

### 單元測試：測最小單位的邏輯

**單元測試**測「**一個方法/類別的邏輯**」，且要**隔離**——不碰真的資料庫、網路（[csharp-8-1]）。為什麼要隔離？

```
如果單元測試碰真資料庫：
   慢（連線、查詢）、脆弱（資料庫沒開就失敗）、不純（測的是邏輯還是資料庫？）
隔離後：
   只測「你的邏輯」本身，快、穩、精準
   → 用「假的依賴」取代真的（資料庫、外部服務），這就是 Moq 的用途
```

### AAA 模式

好的測試遵循 **AAA** 結構（呼應 [課外讀物 E-9-4](../../../課外讀物/E-9-testing/E-9-4-aaa-principle.md)），清楚好讀：

```
Arrange（準備）：設定好測試需要的資料、物件、假依賴
Act（執行）：呼叫「被測的那個方法」
Assert（斷言）：驗證「結果是不是預期的」
```

## 程式碼範例

### 建立測試專案

```bash
# 在方案裡建一個 xUnit 測試專案
dotnet new xunit -o MyApi.Tests
cd MyApi.Tests
dotnet add reference ../MyApi/MyApi.csproj    # 引用要測的專案
dotnet add package Moq                         # 加 Moq
```

### 第一個單元測試

假設有個「計算訂單總價」的純邏輯方法，測它：

```csharp
// 被測的方法（純邏輯，好測）
public class PriceCalculator
{
    public decimal CalculateTotal(decimal unitPrice, int quantity, decimal discountRate)
    {
        if (quantity <= 0) throw new ArgumentException("數量必須大於 0");
        var subtotal = unitPrice * quantity;
        return subtotal * (1 - discountRate);
    }
}

// 測試
public class PriceCalculatorTests
{
    [Fact]                                  // [Fact] 標記一個測試
    public void CalculateTotal_WithDiscount_ReturnsDiscountedPrice()
    {
        // Arrange（準備）
        var calculator = new PriceCalculator();

        // Act（執行）
        var result = calculator.CalculateTotal(100m, 2, 0.1m);

        // Assert（斷言）
        Assert.Equal(180m, result);         // 100 × 2 × 0.9 = 180
    }

    [Fact]
    public void CalculateTotal_InvalidQuantity_ThrowsException()
    {
        var calculator = new PriceCalculator();
        // 斷言「會丟出例外」
        Assert.Throws<ArgumentException>(() => calculator.CalculateTotal(100m, 0, 0));
    }
}
```

說明：

- `[Fact]`：標記一個測試方法（xUnit 會自動找到並執行）。
- 測試名稱用「**方法_情境_預期**」格式，一看就懂在測什麼。
- **AAA**：先準備（建 calculator）、執行（呼叫方法）、斷言（`Assert.Equal` 驗證結果）。
- `Assert.Throws<T>`：斷言「會丟出特定例外」。

跑測試：`dotnet test`——全綠就過。

### 參數化測試：一個測試多組資料

用 `[Theory]` + `[InlineData]` 可以「一個測試跑多組輸入」：

```csharp
[Theory]
[InlineData(100, 1, 0, 100)]      // 無折扣
[InlineData(100, 2, 0.1, 180)]    // 9 折
[InlineData(50, 4, 0.5, 100)]     // 5 折
public void CalculateTotal_VariousCases(decimal price, int qty, decimal discount, decimal expected)
{
    var calculator = new PriceCalculator();
    var result = calculator.CalculateTotal(price, qty, discount);
    Assert.Equal(expected, result);
}
```

說明：`[Theory]` + 多個 `[InlineData]` 讓同一個測試邏輯跑多組資料——省去重複寫多個測試。每組 `[InlineData]` 是一個案例。

### 用 Moq 隔離依賴

當被測的類別**依賴別的東西**（如 `UserService` 依賴 `IUserRepository`，[csharp-4-4]），測試時不想碰真資料庫——用 **Moq 製造一個「假的」**：

```csharp
public class UserServiceTests
{
    [Fact]
    public void GetUser_WhenExists_ReturnsUser()
    {
        // Arrange：製造假的 IUserRepository（不碰真資料庫！）
        var mockRepo = new Mock<IUserRepository>();
        mockRepo.Setup(r => r.FindById(1))                  // 設定：呼叫 FindById(1) 時
                .Returns(new User { Id = 1, Name = "Amy" }); // 就回傳這個假 user

        var service = new UserService(mockRepo.Object);      // 注入假的（csharp-4-4）

        // Act
        var user = service.GetUser(1);

        // Assert
        Assert.NotNull(user);
        Assert.Equal("Amy", user.Name);
    }
}
```

說明：

- `new Mock<IUserRepository>()`：製造一個「假的」repository。
- `.Setup(...).Returns(...)`：設定「假物件的行為」——「當呼叫 `FindById(1)`，回傳這個假 user」。
- `mockRepo.Object`：拿到假物件，注入 `UserService`。
- 這樣測試**完全不碰真資料庫**——只測 `UserService` 的邏輯。快、穩、隔離。

**這就是為什麼 [csharp-2-4]、[csharp-4-4] 一直強調「依賴介面 + 注入」**——因為依賴介面，測試時才能輕鬆塞「假的實作」。**好的設計（依賴注入）讓測試變容易**，這是它們環環相扣的地方。

## 小練習

1. 為 [csharp-1-4] 的 `Add`/`Square` 之類純方法寫 xUnit 測試（用 AAA），跑 `dotnet test`。
2. 用 `[Theory]` + `[InlineData]` 為一個方法寫多組案例的測試。
3. 用 Moq 為一個「依賴介面的服務」寫測試——設定假依賴的行為，驗證服務邏輯，全程不碰真依賴。

<details>
<summary>參考解答</summary>

**1. 為純方法寫 xUnit 測試（AAA）**

先假設有這樣一個純邏輯類別（相同輸入永遠給相同輸出、不改外部狀態，最好測）：

```csharp
public class MathUtils
{
    public int Add(int a, int b) => a + b;
    public int Square(int n) => n * n;
}
```

對應的測試，每個都照 Arrange / Act / Assert 三段寫：

```csharp
public class MathUtilsTests
{
    [Fact]
    public void Add_TwoPositives_ReturnsSum()
    {
        // Arrange
        var math = new MathUtils();

        // Act
        var result = math.Add(2, 3);

        // Assert
        Assert.Equal(5, result);
    }

    [Fact]
    public void Add_NegativeAndPositive_ReturnsSum()
    {
        var math = new MathUtils();
        var result = math.Add(-4, 10);
        Assert.Equal(6, result);
    }

    [Fact]
    public void Square_Three_ReturnsNine()
    {
        var math = new MathUtils();
        var result = math.Square(3);
        Assert.Equal(9, result);
    }
}
```

跑法：在測試專案裡 `dotnet test`。看到 `Passed!` 就代表三個測試都綠。
（動手題——請自行實機執行 `dotnet test` 確認全綠，這裡看不到你的畫面。）

**2. 用 `[Theory]` + `[InlineData]` 寫多組案例**

同一個測試邏輯，只是輸入不同，就用 `[Theory]`＋多個 `[InlineData]`，不必複製貼上寫好幾個 `[Fact]`：

```csharp
public class MathUtilsTheoryTests
{
    [Theory]
    [InlineData(2, 3, 5)]      // 正 + 正
    [InlineData(-4, 10, 6)]    // 負 + 正
    [InlineData(0, 0, 0)]      // 邊界：兩個 0
    [InlineData(-1, -1, -2)]   // 負 + 負
    public void Add_VariousCases_ReturnsExpectedSum(int a, int b, int expected)
    {
        var math = new MathUtils();
        var result = math.Add(a, b);
        Assert.Equal(expected, result);
    }
}
```

每一行 `[InlineData]` 就是一個案例，xUnit 會把它們當成 4 個獨立測試分別跑、分別報綠紅——省下重複程式碼，又能一眼看出涵蓋了哪些情況。

**3. 用 Moq 為「依賴介面的服務」寫測試**

假設有這個服務，它依賴 `IUserRepository` 介面（不直接依賴真資料庫，就是為了好測，呼應 [csharp-4-4]）：

```csharp
public interface IUserRepository
{
    User? FindById(int id);
}

public class UserService
{
    private readonly IUserRepository _repo;
    public UserService(IUserRepository repo) => _repo = repo;

    // 業務邏輯：找不到就丟例外，找到就回名字
    public string GetUserName(int id)
    {
        var user = _repo.FindById(id);
        if (user == null)
            throw new KeyNotFoundException($"找不到 ID 為 {id} 的使用者");
        return user.Name;
    }
}
```

測試時用 Moq 造一個「假的 repository」，設定它的行為，全程不碰真資料庫：

```csharp
public class UserServiceTests
{
    [Fact]
    public void GetUserName_WhenUserExists_ReturnsName()
    {
        // Arrange：假 repo，設定「查 id=1 回一個假 user」
        var mockRepo = new Mock<IUserRepository>();
        mockRepo.Setup(r => r.FindById(1))
                .Returns(new User { Id = 1, Name = "Amy" });
        var service = new UserService(mockRepo.Object);

        // Act
        var name = service.GetUserName(1);

        // Assert
        Assert.Equal("Amy", name);
    }

    [Fact]
    public void GetUserName_WhenUserNotFound_ThrowsKeyNotFound()
    {
        // Arrange：設定「查 id=99 回 null」（模擬查無此人）
        var mockRepo = new Mock<IUserRepository>();
        mockRepo.Setup(r => r.FindById(99)).Returns((User?)null);
        var service = new UserService(mockRepo.Object);

        // Act + Assert：該丟 KeyNotFoundException
        Assert.Throws<KeyNotFoundException>(() => service.GetUserName(99));
    }
}
```

重點：`mockRepo.Setup(...).Returns(...)` 讓你**自己決定假依賴的回傳**，於是同一個服務可以輕鬆測「查得到」和「查不到」兩條路，而且**完全不需要真的資料庫**——快、穩、只測到 `UserService` 自己的邏輯。這正是「依賴介面 + 注入」讓測試變好寫的地方。

</details>

## 課外讀物

> 單元測試、AAA 原則 → [課外讀物 E-9-3：單元測試](../../../課外讀物/E-9-testing/E-9-3-unit-testing.md)、[課外讀物 E-9-4：AAA 原則](../../../課外讀物/E-9-testing/E-9-4-aaa-principle.md)

> 為什麼 DI 讓測試好寫 → [csharp-4-4]、[csharp-2-4]；對照 Rust 測試 → **rust 課程 [rust-7-3]**

> 下一步：測試整個 API 端點——整合測試 → [csharp-8-3]
