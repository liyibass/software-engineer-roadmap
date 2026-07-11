# [rust-9-5] 共享狀態與錯誤處理：把 `Result` 轉成乾淨的 HTTP 錯誤回應

> **本章目標**：解決兩個「讓 API 變真實」的關鍵問題——怎麼讓所有 handler 都能用到同一個資料庫連線池，以及怎麼把 Rust 的錯誤優雅地變成正確的 HTTP 錯誤回應。

## 你會學到

- 用 Axum 的 `State` 把連線池共享給所有 handler
- 從環境變數讀取機密設定（別寫死）
- 怎麼把 handler 的 `Result` 變成 HTTP 狀態碼
- HTTP 狀態碼的基本概念（200、404、500…）

## 概念說明

### 問題一：handler 怎麼拿到連線池？

[rust-9-4] 建好的連線池在 `main` 裡，但 handler 是分開的函式，怎麼讓每個 handler 都能用到它？

Axum 的解法是 **`State`（共享狀態）**——你把「所有 handler 都需要的東西」（像連線池、設定）放進 State，Axum 會在每次呼叫 handler 時自動把它遞給需要的 handler。

比喻：State 像「公司的公共資源（影印機、會議室）」——登記在公司層級，每個員工（handler）需要時都能用，不用各自買一台。

### 問題二：錯誤怎麼變成 HTTP 回應？

handler 裡的操作（查資料庫）會回傳 `Result`（[rust-4-1]）。但瀏覽器不懂 Rust 的 `Err`——它懂的是 **HTTP 狀態碼**：

```
200 OK         ── 成功
201 Created    ── 成功建立了新資源
400 Bad Request── 你的請求有問題（例如格式錯）
404 Not Found  ── 找不到（例如查一個不存在的 id）
500 Internal Server Error ── 伺服器自己出錯了（例如資料庫掛了）
```

所以我們要在「Rust 的 `Result`」和「HTTP 狀態碼」之間搭一座橋：成功 → 200/201，失敗 → 依錯誤種類給 404 或 500。

> HTTP 狀態碼的完整意義 → [課外讀物 E-3：網路通訊基礎](../../../課外讀物/E-3-network/E-3-3-http-protocol.md)、**basic 課程 Part 4**

## 程式碼範例

### 用 State 共享連線池

```rust
use axum::{routing::get, extract::State, Json, Router};
use sqlx::PgPool;

// handler 透過 State(pool) 拿到連線池
async fn list_todos(State(pool): State<PgPool>) -> Json<Vec<Todo>> {
    let todos = sqlx::query_as::<_, Todo>("SELECT id, title, done FROM todos")
        .fetch_all(&pool)
        .await
        .unwrap();           // 先用 unwrap，下面會改成正確的錯誤處理
    Json(todos)
}

#[tokio::main]
async fn main() {
    let pool = make_pool().await;        // 建連線池（rust-9-4）

    let app = Router::new()
        .route("/todos", get(list_todos))
        .with_state(pool);               // 把 pool 放進 State，分享給所有 handler

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

說明：`.with_state(pool)` 把連線池登記成共享狀態；handler 只要在參數寫 `State(pool): State<PgPool>`，Axum 就自動把池子遞進來。乾淨俐落。

### 從環境變數讀機密（別寫死）

[rust-9-4] 提醒過：資料庫密碼不能寫死。正確做法是從**環境變數**讀：

```rust
async fn make_pool() -> PgPool {
    // 從環境變數 DATABASE_URL 讀連線字串
    let db_url = std::env::var("DATABASE_URL")
        .expect("請設定 DATABASE_URL 環境變數");
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("資料庫連線失敗")
}
```

執行前在終端機設好（或用 `.env` 檔配 `dotenvy` crate）：

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/mydb"
cargo run
```

說明：`std::env::var("DATABASE_URL")` 讀環境變數。**機密留在環境裡、不進程式碼、不進 Git**——這是後端安全的基本功。`.env` 檔也務必加進 `.gitignore`（[rust-0-4]、[課外讀物 E-8](../../../課外讀物/E-8-git/E-8-1-git-internals.md)）。

### 把 Result 轉成 HTTP 狀態碼

現在處理錯誤。讓 handler 回傳 `Result`，並告訴 Axum「`Err` 時要回什麼狀態碼」：

```rust
use axum::{extract::{State, Path}, http::StatusCode, Json};

// 查單一 todo：可能成功、可能找不到、可能資料庫出錯
async fn get_todo(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Todo>, StatusCode> {
    let result = sqlx::query_as::<_, Todo>("SELECT id, title, done FROM todos WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)            // 回傳 Option：找到 Some、沒找到 None
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;   // 資料庫錯 → 500

    match result {
        Some(todo) => Ok(Json(todo)),                  // 找到 → 200 + JSON
        None => Err(StatusCode::NOT_FOUND),            // 沒找到 → 404
    }
}
```

逐項說明：

- 回傳型別 `Result<Json<Todo>, StatusCode>`：成功給 `Json<Todo>`（Axum 回 200），失敗給一個 `StatusCode`。
- `.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?`：如果**資料庫操作失敗**（連線斷等），把錯誤轉成 `500` 並用 `?` 提早回傳（[rust-4-2]）。
- `match result`：`fetch_optional` 回傳 `Option`——`Some` 表示找到，回 `200` + 資料；`None` 表示查無此 id，回 `404`。

```mermaid
graph TB
    H["handler 執行"]
    H -->|"查到資料"| OK["Ok(Json) → 200 OK"]
    H -->|"查無此 id"| NF["Err(404) → Not Found"]
    H -->|"資料庫出錯"| ISE["Err(500) → Server Error"]
```

這張圖在說：handler 依不同結果，回傳對應的 HTTP 狀態碼——這就是「Rust 的 `Result`」與「HTTP 世界」之間的橋。前端收到 404 就知道「沒這筆」、收到 500 就知道「伺服器出包」，語意清楚。

> 實務上常用自訂錯誤型別 + 實作 `IntoResponse`（搭配 [rust-4-3] 提的 `anyhow`/`thiserror`）讓錯誤處理更優雅，這裡先用最直觀的 `StatusCode`。

## 小練習

1. 把連線池用 `.with_state()` 共享，寫一個 `list_todos` handler 查出所有待辦回傳 JSON。
2. 把 `DATABASE_URL` 改成從環境變數讀，確認沒設時程式會給出清楚的提示（`expect` 的訊息）。
3. 寫一個 `get_todo` handler，查不到 id 時回 `404`、資料庫出錯回 `500`，用 `curl` 測一個存在的和一個不存在的 id，觀察狀態碼（`curl -i` 可看狀態碼）。

<details>
<summary>參考解答</summary>

三題可以組成一個完整的小程式。以下是可編譯的整合版：

```rust
use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use sqlx::{postgres::PgPoolOptions, PgPool};

#[derive(Serialize, sqlx::FromRow)]
struct Todo {
    id: i32,
    title: String,
    done: bool,
}

// 第 2 題：從環境變數讀連線字串，沒設就給清楚的提示
async fn make_pool() -> PgPool {
    let db_url = std::env::var("DATABASE_URL")
        .expect("請設定 DATABASE_URL 環境變數");   // 沒設時這句訊息會印出來
    PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("資料庫連線失敗")
}

// 第 1 題：用 State 拿連線池，查出全部待辦回傳 JSON
async fn list_todos(State(pool): State<PgPool>)
    -> Result<Json<Vec<Todo>>, StatusCode>
{
    let todos = sqlx::query_as::<_, Todo>("SELECT id, title, done FROM todos ORDER BY id")
        .fetch_all(&pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;   // 資料庫錯 → 500
    Ok(Json(todos))
}

// 第 3 題：查不到回 404、資料庫錯回 500
async fn get_todo(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<Todo>, StatusCode> {
    let result = sqlx::query_as::<_, Todo>("SELECT id, title, done FROM todos WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)                              // Some / None
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;   // 資料庫錯 → 500

    match result {
        Some(todo) => Ok(Json(todo)),           // 找到 → 200 + JSON
        None => Err(StatusCode::NOT_FOUND),     // 沒找到 → 404
    }
}

#[tokio::main]
async fn main() {
    let pool = make_pool().await;

    let app = Router::new()
        .route("/todos", get(list_todos))
        .route("/todos/:id", get(get_todo))
        .with_state(pool);                       // 連線池分享給所有 handler

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    println!("跑在 http://127.0.0.1:3000");
    axum::serve(listener, app).await.unwrap();
}
```

驗收點（需自行實機驗證，前提是有一個跑著的 PostgreSQL 且 `todos` 表已建好）：

**第 1 題**：設好 `DATABASE_URL` 後 `cargo run`，`curl http://127.0.0.1:3000/todos` 應拿到一個 JSON 陣列（可能是 `[]` 或幾筆資料）。

**第 2 題**：**故意不設** `DATABASE_URL` 就 `cargo run`，程式會在 `expect` 那行 panic 並印出「請設定 DATABASE_URL 環境變數」——這就是清楚的提示。設好之後再跑：

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/mydb"
cargo run
```

**第 3 題**：用 `curl -i`（`-i` 會印出回應標頭，看得到狀態碼）：

```bash
# 存在的 id → 200 OK + JSON
curl -i http://127.0.0.1:3000/todos/1
# HTTP/1.1 200 OK ... {"id":1,...}

# 不存在的 id → 404 Not Found
curl -i http://127.0.0.1:3000/todos/99999
# HTTP/1.1 404 Not Found
```

`500` 較難刻意觸發（要真的讓資料庫出錯，例如中途把資料庫關掉再打一次），但邏輯上：只要 `fetch_optional` 回 `Err`（連線斷等），`.map_err(...)?` 就會把它變成 `500` 回應。

</details>

## 課外讀物

> HTTP 狀態碼（2xx/4xx/5xx）的完整意義 → [課外讀物 E-3：網路通訊基礎](../../../課外讀物/E-3-network/E-3-3-http-protocol.md)、**basic 課程 Part 4**

> 機密管理、別把密碼進 Git → [課外讀物 E-10：Web Security 基礎](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)、[課外讀物 E-8：Git](../../../課外讀物/E-8-git/E-8-1-git-internals.md)

> 一致的錯誤回應格式設計 → [課外讀物 E-6-8：後端 Clean Code](../../../課外讀物/E-6-best-practices/E-6-8-backend-clean-code.md)

> 下一節：把全部串起來，做一個完整的 REST API → [rust-9-6]
