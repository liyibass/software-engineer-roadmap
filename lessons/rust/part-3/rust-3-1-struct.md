# [rust-3-1] Struct：定義你自己的資料型別

> **本章目標**：學會用 struct 把「相關的幾個欄位」打包成一個有名字、有意義的型別，讓程式更貼近你要描述的真實事物。

## 你會學到

- struct 是什麼，和 tuple 差在哪
- 怎麼定義 struct、建立實例、存取欄位
- 怎麼修改 struct 的欄位（需要 `mut`）
- 兩個方便寫法：欄位簡寫、用既有實例補齊其餘欄位

## 概念說明

### 從「一袋值」到「有名字的欄位」

[rust-1-3] 的 tuple 能把幾個值綁在一起，但它只能用 `.0`、`.1` 取值——時間久了你會忘記「`.1` 到底是體重還是年齡」。

**struct（結構體）** 解決這個問題：它讓每個欄位**有名字**。用一個比喻：

```
tuple 像「一個沒貼標籤的袋子」：(175, 68.5, 30)，裡面是啥要用順序硬記。
struct 像「一張填好的表單」：
        身高: 175
        體重: 68.5
        年齡: 30
        ——每格都有標籤，一目了然。
```

> struct 就是 [rust-7-3] 之後你會大量用到的「資料的形狀」。設計好的 struct 讓資料自我說明，是好程式的基礎。

## 程式碼範例

### 定義與建立

```rust
// 定義一個 struct（型別名用 PascalCase）
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    // 建立一個實例：每個欄位都給值
    let user = User {
        name: String::from("小美"),
        age: 28,
        active: true,
    };

    // 用「點 + 欄位名」存取
    println!("{} 今年 {} 歲", user.name, user.age);
}
```

說明：

- `struct User { ... }` 定義一個叫 `User` 的型別，列出它有哪些欄位、各是什麼型別。型別名用大駝峰 `PascalCase`。
- 建立實例時，用 `欄位名: 值` 一一填好。
- 用 `user.name`、`user.age` 取值——比 tuple 的 `.0`、`.1` 清楚太多。

### 修改欄位：整個實例要 mut

```rust
fn main() {
    let mut user = User {
        name: String::from("小美"),
        age: 28,
        active: true,
    };
    user.age = 29;            // ✅ 因為 user 是 mut
    user.active = false;
    println!("{} 歲，活躍：{}", user.age, user.active);
}
```

呼應 [rust-1-1]：要改欄位，**整個實例**必須宣告成 `mut`。Rust 不允許「只有某個欄位可變」——可變性是針對整個實例的。

### 方便寫法一：欄位簡寫

當「變數名」剛好和「欄位名」一樣，可以省略重複：

```rust
fn build_user(name: String, age: u32) -> User {
    User {
        name,            // 等同 name: name
        age,             // 等同 age: age
        active: true,
    }
}
```

說明：`name`（而非 `name: name`）是「欄位簡寫」——變數名與欄位名同名時的語法糖，少打字、更清爽。

### 方便寫法二：用既有實例補齊其餘欄位

想「以一個既有實例為基礎，只改幾個欄位」，用 `..`：

```rust
fn main() {
    let user1 = User {
        name: String::from("小美"),
        age: 28,
        active: true,
    };

    let user2 = User {
        name: String::from("阿明"),
        ..user1               // 其餘欄位(age, active)沿用 user1 的值
    };
    println!("{} {}", user2.age, user2.active);   // 28 true
}
```

說明：`..user1` 表示「沒寫到的欄位，從 `user1` 拿」。注意：如果沿用的欄位是 `String` 這種會「移動」的型別，`user1` 對應欄位的擁有權會被移走（呼應 [rust-2-3]）——這裡 `name` 我們另外給了新值，所以沒問題。

## 小練習

1. 定義一個 `Book` struct，欄位有 `title: String`、`pages: u32`、`rating: f64`。建立一本你喜歡的書的實例並印出三個欄位。
2. 把上面的 `Book` 實例改成 `mut`，把 `rating` 改成另一個值再印出。
3. 用 `build_user` 那種「欄位簡寫」寫一個 `fn build_book(title: String, pages: u32) -> Book`，`rating` 預設給 `0.0`。

<details>
<summary>參考解答</summary>

三題可以放在同一個檔案裡練習，這裡一次寫完給你看：

```rust
// 型別名用 PascalCase
struct Book {
    title: String,
    pages: u32,
    rating: f64,
}

// 第 3 題：用「欄位簡寫」建立 Book
// title 與 pages 剛好和欄位同名，可以省略 `title: title`、`pages: pages`
fn build_book(title: String, pages: u32) -> Book {
    Book {
        title,
        pages,
        rating: 0.0,   // 預設分數
    }
}

fn main() {
    // 第 1 題：建立一本書的實例並印出三個欄位
    let book = Book {
        title: String::from("Rust 權威指南"),
        pages: 560,
        rating: 4.8,
    };
    println!("《{}》，{} 頁，評分 {}", book.title, book.pages, book.rating);

    // 第 2 題：要改欄位 → 整個實例宣告成 mut
    let mut book2 = Book {
        title: String::from("深入淺出 Rust"),
        pages: 320,
        rating: 4.0,
    };
    book2.rating = 4.5;   // 修改欄位
    println!("《{}》改後評分：{}", book2.title, book2.rating);

    // 第 3 題：用 build_book 建立，rating 自動是 0.0
    let book3 = build_book(String::from("尚未評分的新書"), 200);
    println!("《{}》預設評分：{}", book3.title, book3.rating);
}
```

幾個重點提醒：

- **第 2 題**：Rust 沒有「只有某個欄位可變」這種事——可變性是針對「整個實例」的。所以要改 `rating`，就得在 `let` 後面加 `mut`（`let mut book2 = ...`），否則編譯器會報錯。
- **第 3 題**：因為參數名 `title`、`pages` 剛好跟欄位同名，才能用簡寫。如果參數叫別的名字（例如 `name`），就得乖乖寫成 `title: name`。
- `rating` 用 `f64`，所以預設值要寫 `0.0` 而不是 `0`（`0` 會被推斷成整數，型別對不上）。

</details>

## 課外讀物

> struct 是組織資料的基礎，好的命名讓欄位自我說明 → [課外讀物 E-6-2：命名的藝術](../../../課外讀物/E-6-best-practices/E-6-2-naming.md)

> 之後 [rust-9-x] 做 Web 後端時，會用 struct 來描述「一筆資料」（例如一個 Todo），並讓它能轉成 JSON
