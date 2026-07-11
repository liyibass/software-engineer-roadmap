# [rust-5-1] 泛型（Generics）：同一段邏輯，適用多種型別

> **本章目標**：學會泛型——讓你「寫一次程式，適用很多種型別」，避免為每種型別重複複製貼上一樣的邏輯。

## 你會學到

- 為什麼需要泛型（重複程式碼的痛）
- 用 `<T>` 寫泛型函式
- 泛型怎麼用在 struct、enum 上
- 泛型是「零成本」的（編譯期就展開）

## 概念說明

### 重複的痛

假設你要寫一個「回傳兩者中較大者」的函式。先寫給 `i32`：

```rust
fn larger_i32(a: i32, b: i32) -> i32 {
    if a > b { a } else { b }
}
```

然後又需要一個給 `f64` 的……邏輯一模一樣，只有型別不同，卻得整段複製貼上、改個型別。如果還要支援其他型別，就更多份。這違反了「不要重複自己（DRY，Don't Repeat Yourself）」。

**泛型**讓你把「型別」也變成一個「可以填空的參數」。比喻：

```
泛型像一張「填空題模板」：
    「回傳 ___ 和 ___ 之中較大的那個」
    ___ 可以是 i32、f64、或任何能比較大小的型別
你寫一次模板，編譯器幫你套用到各種型別。
```

慣例上，這個「型別空格」用一個大寫字母代表，最常見是 **`T`**（Type 的縮寫）。

## 程式碼範例

### 泛型函式

```rust
// <T> 宣告一個型別參數 T；a、b、回傳值都是 T
fn larger<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

fn main() {
    println!("{}", larger(3, 7));        // T 被推斷成 i32 → 7
    println!("{}", larger(2.5, 1.8));    // T 被推斷成 f64 → 2.5
    println!("{}", larger('a', 'z'));    // T 是 char → z
}
```

說明：

- `fn larger<T>(...)`：`<T>` 宣告「這個函式有一個型別參數 `T`」。之後 `a: T`、`b: T`、`-> T` 都用這個 `T`。
- 呼叫時你不用指定 `T` 是什麼，編譯器**從你傳的值自動推斷**（傳整數就是 `i32`，傳小數就是 `f64`）。
- `T: PartialOrd` 是**限制條件**——下面說明。

### 為什麼要 `T: PartialOrd`？

我們的函式用了 `a > b`（比較大小）。但不是「任何型別」都能比大小！如果 `T` 是某種「無法比較」的型別，`a > b` 就沒意義。

所以我們要對 `T` 加一個**限制（trait bound）**：`T: PartialOrd`，意思是「`T` 必須是『能比較大小』的型別」。這樣編譯器才知道 `a > b` 合法。`PartialOrd` 是一個「特徵（trait）」——下一節 [rust-5-2] 就會深入特徵。現在你只要理解：**泛型常常需要說明「這個型別必須具備某種能力」**。

### 泛型用在 struct

struct 也能泛型化——例如一個「能裝任何型別的座標點」：

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 3, y: 5 };        // T = i32
    let float_point = Point { x: 1.2, y: 4.8 };  // T = f64
    println!("{} {}", int_point.x, float_point.y);
}
```

說明：`Point<T>` 可以是「整數座標」或「浮點座標」，不用為各型別各寫一個 struct。你早就用過泛型 struct/enum 了——[rust-3-4] 的 `Option<T>`、[rust-4-1] 的 `Result<T, E>` 就是！那個 `<T>` 正是泛型。

### 泛型是「零成本」的

你可能擔心：「這麼彈性，是不是執行時會變慢？」**不會**。Rust 在編譯時用一種叫「單態化（monomorphization）」的技術，**幫你針對實際用到的每種型別，各生成一份專屬的程式碼**。

```
你寫的：     larger<T>（一份泛型模板）
你用了 i32 和 f64
編譯器生成： larger_i32、larger_f64（兩份具體程式碼）
```

所以執行時跑的是「為 `i32` 量身打造」的版本，速度和你手寫專用函式一模一樣。**彈性在編譯期實現，執行期零額外成本**——這是 Rust「零成本抽象」哲學的又一個體現。

## 小練習

1. 寫一個泛型函式 `fn first<T>(pair: (T, T)) -> T`，回傳一個 tuple 的第一個元素（提示：這個不用比較大小，所以不需要 `PartialOrd` 限制；但 `T` 要能被回傳，可能要 `Clone` 或直接拆解）。先試試回傳 `pair.0`。
2. 寫一個泛型 struct `Pair<T>`，有兩個同型別欄位 `first`、`second`，建立一個整數版和一個字串版。
3. 思考題：`larger` 函式如果不加 `T: PartialOrd` 限制，為什麼會編譯失敗？（提示：編譯器怎麼知道任意的 `T` 能不能用 `>` 比較？）

<details>
<summary>參考解答</summary>

**第 1 題：泛型函式 `first`**

要回傳 tuple 的第一個元素。用 `pair.0` 把它「拿出來」——因為 `pair` 是傳值進來（函式取得了 tuple 的所有權），所以直接把 `.0` 搬出來回傳就好，不需要 `Clone`，也不需要 `PartialOrd`（我們沒有比較大小）：

```rust
fn first<T>(pair: (T, T)) -> T {
    pair.0
}

fn main() {
    println!("{}", first((10, 20)));           // 10
    println!("{}", first(("hello", "world"))); // hello
}
```

小提醒：這裡不需要任何 trait bound，因為「回傳一個值」對任何型別都成立。只有當你要「對 `T` 做某件事」（比較、印出、複製…）時，才需要對應的 trait 限制。

**第 2 題：泛型 struct `Pair<T>`**

兩個欄位同型別，所以共用一個 `T`：

```rust
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let int_pair = Pair { first: 1, second: 2 };              // T = i32
    let str_pair = Pair { first: String::from("a"), second: String::from("b") }; // T = String
    println!("{} {}", int_pair.first, int_pair.second);
    println!("{} {}", str_pair.first, str_pair.second);
}
```

注意兩個欄位是「同一個 `T`」，所以 `Pair { first: 1, second: "x" }` 會編譯失敗（一個 `i32`、一個 `&str` 不一致）。如果你想要兩欄位可以不同型別，就得寫成 `Pair<T, U>` 兩個型別參數。

**第 3 題：為什麼不加 `T: PartialOrd` 會編譯失敗？**

因為泛型的 `T` 代表「任何型別」，而不是所有型別都能用 `>` 比較大小（例如兩個函式、兩個沒定義順序的自訂 struct，比大小根本沒意義）。編譯器在編譯 `larger` 這份泛型模板時，並不知道你未來會傳什麼型別進來，所以它**必須在函式簽名就看到保證**：「`T` 一定具備『能比較大小』這個能力」。

`T: PartialOrd` 就是這個保證——它告訴編譯器「只准傳有實作 `PartialOrd` 的型別」。少了它，編譯器面對 `a > b` 只能說「我無法確定任意的 `T` 支不支援 `>`」而拒絕編譯。這正是 Rust 的哲學：能力要在編譯期就講清楚，而不是等到執行時才爆炸。

</details>

## 課外讀物

> 「不要重複自己（DRY）」是重要的程式設計原則 → [課外讀物 E-6-1：什麼是 Clean Code](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)

> 下一節：泛型的好搭檔——特徵（trait），Rust 版的「介面」 → [rust-5-2]
