# [csharp-2-2] 封裝：屬性（Property）、存取修飾詞（public / private…）

> **本章目標**：理解物件導向的第一根支柱「封裝」——把資料藏好、只露出該露的，並學會 C# 的招牌特性「屬性（Property）」。

## 你會學到

- 封裝是什麼、為什麼重要
- 存取修飾詞：public / private / protected
- 屬性（Property）：C# 控制存取的優雅方式
- 自動屬性與唯讀屬性

## 概念說明

### 封裝：把內部藏好

**封裝（encapsulation）** 是物件導向的第一根支柱——**把物件的內部資料「藏起來」，只透過受控的方式讓外界存取**。

為什麼要藏？因為 [csharp-2-1] 那種 `public` 欄位「誰都能隨便改」很危險：

```csharp
TodoItem todo = new TodoItem("買牛奶");
todo.Title = "";              // 😱 外界可以把標題設成空的！沒人攔得住
todo.IsDone = true;
todo.IsDone = false;          // 😱 隨便亂改狀態
```

封裝的精神是——**內部細節藏起來，只開放「合理、受控」的存取**。比喻：

```
ATM 提款機：你能用「按鈕介面」操作（受控）
   但你碰不到裡面的現金與機械（內部藏起來）
   → 不會有人直接掏走金庫的錢。
封裝就是給物件裝上這種「受控的介面」，保護內部。
```

> 這呼應 **cs 課程 Part 8-1（抽象）** 和 [課外讀物 E-7-5（介面隔離）](../../../課外讀物/E-7-solid/E-7-5-isp.md)——只暴露必要的、藏起內部。

### 存取修飾詞：控制誰能存取

C# 用**存取修飾詞**控制「誰能存取一個欄位/方法」：

```
public：誰都能存取（對外公開的介面）
private：只有「這個 class 內部」能存取（藏起來的內部細節）
protected：自己 + 子類別能存取（[csharp-2-3] 繼承會用到）
```

預設原則（呼應 rust [rust-7-1]、cs Part 5-1 的「最小權限」）：**預設用 `private`，只有「真的需要對外」的才 `public`**。藏得越多，外界越不會依賴你的內部、你越好改。

### 屬性（Property）：C# 的招牌

如果欄位 `private`，外界怎麼讀寫？傳統做法是寫 `GetTitle()` / `SetTitle()` 方法。但 C# 有更優雅的**屬性（Property）**——**看起來像欄位，但實際上是「受控的存取點」**：

```csharp
class TodoItem
{
    private string _title;            // private 欄位（底線是慣例）

    public string Title              // 公開的「屬性」
    {
        get { return _title; }                          // 讀取時
        set                                             // 寫入時，可以加檢查！
        {
            if (string.IsNullOrWhiteSpace(value))       // value 是傳入的新值
                throw new ArgumentException("標題不能為空");
            _title = value;
        }
    }
}
```

說明：

- `_title` 是 `private` 欄位（藏起來，外界碰不到）。
- `Title` 是 `public` **屬性**，有 `get`（讀）和 `set`（寫）兩個「存取器」。
- 關鍵：**`set` 裡可以加驗證**！上面就擋掉「設空標題」。`value` 是「外界要設的新值」的特殊關鍵字。

用起來和欄位一模一樣，但背後有保護：

```csharp
TodoItem todo = new TodoItem();
todo.Title = "買牛奶";        // 觸發 set，通過驗證 → OK
Console.WriteLine(todo.Title); // 觸發 get → 買牛奶
todo.Title = "";              // 觸發 set → 驗證失敗，丟例外！被擋下來了
```

這就是封裝的威力——外界用起來方便（像欄位），但你能在 `set`/`get` 裡加任何保護邏輯。

### 自動屬性：常用的簡寫

如果一個屬性「不需要特別的驗證邏輯」，C# 提供**自動屬性**的精簡寫法：

```csharp
class TodoItem
{
    public string Title { get; set; }          // 自動屬性：編譯器自動產生背後的欄位
    public bool IsDone { get; private set; }    // 唯讀對外：外界能讀，但只有內部能寫
    public DateTime CreatedAt { get; }          // 完全唯讀：只能在建構子設定
}
```

說明：

- `{ get; set; }`：自動屬性——編譯器幫你生成背後的私有欄位，你不用手寫。**這是 C# 最常見的寫法**。
- `{ get; private set; }`：外界**只能讀不能寫**（`set` 是 private）——很適合「狀態只能由物件自己改」的欄位（像 `IsDone` 只能透過 `MarkDone()` 改）。
- `{ get; }`：完全唯讀，只能在建構子設定後就不能變（像「建立時間」）。

## 程式碼範例

把 [csharp-2-1] 的 `TodoItem` 用封裝改寫：

```csharp
class TodoItem
{
    public string Title { get; set; }
    public bool IsDone { get; private set; }     // 外界不能直接設 IsDone
    public DateTime CreatedAt { get; }           // 唯讀

    public TodoItem(string title)
    {
        Title = title;
        IsDone = false;
        CreatedAt = DateTime.Now;                // 在建構子設定唯讀屬性
    }

    public void MarkDone()                       // 只能透過這個方法改 IsDone
    {
        IsDone = true;
    }
}

var todo = new TodoItem("買牛奶");
todo.MarkDone();                  // 正確的方式改狀態
// todo.IsDone = false;          // ❌ 不行！IsDone 的 set 是 private
Console.WriteLine($"{todo.Title} 完成={todo.IsDone} 建立於={todo.CreatedAt}");
```

說明：現在 `IsDone` 只能透過 `MarkDone()` 改——外界無法亂設狀態。這就是封裝：**把「怎麼改狀態」的控制權收回物件自己手上**，更安全、更好維護。

## 小練習

1. 給 [csharp-2-1] 的 `Book` 用「自動屬性」改寫 `Title`、`Author`、`Pages`。
2. 把 `Pages` 改成「有驗證的屬性」：`set` 時若頁數 ≤ 0 就丟例外。
3. 加一個 `bool IsBorrowed { get; private set; }`，只能透過 `Borrow()` / `Return()` 方法改，測試外界無法直接設它。

<details>
<summary>參考解答</summary>

**第 1 題：用自動屬性改寫 `Title`、`Author`、`Pages`**

自動屬性 `{ get; set; }` 讓編譯器自動幫你產生背後的私有欄位，不用手寫 `_title` 那些：

```csharp
class Book
{
    public string Title { get; set; }
    public string Author { get; set; }
    public int Pages { get; set; }

    public Book(string title, string author, int pages)
    {
        Title = title;
        Author = author;
        Pages = pages;
    }
}
```

用起來和欄位一模一樣（`book.Title = "..."`），但它其實是「受控的存取點」，之後想加驗證隨時能升級成完整屬性——這正是第 2 題要做的。

**第 2 題：把 `Pages` 改成有驗證的屬性**

當一個屬性需要驗證，就從自動屬性展開成「有 `private` 欄位 + 完整 `get`/`set`」的寫法，在 `set` 裡擋掉不合理的值：

```csharp
class Book
{
    public string Title { get; set; }
    public string Author { get; set; }

    private int _pages;
    public int Pages
    {
        get { return _pages; }
        set
        {
            if (value <= 0)      // value 是外界要設的新值
                throw new ArgumentException($"頁數必須大於 0，收到的是 {value}");
            _pages = value;
        }
    }

    public Book(string title, string author, int pages)
    {
        Title = title;
        Author = author;
        Pages = pages;           // 走 set，一樣會被驗證
    }
}

// 測試
var book = new Book("正常書", "作者", 300);   // OK
// var bad = new Book("壞書", "作者", -5);   // 丟例外：頁數必須大於 0
```

注意連建構子裡的 `Pages = pages` 也會經過 `set` 的驗證，所以「一開始就給錯的值」也擋得住。

**第 3 題：加只能由內部改的 `IsBorrowed`**

用 `{ get; private set; }` 讓外界只能讀不能寫，狀態只能透過 `Borrow()` / `Return()` 這兩個方法改：

```csharp
class Book
{
    public string Title { get; set; }
    public string Author { get; set; }
    public int Pages { get; set; }
    public bool IsBorrowed { get; private set; }   // 外界只能讀

    public Book(string title, string author, int pages)
    {
        Title = title;
        Author = author;
        Pages = pages;
        IsBorrowed = false;
    }

    public void Borrow()
    {
        IsBorrowed = true;
    }

    public void Return()
    {
        IsBorrowed = false;
    }
}

var book = new Book("深入淺出 C#", "作者", 420);
book.Borrow();
Console.WriteLine(book.IsBorrowed);   // True（讀得到）
book.Return();
Console.WriteLine(book.IsBorrowed);   // False
// book.IsBorrowed = true;            // ❌ 編譯錯誤！set 是 private，外界不能直接設
```

最後那行如果解除註解會直接編譯失敗——這正是封裝的目的：把「怎麼改狀態」的控制權收回物件自己手上。這裡的 `Borrow()`/`Return()` 各只做一件事 → **[課外讀物 E-7-2] S — Single Responsibility Principle**。

</details>

## 課外讀物

> 封裝 = 抽象、最小暴露 → **cs 課程 Part 8-1**、[課外讀物 E-7-5：介面隔離](../../../課外讀物/E-7-solid/E-7-5-isp.md)

> 下一步：物件導向的繼承與多型 → [csharp-2-3]
