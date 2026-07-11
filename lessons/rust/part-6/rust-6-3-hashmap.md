# [rust-6-3] `HashMap`：鍵值對的集合

> **本章目標**：學會 `HashMap`——用「鍵（key）」快速查到「值（value）」的集合，適合表達「對應關係」這類資料。

## 你會學到

- `HashMap` 是什麼，適合存什麼樣的資料
- 新增、查詢、更新鍵值對
- 查詢回傳 `Option`（找不到的處理）
- 走訪 HashMap，與「不保證順序」這件事

## 概念說明

### 用「鍵」直接查到「值」

`Vec`（[rust-6-1]）是「用位置（索引）找元素」。但很多資料的本質是「**對應關係**」——用一個有意義的「鍵」去查「值」：

```
電話簿： 名字 → 電話號碼
庫存：   商品名 → 數量
設定：   設定項名稱 → 設定值
```

**`HashMap<K, V>`** 就是為這種「鍵 → 值」的對應而生（`K` 是 key 型別、`V` 是 value 型別，又是泛型）。比喻：它像一本**字典**——你用「詞」（鍵）直接翻到「解釋」（值），不用一頁頁找。而且這種查找非常快（接近瞬間）。

> `HashMap` 為什麼能「瞬間查到」？背後是「雜湊」的魔法，以及「碰撞」要怎麼處理 → **dsa 課程 Part 3：雜湊表（Hash Table）**

## 程式碼範例

### 建立、新增、查詢

```rust
use std::collections::HashMap;       // HashMap 要先 use 引入

fn main() {
    let mut stock = HashMap::new();
    stock.insert("蘋果", 50);        // insert(鍵, 值)
    stock.insert("香蕉", 30);
    stock.insert("橘子", 0);

    // 查詢：get 回傳 Option（可能查不到）
    match stock.get("蘋果") {
        Some(qty) => println!("蘋果有 {} 個", qty),
        None => println!("沒有這項商品"),
    }
}
```

說明：

- `use std::collections::HashMap;`——`HashMap` 不像 `Vec` 那樣預設可用，要先用 `use` 引入（[rust-7-1] 會講 `use`）。
- `.insert(鍵, 值)` 新增或覆蓋一對鍵值。
- `.get(鍵)` 回傳 `Option<&V>`——找到是 `Some(值的參考)`，找不到是 `None`（呼應 [rust-3-4]）。「查字典可能查無此詞」，所以用 `Option` 很合理。

### 更新值

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("小美", 80);
    scores.insert("小美", 95);       // 同一個鍵再 insert → 覆蓋舊值
    println!("{:?}", scores.get("小美"));   // Some(95)

    // 「沒有才插入」：entry + or_insert
    scores.entry("阿明").or_insert(60);     // 阿明不存在 → 插入 60
    scores.entry("阿明").or_insert(99);     // 阿明已存在 → 不動，還是 60
    println!("{:?}", scores.get("阿明"));   // Some(60)
}
```

說明：

- 對同一個鍵再 `insert`，會**覆蓋**舊值。
- `.entry(鍵).or_insert(值)` 是個超實用的模式：「**如果這個鍵不存在，才插入預設值；存在就不動**」。常用在計數、累積等場景。

### 走訪 HashMap（順序不保證）

```rust
use std::collections::HashMap;

fn main() {
    let mut stock = HashMap::new();
    stock.insert("蘋果", 50);
    stock.insert("香蕉", 30);

    for (name, qty) in &stock {           // 借用走訪，拿到 (鍵, 值)
        println!("{}: {}", name, qty);
    }
}
```

說明：用 `for (k, v) in &map` 走訪每一對鍵值。**注意：`HashMap` 不保證走訪順序**——印出來的次序可能和你插入的次序不同，甚至每次執行都不一樣。這是雜湊表的特性（為了查找快而犧牲順序）。如果你需要「照鍵排序」的對應，標準庫另有 `BTreeMap`。

### 一個實用例子：計數

`entry().or_insert()` 配上「可變參考」能優雅地計數：

```rust
use std::collections::HashMap;

fn main() {
    let text = "蘋果 香蕉 蘋果 橘子 蘋果";
    let mut counts = HashMap::new();

    for word in text.split_whitespace() {       // 依空白切成一個個詞
        let counter = counts.entry(word).or_insert(0);   // 沒有就設 0
        *counter += 1;                          // 透過參考 +1
    }
    println!("{:?}", counts);   // {"蘋果": 3, "香蕉": 1, "橘子": 1}（順序不定）
}
```

說明：`entry(word).or_insert(0)` 回傳「該鍵對應值的可變參考」，`*counter += 1` 透過它把計數加一（`*` 解參考，呼應 [rust-6-1]）。這是統計詞頻的經典寫法。

## 小練習

1. 建一個 `HashMap`，存三個國家 → 首都的對應。用 `get` 查一個存在的、一個不存在的，各印出結果。
2. 用 `entry().or_insert()` 統計一句話裡每個字母（或每個詞）出現幾次。
3. 走訪你的 HashMap 印出所有鍵值對，連續執行幾次，觀察順序是否每次相同（體會「不保證順序」）。

<details>
<summary>參考解答</summary>

**練習 1**：`HashMap` 要先 `use` 引入。`get` 回傳 `Option`，所以「存在」與「不存在」分別對應 `Some` 和 `None`，用 `match` 處理最自然。

```rust
use std::collections::HashMap;

fn main() {
    let mut capitals = HashMap::new();
    capitals.insert("台灣", "台北");
    capitals.insert("日本", "東京");
    capitals.insert("法國", "巴黎");

    // 存在的
    match capitals.get("日本") {
        Some(city) => println!("日本的首都是 {}", city), // 走這裡
        None => println!("查無此國"),
    }

    // 不存在的
    match capitals.get("火星") {
        Some(city) => println!("火星的首都是 {}", city),
        None => println!("查無此國：火星"), // 走這裡
    }
}
```

小提醒：`get` 回傳的是 `Option<&V>`（值的**參考**），因為 HashMap 還擁有那個值，只是借你看一眼。

**練習 2**：這就是本章「計數」的經典模式——`entry(key).or_insert(0)` 回傳「該鍵對應值的可變參考」，再 `*counter += 1` 透過它累加。

```rust
use std::collections::HashMap;

fn main() {
    let text = "蘋果 香蕉 蘋果 橘子 蘋果 香蕉";
    let mut counts = HashMap::new();

    for word in text.split_whitespace() { // 依空白切成一個個詞
        let counter = counts.entry(word).or_insert(0); // 沒有就設 0
        *counter += 1;                                  // 透過參考 +1
    }

    println!("{:?}", counts); // {"蘋果": 3, "香蕉": 2, "橘子": 1}（順序不定）
}
```

驗收點：每個詞的次數要對（蘋果 3、香蕉 2、橘子 1）。若想數「字母」而非「詞」，把迴圈改成 `for ch in text.chars()`、鍵型別會變成 `char`，其餘一樣。

**練習 3**：用 `for (k, v) in &map` 借用走訪。重點是「觀察」——`HashMap` 為了查找快而犧牲順序，所以印出來的次序不保證跟插入順序一致，甚至每次執行都可能不同。

```rust
use std::collections::HashMap;

fn main() {
    let mut stock = HashMap::new();
    stock.insert("蘋果", 50);
    stock.insert("香蕉", 30);
    stock.insert("橘子", 20);

    for (name, qty) in &stock {
        println!("{}: {}", name, qty);
    }
}
```

需自行實機驗證：把這支程式連續 `cargo run` 幾次，觀察三行印出的先後順序有沒有變。這正是「不保證順序」的體感——如果你需要「照鍵排序」的穩定順序，就改用 `BTreeMap`。

</details>

## 課外讀物

> `HashMap` 為什麼能 O(1) 查找、雜湊碰撞怎麼解 → **dsa 課程 Part 3：雜湊表、雜湊碰撞**

> 雜湊的另一個重要應用是分散式快取（一致性雜湊）→ **快取課程 Part 5**
