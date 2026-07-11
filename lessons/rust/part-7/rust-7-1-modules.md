# [rust-7-1] 模組系統：`mod` / `use` / `pub` 怎麼組織與隱藏程式碼

> **本章目標**：學會用模組把程式碼分門別類，控制「誰能看到誰」，讓專案長大時依然整齊好維護。

## 你會學到

- 為什麼需要模組（程式變大後的混亂）
- 用 `mod` 建立模組、`pub` 公開、`use` 引入
- 「預設私有」的設計，以及它的好處
- 把模組拆到不同檔案

## 概念說明

### 程式變大，就需要分類

一開始程式都擠在 `main.rs`，還行。但功能一多，幾百個函式攪在一起就像「一個沒有任何分類的雜物間」——找東西、改東西都痛苦。

**模組（module）** 就是「把相關的程式碼歸到一個有名字的群組」，像把雜物間整理成「一個個貼了標籤的櫃子」：

```
模組 user   ── 放使用者相關的東西
模組 order  ── 放訂單相關的東西
模組 utils  ── 放共用小工具
```

模組還能控制**可見性**——哪些東西「對外公開」、哪些「藏在內部」。這呼應一個重要觀念：**封裝**。只把該露出的露出，內部細節藏起來，別人就不會依賴你的內部實作，你之後也好改。

> 「只暴露必要的、隱藏內部細節」呼應封裝與介面設計 → [課外讀物 E-7-5：介面隔離原則](../../../課外讀物/E-7-solid/E-7-5-isp.md)

## 程式碼範例

### 用 mod 建立模組

```rust
mod math {                        // 定義一個模組 math
    pub fn add(a: i32, b: i32) -> i32 {    // pub = 公開，外面能用
        a + b
    }

    fn secret() -> i32 {          // 沒 pub = 私有，只有模組內能用
        42
    }
}

fn main() {
    let sum = math::add(3, 5);    // 用 模組名::函式 存取
    println!("{}", sum);          // 8
    // math::secret();            // ❌ secret 是私有的，外面看不到
}
```

說明：

- `mod math { ... }` 定義一個模組，裡面放相關函式。
- 用 `math::add(...)` 這種「模組名::項目」的路徑存取（雙冒號 `::`，你在 `String::from`、`HashMap::new` 早就看過）。
- **重點：模組裡的東西「預設是私有的」**，只有加了 `pub` 才對外公開。`add` 有 `pub` 所以外面能用，`secret` 沒有所以只能在 `math` 內部用。

### 為什麼「預設私有」是好事

這呼應 [rust-1-1] 的「預設不可變」哲學——Rust 喜歡「**預設給最少的權限，要開放才明講**」。預設私有的好處：

- 你能放心修改/刪除私有的東西，**保證不會影響到模組外**（因為外面根本碰不到）。
- 模組對外的「公開介面」很清楚——就是那些 `pub` 的東西。內部怎麼實作是你的自由。

這讓大型專案好維護：改內部不怕牽一髮動全身。

### 用 use 省去重複的長路徑

每次都寫 `math::add` 有點長。`use` 可以把某個項目「引進當前範圍」，之後直接用短名字：

```rust
mod math {
    pub fn add(a: i32, b: i32) -> i32 { a + b }
}

use math::add;                    // 把 add 引進來

fn main() {
    println!("{}", add(3, 5));    // 直接用 add，不用寫 math::add
}
```

說明：`use math::add;` 之後就能直接寫 `add`。你前面用過 `use std::collections::HashMap;`（[rust-6-3]）、`use colored::Colorize;`（[rust-0-4]）——都是同個機制，把標準庫或外部 crate 的東西引進來用。

### 把模組拆到不同檔案

模組大了，可以放到獨立檔案，保持 `main.rs` 清爽。把 `math` 模組搬到 `src/math.rs`：

```rust
// src/math.rs —— 檔名就是模組名，內容直接是模組本體
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```rust
// src/main.rs
mod math;                    // 宣告：去找 math.rs（或 math/ 資料夾）載入

fn main() {
    println!("{}", math::add(3, 5));
}
```

說明：`mod math;`（注意是分號、不是大括號）告訴編譯器「`math` 模組的內容在另一個檔案 `math.rs` 裡，去載入它」。這樣每個模組一個檔案，專案結構清楚。更大的模組可以用 `math/` 資料夾搭配 `math/mod.rs` 來組織。

## 小練習

1. 在 `main.rs` 裡定義一個模組 `greetings`，放一個 `pub fn hello()` 印出問候語，在 `main` 用 `greetings::hello()` 呼叫。
2. 在 `greetings` 裡多放一個「沒有 `pub`」的函式，試著從 `main` 呼叫它，觀察編譯器說它私有。
3. 用 `use` 把 `greetings::hello` 引進來，改成直接呼叫 `hello()`。

<details>
<summary>參考解答</summary>

**第 1 題**：定義模組 `greetings`，裡面放一個 `pub fn hello()`，在 `main` 用完整路徑 `greetings::hello()` 呼叫。

```rust
mod greetings {
    pub fn hello() {                 // pub = 公開，main 才看得到
        println!("哈囉，歡迎來到 Rust！");
    }
}

fn main() {
    greetings::hello();              // 用「模組名::函式」的路徑存取
}
```

重點：`hello` 一定要加 `pub`，不然模組外（`main`）碰不到它——因為模組裡的東西預設是私有的。

**第 2 題**：在 `greetings` 裡再放一個「沒有 `pub`」的函式（例如 `secret`），然後從 `main` 呼叫看看。

```rust
mod greetings {
    pub fn hello() {
        println!("哈囉！");
    }

    fn secret() {                    // 沒有 pub，就是私有的
        println!("這是內部小祕密");
    }
}

fn main() {
    greetings::hello();
    greetings::secret();             // ❌ 這行會編譯失敗
}
```

編譯時你會看到類似這樣的錯誤：

```
error[E0603]: function `secret` is private
  --> src/main.rs
   |
   |     greetings::secret();
   |                ^^^^^^ private function
```

編譯器明確告訴你 `secret` 是私有的（`private function`），模組外用不了。這正是「預設私有」在保護你：內部細節不會不小心被外面依賴。如果真的想開放，就得幫 `secret` 加上 `pub`。

**第 3 題**：用 `use` 把 `greetings::hello` 引進當前範圍，之後就能直接寫 `hello()`，省掉每次都打長路徑。

```rust
mod greetings {
    pub fn hello() {
        println!("哈囉！");
    }
}

use greetings::hello;               // 把 hello 引進來

fn main() {
    hello();                        // 直接用短名字，不用寫 greetings::hello
}
```

`use greetings::hello;` 之後，`hello` 這個名字就在 `main` 所在的範圍可用了。這和你之前寫的 `use std::collections::HashMap;` 是同一個機制。

</details>

## 課外讀物

> 「封裝、只暴露必要介面」是降低耦合的關鍵 → [課外讀物 E-7-5：介面隔離原則](../../../課外讀物/E-7-solid/E-7-5-isp.md)、[課外讀物 E-6-1：什麼是 Clean Code](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)

> 下一節：怎麼找到、加入、使用別人寫的 crate → [rust-7-2]
