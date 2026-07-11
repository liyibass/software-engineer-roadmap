# [rust-5-2] 特徵（Traits）：Rust 的「介面」——定義「能做什麼」

> **本章目標**：掌握 trait——Rust 用來定義「一群型別共同擁有的能力」的機制。它是 Rust 版的「介面」，也是整個語言抽象與複用的核心。

## 你會學到

- trait 是什麼：定義「一種能力／一份合約」
- 怎麼定義 trait、為型別實作 trait
- trait 怎麼和泛型（[rust-5-1]）搭配
- 預設方法：trait 可以提供現成實作

## 概念說明

### trait 是「能力的合約」

很多不同的型別，可能共享「某種能力」。例如「狗」「貓」「鴨」都不一樣，但都會「叫」。Rust 用 **trait（特徵）** 來描述這種「共同能力」。

比喻：trait 像一張**能力認證**。

```
「會叫」這張認證（trait）規定：你要有一個「叫(&self) -> String」的方法。
任何型別，只要實作了這個方法，就「擁有這張認證」。
之後凡是需要「會叫的東西」的地方，都接受它。
```

如果你學過 TypeScript 的 `interface`、或其他語言的「介面」，trait 的精神很接近——**它定義「該有哪些能力」，但不規定「資料長怎樣」**。一個型別可以實作很多個 trait（擁有很多認證）。

> trait 對應「介面」，設計時要注意「介面別塞太多東西、讓實作者被迫實作用不到的方法」→ [課外讀物 E-7-5：介面隔離原則](../../../課外讀物/E-7-solid/E-7-5-isp.md)

## 程式碼範例

### 定義 trait 並為型別實作

```rust
// 定義一個 trait：規定「會發出聲音」的能力
trait Animal {
    fn sound(&self) -> String;       // 只宣告方法簽名，沒有實作
}

struct Dog;
struct Cat;

// 為 Dog 實作 Animal
impl Animal for Dog {
    fn sound(&self) -> String {
        String::from("汪汪")
    }
}

// 為 Cat 實作 Animal
impl Animal for Cat {
    fn sound(&self) -> String {
        String::from("喵喵")
    }
}

fn main() {
    let d = Dog;
    let c = Cat;
    println!("{}", d.sound());    // 汪汪
    println!("{}", c.sound());    // 喵喵
}
```

說明：

- `trait Animal { fn sound(&self) -> String; }` 定義一份合約：「想當 `Animal`，就要提供一個 `sound` 方法」。注意它只有**方法簽名**、沒有實作（結尾是分號）。
- `impl Animal for Dog { ... }` 表示「為 `Dog` 型別實作 `Animal` 這個 trait」，並補上 `sound` 的具體內容。
- 現在 `Dog`、`Cat` 都「擁有 `Animal` 的認證」，各自叫的方式不同。

### trait + 泛型：限制「型別要有某種能力」

還記得 [rust-5-1] 的 `T: PartialOrd` 嗎？那個 `PartialOrd` 就是一個 trait！「`T: 某 trait`」的意思是「**`T` 必須實作了這個 trait（具備這個能力）**」。

我們可以寫一個函式，接受「任何會叫的動物」：

```rust
// T 必須實作 Animal —— 也就是「任何會叫的型別」
fn describe<T: Animal>(animal: T) {
    println!("牠說：{}", animal.sound());
}

fn main() {
    describe(Dog);    // 牠說：汪汪
    describe(Cat);    // 牠說：喵喵
}
```

說明：`<T: Animal>` 限制 `T` 必須實作 `Animal`。於是函式內可以安心呼叫 `animal.sound()`——因為合約保證了「凡是 `Animal`，就一定有 `sound`」。這就是**泛型 + trait** 的核心威力：寫一份能適用「所有具備某能力的型別」的程式。

### 預設方法：trait 可以提供現成實作

trait 的方法可以**附帶預設實作**——實作者沒提供時就用預設的：

```rust
trait Greet {
    fn name(&self) -> String;

    // 預設方法：用到了上面的 name()
    fn hello(&self) -> String {
        format!("你好，我是 {}", self.name())
    }
}

struct Person { name: String }

impl Greet for Person {
    fn name(&self) -> String {
        self.name.clone()
    }
    // 沒有實作 hello → 自動用預設的
}

fn main() {
    let p = Person { name: String::from("小美") };
    println!("{}", p.hello());    // 你好，我是 小美
}
```

說明：`Person` 只實作了 `name`，但因為 trait 給了 `hello` 的預設實作，`Person` 自動就有 `hello` 能用。預設方法讓你「定義一次共通行為，所有實作者共享」，減少重複。

## 小練習

1. 定義一個 trait `Shape`，規定一個方法 `area(&self) -> f64`。為 `Circle`（帶半徑）和 `Rectangle`（帶寬高）各實作 `area`。
2. 寫一個泛型函式 `fn print_area<T: Shape>(shape: T)`，印出任何形狀的面積。用兩種形狀測試。
3. 給 `Shape` 加一個**預設方法** `describe(&self)`，印出「這個形狀面積是 ___」（內部呼叫 `self.area()`）。確認兩種形狀不用各自實作就能用。

<details>
<summary>參考解答</summary>

這三題是同一份程式的漸進疊加，最後合起來看。

**第 1 題：定義 `Shape` trait，並為 `Circle`、`Rectangle` 實作 `area`**

trait 只規定「要有一個 `area` 方法」，各型別自己算面積：

```rust
trait Shape {
    fn area(&self) -> f64;
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}
```

`std::f64::consts::PI` 是標準庫提供的圓周率常數，比自己寫 `3.14159` 精確。

**第 2 題：泛型函式 `print_area`**

用 `<T: Shape>` 限制「傳進來的東西一定會 `area()`」，函式內就能安心呼叫：

```rust
fn print_area<T: Shape>(shape: T) {
    println!("面積是 {}", shape.area());
}

fn main() {
    print_area(Circle { radius: 2.0 });                 // 面積是 12.566...
    print_area(Rectangle { width: 3.0, height: 4.0 });  // 面積是 12
}
```

**第 3 題：給 `Shape` 加預設方法 `describe`**

把 `describe` 直接寫在 trait 裡並附上實作，它內部呼叫 `self.area()`。因為有預設實作，`Circle`、`Rectangle` 都不用各自再寫一次：

```rust
trait Shape {
    fn area(&self) -> f64;

    // 預設方法：用到上面的 area()
    fn describe(&self) {
        println!("這個形狀面積是 {}", self.area());
    }
}

// Circle、Rectangle 的 impl 只需實作 area，describe 自動就有
fn main() {
    let c = Circle { radius: 1.0 };
    let r = Rectangle { width: 2.0, height: 5.0 };
    c.describe();   // 這個形狀面積是 3.14159...
    r.describe();   // 這個形狀面積是 10
}
```

重點：`describe` 只寫一次、寫在 trait 裡，所有實作者共享——這就是預設方法的價值，避免每個型別重複寫一樣的東西。當然，若某個型別想要不一樣的 `describe`，也可以在自己的 `impl` 裡覆寫掉預設版本。

</details>

## 課外讀物

> trait 是「介面」，設計時遵守介面隔離（別讓介面太肥） → [課外讀物 E-7-5：介面隔離原則](../../../課外讀物/E-7-solid/E-7-5-isp.md)

> 「針對能力（介面）寫程式，而非針對具體型別」是依賴反轉的精神 → [課外讀物 E-7-6：依賴反轉原則](../../../課外讀物/E-7-solid/E-7-6-dip.md)

> 下一節：把 trait 用在函式參數與回傳值上的各種寫法 → [rust-5-3]
