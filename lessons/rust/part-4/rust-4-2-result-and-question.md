# [rust-4-2] `Result` 與 `?` 運算子：優雅地把錯誤往上傳

> **本章目標**：學會 `?` 運算子——Rust 處理「一連串可能失敗的操作」時的神兵利器，讓錯誤處理的程式碼從一堆巢狀 `match` 變得清爽筆直。

## 你會學到

- 「錯誤往上傳（propagation）」是什麼意思、為什麼需要
- 沒有 `?` 時，串接失敗操作有多囉嗦
- `?` 運算子怎麼把那些囉嗦變成一個符號
- `?` 的使用條件（函式回傳型別要相容）

## 概念說明

### 不是每個錯誤都該「就地處理」

有時候一個函式遇到錯誤，**它自己沒辦法（也不該）決定怎麼辦**，最好的做法是「把錯誤回報給呼叫它的人」，讓上層決定。這叫**錯誤往上傳遞（propagation）**。

比喻：櫃台人員（底層函式）發現「客人要的東西缺貨」，他不會自己亂做決定，而是把問題上報給主管（呼叫者）處理。

問題是，如果一連串操作每一步都可能失敗，而每一步都要「失敗就往上傳」，用 `match` 寫會變成一座巢狀地獄：

```rust
// 沒有 ? 的痛苦：讀檔 → 轉數字，每步都可能失敗
fn read_number() -> Result<i32, String> {
    let content = match read_file() {
        Ok(c) => c,
        Err(e) => return Err(e),        // 失敗就往上傳
    };
    let number = match content.parse::<i32>() {
        Ok(n) => n,
        Err(_) => return Err(String::from("不是數字")),
    };
    Ok(number)
}
```

每一步都重複「`match`、成功取值、失敗 `return Err`」這個樣板。三四步下來就一團亂——這正是 [rust-1-5] 提過的「巢狀地獄」反模式。

### `?`：一個符號搞定「失敗就往上傳」

Rust 提供 `?` 運算子，把上面那一大坨濃縮成一個字。`?` 放在一個回傳 `Result` 的運算式後面，意思是：

```
這個運算式.?  →  如果是 Ok(值)，就把「值」取出來繼續用；
                如果是 Err(錯誤)，就「立刻 return 這個 Err」，把錯誤往上傳。
```

換句話說，`?` 自動做了「成功就解開、失敗就提早回傳錯誤」這件事。

## 程式碼範例

### 用 ? 改寫，瞬間清爽

```rust
fn read_number() -> Result<i32, String> {
    let content = read_file()?;               // 失敗自動往上傳
    let number = content.parse::<i32>()
        .map_err(|_| String::from("不是數字"))?;   // 失敗自動往上傳
    Ok(number)
}
```

對比上一段的巢狀 `match`，這裡每個可能失敗的步驟後面只多一個 `?`，程式碼**像沒有錯誤處理一樣筆直好讀**，但其實每一步的失敗都被妥善地往上傳了。`?` 是 Rust 錯誤處理體驗的關鍵——它讓「正確處理錯誤」不再痛苦。

> `.map_err(...)` 是把底層的錯誤型別轉成我們函式宣告的錯誤型別（這裡轉成 `String`）。實務上常用專門的錯誤處理 crate（像 `anyhow`）讓這件事更省事，[rust-4-3] 會提。

### `?` 的使用條件

`?` 不能隨便用——它要「提早 return 一個 `Err`」，所以**它所在的函式，回傳型別必須是 `Result`（或 `Option`）**。

```rust
fn main() {
    let n = read_number()?;    // ❌ 通常不行：main 預設不回傳 Result
}
```

上面常會報錯，因為 `main` 預設回傳 `()`（什麼都不回傳），`?` 沒有 `Err` 可以 return 到哪去。兩個解法：

```rust
// 解法一：在 main 裡用 match 好好處理
fn main() {
    match read_number() {
        Ok(n) => println!("數字是 {}", n),
        Err(e) => println!("出錯：{}", e),
    }
}
```

```rust
// 解法二：讓 main 也回傳 Result（Rust 允許）
fn main() -> Result<(), String> {
    let n = read_number()?;
    println!("數字是 {}", n);
    Ok(())
}
```

說明：解法二讓 `main` 回傳 `Result`，於是 `?` 可以在 `main` 裡用了；如果最後回傳 `Err`，程式會印出錯誤並以非零狀態結束。兩種都常見，看你想不想在 `main` 裡客製化錯誤訊息。

### `?` 也能用在 Option

`?` 不只用於 `Result`，也能用於 `Option`——遇到 `None` 就提早回傳 `None`：

```rust
fn first_char_upper(s: &str) -> Option<char> {
    let first = s.chars().next()?;        // 沒有字元就回傳 None
    Some(first.to_ascii_uppercase())
}
```

說明：`s.chars().next()` 回傳 `Option<char>`，`?` 在 `None` 時直接讓函式回傳 `None`，有值才繼續。一樣讓程式筆直好讀。

## 小練習

1. 寫一個函式 `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>`：把字串轉成數字（用 `s.parse::<i32>()?`），再回傳它的兩倍。在 `main` 用 `match` 測 `"21"` 和 `"abc"`。
2. 把練習 1 改成「`main` 也回傳 `Result`」的寫法，在 `main` 裡用 `?` 呼叫它。
3. 用 `Option` 版的 `?` 寫一個 `fn second_char(s: &str) -> Option<char>`，回傳第二個字元（沒有就 `None`）。

<details>
<summary>參考解答</summary>

**練習 1：`parse_and_double`**

```rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    let n = s.parse::<i32>()?;   // 失敗就自動 return 這個 Err
    Ok(n * 2)
}

fn main() {
    match parse_and_double("21") {
        Ok(n) => println!("兩倍是 {}", n),
        Err(e) => println!("出錯：{}", e),
    }

    match parse_and_double("abc") {
        Ok(n) => println!("兩倍是 {}", n),
        Err(e) => println!("出錯：{}", e),
    }
}
```

`"21"` 會印出 `兩倍是 42`；`"abc"` 會走 `Err`，印出 `出錯：invalid digit found in string`。這裡函式的錯誤型別直接宣告成 `std::num::ParseIntError`——剛好就是 `parse` 失敗時給的錯誤型別，所以 `?` 不需要任何轉換就能把錯誤原封不動往上傳。

**練習 2：讓 `main` 也回傳 `Result`**

```rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    let n = s.parse::<i32>()?;
    Ok(n * 2)
}

fn main() -> Result<(), std::num::ParseIntError> {
    let n = parse_and_double("21")?;   // 在 main 裡也能用 ? 了
    println!("兩倍是 {}", n);
    Ok(())
}
```

因為 `main` 現在回傳 `Result<(), std::num::ParseIntError>`，`?` 就有地方可以 `return Err` 了。如果把 `"21"` 換成 `"abc"`，`?` 會讓 `main` 提早回傳 `Err`，程式會把錯誤印出來並以非零狀態碼結束（代表「這次執行失敗了」）。注意 `main` 的錯誤型別要跟 `parse_and_double` 相容，`?` 才會通過。

**練習 3：`Option` 版的 `?`**

```rust
fn second_char(s: &str) -> Option<char> {
    let mut chars = s.chars();
    chars.next()?;              // 先跳過第一個字元；沒有就直接回傳 None
    let second = chars.next()?; // 再取第二個；沒有一樣回傳 None
    Some(second)
}

fn main() {
    println!("{:?}", second_char("hello")); // Some('e')
    println!("{:?}", second_char("h"));      // None（只有一個字元）
    println!("{:?}", second_char(""));       // None（空字串）
}
```

`s.chars()` 會給我們一個逐字元的迭代器。第一次 `chars.next()?` 拿走第一個字元——我們不需要它的值，但用 `?` 可以順便處理「空字串」的情況（`None` 就直接回傳 `None`）。第二次 `chars.next()?` 才是我們要的第二個字元，一樣沒有就回傳 `None`。全部都有值時包成 `Some(second)` 回傳。可以看到 `?` 用在 `Option` 上時，邏輯是「遇到 `None` 就提早回傳 `None`」，讓程式一樣筆直好讀。

</details>

## 課外讀物

> 「巢狀地獄」是可讀性反模式，`?` 正是 Rust 對它的解藥 → [課外讀物 E-6-6：程式碼異味與反模式](../../../課外讀物/E-6-best-practices/E-6-6-anti-patterns.md)

> 下一節：錯誤處理的好習慣，以及讓 `?` 更好用的 crate → [rust-4-3]
