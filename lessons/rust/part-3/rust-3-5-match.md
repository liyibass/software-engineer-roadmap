# [rust-3-5] 模式比對 `match`：強大又安全的分支

> **本章目標**：掌握 `match`——Rust 最強大的控制流工具。它能根據一個值的「樣子」分流處理，而且編譯器會強迫你「每種情況都處理到」。

## 你會學到

- `match` 怎麼根據值的不同樣子分流
- 為什麼 `match` 比一長串 `if-else` 安全
- 「窮盡性檢查」：編譯器逼你處理每一種可能
- 怎麼在 match 裡「取出」enum 變體攜帶的資料

## 概念說明

### match：超級加強版的「分流」

`match` 有點像其他語言的 `switch`，但強大得多。它拿一個值，逐一比對「這個值符不符合某個樣子（pattern，模式）」，符合就執行對應的分支。

比喻：`match` 像郵局的自動分信機——每封信（值）依「它的樣子」被分到對應的格子（分支）去處理：

```
把 號誌燈 拿去比對：
    如果是 紅燈 → 停車
    如果是 黃燈 → 減速
    如果是 綠燈 → 通行
```

`match` 最關鍵的特性是 **窮盡性（exhaustiveness）**：**你必須處理「所有可能的情況」，否則編譯不過。** 這正是它比 `if-else` 安全的地方——你不可能「忘記某個 case」，因為編譯器會抓出來。

## 程式碼範例

### 基本 match

```rust
enum Light {
    Red,
    Yellow,
    Green,
}

fn action(light: Light) -> &'static str {
    match light {
        Light::Red => "停車",
        Light::Yellow => "減速",
        Light::Green => "通行",
    }
}

fn main() {
    println!("{}", action(Light::Green));   // 通行
}
```

說明：`match light { ... }` 逐一比對 `light` 是哪個變體。每個「分支臂」是 `模式 => 結果`。因為 `match` 是表達式（呼應 [rust-1-4]），整個 `match` 會算出一個值，這裡直接被回傳。

### 窮盡性檢查：忘了一種就編譯失敗

試著故意漏掉一種：

```rust
fn action(light: Light) -> &'static str {
    match light {
        Light::Red => "停車",
        Light::Green => "通行",
        // 忘了 Yellow！
    }
}
```

編譯器立刻抓出來：

```
error[E0004]: non-exhaustive patterns: `Light::Yellow` not covered
```

它明確說「你沒處理 `Yellow`」。**這個保護超有價值**——當你之後給 `Light` enum 新增一個變體（例如閃黃燈），所有沒處理新變體的 `match` 都會編譯失敗，逼你回去補上。你不會「默默漏掉新情況」而埋下 bug。

> 這呼應一個設計原則：當需求改變（enum 多一個變體），編譯器幫你找出所有需要跟著改的地方 → [課外讀物 E-7-3：開放封閉原則](../../../課外讀物/E-7-solid/E-7-3-ocp.md)

### 在 match 裡取出變體帶的資料

還記得 [rust-3-3] 說 enum 變體能帶資料嗎？`match` 能在比對的同時**把那些資料解構出來**：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn process(msg: Message) {
    match msg {
        Message::Quit => println!("結束"),
        Message::Move { x, y } => println!("移動到 ({}, {})", x, y),   // 取出 x, y
        Message::Write(text) => println!("寫入：{}", text),            // 取出 text
    }
}
```

說明：`Message::Move { x, y }` 不只比對「是不是 Move」，還順手把它帶的 `x`、`y` 取出來給你用；`Message::Write(text)` 把字串綁到 `text`。**這就是 enum + match 的威力**——分流的同時把資料拆出來，一氣呵成。

### `_` 萬用模式：其餘的都歸這

如果你只關心幾種情況，其餘的想統一處理，用 `_`（底線，代表「任何其他值」）：

```rust
fn describe(n: i32) -> &'static str {
    match n {
        0 => "零",
        1 => "一",
        _ => "很多",          // 其餘所有數字
    }
}
```

說明：`_` 接住「前面沒列到的所有情況」，也讓 `match` 維持窮盡。注意：別濫用 `_` 來偷懶蓋掉 enum——那會讓你失去「新增變體時編譯器提醒你」的好處。`_` 適合用在「真的有無限多種值」（像所有整數）的時候。

## 小練習

1. 用 [rust-3-3] 的 `Coin` enum（Penny/Nickel/Dime/Quarter），寫一個 `fn value(coin: Coin) -> u32` 用 `match` 回傳對應幣值（1/5/10/25）。
2. 把 [rust-3-4] 的 `Option` 例子用 `match` 處理 `Some(n)` 與 `None`，分別印出不同訊息。
3. 寫一個 `match`，對一個 `i32`：負數印「負」、0 印「零」、正數印「正」（提示：可以用條件式的模式 `n if n < 0 => ...`，查查看「match guard」）。

<details>
<summary>參考解答</summary>

**第 1 題：Coin 的幣值**

`match` 把每個變體對應到它的幣值，因為四個變體都列到了，`match` 是窮盡的：

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    println!("{}", value(Coin::Quarter));   // 25
}
```

**第 2 題：用 match 處理 Option**

沿用上一節找偶數的例子，`match` 逼你同時處理 `Some` 和 `None`，還順手把 `Some` 裡的值取出來：

```rust
fn first_even(numbers: &[i32]) -> Option<i32> {
    for &n in numbers {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}

fn main() {
    let nums = [1, 3, 5, 8, 9];
    match first_even(&nums) {
        Some(n) => println!("找到偶數：{}", n),   // 取出 n 來用
        None => println!("沒有偶數"),
    }
}
```

**第 3 題：用 match guard 判斷正負**

單純的模式沒辦法表達「小於 0」這種條件，這時用 **match guard**——在模式後面加 `if 條件`：

```rust
fn sign(n: i32) -> &'static str {
    match n {
        0 => "零",
        n if n < 0 => "負",   // match guard：綁定 n 後，再用 if 判斷
        _ => "正",            // 到這裡的一定 > 0（0 和負數都被前面接走了）
    }
}

fn main() {
    println!("{}", sign(-5));   // 負
    println!("{}", sign(0));    // 零
    println!("{}", sign(42));   // 正
}
```

重點：分支是**由上往下比對**的，所以順序有意義。`0 => ...` 先接走 0，`n if n < 0` 接走負數，剩下能走到 `_` 的必然是正數。用 `_` 收尾也讓 `match` 保持窮盡（涵蓋所有 `i32`）。

</details>

## 課外讀物

> 「新增情況時，編譯器幫你找出所有要改的地方」呼應開放封閉原則 → [課外讀物 E-7-3：開放封閉原則](../../../課外讀物/E-7-solid/E-7-3-ocp.md)

> 下一節 [rust-3-6]：當你只關心「一種情況」時，比 match 更簡潔的 `if let`
