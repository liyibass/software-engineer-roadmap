# [rust-6-1] `Vec`：可成長的動態陣列

> **本章目標**：學會 `Vec`——Rust 最常用的集合型別。它像陣列，但能動態增減元素，是你日常存放「一串資料」的首選。

## 你會學到

- `Vec` 和固定長度陣列（[rust-1-3]）的差別
- 建立、新增、讀取、走訪 `Vec`
- 安全讀取：`[]` vs `.get()`
- `Vec` 與所有權、借用的互動

## 概念說明

### 從「固定的蛋盒」到「可加格子的盒子」

[rust-1-3] 的陣列 `[i32; 5]` 長度固定——編譯時就定死，不能增減。但現實中你常常「事先不知道有幾個元素」（例如使用者陸續輸入的待辦事項）。

**`Vec`（vector，向量）** 就是「**可以動態變長變短的陣列**」。比喻：

```
array  像一個「固定格數的蛋盒」：剛好 5 格，不能加。
Vec    像一個「可以一直往後加格子的盒子」：要幾格就幾格。
```

`Vec` 的資料放在**堆積**上（呼應 [rust-2-1]），所以能動態調整大小，而它在堆疊上只放一個「把手」。也因此 `Vec` 是「擁有堆積資料」的型別——它遵守移動、借用那一整套規則（Part 2 又派上用場）。

> `Vec` 背後「自動擴容」的機制與「攤銷 O(1)」的成本分析 → **dsa 課程 Part 2：動態陣列**

## 程式碼範例

### 建立 Vec

```rust
fn main() {
    // 方式一：建立空的，之後再加（要標型別，因為還沒東西可推斷）
    let mut nums: Vec<i32> = Vec::new();
    nums.push(10);
    nums.push(20);
    nums.push(30);

    // 方式二：用 vec! 巨集，直接給初始值（最常用）
    let fruits = vec!["蘋果", "香蕉", "橘子"];

    println!("{:?}", nums);     // [10, 20, 30]
    println!("{:?}", fruits);   // ["蘋果", "香蕉", "橘子"]
}
```

說明：

- `Vec::new()` 建立空向量；因為空的、推斷不出型別，要標 `Vec<i32>`。
- `.push(值)` 在尾巴新增一個元素（要 `mut`）。
- `vec![...]` 巨集（呼應 [rust-1-6]）是建立「一開始就有內容」的向量最方便的方式。
- `Vec<i32>` 的 `<i32>` 就是泛型（[rust-5-1]）——「一個裝 `i32` 的向量」。

### 讀取元素：`[]` vs `.get()`

兩種讀法，安全性不同：

```rust
fn main() {
    let nums = vec![10, 20, 30];

    // 方式一：[] 索引 —— 越界會 panic（呼應 rust-1-3）
    println!("{}", nums[0]);        // 10

    // 方式二：.get() —— 回傳 Option，越界給 None，不會當掉
    match nums.get(10) {
        Some(v) => println!("第 10 個是 {}", v),
        None => println!("沒有第 10 個元素"),    // 走這裡
    }
}
```

說明：`nums[10]` 越界會讓程式 panic；`nums.get(10)` 回傳 `Option`（呼應 [rust-3-4]），越界給 `None`，讓你優雅處理。**不確定索引在不在範圍內時，用 `.get()` 比較安全。**

### 走訪 Vec

用 `for`（呼應 [rust-1-5]）走訪最自然：

```rust
fn main() {
    let nums = vec![10, 20, 30];

    // 唯讀走訪：借用每個元素
    for n in &nums {
        println!("{}", n);
    }

    // 可變走訪：借用並修改每個元素
    let mut scores = vec![1, 2, 3];
    for s in &mut scores {
        *s *= 10;               // * 是「解參考」，透過參考改值
    }
    println!("{:?}", scores);   // [10, 20, 30]
}
```

說明：

- `for n in &nums`：用 `&` **借用**向量來走訪，這樣走訪完 `nums` 還能用（若寫 `for n in nums` 會把向量的擁有權移動進迴圈，之後不能用了——呼應 [rust-2-3]）。
- `for s in &mut scores` + `*s *= 10`：可變借用每個元素，`*s` 是「解參考」（透過參考去改它指向的值）。先有印象，[rust-8-1] 會再碰到 `*`。

### 常用方法

```rust
fn main() {
    let mut v = vec![3, 1, 2];
    println!("長度 {}", v.len());       // 3
    println!("是空的嗎 {}", v.is_empty()); // false
    v.sort();                            // 排序 → [1, 2, 3]
    let last = v.pop();                  // 取出最後一個，回傳 Option
    println!("{:?} 剩 {:?}", last, v);   // Some(3) 剩 [1, 2]
}
```

說明：`Vec` 提供大量好用方法——`len`、`is_empty`、`sort`、`pop`（呼應 [rust-3-6] 的 `while let pop()`）等。`pop()` 回傳 `Option` 是因為「可能是空的、沒東西可取」。

## 小練習

1. 用 `Vec::new()` 建一個空的 `Vec<String>`，`push` 三個你喜歡的水果名，用 `{:?}` 印出整個向量。
2. 用 `vec![]` 建一個數字向量，用 `for ... in &v` 走訪算出總和並印出。
3. 用 `.get()` 安全地嘗試讀取一個「可能越界」的索引，用 `match` 印出「有」或「沒有」。

<details>
<summary>參考解答</summary>

**練習 1**：`Vec::new()` 建空向量時推斷不出型別，所以要標 `Vec<String>`；水果名字面值是 `&str`，要 `.to_string()` 轉成 `String` 才能 `push` 進去。

```rust
fn main() {
    let mut fruits: Vec<String> = Vec::new();
    fruits.push("蘋果".to_string());
    fruits.push("香蕉".to_string());
    fruits.push("橘子".to_string());
    println!("{:?}", fruits); // ["蘋果", "香蕉", "橘子"]
}
```

小提醒：字面值 `"蘋果"` 是 `&str`（借用），而 `Vec<String>` 要的是擁有的 `String`，所以中間要 `.to_string()` 這道轉換。

**練習 2**：用 `for n in &v` **借用**走訪，這樣走訪完 `v` 還能用；`sum` 用 `mut` 才能持續累加。

```rust
fn main() {
    let v = vec![10, 20, 30, 40];
    let mut sum = 0;
    for n in &v {
        sum += n; // n 是 &i32，這裡 Rust 會自動解參考做加法
    }
    println!("總和是 {}", sum); // 總和是 100
}
```

驗收點：如果寫成 `for n in v`（沒有 `&`），向量的擁有權會被移動進迴圈，迴圈之後就不能再用 `v` 了——這是很常見的初學卡點。

**練習 3**：`.get()` 回傳 `Option`，越界給 `None` 而不會 panic，正好用 `match` 兩個分支處理。

```rust
fn main() {
    let nums = vec![1, 2, 3];
    let index = 5; // 故意越界

    match nums.get(index) {
        Some(v) => println!("第 {} 個是 {}", index, v),
        None => println!("沒有第 {} 個元素", index), // 走這裡
    }
}
```

如果把 `index` 改成 `0`，就會走 `Some` 分支印出 `第 0 個是 1`。對照之下，`nums[5]` 會直接 panic，這就是 `.get()` 更安全的地方。

</details>

## 課外讀物

> `Vec` 的自動擴容、攤銷成本、與鏈結串列的取捨 → **dsa 課程 Part 2：陣列、動態陣列、鏈結串列**

> `pop()` 的「後進先出」行為對應堆疊 → **dsa 課程 Part 2：堆疊**；下一節最常見的困惑 → [rust-6-2] String vs &str
