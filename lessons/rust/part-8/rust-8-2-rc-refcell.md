# [rust-8-2] `Rc` 與 `RefCell`：共享所有權與「內部可變性」

> **本章目標**：認識兩個進階智慧指標——`Rc`（讓一份資料被多個擁有者共享）與 `RefCell`（在唯讀的外表下安全地修改內部），以及它們解決的問題。

## 你會學到

- 「唯一擁有者」規則有時太嚴格的情境
- `Rc`：讓一份資料被多人共享（引用計數）
- `RefCell`：「內部可變性」——繞過編譯期借用檢查到執行期
- 這兩者的代價與適用時機

## 概念說明

### 當「唯一擁有者」不夠用

[rust-2-2] 的規則說「一個值只有一個擁有者」。這對單純的情況很好，但有些資料結構天生需要「**多個地方共享同一份資料**」。

例如一個圖：多個節點都「指向」同一個共用節點。這時「唯一擁有者」就卡住了——到底誰擁有那個共用節點？

`Rc`（Reference Counted，引用計數）就是來解這個的。比喻：

```
一般擁有權：一把鑰匙、一個主人。主人走了，房子拆掉。
Rc：       同一個房子發很多把鑰匙給多人。Rc 在旁邊「數還有幾把鑰匙」，
           數到「最後一把也還回來了（沒人用了）」，才拆房子。
```

`Rc` 內部維護一個**計數器**：每多一個共享者 +1，每少一個 -1，歸零時才清理資料。這樣多人能安全共享，又不會有人提早把資料清掉。

> 引用計數其實是一種「迷你 GC」的概念 → **cs 課程 Part 5**（記憶體管理）

## 程式碼範例

### Rc：共享所有權

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("共用資料"));
    println!("計數：{}", Rc::strong_count(&shared));   // 1

    let a = Rc::clone(&shared);     // 多一個共享者（不是深拷貝！只是計數+1）
    println!("計數：{}", Rc::strong_count(&shared));   // 2

    {
        let b = Rc::clone(&shared);
        println!("計數：{}", Rc::strong_count(&shared));   // 3
    }   // b 離開範圍，計數 -1

    println!("計數：{}", Rc::strong_count(&shared));   // 2
    println!("{} {}", a, shared);
}
```

說明：

- `Rc::new(...)` 建立一個引用計數的共享值。
- `Rc::clone(&shared)`——**注意，這不是深拷貝！** 它只是「多發一把鑰匙」，把計數 +1，大家共享同一份底層資料（很便宜）。
- `Rc::strong_count(&x)` 看現在有幾個共享者。
- 每當一個 `Rc` 離開範圍，計數自動 -1；歸零時底層資料才被清理。

⚠️ 注意：`Rc` **只能用在單執行緒**。多執行緒要用它的線程安全版本 `Arc`（下一節 [rust-8-4]）。

### RefCell：內部可變性

第二個問題：`Rc` 共享的資料是**唯讀**的（多人共享，總不能讓誰隨便改吧）。但有時你就是需要「共享、又能改」。

這就要搭配 **`RefCell`**——它提供「**內部可變性（interior mutability）**」：讓你在「外表看起來不可變」的情況下，安全地修改內部資料。它的訣竅是把 [rust-2-6] 的借用檢查**從編譯期改到執行期**：

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);       // 注意 data 本身不是 mut！

    *data.borrow_mut() += 10;         // 借一個「可變借用」來改
    println!("{}", data.borrow());    // 15（借一個唯讀借用來看）
}
```

說明：

- `RefCell::new(5)`——即使 `data` 不是 `mut`，我們仍能改它內部的值。
- `.borrow_mut()` 拿一個可變借用、`.borrow()` 拿唯讀借用。
- **借用規則（多讀或一寫）仍然存在，只是改在「執行期」檢查**——如果你違反（例如同時拿兩個可變借用），不是編譯失敗，而是**執行時 panic**。這是它和一般借用最大的差別。

### 經典組合：`Rc<RefCell<T>>`

把兩者組起來——`Rc` 給「多人共享」、`RefCell` 給「能改」——就得到「**多個擁有者，且都能修改的共享資料**」：

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2, 3]));

    let clone_a = Rc::clone(&shared);
    clone_a.borrow_mut().push(4);     // 透過 a 修改

    shared.borrow_mut().push(5);      // 透過原本的修改

    println!("{:?}", shared.borrow());   // [1, 2, 3, 4, 5]
}
```

說明：`Rc<RefCell<T>>` 是 Rust 裡實作「共享且可變」資料結構（如某些圖、樹）的常見模式。但它有代價——下面說。

### 代價與心法

```mermaid
graph TB
    RULE["Rust 預設：編譯期保證安全（最好）"]
    RULE --> RC["Rc/RefCell：放寬限制<br/>換來彈性，但把部分檢查延到執行期<br/>(RefCell 違規會 panic、有一點執行成本)"]
```

這張圖的重點：`Rc`/`RefCell` 是「**逃生出口**」——當所有權/借用的預設規則太死、擋住你合理的需求時才用。它們換來彈性，但代價是「部分安全檢查從編譯期挪到執行期」（`RefCell` 借用違規會在執行時 panic，而非編譯時被擋）。所以心法是：**優先用單純的所有權與借用；只在「真的需要共享所有權」時才搬出 `Rc`/`RefCell`。**

## 小練習

1. 用 `Rc` 共享一個 `String`，clone 出三個共享者，用 `Rc::strong_count` 觀察計數變化，再讓其中一個離開範圍看計數下降。
2. 用 `RefCell<i32>` 包一個計數器，多次 `borrow_mut()` 把它加到 10，印出結果（注意 `RefCell` 本身不用 `mut`）。
3. 思考題：`RefCell` 把借用檢查放到執行期，違規時會 panic。比起編譯期就擋下，這「好」還是「不好」？什麼情況下值得這個取捨？

<details>
<summary>參考解答</summary>

**第 1 題：用 `Rc` 共享 `String`、clone 三份、觀察計數**

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("共用字串"));
    println!("一開始：{}", Rc::strong_count(&shared));   // 1

    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);
    {
        let c = Rc::clone(&shared);
        println!("clone 三份後：{}", Rc::strong_count(&shared));   // 4（原本 1 + a + b + c）
    }   // ← c 在這裡離開範圍，計數 -1

    println!("c 離開後：{}", Rc::strong_count(&shared));   // 3
    println!("內容：{} / {} / {}", shared, a, b);
}
```

輸出：
```
一開始：1
clone 三份後：4
c 離開後：3
內容：共用字串 / 共用字串 / 共用字串
```

重點：一開始 `shared` 自己就算 1 個擁有者，再 clone 三份就變 4（不是 3）。`Rc::clone` 只是「計數 +1」，三份 `a`/`b`/`c` 和 `shared` 共享**同一份底層字串**，沒有複製文字內容。`c` 一離開它那對 `{ }` 範圍，計數立刻降回 3。

**第 2 題：用 `RefCell<i32>` 當計數器加到 10**

```rust
use std::cell::RefCell;

fn main() {
    let counter = RefCell::new(0);   // 注意：counter 沒有寫 mut

    for _ in 0..10 {
        *counter.borrow_mut() += 1;  // 每次借一個可變借用來 +1，用完馬上還
    }

    println!("結果：{}", counter.borrow());   // 10
}
```

重點：`counter` 本身不是 `mut`，卻能改它內部的值——這就是「內部可變性」。這裡刻意讓每次 `borrow_mut()` 產生的可變借用「用完當場就還掉」（該行結束就釋放），所以迴圈裡不會同時存在兩個借用，不會 panic。

反例提醒——**下面這樣寫會執行期 panic**：
```rust
let mut a = counter.borrow_mut();
let mut b = counter.borrow_mut();   // ❌ 同時拿兩個可變借用 → 執行時 panic：already borrowed
```

**第 3 題（思考題）：借用檢查延到執行期，好還是不好？**

先講結論：**這是一個「取捨」，沒有絕對好壞，端看你的需求。**

- **編譯期檢查（Rust 預設）的好處**：問題在你按下編譯的那一刻就被抓出來，程式根本不會出貨到使用者手上就已經確定「不會有借用衝突」。這是最安全的，也「零執行成本」。缺點是規則很嚴，有些「其實安全、但編譯器證明不了」的寫法會被一併擋掉。

- **`RefCell` 把檢查延到執行期的代價**：借用是否衝突變成「跑到那一行才知道」，違規時會 panic（程式當場崩潰）。而且每次 `borrow`/`borrow_mut` 都要在執行期查一下「現在有沒有別人借著」，有一點點執行成本。萬一那條有問題的路徑很少被走到、測試又沒覆蓋到，這個 panic 就可能潛伏到上線後才爆。

**什麼情況值得這個取捨？** 當你的資料結構「邏輯上安全，但編譯器的靜態規則證明不出來」時。最典型的就是 `Rc<RefCell<T>>` 這種「多個擁有者、又都要能改」的共享結構（例如圖、某些樹）——用純所有權/借用根本寫不出來，這時 `RefCell` 就是必要的逃生出口。心法是：**能用編譯期保證的，就別用 `RefCell`；只有在預設規則真的擋住合理需求時，才接受「延到執行期」這個代價。**

</details>

## 課外讀物

> 引用計數作為記憶體管理策略（對比 GC、所有權）→ **cs 課程 Part 5：作業系統（記憶體管理）**

> 下一節：Rust 最自豪的「無懼並行」——多執行緒 → [rust-8-3]
