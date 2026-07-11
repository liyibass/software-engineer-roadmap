# [rust-3-2] 方法與 `impl`：把行為綁到型別上

> **本章目標**：學會用 `impl` 為 struct 加上「方法」——讓資料和「操作這份資料的行為」綁在一起，寫出更有組織的程式。

## 你會學到

- 方法（method）和一般函式的差別
- 用 `impl` 區塊為 struct 定義方法
- `&self`、`&mut self`、`self` 三種接收方式的差別
- 關聯函式（像「建構子」的 `new`）

## 概念說明

### 資料 + 行為 = 方法

[rust-3-1] 的 struct 描述「資料長什麼樣」。但資料常常有「專屬的操作」——例如一個「長方形」應該能算自己的面積。把這種行為**綁到型別上**，就成了**方法**。

```
一般函式：area(rect)        ← 把資料當參數傳進去
方法：    rect.area()       ← 行為「長在」資料身上，用點呼叫
```

比喻：方法就像「這個東西會的技能」。長方形「會算面積」，所以你對著一個長方形喊 `.area()`，它就告訴你。這讓「資料」和「它能做什麼」待在一起，程式更好讀、好維護。

> 把相關的資料與行為放在一起、各司其職，呼應物件導向的封裝概念，也呼應單一職責 → [課外讀物 E-7-2：單一職責原則](../../../課外讀物/E-7-solid/E-7-2-srp.md)

## 程式碼範例

### 用 impl 定義方法

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {                      // impl 區塊：放這個型別的方法
    fn area(&self) -> u32 {           // 方法的第一個參數是 &self
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面積是 {}", rect.area());   // 用 . 呼叫方法
}
```

說明：

- `impl Rectangle { ... }` 是一個「實作區塊」，裡面定義屬於 `Rectangle` 的方法。
- 方法的第一個參數是特殊的 `&self`——它代表「呼叫這個方法的那個實例本身」。`self.width` 就是存取該實例的欄位。
- 呼叫時用 `rect.area()`，`rect` 自動成為那個 `self`。

### self 的三種接收方式

方法第一個參數怎麼寫 `self`，決定它「如何對待呼叫它的實例」——這直接連到 Part 2 的所有權與借用：

| 寫法 | 意思 | 何時用 |
|------|------|--------|
| `&self` | **借用**（唯讀） | 只是讀資料，最常見（像 `area`） |
| `&mut self` | **可變借用** | 要修改實例的欄位 |
| `self` | **取得擁有權**（會移動） | 要「消耗掉」這個實例，較少見 |

範例：一個會修改自己的方法用 `&mut self`：

```rust
impl Rectangle {
    fn scale(&mut self, factor: u32) {    // 要改欄位 → &mut self
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut rect = Rectangle { width: 10, height: 20 };
    rect.scale(2);                        // 放大兩倍
    println!("{} x {}", rect.width, rect.height);   // 20 x 40
}
```

說明：`scale` 要改欄位，所以用 `&mut self`，而且 `rect` 本身要是 `mut`——完全呼應 [rust-2-6] 的可變借用規則。**Part 2 學的所有權，在這裡又派上用場了。**

### 關聯函式：像「建構子」的 new

`impl` 區塊裡，**沒有 `self` 參數**的函式叫「關聯函式」——它屬於型別本身，而不是某個實例。最常見的用途是寫一個 `new` 來方便地建立實例：

```rust
impl Rectangle {
    fn new(width: u32, height: u32) -> Rectangle {   // 沒有 self
        Rectangle { width, height }
    }
}

fn main() {
    let rect = Rectangle::new(30, 50);    // 用 型別::函式 呼叫
    println!("{}", rect.area());
}
```

說明：關聯函式用 `型別::函式名` 呼叫（雙冒號 `::`），不是用實例的點。你其實早就用過這種寫法了——`String::from("...")` 就是 `String` 的關聯函式！Rust 沒有其他語言那種特殊的「建構子」語法，慣例就是寫一個叫 `new` 的關聯函式。

## 小練習

1. 給 [rust-3-1] 的 `Book` 加一個方法 `is_long(&self) -> bool`，頁數超過 300 回傳 `true`。
2. 給 `Book` 加一個 `&mut self` 的方法 `rate(&mut self, score: f64)`，用來設定評分。在 `main` 建一本 `mut` 的書、評分、印出。
3. 給 `Book` 寫一個關聯函式 `Book::new(title, pages)`，`rating` 預設 `0.0`，用 `Book::new(...)` 建立實例。

<details>
<summary>參考解答</summary>

延續上一節的 `Book`，把三個方法都補進同一個 `impl` 區塊：

```rust
struct Book {
    title: String,
    pages: u32,
    rating: f64,
}

impl Book {
    // 第 3 題：關聯函式（沒有 self），像「建構子」
    fn new(title: String, pages: u32) -> Book {
        Book {
            title,
            pages,
            rating: 0.0,
        }
    }

    // 第 1 題：只讀資料 → 用 &self
    fn is_long(&self) -> bool {
        self.pages > 300
    }

    // 第 2 題：要修改欄位 → 用 &mut self
    fn rate(&mut self, score: f64) {
        self.rating = score;
    }
}

fn main() {
    // 第 3 題：用 型別::函式 呼叫關聯函式
    let short = Book::new(String::from("小書"), 120);
    let long = Book::new(String::from("大部頭"), 500);

    // 第 1 題：用點呼叫方法
    println!("《{}》是長書嗎？{}", short.title, short.is_long());  // false
    println!("《{}》是長書嗎？{}", long.title, long.is_long());    // true

    // 第 2 題：要呼叫 &mut self 的方法，實例本身必須是 mut
    let mut book = Book::new(String::from("待評分"), 260);
    book.rate(4.7);
    println!("《{}》評分：{}", book.title, book.rating);           // 4.7
}
```

幾個關鍵：

- **`&self` vs `&mut self`**：`is_long` 只是讀 `pages`，用 `&self`（唯讀借用）；`rate` 要改 `rating`，必須用 `&mut self`（可變借用）。這完全對應 Part 2 的所有權與借用規則。
- **第 2 題的 `mut`**：想呼叫 `book.rate(...)`，`book` 這個變數本身也要宣告成 `mut`，否則 Rust 不允許對它做可變借用，編譯會失敗。
- **關聯函式 vs 方法**：`new` 沒有 `self` 參數，屬於型別本身，所以用 `Book::new(...)`（雙冒號）呼叫；`is_long`、`rate` 有 `self`，是方法，用 `實例.方法()` 呼叫。

</details>

## 課外讀物

> 「資料與操作它的行為放一起、各司其職」呼應封裝與單一職責 → [課外讀物 E-7-2：單一職責原則](../../../課外讀物/E-7-solid/E-7-2-srp.md)

> 方法接收 `&self` / `&mut self` / `self` 的選擇，本質是 Part 2 的所有權與借用 → 複習 [rust-2-5]、[rust-2-6]
