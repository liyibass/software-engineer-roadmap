# [csharp-3-1] 泛型（Generics）：寫一次、適用多種型別

> **本章目標**：掌握泛型——讓你「寫一次程式碼、適用多種型別」，避免重複，也是 `List<T>`、`Dictionary<K,V>` 背後的機制。

## 你會學到

- 為什麼需要泛型（重複的痛）
- 泛型方法與泛型類別
- 泛型約束（constraint）
- 泛型怎麼兼顧型別安全與重用

## 概念說明

### 重複的痛

假設你要寫「回傳清單第一個元素」的方法。為 `int` 寫一個、為 `string` 寫一個、為每種型別都寫一個……邏輯一樣只是型別不同，超浪費（違反 DRY，[課外讀物 E-6-1](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)）。

**泛型（generics）** 讓「型別」變成一個「可以填空的參數」。你寫一份「型別待定」的模板，用的時候才指定型別。比喻（呼應 rust 課程 [rust-5-1]）：

```
泛型像「填空模板」：「回傳 List<___> 的第一個 ___」
   ___ 可以是 int、string、任何型別
你寫一次，編譯器幫你套用到各種型別，且保持型別安全。
```

慣例用 `T`（Type）代表型別參數。你早就用過泛型——`List<T>`、`Dictionary<K,V>`（[csharp-1-5]）的 `<T>` 就是！

## 程式碼範例

### 泛型方法

```csharp
// <T> 宣告型別參數；參數和回傳都用 T
T First<T>(List<T> list)
{
    return list[0];
}

// 用：編譯器自動推斷 T
List<int> numbers = new List<int> { 10, 20, 30 };
int firstNum = First(numbers);        // T 推斷成 int → 10

List<string> names = new List<string> { "Amy", "Bob" };
string firstName = First(names);       // T 推斷成 string → "Amy"
```

說明：`First<T>` 一份程式碼，適用 `int`、`string` 或任何型別。呼叫時編譯器**自動推斷 T**。關鍵是——它**保持型別安全**：`First(numbers)` 回傳的就是 `int`（不是 `object` 之類要再轉型的東西），編譯器全程知道型別。

### 泛型類別

class 也能泛型化——例如一個「能裝任何型別的盒子」：

```csharp
class Box<T>
{
    public T Content { get; set; }

    public Box(T content)
    {
        Content = content;
    }

    public void Show()
    {
        Console.WriteLine($"盒子裡裝著：{Content}");
    }
}

var intBox = new Box<int>(42);          // 裝 int 的盒子
var strBox = new Box<string>("hello");   // 裝 string 的盒子
intBox.Show();      // 盒子裡裝著：42
```

說明：`Box<T>` 可以是「裝 int 的盒子」或「裝 string 的盒子」，不用為每種型別各寫一個 class。`List<T>` 就是這樣設計的——一個泛型類別，能裝任何型別。

### 泛型約束（constraint）

有時你想「限制 T 必須具備某些能力」（呼應 rust 的 trait bound [rust-5-1]）。用 `where` 加**約束**：

```csharp
// 限制 T 必須實作 IComparable（才能比較大小）
T Max<T>(List<T> list) where T : IComparable<T>
{
    T max = list[0];
    foreach (var item in list)
    {
        if (item.CompareTo(max) > 0)   // 因為有約束，才能用 CompareTo
            max = item;
    }
    return max;
}

Console.WriteLine(Max(new List<int> { 3, 7, 2 }));     // 7
Console.WriteLine(Max(new List<string> { "a", "z" }));  // z
```

說明：`where T : IComparable<T>` 約束「T 必須能比較大小」（實作了 `IComparable` 介面，[csharp-2-4]）。有了約束，編譯器才允許你在方法裡用 `CompareTo`。常見約束還有 `where T : class`（必須是參考型別）、`where T : new()`（必須有無參數建構子）等。

## 小練習

1. 寫一個泛型方法 `Last<T>(List<T> list)` 回傳最後一個元素，用 int 和 string 各測一次。
2. 寫一個泛型類別 `Pair<T>`，有兩個同型別的屬性 `First`、`Second`，建立 int 版和 string 版。
3. 思考題：為什麼泛型比「用 `object` 裝所有東西、再轉型」更好？（提示：型別安全、不用轉型、編譯期就抓錯。）

<details>
<summary>參考解答</summary>

**第 1 題：泛型方法 `Last<T>`**

和 `First<T>` 一樣是「型別待定」的模板，只是回傳 `list[list.Count - 1]`（清單最後一個索引）。呼叫時編譯器一樣會自動推斷 `T`：

```csharp
T Last<T>(List<T> list)
{
    return list[list.Count - 1];   // Count - 1 是最後一個元素的索引
}

List<int> numbers = new List<int> { 10, 20, 30 };
Console.WriteLine(Last(numbers));       // T 推斷成 int → 30

List<string> names = new List<string> { "Amy", "Bob" };
Console.WriteLine(Last(names));         // T 推斷成 string → "Bob"
```

驗收點：`int` 版印出 `30`、`string` 版印出 `Bob`，且回傳值就是原本的型別（不用再轉型）。

**第 2 題：泛型類別 `Pair<T>`**

兩個屬性都是同一個型別參數 `T`，所以「int 版」的 `First`、`Second` 都是 int，「string 版」的都是 string：

```csharp
class Pair<T>
{
    public T First { get; set; }
    public T Second { get; set; }

    public Pair(T first, T second)
    {
        First = first;
        Second = second;
    }
}

var intPair = new Pair<int>(1, 2);
Console.WriteLine($"{intPair.First}, {intPair.Second}");        // 1, 2

var strPair = new Pair<string>("hello", "world");
Console.WriteLine($"{strPair.First}, {strPair.Second}");        // hello, world
```

驗收點：兩種型別都能建立，屬性型別各自對應（`intPair.First` 是 int、`strPair.First` 是 string），編譯器全程知道型別。

**第 3 題（思考題）：泛型 vs `object` + 轉型**

用 `object` 裝所有東西看起來也能「通用」，但有三個大問題，泛型全部解決：

1. **型別安全**：`object` 版本什麼都吃得下，你可以不小心把一個 `string` 塞進「本來想放 int」的清單，編譯器不會擋，等到執行期才爆炸。泛型的 `List<int>` 只收 int，放錯東西**編譯期就報錯**。
2. **不用轉型**：從 `object` 拿東西出來，型別是 `object`，你得手動 `(int)` 轉回來——囉嗦又容易轉錯（轉錯會丟 `InvalidCastException`）。泛型拿出來就是 `int`，直接用。
3. **效能**：把 `int`（實值型別）裝進 `object` 會發生**裝箱（boxing）**，多一層包裝與記憶體配置；泛型沒有這個成本。

一句話總結：泛型讓編譯器「全程知道真正的型別」，所以能在**編譯期**幫你抓錯、省去轉型、避免裝箱；`object` 則是把型別資訊丟掉、把風險延後到執行期。

> 這正是「不要重複自己（DRY）」＋「型別安全」的體現 → [課外讀物 E-6-1](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)

</details>

## 課外讀物

> 泛型概念（trait bound 對照）→ **rust 課程 [rust-5-1]**；不要重複自己（DRY）→ [課外讀物 E-6-1](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)

> 泛型是 dsa 資料結構的基礎 → **dsa 課程**（List/Map 都是泛型）

> 下一步：用 LINQ 優雅地操作資料 → [csharp-3-2]
