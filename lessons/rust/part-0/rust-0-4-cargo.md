# [rust-0-4] Cargo 入門：建專案、編譯、執行、加套件的日常流程

> **本章目標**：學會用 `cargo`——Rust 的專案總管——建立專案、編譯執行、加入別人寫好的套件。這是你之後每天都會用到的工具。

## 你會學到

- `cargo` 幫你管掉哪些雜事
- 用 `cargo new` 建一個標準專案，看懂它產生的檔案
- `cargo build` / `cargo run` / `cargo check` 的差別與時機
- `Cargo.toml` 是什麼、怎麼用 `cargo add` 加套件（crate）

## 概念說明

### 為什麼不繼續用 rustc 就好？

上一章你用 `rustc main.rs` 手動編譯。一個檔案還好，但真實專案有**幾十、幾百個檔案**，還會用到**別人寫好的套件**、要跑測試、分開發版與正式版……全部手動 `rustc` 會瘋掉。

`cargo` 就是來解決這些雜事的**專案總管**。一個比喻：

```
rustc 像「一台烤箱」：能烤，但要你自己備料、計時、洗碗。
cargo 像「整間廚房 + 助手」：建專案、編譯、執行、叫食材(套件)、
       擺盤(發布)、試吃(測試)，一條龍幫你打理。
```

幾乎所有 Rust 專案都用 cargo 管理，它是社群的共同標準。

### crate 是什麼？

在 Rust 世界，**一個套件/函式庫叫做 crate**（板條箱）。你自己的專案是一個 crate，別人分享出來、可以拿來用的也是 crate。大家把 crate 發布到官方的套件倉庫 **[crates.io](https://crates.io)**，你用 cargo 一行指令就能下載來用——就像 TypeScript 世界的 npm。

> 對「套件生態系、為什麼不要重造輪子」想多了解 → [課外讀物 E-2：npm 與套件生態](../../../課外讀物/E-2-npm/E-2-1-npm-intro.md)（Rust 的 crates.io 與 npm 概念相通）

## 程式碼範例

### 建立一個專案

```bash
cargo new hello_cargo
cd hello_cargo
```

`cargo new` 幫你產生一個標準結構：

```
hello_cargo/
├── Cargo.toml      # 專案的「身分證 + 食材清單」
└── src/
    └── main.rs     # 程式進入點（已經幫你寫好 Hello World）
```

打開 `Cargo.toml` 看看：

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2021"

[dependencies]
# 你要用的套件(crate)寫在這裡
```

- `[package]`：這個專案的基本資料（名字、版本、用哪個 Rust 版本規範）。
- `[dependencies]`：**你依賴哪些別人的 crate**，目前是空的。

而 `src/main.rs` 裡 cargo 已經幫你放好了：

```rust
fn main() {
    println!("Hello, world!");
}
```

### 編譯與執行：認識三個常用指令

```bash
cargo run
```

`cargo run` 會**一次做兩件事**：編譯 + 執行。你會看到它編譯後印出 `Hello, world!`。日常開發最常用這個。

其他兩個你會常用的：

| 指令 | 做什麼 | 什麼時候用 |
|------|--------|-----------|
| `cargo run` | 編譯 + 執行 | 想看程式跑起來的結果 |
| `cargo build` | 只編譯，不執行 | 只想產生執行檔 |
| `cargo check` | 只檢查能不能編譯，**不真的產生執行檔** | 寫到一半想快速確認「有沒有錯」，比 build 快很多 |

`cargo check` 是個好朋友——寫 Rust 時你會很常想「我現在這樣編譯器接不接受？」，`cargo check` 幾秒就告訴你，不用等完整編譯。

> 編譯產物會放在 `target/` 資料夾。這個資料夾很大且能重新產生，**不該進 Git**——`cargo new` 已經自動幫你建好 `.gitignore` 把它排除了。
> 想了解 `.gitignore` 與「哪些東西不該進 Git」 → [課外讀物 E-8：Git 版本控制](../../../課外讀物/E-8-git/E-8-1-git-internals.md)

### 加一個別人的套件（crate）

假設我們想印出一行彩色文字，用一個叫 `colored` 的 crate。加它只要：

```bash
cargo add colored
```

這行會自動把 `colored` 寫進 `Cargo.toml` 的 `[dependencies]`。然後在 `src/main.rs` 用它：

```rust
use colored::Colorize;   // 把 colored 提供的能力引進來

fn main() {
    println!("{}", "Hello, 彩色的 Rust!".green());
}
```

再 `cargo run`，cargo 會**自動下載 `colored` 及它需要的東西、編譯、執行**——你看到綠色的字了。整個過程你沒有手動下載任何檔案，這就是 cargo + crates.io 的威力。

> `use` 這個關鍵字（把外部能力引進來）之後 [rust-7-1] 模組系統會詳細講，現在先照著用。

## 小練習

1. 用 `cargo new` 建一個叫 `my_first` 的專案，把 `main.rs` 改成印出三行你喜歡的句子，用 `cargo run` 跑起來。
2. 比較 `cargo check` 和 `cargo build` 的速度差異：故意在程式裡留一個錯（例如刪掉分號），分別跑這兩個指令，觀察它們都能抓到錯、但 check 比較快。
3. 到 [crates.io](https://crates.io) 逛逛，搜尋一個你好奇的關鍵字（例如 `json`、`http`），看看有哪些 crate、它們被下載幾次。下載次數通常反映了一個 crate 多受信任。

<details>
<summary>參考解答</summary>

**第 1 題**

```bash
cargo new my_first
cd my_first
```

把 `src/main.rs` 改成：

```rust
fn main() {
    println!("今天也要好好寫 Rust");
    println!("編譯器是嚴格的好朋友");
    println!("錯誤訊息其實在幫你");
}
```

然後跑：

```bash
cargo run
```

你會看到 cargo 先編譯、再依序印出這三行。重點觀察：`cargo new` 自動幫你生好了 `Cargo.toml`、`src/main.rs`、`.gitignore` 和 git 初始化，你什麼都不用手動建。

**第 2 題**

先在程式裡故意留錯，例如刪掉一個分號：

```rust
fn main() {
    println!("Hello")   // ← 少了分號
}
```

分別跑：

```bash
cargo check   # 只做「能不能通過編譯」的檢查
cargo build   # 檢查 + 真的產生執行檔
```

觀察結果：**兩個都會抓到同一個錯**（少分號的錯誤訊息一模一樣），因為型別檢查、語法檢查這些「判斷對錯」的工作兩者都做。差別在 `cargo check` **省下了「產生機器碼、寫出執行檔」這段最花時間的工作**，所以它明顯比較快。這就是為什麼寫到一半想快速確認「編譯器接不接受」時，用 `check` 最划算——它給你答案的速度快，你就能更頻繁地檢查。

把分號補回去後，兩個指令都會成功。

**第 3 題**

這題沒有標準答案，重點是養成「挑 crate 前先看它多受信任」的習慣。以搜尋 `json` 為例，你大概會看到 `serde_json` 這個 crate，下載次數是「億」為單位——這種天文數字代表整個 Rust 生態幾乎都在用它，踩雷風險極低。

判斷一個 crate 值不值得用，除了下載次數，還可以看：最近有沒有在更新（維護中）、文件是否齊全、依賴的其他 crate 多不多。下載次數高通常代表「很多人幫你踩過雷了」，但它只是參考指標之一，不是唯一標準。

</details>

## 課外讀物

> 想理解「套件生態系、語意化版本、為什麼鎖版本」 → [課外讀物 E-2：npm 與套件生態](../../../課外讀物/E-2-npm/E-2-1-npm-intro.md)（觀念與 crates.io 相通）

> 想知道哪些檔案不該進 Git（例如 `target/`） → [課外讀物 E-8：Git 版本控制](../../../課外讀物/E-8-git/E-8-1-git-internals.md)
