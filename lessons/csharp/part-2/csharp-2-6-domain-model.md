# [csharp-2-6] 🔧 動手做：用 OOP 設計一個小領域模型

> **本章目標**：把 Part 2 的物件導向知識整合起來，動手設計一個「圖書館借閱」的小領域模型，體驗用 class、封裝、介面設計真實的業務邏輯。

## 你會學到

- 怎麼把「真實世界的概念」對應成 class（領域模型）
- 整合封裝、介面、SOLID
- 用物件之間的關係（組合）建模
- 為後端開發打下設計基礎

## 概念說明

### 領域模型：把業務變成物件

**領域模型（domain model）** 就是「**用 class 把『業務領域的概念與規則』表達出來**」。例如做圖書館系統，領域裡有「書、會員、借閱」這些概念與規則（一本書同時只能借給一個人、會員最多借 5 本…）——把它們設計成 class，就是領域模型。

這是後端開發的核心技能——**後端的本質，就是「用程式表達業務規則 + 存取資料」**。Part 2 學的 OOP 工具，正是為了把業務建模得清楚、好維護。

### 我們要建模：圖書館借閱

```
概念（會變成 class）：
   Book（書）：書名、作者、是否被借走
   Member（會員）：姓名、目前借了哪些書
   Library（圖書館）：管理所有書、處理借還
業務規則（會變成方法裡的邏輯）：
   已被借走的書不能再借
   會員最多同時借 3 本
```

## 程式碼範例

```csharp
// === Book：用封裝保護狀態（csharp-2-2）===
class Book
{
    public string Title { get; }
    public string Author { get; }
    public bool IsBorrowed { get; private set; }   // 只能由內部改

    public Book(string title, string author)
    {
        Title = title;
        Author = author;
        IsBorrowed = false;
    }

    public void MarkBorrowed() => IsBorrowed = true;
    public void MarkReturned() => IsBorrowed = false;
}

// === Member：用組合持有「借閱的書」（has-a 關係，csharp-2-3）===
class Member
{
    public string Name { get; }
    private readonly List<Book> _borrowedBooks = new List<Book>();   // 組合
    public IReadOnlyList<Book> BorrowedBooks => _borrowedBooks;       // 對外唯讀

    private const int MaxBooks = 3;        // 規則：最多借 3 本（具名常數，非魔術數字）

    public Member(string name)
    {
        Name = name;
    }

    public bool CanBorrowMore() => _borrowedBooks.Count < MaxBooks;

    public void AddBook(Book book) => _borrowedBooks.Add(book);
    public void RemoveBook(Book book) => _borrowedBooks.Remove(book);
}

// === Library：協調借還，執行業務規則 ===
class Library
{
    private readonly List<Book> _books = new List<Book>();

    public void AddBook(Book book) => _books.Add(book);

    // 借書：執行業務規則
    public bool Borrow(Member member, Book book)
    {
        if (book.IsBorrowed)                          // 規則：已借走不能再借
        {
            Console.WriteLine($"《{book.Title}》已被借走");
            return false;
        }
        if (!member.CanBorrowMore())                  // 規則：最多 3 本
        {
            Console.WriteLine($"{member.Name} 已達借閱上限");
            return false;
        }
        book.MarkBorrowed();
        member.AddBook(book);
        Console.WriteLine($"{member.Name} 借了《{book.Title}》");
        return true;
    }

    public void Return(Member member, Book book)
    {
        book.MarkReturned();
        member.RemoveBook(book);
        Console.WriteLine($"{member.Name} 還了《{book.Title}》");
    }
}

// === 使用 ===
var library = new Library();
var book1 = new Book("深入淺出 C#", "某作者");
var book2 = new Book("資料結構", "另一作者");
library.AddBook(book1);
library.AddBook(book2);

var amy = new Member("Amy");
library.Borrow(amy, book1);     // Amy 借了《深入淺出 C#》

var bob = new Member("Bob");
library.Borrow(bob, book1);     // 《深入淺出 C#》已被借走（規則生效！）

library.Return(amy, book1);     // Amy 還了
library.Borrow(bob, book1);     // 現在 Bob 借得到了
```

逐項說明這個模型怎麼整合 Part 2：

- **封裝（[csharp-2-2]）**：`Book.IsBorrowed` 是 `private set`——狀態只能透過 `MarkBorrowed/MarkReturned` 改，外界不能亂設。`Member._borrowedBooks` 是 private，對外只給唯讀的 `IReadOnlyList`。
- **組合（[csharp-2-3]）**：`Member` 用「持有一個 `List<Book>`」表達「會員有借閱的書」（has-a 關係，用組合而非繼承——呼應「組合優於繼承」）。
- **單一職責（[csharp-2-5] SRP）**：`Book` 管書的狀態、`Member` 管會員、`Library` 管借還協調——各司其職。
- **業務規則集中**：借書規則（已借走/超上限）都在 `Library.Borrow` 裡，清楚好維護。
- **沒有魔術數字（[課外讀物 E-6-6](../../../課外讀物/E-6-best-practices/E-6-6-anti-patterns.md)）**：`MaxBooks = 3` 用具名常數，不直接寫 `3`。

這個小模型展示了「**用 OOP 把業務規則表達清楚**」——這正是後端開發每天在做的事。Part 4 起，你會把這種領域模型放進 ASP.NET Core，變成真正的 Web API。

## 小練習

1. 把這個圖書館模型完整打出來、跑起來，驗證「已借走不能再借」「最多借 3 本」兩個規則。
2. 加一個規則：書有「分類」，VIP 會員才能借「限定分類」的書（提示：給 Member 加 `IsVip`，給 Book 加分類）。
3. 重構練習：如果未來「借閱記錄要存進資料庫」，你會怎麼用介面（`IBookRepository`，[csharp-2-4]）把「存取」抽出來？（這預告了 [csharp-9-1] 的分層架構。）

<details>
<summary>參考解答</summary>

**第 1 題（動手做）：完整打出來、跑起來，驗證兩個規則**

做法：把本章「程式碼範例」的 `Book` / `Member` / `Library` 三個 class 加上使用範例整段貼進一個新的 C# 主控台專案（`dotnet new console` 後放進 `Program.cs`），然後 `dotnet run`。要驗證兩個規則，可以刻意觸發它們：

```csharp
var library = new Library();
var book1 = new Book("深入淺出 C#", "某作者");
library.AddBook(book1);

var amy = new Member("Amy");
var bob = new Member("Bob");

// 驗證「已借走不能再借」
library.Borrow(amy, book1);   // Amy 借了《深入淺出 C#》
library.Borrow(bob, book1);   // 《深入淺出 C#》已被借走 → 回傳 false

// 驗證「最多借 3 本」
var b2 = new Book("書2", "作者"); var b3 = new Book("書3", "作者");
var b4 = new Book("書4", "作者"); var b5 = new Book("書5", "作者");
library.AddBook(b2); library.AddBook(b3); library.AddBook(b4); library.AddBook(b5);
library.Borrow(bob, b2);   // 第 1 本，成功
library.Borrow(bob, b3);   // 第 2 本，成功
library.Borrow(bob, b4);   // 第 3 本，成功
library.Borrow(bob, b5);   // Bob 已達借閱上限 → 回傳 false
```

**驗收點**：
- 第二次 `Borrow(bob, book1)` 印出「《深入淺出 C#》已被借走」且回傳 `false`。
- Bob 借第 4 本時印出「Bob 已達借閱上限」且回傳 `false`。
- `library.Return(amy, book1)` 之後，Bob 再借 `book1` 就成功。

> 這題需要你自行在本機實機執行、看主控台輸出確認，屬於動手驗證，光看程式碼不算完成。

**第 2 題：加「分類」與「VIP 才能借限定分類」規則**

給 `Book` 加分類、給 `Member` 加 `IsVip`，再把新規則加進 `Library.Borrow`。分類用 `enum` 比字串更安全（不會拼錯）：

```csharp
enum Category { General, Restricted }   // 一般 / 限定

class Book
{
    public string Title { get; }
    public string Author { get; }
    public Category Category { get; }            // 新增：分類
    public bool IsBorrowed { get; private set; }

    public Book(string title, string author, Category category = Category.General)
    {
        Title = title;
        Author = author;
        Category = category;
        IsBorrowed = false;
    }

    public void MarkBorrowed() => IsBorrowed = true;
    public void MarkReturned() => IsBorrowed = false;
}

class Member
{
    public string Name { get; }
    public bool IsVip { get; }                    // 新增：是否 VIP
    private readonly List<Book> _borrowedBooks = new List<Book>();
    public IReadOnlyList<Book> BorrowedBooks => _borrowedBooks;
    private const int MaxBooks = 3;

    public Member(string name, bool isVip = false)
    {
        Name = name;
        IsVip = isVip;
    }

    public bool CanBorrowMore() => _borrowedBooks.Count < MaxBooks;
    public void AddBook(Book book) => _borrowedBooks.Add(book);
    public void RemoveBook(Book book) => _borrowedBooks.Remove(book);
}

class Library
{
    private readonly List<Book> _books = new List<Book>();
    public void AddBook(Book book) => _books.Add(book);

    public bool Borrow(Member member, Book book)
    {
        if (book.IsBorrowed)
        {
            Console.WriteLine($"《{book.Title}》已被借走");
            return false;
        }
        // 新規則：限定分類只有 VIP 能借
        if (book.Category == Category.Restricted && !member.IsVip)
        {
            Console.WriteLine($"《{book.Title}》為限定書籍，只有 VIP 能借");
            return false;
        }
        if (!member.CanBorrowMore())
        {
            Console.WriteLine($"{member.Name} 已達借閱上限");
            return false;
        }
        book.MarkBorrowed();
        member.AddBook(book);
        Console.WriteLine($"{member.Name} 借了《{book.Title}》");
        return true;
    }

    public void Return(Member member, Book book)
    {
        book.MarkReturned();
        member.RemoveBook(book);
        Console.WriteLine($"{member.Name} 還了《{book.Title}》");
    }
}

// 測試
var lib = new Library();
var secret = new Book("機密檔案", "作者", Category.Restricted);
lib.AddBook(secret);
var normal = new Member("小明");            // 非 VIP
var vip = new Member("大戶", isVip: true);   // VIP
lib.Borrow(normal, secret);   // 為限定書籍，只有 VIP 能借 → false
lib.Borrow(vip, secret);      // 大戶 借了《機密檔案》 → true
```

重點：新規則只加在 `Library.Borrow`（業務規則集中的地方），`Book`、`Member` 只新增資料欄位，職責依然清楚。

**第 3 題（重構）：用介面 `IBookRepository` 把「存取」抽出來**

目前 `Library` 把書直接放在記憶體的 `List<Book>`。若未來要存進資料庫，重點是「**別讓 `Library` 綁死存取方式**」——把「怎麼存取書」抽成一個介面，`Library` 只依賴介面（依賴反轉）：

```csharp
// 1) 定義「能力合約」：怎麼存取書，Library 不需要知道細節
interface IBookRepository
{
    void Add(Book book);
    Book? FindByTitle(string title);
    IReadOnlyList<Book> GetAll();
}

// 2) 現階段用記憶體實作（跟原本行為一樣）
class InMemoryBookRepository : IBookRepository
{
    private readonly List<Book> _books = new List<Book>();
    public void Add(Book book) => _books.Add(book);
    public Book? FindByTitle(string title) => _books.FirstOrDefault(b => b.Title == title);
    public IReadOnlyList<Book> GetAll() => _books;
}

// 3) 未來要進資料庫，只要再寫一個實作，Library 完全不用改：
// class SqlBookRepository : IBookRepository { /* 連資料庫 */ }

// 4) Library 依賴「介面」，實作從建構子注入
class Library
{
    private readonly IBookRepository _books;

    public Library(IBookRepository books)   // 注入：不在乎實際是記憶體還是 SQL
    {
        _books = books;
    }

    public void AddBook(Book book) => _books.Add(book);

    public bool Borrow(Member member, Book book)
    {
        // ...借閱業務規則不變（同前）...
        return true;
    }
}

// 使用：現在給記憶體版，未來換成 new Library(new SqlBookRepository())
var library = new Library(new InMemoryBookRepository());
```

**改善了什麼**：
- `Library` 只管「借還的業務規則」，不再管「書存哪、怎麼存」——職責更單一（SRP）。
- 想換成資料庫？寫一個 `SqlBookRepository : IBookRepository`，`Library` 一行都不用改（OCP + DIP）。
- 想測試 `Library` 的借閱規則？注入一個假的 repository，不用真連資料庫。

這正是 [csharp-9-1] 分層架構的雛形——把「業務邏輯層」和「資料存取層」用介面隔開。→ **[課外讀物 E-7-6] D — 依賴反轉原則**。

</details>

## 課外讀物

> 整合的原則：封裝、SRP、組合優於繼承 → 複習 [csharp-2-2]、[csharp-2-5]、[課外讀物 E-7](../../../課外讀物/E-7-solid/E-7-1-solid-overview.md)

> 避免魔術數字等反模式 → [課外讀物 E-6-6：程式碼異味與反模式](../../../課外讀物/E-6-best-practices/E-6-6-anti-patterns.md)

> 本 Part 完成！下一步：C# 進階特性（泛型、LINQ、async）→ [csharp-3-1]
