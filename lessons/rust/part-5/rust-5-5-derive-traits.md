# [rust-5-5] 常用標準特徵：`Debug` / `Clone` / `PartialEq` / `Default` 與 `#[derive]`

> **本章目標**：認識幾個 Rust 標準庫最常用的 trait，並學會用 `#[derive]` 一行讓編譯器自動幫你的型別實作它們，省下大量樣板程式碼。

## 你會學到

- `#[derive]` 是什麼：自動產生 trait 實作
- 四個最常用的標準 trait：`Debug`、`Clone`、`PartialEq`、`Default`
- 各自賦予型別什麼能力
- 什麼時候該 derive、什麼時候要自己實作

## 概念說明

### 重複的樣板：每個型別都要會「複製、印出、比較」

你自訂的 struct/enum，常常需要一些「基本能力」：能被印出來除錯、能被複製、能互相比較相等。這些能力其實就是實作對應的 trait（[rust-5-2]），但每個型別都手寫一遍很煩、又都長得差不多。

Rust 的解法是 **`#[derive(...)]`**——貼在型別上方的一行「標註」，叫編譯器**自動幫你產生這些 trait 的標準實作**：

```
#[derive(Debug, Clone, PartialEq)]
struct Point { x: i32, y: i32 }
        ↑
   一行就讓 Point 會「印出除錯資訊、被複製、被比較相等」
```

比喻：`#[derive]` 像在型別上「蓋認證章」——蓋上 `Debug` 章，它就自動會被 `{:?}` 印出；蓋上 `Clone` 章，它就自動會 `.clone()`。你不用手寫實作。

## 程式碼範例

### Debug：能被 `{:?}` 印出來

還記得 [rust-1-6] 說自訂型別要印出來除錯，得加一行嗎？就是這個：

```rust
#[derive(Debug)]
struct Point { x: i32, y: i32 }

fn main() {
    let p = Point { x: 3, y: 5 };
    println!("{:?}", p);        // Point { x: 3, y: 5 }
    println!("{:#?}", p);       // {:#?} 是「美化版」，會換行縮排
}
```

說明：加了 `#[derive(Debug)]`，`Point` 就能用 `{:?}` 印出。沒加的話，`println!("{:?}", p)` 會編譯失敗。`Debug` 是除錯最常用的 trait，幾乎所有型別都建議 derive 它。

### Clone：能被 `.clone()` 深拷貝

```rust
#[derive(Debug, Clone)]
struct Point { x: i32, y: i32 }

fn main() {
    let p1 = Point { x: 3, y: 5 };
    let p2 = p1.clone();        // 複製一份獨立的
    println!("{:?} {:?}", p1, p2);   // 兩個都能用
}
```

說明：derive `Clone` 後，型別就有了 `.clone()` 方法（呼應 [rust-2-4]），能複製出獨立的一份。

### PartialEq：能用 `==` 比較相等

```rust
#[derive(Debug, PartialEq)]
struct Point { x: i32, y: i32 }

fn main() {
    let a = Point { x: 1, y: 2 };
    let b = Point { x: 1, y: 2 };
    let c = Point { x: 9, y: 9 };
    println!("{}", a == b);     // true（每個欄位都相等）
    println!("{}", a == c);     // false
}
```

說明：derive `PartialEq` 後，型別就能用 `==`、`!=` 比較。預設規則是「所有欄位都相等才算相等」，很符合直覺。

### Default：提供一個「預設值」

```rust
#[derive(Debug, Default)]
struct Config {
    retries: u32,
    verbose: bool,
}

fn main() {
    let c = Config::default();      // 每個欄位用它型別的預設值
    println!("{:?}", c);            // Config { retries: 0, verbose: false }
}
```

說明：derive `Default` 後，`Config::default()` 會給你一個「每個欄位都是預設值」的實例（數字 `0`、布林 `false`、`String` 空字串…）。在「想要一個空白起點再慢慢設定」時很方便。

### 常用 derive 一覽

```rust
#[derive(Debug, Clone, PartialEq, Default)]
struct Thing { /* ... */ }
```

| trait | 賦予的能力 | 常用度 |
|-------|-----------|:---:|
| `Debug` | 用 `{:?}` 印出（除錯） | ⭐⭐⭐ 幾乎都加 |
| `Clone` | `.clone()` 深拷貝 | ⭐⭐ |
| `PartialEq` | 用 `==` 比較相等 | ⭐⭐ |
| `Default` | `::default()` 取得預設實例 | ⭐ |
| `Copy` | 賦值時複製而非移動（[rust-2-4]） | 只給「完全在堆疊」的小型別 |

### 什麼時候不能只靠 derive？

`#[derive]` 給的是「標準的、按欄位來的」實作。當你需要**客製化邏輯**時，就得自己 `impl`。例如「兩個使用者只要 `id` 相同就算相等（不管名字）」——這不是預設的「所有欄位都比」，你得手動實作 `PartialEq`。所以：**簡單情況 derive 省事；有特殊規則時自己實作**（呼應 [rust-5-2] 手寫 trait 實作）。

## 小練習

1. 給 [rust-3-1] 的 `Book` struct 加上 `#[derive(Debug, Clone, PartialEq)]`。印出一本書、複製一份、比較兩本書是否相等。
2. 給一個 `Settings` struct（幾個數字/布林欄位）derive `Default`，用 `Settings::default()` 建立並印出。
3. 思考題：為什麼 `String` 不能 derive `Copy`，但可以 derive `Clone`？（提示：回憶 [rust-2-4] 堆疊 vs 堆積、廉價複製 vs 深拷貝。）

<details>
<summary>參考解答</summary>

**第 1 題**：一行 `#[derive(Debug, Clone, PartialEq)]` 就同時得到印出、複製、比較三種能力。

```rust
#[derive(Debug, Clone, PartialEq)]
struct Book {
    title: String,
    pages: u32,
}

fn main() {
    let b1 = Book { title: String::from("Rust 入門"), pages: 300 };

    let b2 = b1.clone();                // 複製一份獨立的
    println!("{:?}", b1);              // 印出（靠 Debug）

    let b3 = Book { title: String::from("Rust 入門"), pages: 300 };
    println!("{}", b1 == b3);          // true：每個欄位都相等
    println!("{}", b1 == Book { title: String::from("別本"), pages: 100 }); // false
}
```

（`Book` 欄位以你在 [rust-3-1] 定義的為準，這裡示範用 `title` 與 `pages`。注意 `String` 本身有實作 `Debug`/`Clone`/`PartialEq`，`Book` 才能順利 derive——derive 的前提是「每個欄位的型別也都有實作那個 trait」。）

**第 2 題**：derive `Default` 後，每個欄位都用它自己型別的預設值（數字 `0`、布林 `false`）。

```rust
#[derive(Debug, Default)]
struct Settings {
    max_retries: u32,
    timeout_secs: u32,
    verbose: bool,
}

fn main() {
    let s = Settings::default();
    println!("{:?}", s);   // Settings { max_retries: 0, timeout_secs: 0, verbose: false }
}
```

**第 3 題（思考題）**：關鍵在 `Copy` 和 `Clone` 代表的複製「代價」不同。

- `Copy` 的意思是「這個型別可以靠**單純逐位元組拷貝堆疊上的資料**就完整複製」——快到編譯器願意在賦值時「自動、隱含地」幫你複製，不會發生所有權移動。這只適用於「資料整包都在堆疊上」的小型別，例如 `i32`、`bool`、`char`。
- 但 `String` 的內容（實際的文字位元組）是放在**堆積**上的，`String` 本身在堆疊上只是一個「指標 + 長度 + 容量」。如果讓它 `Copy`，逐位元組拷貝只會複製那個指標，變成兩個 `String` 指向同一塊堆積記憶體——這正是所有權系統要避免的「二次釋放（double free）」危險。所以 `String` **不能** derive `Copy`。
- `Clone` 則是「**明確地、要你親手呼叫 `.clone()`**」的複製，而且允許做「更花力氣」的深拷貝——`String::clone()` 會另外去堆積上配置一塊新記憶體、把文字整份複製過去，得到兩個各自獨立、互不干擾的 `String`。因為代價高，Rust 逼你手動寫出 `.clone()`，讓「這裡有一次昂貴複製」在程式碼裡看得見。

一句話總結：`Copy` = 廉價、隱含、只限堆疊資料；`Clone` = 可以昂貴、必須明講。`String` 帶著堆積資料，只符合後者。

</details>

## 課外讀物

> `#[derive]` 自動產生樣板，呼應「不要重複自己（DRY）」 → [課外讀物 E-6-1：什麼是 Clean Code](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)

> `Clone` / `Copy` 與堆疊堆積的關係 → 複習 [rust-2-4]；下一個 Part 進入常用集合 → [rust-6-1]
