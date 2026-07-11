# [rust-9-4] 接資料庫：用 `sqlx` 連 PostgreSQL、做查詢與寫入

> **本章目標**：讓你的 API 不再只回傳寫死的假資料——學會用 `sqlx` 連接 PostgreSQL 資料庫，把資料真正存起來、查出來。

## 你會學到

- 為什麼後端需要資料庫
- `sqlx`：Rust 的資料庫工具，與它「編譯期檢查 SQL」的特色
- 連線資料庫、建立連線池
- 執行查詢與寫入

## 概念說明

### 資料要存在哪？

前幾節的 handler 回傳的都是「寫死在程式裡的假資料」——程式一重啟就沒了。真實的 API 需要把資料**持久化**存起來，這就是**資料庫**的工作（你在 basic Part 5 學過）。

這門課用 **PostgreSQL**（簡稱 Postgres）——一個強大、開源、業界最受歡迎的關聯式資料庫之一。連接它，我們用 **`sqlx`** 這個 crate。

### sqlx 的特色：編譯期檢查你的 SQL

`sqlx` 有個很「Rust」的殺手鐧：**它能在編譯期檢查你的 SQL 對不對**。你寫的 SQL 查詢，`sqlx` 會去比對真實的資料庫結構，如果你打錯欄位名、型別對不上，**編譯就失敗**——而不是等到上線執行時才出錯。

這完全延續了 Rust 的精神（[rust-0-1]）：**把錯誤抓在編譯期**。在別的語言，SQL 字串裡的錯字常常要執行到那一行才爆；`sqlx` 讓這類 bug 提早現形。

> 資料庫、SQL、關聯式模型的基礎 → **basic 課程 Part 5**、[課外讀物 E-4：資料庫進階](../../../課外讀物/E-4-database/E-4-1-what-is-index.md)

## 程式碼範例

### 準備：加依賴、開資料庫

```bash
cargo add sqlx --features "runtime-tokio postgres macros"
cargo add tokio --features full
```

假設你已經有一個 Postgres 跑著（本機安裝，或用 Docker——可參考 **infra 課程**的容器章節），裡面有一張表：

```sql
CREATE TABLE todos (
    id    SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done  BOOLEAN NOT NULL DEFAULT false
);
```

### 建立連線池

程式啟動時，先建立一個**連線池（connection pool）**——一組「預先開好、重複使用」的資料庫連線，避免每次查詢都重開連線（很慢）。

```rust
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() {
    // 連線字串：postgres://使用者:密碼@主機:埠/資料庫名
    let db_url = "postgres://user:password@localhost:5432/mydb";

    let pool = PgPoolOptions::new()
        .max_connections(5)          // 池子裡最多 5 條連線
        .connect(db_url)
        .await
        .expect("無法連線到資料庫");

    println!("資料庫連線成功！");
    // ... 把 pool 交給 Axum（下一節 rust-9-5 會講怎麼共享給 handler）
}
```

說明：`PgPoolOptions` 建立連線池，`max_connections(5)` 設池子大小，`.connect(db_url)` 連上去。連線字串含帳密——⚠️ **這種機密絕對不能寫死在程式裡、不能進 Git**，正式專案要用環境變數讀取（下一節會提）。

> ⚠️ 機密（資料庫密碼、API 金鑰）絕不能寫死在程式碼或進 Git → [課外讀物 E-10：Web Security 基礎](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)

### 查詢：把資料庫的列變成 struct

```rust
use serde::Serialize;

#[derive(Serialize, sqlx::FromRow)]      // FromRow：能從資料庫的一列轉成這個 struct
struct Todo {
    id: i32,
    title: String,
    done: bool,
}

// 查出所有待辦
async fn all_todos(pool: &sqlx::PgPool) -> Result<Vec<Todo>, sqlx::Error> {
    let todos = sqlx::query_as::<_, Todo>("SELECT id, title, done FROM todos")
        .fetch_all(pool)
        .await?;                          // ? 把資料庫錯誤往上傳（rust-4-2）
    Ok(todos)
}
```

說明：

- `#[derive(sqlx::FromRow)]`：讓 `sqlx` 知道「怎麼把資料庫查出來的一列，對應成這個 struct」。
- `sqlx::query_as::<_, Todo>("SELECT ...")`：執行查詢，並把每一列轉成 `Todo`。
- `.fetch_all(pool)`：拿回所有符合的列，成為 `Vec<Todo>`。
- `?`（[rust-4-2]）：查詢可能失敗（連線斷、SQL 錯），用 `?` 把錯誤往上傳。注意整個函式回傳 `Result`。

### 寫入：用參數化查詢（防 SQL injection）

```rust
async fn add_todo(pool: &sqlx::PgPool, title: &str) -> Result<Todo, sqlx::Error> {
    let todo = sqlx::query_as::<_, Todo>(
        "INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done"
    )
    .bind(title)                          // 把 title 安全地綁到 $1
    .fetch_one(pool)
    .await?;
    Ok(todo)
}
```

說明：

- `$1` 是**參數佔位符**，用 `.bind(title)` 把值綁進去。
- **為什麼不直接把 title 拼進 SQL 字串？** 因為那會造成 **SQL injection（注入攻擊）**——惡意使用者在 title 塞入 SQL 指令，可能竄改或竊取整個資料庫。用 `.bind()` 的「參數化查詢」能徹底防止這個經典漏洞。**這是後端安全的鐵律。**
- `RETURNING ...` 讓 INSERT 後直接回傳剛建立的那筆資料。

> SQL injection 是最經典的 Web 漏洞之一，務必用參數化查詢 → [課外讀物 E-10-4：SQL Injection](../../../課外讀物/E-10-security/E-10-4-sql-injection.md)

## 小練習

1. （概念）畫出「handler → sqlx 查詢 → PostgreSQL → 回傳 Vec<Todo> → 序列化成 JSON」的資料流。
2. 寫一個查詢函式 `get_todo_by_id`，用 `.bind(id)` 和 `WHERE id = $1`，回傳單一 `Todo`（提示：用 `fetch_optional` 回傳 `Option`，因為可能找不到）。
3. 想一想：為什麼「把使用者輸入直接拼進 SQL 字串」很危險？用一句話描述 SQL injection。

<details>
<summary>參考解答</summary>

**第 1 題（資料流圖）**

用 Mermaid 把整條路徑畫出來：

```mermaid
graph LR
    REQ["前端請求<br/>GET /todos"] --> H["handler"]
    H -->|"query_as + fetch_all"| SQLX["sqlx"]
    SQLX -->|"送出 SQL"| DB[("PostgreSQL")]
    DB -->|"回傳資料列 (rows)"| SQLX
    SQLX -->|"FromRow 轉換"| VEC["Vec&lt;Todo&gt;"]
    VEC -->|"Json(...) 序列化"| JSON["JSON 回應"]
    JSON --> RESP["送回前端"]
```

這張圖在說：請求進 handler → handler 用 sqlx 送 SQL 給 PostgreSQL → 資料庫回傳「資料列」→ sqlx 靠 `FromRow` 把每一列變成 `Todo`、湊成 `Vec<Todo>` → 再用 `Json(...)` 序列化（[rust-9-3]）成 JSON 送回前端。

**第 2 題（`get_todo_by_id` 用 `fetch_optional`）**

因為指定 id 可能查不到，回傳型別用 `Option<Todo>`，並用 `fetch_optional`（查得到給 `Some`、查不到給 `None`）：

```rust
async fn get_todo_by_id(
    pool: &sqlx::PgPool,
    id: i32,
) -> Result<Option<Todo>, sqlx::Error> {
    let todo = sqlx::query_as::<_, Todo>(
        "SELECT id, title, done FROM todos WHERE id = $1"
    )
    .bind(id)                    // 把 id 安全綁到 $1（參數化查詢）
    .fetch_optional(pool)        // 回傳 Option：Some(找到) / None(查無)
    .await?;                     // 資料庫層級的錯誤（連線斷等）用 ? 往上傳
    Ok(todo)
}
```

驗收點：

- 傳一個存在的 id → 拿到 `Ok(Some(todo))`。
- 傳一個不存在的 id → 拿到 `Ok(None)`（注意：**查無資料不是錯誤**，所以是 `Ok(None)` 而不是 `Err`）。
- 只有連線斷、SQL 壞掉這種真正的失敗才會是 `Err`，被 `?` 往上拋。

到了下一節（[rust-9-5]），你會把這個 `None` 對應成 HTTP `404`、把 `Err` 對應成 `500`。

**第 3 題（為什麼直接拼字串危險 + 一句話描述 SQL injection）**

危險的原因：如果把使用者輸入直接用字串拼進 SQL，使用者輸入的內容就會被資料庫**當成 SQL 指令的一部分去執行**，而不只是「一筆資料」。例如查詢寫成 `"SELECT * FROM users WHERE name = '" + input + "'"`，攻擊者在 `input` 塞入 `' OR '1'='1`，整條 SQL 的語意就被改寫成「條件永遠成立」，於是撈出整張表；更狠的還能塞入 `; DROP TABLE users; --` 直接刪表。

一句話描述 **SQL injection**：*攻擊者在輸入裡塞進 SQL 語法，讓自己的輸入被資料庫當成指令執行，藉此竊取、竄改或破壞資料。*

防法就是本章的**參數化查詢**——用 `$1` 佔位、`.bind(value)` 綁值，資料庫會把綁進來的值**永遠只當純資料**、絕不解讀成 SQL，從根本上堵死這個漏洞。

</details>

## 課外讀物

> SQL injection 與參數化查詢 → [課外讀物 E-10-4：SQL Injection](../../../課外讀物/E-10-security/E-10-4-sql-injection.md)

> 資料庫、索引、查詢效能 → **basic 課程 Part 5**、[課外讀物 E-4：資料庫進階](../../../課外讀物/E-4-database/E-4-1-what-is-index.md)、[課外讀物 E-11-4：資料庫效能](../../../課外讀物/E-11-performance/E-11-4-database-performance.md)

> 下一節：把連線池共享給所有 handler，並好好處理錯誤 → [rust-9-5]
