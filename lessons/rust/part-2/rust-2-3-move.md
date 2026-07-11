# [rust-2-3] Move（移動）：為什麼把變數賦值給別人後，原本的就「不能用了」

> **本章目標**：徹底搞懂 Rust 最容易卡住的一關——「移動」。理解為什麼 `let b = a` 之後 `a` 就失效了，以及這背後是為了避免什麼災難。

## 你會學到

- 「移動（move）」到底發生了什麼事
- 為什麼移動後原變數不能再用
- 把變數傳進函式，也會發生移動
- 怎麼讀懂 `value borrowed here after move` 這類錯誤

## 概念說明

### 賦值不一定是「複製」

在 TypeScript、Python，你寫 `b = a` 通常不太需要想「a 還能不能用」——當然能。但在 Rust，對「堆積上的資料」來說，`let b = a` 是**移動**，不是複製。

回憶 [rust-2-2] 的規則二：**一個值只能有一個擁有者**。所以當你寫 `let b = a`，Rust 面臨選擇：

```
選項一：複製一份給 b      → 但堆積資料可能很大，預設就偷偷深拷貝會很慢
選項二：把擁有權搬給 b    → 快！但搬完後 a 就不該再算擁有者了
```

Rust 選了**選項二**：把擁有權從 `a` **移動**給 `b`，然後**讓 `a` 失效**。這樣既不用付出「偷偷深拷貝」的效能成本，又能維持「唯一擁有者」的規則。

```mermaid
graph TB
    subgraph 之前
        A1["a (擁有者)"] -->|指向| H1["堆積資料 '哈囉'"]
    end
    subgraph 之後["let b = a 之後"]
        A2["a ❌ 失效"] -.x.-> H2["堆積資料 '哈囉'"]
        B2["b (新擁有者)"] -->|指向| H2
    end
```

這張圖在說：移動後，堆積上的資料**沒有被複製**（還是同一份），只是「擁有它的人」從 `a` 換成了 `b`，而 `a` 被標記為失效、不能再用。

### 為什麼非得讓 a 失效？

同樣是為了避免 [rust-2-2] 說的 **double free**。如果移動後 `a` 和 `b` 都能用，那函式結束時兩個都會去清理「同一塊堆積資料」——清兩次，災難。讓 `a` 失效，就保證「只有 `b` 會清它，且只清一次」。

**所以「移動後原變數失效」不是 Rust 在找你麻煩，而是它保證記憶體安全的手段。**

## 程式碼範例

### 基本移動

```rust
fn main() {
    let a = String::from("哈囉");
    let b = a;                 // 移動：擁有權 a → b，a 失效

    println!("{}", b);         // ✅ b 是現在的擁有者
    println!("{}", a);         // ❌ 編譯錯誤：a 的值已被移動
}
```

編譯器的錯誤訊息很具體：

```
error[E0382]: borrow of moved value: `a`
  |
  |   let b = a;
  |           - value moved here
  |   println!("{}", a);
  |                  ^ value borrowed here after move
```

它清楚標出「值在這裡被移走（moved here）」、「你又在這裡用了它（borrowed here after move）」。**學會讀這個訊息，你就掌握了一半的 Rust 除錯。**

### 傳進函式也會移動

這是新手第二個常踩的點：**把變數傳給函式，擁有權也會移動進去**。

```rust
fn main() {
    let s = String::from("哈囉");
    print_it(s);              // s 的擁有權「移動」進函式了
    // println!("{}", s);     // ❌ 這裡 s 已經失效
}

fn print_it(text: String) {
    println!("{}", text);
}   // ← text 在這裡離開範圍，被清理掉
```

說明：呼叫 `print_it(s)` 後，`s` 的擁有權交給了函式參數 `text`，函式結束時 `text` 連同那塊資料一起被清掉。所以回到 `main`，`s` 已經不能用了。

### 那我還想繼續用怎麼辦？

如果每次傳進函式就失去擁有權，程式會很難寫。Rust 有兩條路：

1. **「借」給函式用，而不是「給」**——這叫「借用」，用 `&`，是下一章 [rust-2-5] 的主角（也是最常用的解法）。
2. **真的複製一份**——對小型固定大小的值會自動複製（[rust-2-4] 的 Copy），對 `String` 這種可明確呼叫 `.clone()` 深拷貝（但要付出成本）。

先看一眼 `clone`：

```rust
fn main() {
    let s = String::from("哈囉");
    print_it(s.clone());      // 複製一份丟進去，原本的 s 保留
    println!("還能用：{}", s); // ✅ OK
}

fn print_it(text: String) {
    println!("{}", text);
}
```

`clone` 能解決問題，但它**真的複製了整塊堆積資料**，有成本。下一章會講「什麼時候該 clone、什麼時候其實不必」。

## 小練習

1. 寫一段會觸發移動錯誤的程式（`let b = a` 後再用 `a`），跑跑看，**仔細讀** `value moved here` / `borrowed here after move` 兩行標示。
2. 寫一個函式 `fn consume(s: String)`，在 `main` 把一個 `String` 傳進去，然後嘗試在呼叫後再用它，觀察錯誤。再用 `.clone()` 修好它。
3. 思考題：為什麼 Rust 對 `String` 用「移動」，但（下一章會看到）對 `i32` 這種整數卻是「直接複製、原本還能用」？（提示：和「資料在堆疊還堆積、大小固不固定」有關。）

<details>
<summary>參考解答</summary>

**第 1 題**

```rust
fn main() {
    let a = String::from("哈囉");
    let b = a;              // 移動：擁有權 a → b，a 失效
    println!("{}", b);      // ✅ b 是現在的擁有者
    println!("{}", a);      // ❌ 編譯錯誤：a 的值已被移動
}
```

跑起來會看到：

```
error[E0382]: borrow of moved value: `a`
  |   let b = a;
  |           - value moved here      ← a 的值在這裡被移走
  |   println!("{}", a);
  |                  ^ value borrowed here after move   ← 你又在這裡用了它
```

兩行標示分別告訴你「值在哪裡被移走」與「你在哪裡又用了已被移走的值」，這是讀懂 move 錯誤的關鍵。

**第 2 題**

會出錯的版本：

```rust
fn main() {
    let s = String::from("哈囉");
    consume(s);              // s 的擁有權移動進函式
    // println!("{}", s);    // ❌ s 已失效：value borrowed here after move
}

fn consume(s: String) {
    println!("吃掉：{}", s);
} // ← 參數 s 在這裡離開範圍、被清理
```

用 `.clone()` 修好：

```rust
fn main() {
    let s = String::from("哈囉");
    consume(s.clone());        // 複製一份丟進去，原本的 s 保留
    println!("原本的還能用：{}", s); // ✅ OK
}

fn consume(s: String) {
    println!("吃掉：{}", s);
}
```

`clone()` 真的複製了整塊堆積資料，所以 `main` 裡的 `s` 和函式收到的是**兩份獨立**的資料，函式清掉它那份不影響 `main` 的那份。（不過如果只是想讓函式「讀一下」，更好的做法是下一章的借用 `&`，成本比 clone 低。）

**第 3 題**

因為兩者「資料放在哪、複製貴不貴」完全不同：

- `i32` 這種整數**完全待在堆疊上、大小固定**（就 4 個位元組）。要複製它，只是原地多印一份小數字，成本微乎其微。既然複製這麼便宜，Rust 乾脆複製，讓原變數和新變數都能用，皆大歡喜——這就是下一章的 `Copy`。
- `String` 的把手雖在堆疊，但**真正的字元內容在堆積、而且可能很大**。如果賦值時偷偷把整塊堆積資料深拷貝一份，會默默拖慢程式（違反「不偷偷做昂貴的事」）。所以 Rust 選擇移動：不複製資料，只把擁有權交棒給新變數，並讓舊變數失效，藉此維持「唯一擁有者」又避免 double free。

一句話：**小又固定、複製便宜 → 複製（Copy）；擁有堆積資料、複製昂貴 → 移動（Move）。**

</details>

## 課外讀物

> 「移動 vs 複製」背後是堆疊/堆積的差異 → 複習 [rust-2-1] 與 **cs 課程 Part 3、5**

> 為什麼「預設不偷偷做昂貴的事（深拷貝）」是好的設計——明確優於隱晦 → [課外讀物 E-6-1：什麼是 Clean Code](../../../課外讀物/E-6-best-practices/E-6-1-what-is-clean-code.md)
