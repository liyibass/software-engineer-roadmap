# [go-7-6] 🏆 整合專案：完整的書籍清單 REST API

> **本章目標**：把整本書學到的東西全部串成一個**真的能編譯、能跑、有測試、能部署成單一執行檔**的後端服務——一個書籍清單的 REST API，具備完整 CRUD、連 PostgreSQL、交易、優雅關機、table-driven 測試。這是你的 Go 畢業專案：讀完能自己把它敲出來、跑起來、測過、打包。

從 `go-0-1` 到這裡，你學過語法、struct 與 interface、`error` 是值、goroutine 與 `context`、套件與測試、標準庫。Part 7 又一路把 HTTP 服務（`go-7-2`）、路由與 JSON（`go-7-3`）、資料庫（`go-7-4`）、優雅關機（`go-7-5`）疊上去。這一章不教新東西，而是**把它們組裝成一個完整的專案**，讓你看到各塊怎麼咬合。

## 你會學到

- 一個「剛好夠用、不過度設計」的 Go 後端專案長什麼樣：目錄怎麼分、依賴怎麼串
- 用 interface 把 handler 和資料庫解耦，換來「不碰真資料庫也能測」的能力
- 怎麼為這個 API 寫 **table-driven 測試**（`go-5-3`），一張表涵蓋一堆情境
- 怎麼用 `go build` 把整包編成**一個獨立執行檔**，以及怎麼把它跑起來

## 概念說明

### 全貌：這個 API 做什麼

我們做的是一個管理「書籍清單」的 REST API，提供完整的 **CRUD**——任何資料管理服務的四大基本功：

| 動作 | 全名 | HTTP 方法 | 路由 | 意思 | 成功狀態碼 |
|------|------|-----------|------|------|:---:|
| **C**reate | 建立 | `POST` | `/books` | 新增一本書 | `201 Created` |
| **R**ead | 讀取 | `GET` | `/books`、`/books/{id}` | 列出全部 / 查單一本 | `200 OK` |
| **U**pdate | 更新 | `PUT` | `/books/{id}` | 修改一本書 | `200 OK` |
| **D**elete | 刪除 | `DELETE` | `/books/{id}` | 刪除一本書 | `204 No Content` |

這就是 REST API 的典型樣貌——用「HTTP 方法 + 資源路徑」表達「對什麼資源做什麼」。學會這套，任何資源（使用者、訂單、文章…）都是一樣的套路。

### 專案結構：按職責分檔，一個 package 就好

```
bookapi/
├── go.mod              # 模組定義與相依套件
├── schema.sql          # 建表的 SQL（給你手動跑一次）
├── main.go             # 啟動：連 DB、組路由、跑伺服器、優雅關機
├── store.go            # 資料層：BookStore 介面 + PostgreSQL 實作
├── handlers.go         # HTTP 層：app struct、各 handler、路由、JSON 工具、驗證
└── handlers_test.go    # table-driven 測試（用假 store，不碰真 DB）
```

這是一個刻意**簡單**的結構——全部放在同一個 `package main`，用檔名分職責，不急著切 `internal/`、不套任何框架。這正是 `CLAUDE.md` 的「最小可行」：一個教學專案不需要五層目錄。等它真的長大了再拆（`go-5-1` 的 package 切分）。但職責分得很清楚：

```mermaid
graph TB
    MAIN["main.go<br/>啟動、優雅關機"] --> HANDLERS
    HANDLERS["handlers.go<br/>HTTP 層<br/>（app + handlers + 路由）"] -->|透過 BookStore 介面| STORE
    STORE["store.go<br/>資料層<br/>（介面 + PostgreSQL 實作）"] --> DB[("PostgreSQL")]
    TEST["handlers_test.go<br/>塞假 store 測 HTTP 層"] -.->|實作同一個介面| HANDLERS
    style HANDLERS fill:#ddf,stroke:#36c,stroke-width:2px
```

這張圖的關鍵在那條虛線：**`handlers.go` 依賴的是 `store.go` 裡的 `BookStore` 介面，而不是具體的 PostgreSQL 實作。** 所以測試時可以塞一個「假 store」進去，HTTP 層一行都不用改就能測。這就是 `go-2-3` interface ＋ [課外讀物 E-7-6（DIP）](../../../課外讀物/E-7-solid/E-7-6-dip.md) 在真實專案裡換來的實際好處。

## 程式碼範例

> 以下六個檔案就是完整專案，**可以直接敲出來跑**（本章所有程式碼都經過 `gofmt`、`go vet`、`go build`、`go test` 驗證）。先看資料層，再看 HTTP 層，最後是啟動與測試。

### `go.mod` 與 `schema.sql`

```
module bookapi

go 1.22
```

> 只宣告一個相依套件（PostgreSQL 的 driver），執行 `go mod tidy` 後 Go 會自動把它和它的間接相依補進 `go.mod`／`go.sum`（`go-5-2`）。用到 Go 1.22 是因為下面的路由語法（方法 + 路徑參數）是 1.22 才有的標準庫功能。

`schema.sql`——建表，你會在「怎麼跑起來」那節手動對資料庫跑一次：

```sql
CREATE TABLE IF NOT EXISTS books (
    id        BIGSERIAL PRIMARY KEY,
    title     TEXT    NOT NULL,
    author    TEXT    NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO books (title, author) VALUES
    ('深入淺出 Go', '示範作者'),
    ('並行程式設計', '示範作者');
```

### `store.go`：資料層（介面 + 實作）

這個檔案定義核心資料型別 `Book`、handler 依賴的 `BookStore` 介面，以及背後真的連 PostgreSQL 的 `PostgresStore`。SQL 細節在 `go-7-4` 都講過了，這裡是收齊的完整版。

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// Book 是這個服務的核心資料型別，也是回傳給前端的 JSON 形狀。
type Book struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Author    string `json:"author"`
	Available bool   `json:"available"`
}

// ErrNotFound 讓上層能分辨「查無此書」（→ 404）與「資料庫壞了」（→ 500）。
var ErrNotFound = errors.New("找不到這本書")

// BookStore 是 handler 依賴的「抽象」：handler 只要求「能做這五件事」，
// 不在乎背後是 PostgreSQL 還是測試用的假資料。這讓 handler 能被獨立測試。
type BookStore interface {
	List(ctx context.Context) ([]Book, error)
	GetByID(ctx context.Context, id int64) (Book, error)
	Create(ctx context.Context, title, author string) (Book, error)
	Update(ctx context.Context, id int64, title, author string, available bool) (Book, error)
	Delete(ctx context.Context, id int64) error
}

// PostgresStore 是 BookStore 的正式實作，背後是真的 PostgreSQL。
type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (s *PostgresStore) List(ctx context.Context) ([]Book, error) {
	const query = `SELECT id, title, author, available FROM books ORDER BY id`
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("查詢書籍清單失敗：%w", err)
	}
	defer rows.Close() // 成對：拿到 rows 就要關，否則連線不回池子

	books := []Book{} // 初始化為空 slice，讓「沒資料」時 JSON 是 [] 而非 null
	for rows.Next() {
		var b Book
		if err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.Available); err != nil {
			return nil, fmt.Errorf("讀取書籍列失敗：%w", err)
		}
		books = append(books, b)
	}
	if err := rows.Err(); err != nil { // 迴圈中途的錯誤只會在這裡現形
		return nil, fmt.Errorf("走訪書籍列時出錯：%w", err)
	}
	return books, nil
}

func (s *PostgresStore) GetByID(ctx context.Context, id int64) (Book, error) {
	const query = `SELECT id, title, author, available FROM books WHERE id = $1`
	var b Book
	err := s.db.QueryRowContext(ctx, query, id).
		Scan(&b.ID, &b.Title, &b.Author, &b.Available)
	switch {
	case errors.Is(err, sql.ErrNoRows):
		return Book{}, ErrNotFound // 查無資料是預期內的情況，翻成自己的錯誤
	case err != nil:
		return Book{}, fmt.Errorf("查詢書籍 %d 失敗：%w", id, err)
	}
	return b, nil
}

func (s *PostgresStore) Create(ctx context.Context, title, author string) (Book, error) {
	const query = `INSERT INTO books (title, author, available)
	               VALUES ($1, $2, true)
	               RETURNING id, title, author, available`
	var b Book
	err := s.db.QueryRowContext(ctx, query, title, author).
		Scan(&b.ID, &b.Title, &b.Author, &b.Available)
	if err != nil {
		return Book{}, fmt.Errorf("新增書籍失敗：%w", err)
	}
	return b, nil
}

func (s *PostgresStore) Update(ctx context.Context, id int64, title, author string, available bool) (Book, error) {
	const query = `UPDATE books SET title = $1, author = $2, available = $3
	               WHERE id = $4
	               RETURNING id, title, author, available`
	var b Book
	err := s.db.QueryRowContext(ctx, query, title, author, available, id).
		Scan(&b.ID, &b.Title, &b.Author, &b.Available)
	switch {
	case errors.Is(err, sql.ErrNoRows):
		return Book{}, ErrNotFound // 沒這筆可更新
	case err != nil:
		return Book{}, fmt.Errorf("更新書籍 %d 失敗：%w", id, err)
	}
	return b, nil
}

func (s *PostgresStore) Delete(ctx context.Context, id int64) error {
	const query = `DELETE FROM books WHERE id = $1`
	result, err := s.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("刪除書籍 %d 失敗：%w", id, err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("讀取刪除結果失敗：%w", err)
	}
	if rows == 0 {
		return ErrNotFound // 沒有任何列被刪 → 本來就沒這筆
	}
	return nil
}
```

說明：五個方法對應 CRUD（list/get/create/update/delete），全部吃 `context`（`go-4-6`／`go-7-4`）、全部用 `$1` 參數化查詢（防 SQL injection → [課外讀物 E-10-4](../../../課外讀物/E-10-security/E-10-4-sql-injection.md)）。`GetByID`／`Update` 把 `sql.ErrNoRows` 翻成 `ErrNotFound`，`Delete` 靠 `RowsAffected()==0` 判斷不存在——讓 HTTP 層能回對應的 404。

> 這個版本為了聚焦沒放多表交易，但 `go-7-4` 的 `BorrowBook`（借書＝插紀錄＋改書況包成一個交易）可以直接加進 `BookStore` 介面和 `PostgresStore`，當作把專案長大的下一步。

### `handlers.go`：HTTP 層

這個檔案是「HTTP 世界」和「資料世界」的翻譯官。注意 `app.store` 的型別是**介面** `BookStore`，不是具體的 `PostgresStore`——這一個小決定，就是整個專案可測試性的來源。

```go
package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
)

// app 握著這個服務的所有依賴。store 的型別是 interface BookStore，
// 不是具體的 PostgresStore——這正是讓測試能塞假 store 進來的關鍵。
type app struct {
	store BookStore
}

// routes 把所有路由集中在一個地方。用 Go 1.22 的「方法 + 路徑參數」路由，
// 標準庫就夠，不需要第三方框架（為什麼 → go-7-1）。
func (a *app) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /books", a.listBooks)
	mux.HandleFunc("POST /books", a.createBook)
	mux.HandleFunc("GET /books/{id}", a.getBook)
	mux.HandleFunc("PUT /books/{id}", a.updateBook)
	mux.HandleFunc("DELETE /books/{id}", a.deleteBook)
	return mux
}

// ── 請求型別與驗證 ──

type bookRequest struct {
	Title     string `json:"title"`
	Author    string `json:"author"`
	Available bool   `json:"available"`
}

// validate 回傳「欄位 → 錯誤訊息」的對照；空 map 代表通過。
// 抽成純函式（不碰 HTTP、不碰 DB），是為了能用 table-driven 測試單獨驗它。
func (r bookRequest) validate() map[string]string {
	problems := map[string]string{}
	if strings.TrimSpace(r.Title) == "" {
		problems["title"] = "書名不能為空"
	}
	if strings.TrimSpace(r.Author) == "" {
		problems["author"] = "作者不能為空"
	}
	if len(r.Title) > 200 {
		problems["title"] = "書名不能超過 200 字"
	}
	return problems
}

// ── JSON 小工具（go-7-3 寫過，這裡收齊） ──

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func parseID(r *http.Request) (int64, error) {
	return strconv.ParseInt(r.PathValue("id"), 10, 64) // 1.22 的路徑參數
}

// ── handlers：每個只做「解析 → 呼叫 store → 組回應」三件事 ──

func (a *app) listBooks(w http.ResponseWriter, r *http.Request) {
	books, err := a.store.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	writeJSON(w, http.StatusOK, books)
}

func (a *app) getBook(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id 必須是整數")
		return
	}
	book, err := a.store.GetByID(r.Context(), id)
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "找不到這本書")
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	writeJSON(w, http.StatusOK, book)
}

func (a *app) createBook(w http.ResponseWriter, r *http.Request) {
	var req bookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "請求內容不是合法的 JSON")
		return
	}
	if problems := req.validate(); len(problems) > 0 {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"errors": problems})
		return
	}
	book, err := a.store.Create(r.Context(), req.Title, req.Author)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	writeJSON(w, http.StatusCreated, book) // 201
}

func (a *app) updateBook(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id 必須是整數")
		return
	}
	var req bookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "請求內容不是合法的 JSON")
		return
	}
	if problems := req.validate(); len(problems) > 0 {
		writeJSON(w, http.StatusUnprocessableEntity, map[string]any{"errors": problems})
		return
	}
	book, err := a.store.Update(r.Context(), id, req.Title, req.Author, req.Available)
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "找不到這本書")
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	writeJSON(w, http.StatusOK, book)
}

func (a *app) deleteBook(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "id 必須是整數")
		return
	}
	err = a.store.Delete(r.Context(), id)
	switch {
	case errors.Is(err, ErrNotFound):
		writeError(w, http.StatusNotFound, "找不到這本書")
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	w.WriteHeader(http.StatusNoContent) // 204，沒有 body
}
```

說明：每個 handler 都只做三件事——**解析輸入 → 呼叫 store → 把結果（或錯誤）翻成 HTTP 回應**。這種「薄 handler」是刻意的：業務與 SQL 在 store 層、驗證在純函式 `validate`，handler 本身短到一眼看完（`CLAUDE.md`「一個函式只做一件事」、函式設計 → [課外讀物 E-6-3](../../../課外讀物/E-6-best-practices/E-6-3-function-design.md)）。錯誤被誠實地分類成 `400`（輸入格式不對）、`404`（找不到）、`422`（語意驗證不過）、`500`（伺服器自己的錯），沒有一個被默默吞掉（`go-3-1`／後端錯誤處理 → [課外讀物 E-6-8](../../../課外讀物/E-6-best-practices/E-6-8-backend-clean-code.md)）。

### `main.go`：組裝與優雅關機

這個檔案把 `go-7-4` 的連線池和 `go-7-5` 的優雅關機接起來，是整個服務的進入點。

```go
package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // 空白匯入：註冊名為 "pgx" 的 driver
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

// run 把邏輯從 main 抽出來，好處是它能回傳 error（main 不行），
// 讓啟動流程的錯誤處理乾淨一致。
func run() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return errors.New("請設定 DATABASE_URL 環境變數")
	}

	db, err := openDB(dsn)
	if err != nil {
		return err
	}

	application := &app{store: NewPostgresStore(db)}
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      application.routes(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	// context ①：收到 SIGINT/SIGTERM 就自動取消（go-7-5）
	ctx, stop := signal.NotifyContext(context.Background(),
		syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Println("書籍 API 啟動於 http://localhost:8080")
		if err := srv.ListenAndServe(); err != nil &&
			!errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("伺服器意外結束：%v", err)
		}
	}()

	<-ctx.Done()
	stop()
	log.Println("收到關機訊號，開始排空進行中的請求…")

	// context ②：排空最多等 15 秒
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil { // 先排空 HTTP
		log.Printf("排空逾時：%v", err)
	}
	if err := db.Close(); err != nil { // 確定沒人在用，才關連線池
		log.Printf("關閉資料庫時出錯：%v", err)
	}

	log.Println("乾淨退出")
	return nil
}

// openDB 建立並驗證連線池。整個程式只該呼叫一次（go-7-4）。
func openDB(dsn string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("開啟資料庫失敗：%w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("連不上資料庫：%w", err)
	}
	return db, nil
}
```

說明：注意這個常見又好用的慣用法——`main` 只做「呼叫 `run()`，出錯就 `log.Fatal`」，真正的邏輯在 `run() error` 裡。為什麼？因為 `main` 不能回傳 error，所有錯誤都得當場 `log.Fatal`，散落各處；抽出一個會回傳 error 的 `run`，就能用一致的 `if err != nil { return err }` 風格（`go-3-1`），`log.Fatal` 只出現在一個地方。依賴由外往內組：`db → PostgresStore → app`，就是 DIP（[課外讀物 E-7-6](../../../課外讀物/E-7-solid/E-7-6-dip.md)）。

### `handlers_test.go`：table-driven 測試（不碰真資料庫）

這是把 `go-5-3`（table-driven）和 `go-5-4`（`httptest`）用在真專案上。**核心技巧**：因為 `app.store` 是介面，我們寫一個不碰資料庫的「假 store」塞進去，就能在記憶體裡測完整個 HTTP 層——快、不需要資料庫、每次結果一致。

```go
package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// ── 測試替身：一個不碰資料庫的假 store，實作 BookStore 介面 ──
// 因為 app.store 的型別是 interface，測試時塞這個進去，handler 完全不用改。
type fakeStore struct {
	books    map[int64]Book
	nextID   int64
	forceErr error // 設了就讓每個方法都回傳這個錯，用來測「資料庫壞掉 → 500」
}

func newFakeStore(seed ...Book) *fakeStore {
	f := &fakeStore{books: map[int64]Book{}, nextID: 1}
	for _, b := range seed {
		f.books[b.ID] = b
		if b.ID >= f.nextID {
			f.nextID = b.ID + 1
		}
	}
	return f
}

func (f *fakeStore) List(_ context.Context) ([]Book, error) {
	if f.forceErr != nil {
		return nil, f.forceErr
	}
	out := []Book{}
	for _, b := range f.books {
		out = append(out, b)
	}
	return out, nil
}

func (f *fakeStore) GetByID(_ context.Context, id int64) (Book, error) {
	if f.forceErr != nil {
		return Book{}, f.forceErr
	}
	b, ok := f.books[id]
	if !ok {
		return Book{}, ErrNotFound
	}
	return b, nil
}

func (f *fakeStore) Create(_ context.Context, title, author string) (Book, error) {
	if f.forceErr != nil {
		return Book{}, f.forceErr
	}
	b := Book{ID: f.nextID, Title: title, Author: author, Available: true}
	f.books[b.ID] = b
	f.nextID++
	return b, nil
}

func (f *fakeStore) Update(_ context.Context, id int64, title, author string, available bool) (Book, error) {
	if f.forceErr != nil {
		return Book{}, f.forceErr
	}
	if _, ok := f.books[id]; !ok {
		return Book{}, ErrNotFound
	}
	b := Book{ID: id, Title: title, Author: author, Available: available}
	f.books[id] = b
	return b, nil
}

func (f *fakeStore) Delete(_ context.Context, id int64) error {
	if f.forceErr != nil {
		return f.forceErr
	}
	if _, ok := f.books[id]; !ok {
		return ErrNotFound
	}
	delete(f.books, id)
	return nil
}

// ── 測試一：純函式 validate()，最典型的 table-driven test ──
func TestBookRequestValidate(t *testing.T) {
	tests := []struct {
		name        string
		req         bookRequest
		wantProblem bool // 期望「有」驗證錯誤嗎
	}{
		{"書名與作者都有 → 通過", bookRequest{Title: "深入淺出 Go", Author: "某人"}, false},
		{"書名空白 → 不通過", bookRequest{Title: "   ", Author: "某人"}, true},
		{"作者空白 → 不通過", bookRequest{Title: "書", Author: ""}, true},
		{"書名過長 → 不通過", bookRequest{Title: strings.Repeat("長", 201), Author: "某人"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			problems := tt.req.validate()
			gotProblem := len(problems) > 0
			if gotProblem != tt.wantProblem {
				t.Errorf("validate() 有錯誤=%v，期望有錯誤=%v（problems=%v）",
					gotProblem, tt.wantProblem, problems)
			}
		})
	}
}

// ── 測試二：handler 層，table-driven + httptest，用假 store ──
func TestBookHandlers(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		target     string
		body       string
		seed       []Book
		wantStatus int
	}{
		{"GET 既有的書 → 200", http.MethodGet, "/books/1", "",
			[]Book{{ID: 1, Title: "書 A", Author: "作者 A", Available: true}}, http.StatusOK},
		{"GET 不存在的書 → 404", http.MethodGet, "/books/999", "", nil, http.StatusNotFound},
		{"GET id 不是整數 → 400", http.MethodGet, "/books/abc", "", nil, http.StatusBadRequest},
		{"POST 合法 → 201", http.MethodPost, "/books", `{"title":"新書","author":"新作者"}`,
			nil, http.StatusCreated},
		{"POST 書名空白 → 422", http.MethodPost, "/books", `{"title":"","author":"作者"}`,
			nil, http.StatusUnprocessableEntity},
		{"POST 壞掉的 JSON → 400", http.MethodPost, "/books", `{bad json`, nil, http.StatusBadRequest},
		{"DELETE 既有的書 → 204", http.MethodDelete, "/books/1", "",
			[]Book{{ID: 1, Title: "書 A", Author: "作者 A"}}, http.StatusNoContent},
		{"DELETE 不存在的書 → 404", http.MethodDelete, "/books/999", "", nil, http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			application := &app{store: newFakeStore(tt.seed...)}
			handler := application.routes()

			req := httptest.NewRequest(tt.method, tt.target, strings.NewReader(tt.body))
			rec := httptest.NewRecorder()

			handler.ServeHTTP(rec, req) // 不起真的伺服器，直接把請求餵給路由

			if rec.Code != tt.wantStatus {
				t.Errorf("狀態碼 = %d，期望 %d（body=%s）",
					rec.Code, tt.wantStatus, rec.Body.String())
			}
		})
	}
}

// ── 測試三：store 壞掉時 handler 要回 500（用 forceErr 模擬） ──
func TestListBooksDBError(t *testing.T) {
	store := newFakeStore()
	store.forceErr = context.DeadlineExceeded // 假裝資料庫逾時

	application := &app{store: store}
	req := httptest.NewRequest(http.MethodGet, "/books", nil)
	rec := httptest.NewRecorder()
	application.routes().ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("狀態碼 = %d，期望 500", rec.Code)
	}
}
```

說明：三個測試展示了三種層次——

- **`TestBookRequestValidate`** 是教科書式的 table-driven：一張 `tests` 表、每列一個情境、`for` 迴圈配 `t.Run` 跑。要加情境就加一列，不用複製貼上一整個測試函式。這是 Go 測試的招牌風格（`go-5-3`、[課外讀物 E-9-3](../../../課外讀物/E-9-testing/E-9-3-unit-testing.md)）。
- **`TestBookHandlers`** 把 table-driven 和 `httptest`（`go-5-4`）結合：用 `httptest.NewRequest` 偽造請求、`httptest.NewRecorder` 接住回應，**完全不用真的起伺服器、不用真的資料庫**——假 store 就夠了。一張表把 CRUD 的成功與各種失敗（400／404／422）一網打盡（API 測試觀念 → [課外讀物 E-9-8](../../../課外讀物/E-9-testing/E-9-8-api-testing.md)）。
- **`TestListBooksDBError`** 用假 store 的 `forceErr` 欄位模擬「資料庫壞掉」，驗證 handler 這時確實回 `500`——這種錯誤路徑用真資料庫很難穩定重現，用假 store 一行就搞定。這正是**依賴介面而非具體實作**換來的測試能力。

跑測試：

```bash
go test ./...          # 跑全部測試
go test -v ./...       # 看每個子測試的結果
go test -cover ./...   # 順便看覆蓋率（go-5-4）
```

### 怎麼把它跑起來（端對端）

需要一個 PostgreSQL。最快的方式是用容器起一個（若你還沒裝 Docker，用本機裝的 PostgreSQL 也行）：

```bash
# 1) 起一個 PostgreSQL（容器），設好帳密與資料庫名
docker run -d --name bookapi-db \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=books \
  -p 5432:5432 postgres:16

# 2) 建表（把 schema.sql 餵進去）
psql "postgres://postgres:secret@localhost:5432/books" -f schema.sql

# 3) 設連線字串、把服務跑起來
export DATABASE_URL="postgres://postgres:secret@localhost:5432/books"
go run .
# → 書籍 API 啟動於 http://localhost:8080
```

另開一個終端機，用 `curl` 走一遍完整 CRUD：

```bash
BASE=http://localhost:8080

# C：新增
curl -s -X POST $BASE/books \
  -H "Content-Type: application/json" \
  -d '{"title":"學 Go","author":"我"}'
# → {"id":3,"title":"學 Go","author":"我","available":true}

# R：列出全部 / 查單一
curl -s $BASE/books
curl -s $BASE/books/3

# U：更新（把 available 改成 false）
curl -s -X PUT $BASE/books/3 \
  -H "Content-Type: application/json" \
  -d '{"title":"學 Go（讀完了）","author":"我","available":false}'

# D：刪除（成功回 204，沒有 body）
curl -s -i -X DELETE $BASE/books/3 | head -1   # → HTTP/1.1 204 No Content

# 驗證錯誤路徑
curl -s -i $BASE/books/999 | head -1           # → 404
curl -s -X POST $BASE/books -d '{"title":""}'  # → 422，回傳欄位錯誤
```

跑完記得測一下優雅關機（`go-7-5`）：在 `go run .` 的終端機按 `Ctrl+C`，看它印「開始排空…」再「乾淨退出」。

### 打包成單一執行檔部署

開發時用 `go run .`，要上線就編譯：

```bash
go build -o bookapi .
```

產物是一個名叫 `bookapi` 的**獨立執行檔**。Go 後端部署的一大優勢就在這——它把所有相依都靜態編進這**一個檔案**，伺服器上不用裝 Go、不用裝任何執行環境（不像 Node 要搬一整包 `node_modules`）。直接執行它：

```bash
export DATABASE_URL="postgres://postgres:secret@localhost:5432/books"
./bookapi
# → 書籍 API 啟動於 http://localhost:8080
```

```mermaid
graph LR
    DEV["開發：go run .<br/>（改了就重跑）"] --> BUILD["打包：go build -o bookapi<br/>（單一執行檔）"]
    BUILD --> DEPLOY["部署：把這一個檔案<br/>丟上伺服器就能跑<br/>→ infra / aws"]
```

這張圖在說：開發用 `go run` 快速迭代，上線用 `go build` 打包成單一執行檔，接著就能用 **infra 課程**（自架）或 **aws 課程**（雲端）把它部署出去。想編給別台作業系統（例如在 Mac 上編 Linux 版）也只要加兩個環境變數：`GOOS=linux GOARCH=amd64 go build -o bookapi .`——**跨平台交叉編譯**是 Go 內建的，這也是它受歡迎的原因之一。

## 小練習

1. **補完 CRUD 的手感**：把整個專案敲出來跑起來（或照上面步驟），用 `curl` 走完「新增 → 查詢 → 更新 → 刪除 → 再查（應 404）」，確認每一步的狀態碼都對。
2. **加一個情境到測試表**：在 `TestBookHandlers` 的表裡加一列測 `PUT`——更新一本不存在的書應該回 `404`。只加一列、不新增測試函式，體會 table-driven 的好處。
3. **把專案長大一點**：為 `BookStore` 加一個「只列出可借的書」的方法 `ListAvailable(ctx)`（SQL 加 `WHERE available = true`），開一條新路由 `GET /books/available`，並在假 store 裡實作它、加一個測試。走一遍「介面加方法 → 兩個實作都補 → handler 接 → 測試」的完整流程。

<details>
<summary>參考解答</summary>

**第 1 題（端對端走一遍）**

照「怎麼把它跑起來」那節的步驟即可（需自行實機執行，要有 PostgreSQL）。驗收點：新增回 `201` 且拿到 `id`、查單一拿得到、更新後 `available` 變 `false`、刪除回 `204`、再查該 id 回 `404`。這一輪跑通，代表整條鏈路（路由 → handler → store → 資料庫 → 回應）都接對了。

**第 2 題（加一列測 PUT 404）**

在 `TestBookHandlers` 的 `tests` 表裡加這一列：

```go
{"PUT 不存在的書 → 404", http.MethodPut, "/books/999",
	`{"title":"新書名","author":"新作者"}`, nil, http.StatusNotFound},
```

不用動任何其他程式碼，`go test` 就會多跑這個情境。這就是 table-driven 的價值：**擴充測試＝加一列資料**，不是複製一個函式。這一列會驗證 `updateBook` 在 store 回 `ErrNotFound` 時確實翻成 `404`。

**第 3 題（加 `ListAvailable`）**

四個地方都要動，這正是「依賴介面」的代價與好處——加方法時編譯器會逼你把每個實作都補齊，不會漏：

```go
// 1) store.go：介面加一行
type BookStore interface {
	// ...原本的五個...
	ListAvailable(ctx context.Context) ([]Book, error)
}

// 2) store.go：PostgresStore 實作（跟 List 幾乎一樣，SQL 多個 WHERE）
func (s *PostgresStore) ListAvailable(ctx context.Context) ([]Book, error) {
	const query = `SELECT id, title, author, available FROM books
	               WHERE available = true ORDER BY id`
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("查詢可借書籍失敗：%w", err)
	}
	defer rows.Close()
	books := []Book{}
	for rows.Next() {
		var b Book
		if err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.Available); err != nil {
			return nil, err
		}
		books = append(books, b)
	}
	return books, rows.Err()
}

// 3) handlers.go：新 handler + 路由
func (a *app) listAvailableBooks(w http.ResponseWriter, r *http.Request) {
	books, err := a.store.ListAvailable(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "伺服器錯誤")
		return
	}
	writeJSON(w, http.StatusOK, books)
}
// routes() 裡加：mux.HandleFunc("GET /books/available", a.listAvailableBooks)

// 4) handlers_test.go：假 store 也要實作（否則 fakeStore 不再滿足介面，編譯不過）
func (f *fakeStore) ListAvailable(_ context.Context) ([]Book, error) {
	if f.forceErr != nil {
		return nil, f.forceErr
	}
	out := []Book{}
	for _, b := range f.books {
		if b.Available {
			out = append(out, b)
		}
	}
	return out, nil
}
```

注意一個路由細節：`GET /books/available` 和 `GET /books/{id}` 可能會「撞路由」。Go 1.22 的 `ServeMux` 規則是「比較具體的優先」——字面的 `/books/available` 會贏過有萬用字元的 `/books/{id}`，所以兩條可以共存。驗收點：`go build` 要先過（這會逼你確定兩個實作都補了），再加一個 table-driven 測試情境驗 `GET /books/available` 只回可借的書。

</details>

## 課外讀物

> 🎓 **恭喜你完成 Go 課程！** 從零語法基礎，到 goroutine 與 `context`，再到這個能連資料庫、能優雅關機、能打包上線的完整後端服務——你已經能讀、也能寫一個像樣的 Go 服務了。

> 把這個 API 部署上線 → **[infra 課程](../../infra/課程大綱.md)**（自架伺服器、容器）或 **[aws 課程](../../aws/課程大綱.md)**（雲端部署）

> 讓服務「跑得可靠」——監控、告警、逾時重試、SLO → **[sre 課程大綱](../../sre/課程大綱.md)**

> API 的安全面（輸入驗證、注入、認證）→ [課外讀物 E-10：Web 安全總覽](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)

> 想看另一種「沒有 GC、靠所有權做並行」的後端對照 → **rust 課程** Part 9（姊妹課的同款畢業專案）
