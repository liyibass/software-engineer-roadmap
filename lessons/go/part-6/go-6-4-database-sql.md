# [go-6-4] `database/sql`：連 PostgreSQL、查詢、交易、用 `context` 設逾時

> **本章目標**：學會用標準庫 `database/sql` 連接 PostgreSQL——建立連線池、用 `QueryContext` / `ExecContext` 查詢與寫入、用 `go-4-6` 的 `context` 設查詢逾時，以及用交易（transaction）保證「一組操作要嘛全成功、要嘛全復原」。

後端最終都要跟資料庫打交道。Go 的 `database/sql` 是一個「通用介面」——它本身不知道怎麼講 PostgreSQL 的話，而是定義了一套標準 API，再由各家資料庫的**驅動（driver）**去實作。好處是：你的程式碼對著 `database/sql` 寫，哪天換資料庫，大致只要換驅動。這章用 PostgreSQL 當例子。

> 這章假設你已經懂基本的 SQL 和資料庫概念（表、查詢、交易）。還不熟的話 → **basic 課程 Part 5**、[課外讀物 E-4-3：交易與 ACID](../../../課外讀物/E-4-database/E-4-3-transaction-acid.md)

## 你會學到

- `database/sql` ＋驅動的分工：為什麼 import 驅動要用「底線（blank import）」
- `sql.DB` 其實是**連線池**，不是「一條連線」——這點影響你怎麼用它
- `QueryContext`（讀多列）、`QueryRowContext`（讀一列）、`ExecContext`（寫入）的分別
- 怎麼用 `context` 給每個查詢設逾時（接 `go-4-6`）
- 交易 `Begin` / `Commit` / `Rollback`：一組操作的「全有全無」

> ⚠️ **這章的範例是示範「怎麼寫」，不需要真的連上資料庫就能讀懂。** 程式碼能編譯、`go vet` 通過即可；真要跑起來需要一個 PostgreSQL 和對應的連線設定。

## 概念說明

### `database/sql` 和驅動：介面與實作分離

```mermaid
graph LR
    CODE["你的程式<br/>（對著 database/sql 寫）"] --> STD["database/sql<br/>（標準介面）"]
    STD --> DRV["pgx 或 lib/pq<br/>（PostgreSQL 驅動）"]
    DRV --> PG[("PostgreSQL")]
```

這張圖在說：你的程式只認識 `database/sql` 這套標準 API；真正「會講 PostgreSQL 協定」的是驅動（這裡用 `github.com/jackc/pgx` 或 `github.com/lib/pq`）。這是 `go-2-3` interface 「隱式實作」的大規模應用——驅動只要滿足 `database/sql` 定義的介面，就能被插進來用。

> interface 把「用的人」和「實作的人」解耦，正是依賴反轉的精神 → **[課外讀物 E-7-6] D — Dependency Inversion Principle**

要用驅動，你得 import 它，但寫法很特別——用一個**底線（`_`）**：

```go
import (
	"database/sql"
	_ "github.com/jackc/pgx/v5/stdlib" // 底線 import：只為了「觸發它的註冊」，程式碼不直接呼叫它
)
```

為什麼加底線？因為你的程式碼**不會直接呼叫驅動的任何函式**——你只呼叫 `database/sql` 的 API。但驅動需要在程式啟動時「向 `database/sql` 登記自己」（在它的 `init()` 裡做）。底線 import 的意思是「我要這個套件的 `init()` 執行（產生登記這個副作用），但我不直接用它的任何東西」。如果不加底線，Go 會因為「import 了卻沒用」而編譯失敗。

### 關鍵認知：`sql.DB` 是「連線池」，不是一條連線

這是最多人誤會的地方。`sql.Open(...)` 回傳的 `*sql.DB` **不是一條資料庫連線**，而是一個**連線池（connection pool）**——一組「預先開好、自動管理、重複使用」的連線。

```mermaid
graph TB
    APP["你的程式<br/>（很多 goroutine 同時查詢）"]
    POOL["sql.DB<br/>（連線池）"]
    C1["連線 1"]
    C2["連線 2"]
    C3["連線 3"]
    APP -->|"要一條連線來查詢"| POOL
    POOL --> C1
    POOL --> C2
    POOL --> C3
```

這帶來幾個重要後果：

1. **`sql.DB` 可以安全地被多個 goroutine 同時用**（它內部管好了連線的借還），所以你整個程式**只需要一個 `sql.DB`**，建一次、傳給所有需要的地方，不要每次查詢都 `sql.Open`。
2. 每次 `Query` / `Exec`，連線池自動借一條連線給你、用完還回去。
3. **`sql.Open` 本身不會真的連上資料庫**——它只是準備好池子。第一次真正的連線發生在你第一次查詢，或你主動 `db.PingContext(ctx)` 時。所以要驗證「連得上嗎」要用 `Ping`，不能只看 `Open` 有沒有出錯。

> 連線池的大小要調（太小會卡、太大會壓垮資料庫），這屬於效能主題 → [課外讀物 E-11-4：資料庫效能](../../../課外讀物/E-11-performance/E-11-4-database-performance.md)

### 三個查詢方法，對應三種需求

| 方法 | 用在 | 回傳 |
|------|------|------|
| `QueryContext` | 讀「多列」（SELECT 一堆） | `*sql.Rows`，要迴圈 `Next()` 掃過去 |
| `QueryRowContext` | 讀「剛好一列」（依 ID 查單筆） | `*sql.Row`，直接 `Scan` |
| `ExecContext` | 寫入（INSERT/UPDATE/DELETE，不回資料列） | `sql.Result`（影響了幾列等） |

注意這些方法名字都有 **`Context`** 結尾——這是刻意選的。還有沒有 Context 的舊版（`Query`、`Exec`），但**現代 Go 一律用帶 Context 的版本**，因為你要能給查詢設逾時、能在上游取消時中斷查詢（就是 `go-4-6` 那套）。

## 程式碼範例

> 以下假設有一張表：
> ```sql
> CREATE TABLE users (
>     id    BIGSERIAL PRIMARY KEY,
>     name  TEXT NOT NULL,
>     email TEXT NOT NULL UNIQUE
> );
> ```

### 範例一：開連線池、用 context 驗證連得上

```go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib" // 底線 import：登記 pgx 驅動
)

func openDB() (*sql.DB, error) {
	// 連線字串含帳密 → 絕不寫死、絕不進 Git，實務上從環境變數讀（下方說明）
	dsn := "postgres://user:password@localhost:5432/mydb?sslmode=disable"

	// "pgx" 是驅動登記的名字；Open 只準備池子，還沒真的連線
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("開啟資料庫失敗：%w", err)
	}

	// 調整連線池（依資料庫承載量設定）
	db.SetMaxOpenConns(25)                 // 池子最多 25 條連線
	db.SetMaxIdleConns(25)                 // 最多保留 25 條閒置連線備用
	db.SetConnMaxLifetime(5 * time.Minute) // 連線最多活 5 分鐘就換新的

	// 用帶逾時的 context 真正試連一次——Open 不會連，Ping 才會
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("連線資料庫失敗：%w", err)
	}

	return db, nil
}
```

說明：

- `sql.Open("pgx", dsn)`：第一個參數是**驅動登記的名字**（pgx 的 stdlib 版登記成 `"pgx"`），不是套件路徑。這就是為什麼前面要底線 import 它——不 import 就沒人登記這個名字，`Open` 會回「unknown driver」。
- `SetMaxOpenConns` 等三個設定在調連線池。這些數字要配合你的 PostgreSQL 設定與負載調，不是越大越好——開太多連線反而會壓垮資料庫。
- `db.PingContext(ctx)` 才是第一次真正連線。用帶 5 秒逾時的 context，連不上時不會無限等待。
- ⚠️ **連線字串裡的帳密是機密**，絕不能寫死在程式碼、絕不能進 Git，正式專案用環境變數（`os.Getenv("DATABASE_URL")`）讀。→ [課外讀物 E-10-1：Web Security 總覽](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)

### 範例二：查一列、查多列，並用參數化查詢防注入

```go
type User struct {
	ID    int64
	Name  string
	Email string
}

// 依 ID 查單筆：QueryRowContext
func getUserByID(ctx context.Context, db *sql.DB, id int64) (*User, error) {
	var u User
	// $1 是參數佔位符，絕不要用字串拼接把 id 塞進 SQL（防 SQL injection）
	err := db.QueryRowContext(ctx,
		"SELECT id, name, email FROM users WHERE id = $1", id,
	).Scan(&u.ID, &u.Name, &u.Email) // Scan 把查到的欄位填進 struct（要傳指標）

	if err == sql.ErrNoRows {
		// 查無資料「不是」錯誤——明確分開處理（回 nil, nil 讓上游決定怎麼辦）
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("查詢 user %d 失敗：%w", id, err)
	}
	return &u, nil
}

// 查多筆：QueryContext，要迴圈掃 Rows
func listUsers(ctx context.Context, db *sql.DB) ([]User, error) {
	rows, err := db.QueryContext(ctx, "SELECT id, name, email FROM users ORDER BY id")
	if err != nil {
		return nil, fmt.Errorf("查詢 users 失敗：%w", err)
	}
	defer rows.Close() // 成對：拿到 Rows 一定要關，否則連線還不回池子

	var users []User
	for rows.Next() { // 一列一列往下掃
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
			return nil, fmt.Errorf("讀取列失敗：%w", err)
		}
		users = append(users, u)
	}
	// 迴圈結束後一定要檢查 rows.Err()——迴圈中途的錯誤只會在這裡浮現
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("掃描 users 發生錯誤：%w", err)
	}
	return users, nil
}
```

說明（這段有好幾個關鍵習慣）：

- **`$1` 參數化查詢**：永遠用 `$1`、`$2` 佔位符加參數，**絕不**把值用字串拼進 SQL。拼字串會造成 **SQL injection**——攻擊者在輸入裡塞 SQL 指令竊取或破壞整個資料庫。這是後端安全的鐵律。→ [課外讀物 E-10-4：SQL Injection](../../../課外讀物/E-10-security/E-10-4-sql-injection.md)
- **`sql.ErrNoRows` 要單獨處理**：`QueryRowContext` 查不到資料時回傳這個特定錯誤。查無資料**不是系統錯誤**（呼應 `go-3-1`「沒有是不是預期內的情況」），通常要分開處理——這裡回 `nil, nil` 讓上游 handler 決定要回 404 還是空結果。
- **`defer rows.Close()`**：`QueryContext` 回傳的 `Rows` 握著一條連線，不關它那條連線永遠回不了池子（連線洩漏）。這又是「成對」原則。
- **`rows.Err()` 收尾檢查**：`for rows.Next()` 迴圈正常結束，不代表沒出錯——迴圈過程中若發生錯誤（例如連線斷），`Next()` 會回 false 讓迴圈結束，真正的錯誤藏在 `rows.Err()` 裡。漏了這個檢查，你會以為「查到空結果」，其實是「查到一半爆了」——又一個會靜默吞錯的坑。

### 範例三：用 context 設查詢逾時（接 `go-4-6`）

`go-4-6` 學的 context 在這裡終於派上大用場：給單一查詢設逾時，並讓上游的取消一路傳到資料庫。

```go
func getUserBySlowQuery(parentCtx context.Context, db *sql.DB, id int64) (*User, error) {
	// 從上游 context 衍生一個「這個查詢最多 2 秒」的子 context
	ctx, cancel := context.WithTimeout(parentCtx, 2*time.Second)
	defer cancel() // 成對：WithTimeout 拿到的 cancel 一定要呼叫（go-4-6）

	var u User
	err := db.QueryRowContext(ctx,
		"SELECT id, name, email FROM users WHERE id = $1", id,
	).Scan(&u.ID, &u.Name, &u.Email)

	// 查詢超過 2 秒，context 逾時，QueryRowContext 會回 context.DeadlineExceeded
	if err != nil {
		return nil, fmt.Errorf("查詢 user %d 失敗：%w", id, err)
	}
	return &u, nil
}
```

說明：

- `context.WithTimeout(parentCtx, 2*time.Second)`：注意是從**上游傳進來的** `parentCtx` 衍生的（在 Web 服務裡，`parentCtx` 通常是 `r.Context()`——那個請求的 context）。這樣兩件事同時成立：查詢自己最多 2 秒；上游請求被取消（使用者關頁面）時，這個查詢也會**立刻被中斷**，不會傻傻把資料庫查完。
- 這就是為什麼前面一直用帶 `Context` 的方法——`database/sql` 的 `QueryContext` 等方法會把 context 的取消訊號**真的傳給資料庫驅動去中斷查詢**，不是只在 Go 這端放棄等待。一個卡住的慢查詢因此能被真正叫停，不會一直佔著資料庫資源。

### 範例四：交易——一組操作「全有全無」

情境：把錢從一個帳戶轉到另一個帳戶。這是兩步（A 扣款、B 入帳），**絕不能只做一半**——扣了款卻沒入帳，錢就憑空消失了。交易（transaction）保證「兩步要嘛都成功、要嘛都不算」。

```go
func transfer(ctx context.Context, db *sql.DB, fromID, toID int64, amountCents int) error {
	// 開啟交易
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("開啟交易失敗：%w", err)
	}
	// 關鍵保險：defer 一個 Rollback。若中途 return（出錯），交易被復原；
	// 若最後成功 Commit 了，這個 Rollback 會回 "交易已結束" 的錯誤、無害（忽略即可）。
	defer tx.Rollback()

	// 第一步：從來源帳戶扣款
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance - $1 WHERE id = $2", amountCents, fromID)
	if err != nil {
		return fmt.Errorf("扣款失敗：%w", err) // 一 return，上面的 defer Rollback 復原整筆
	}

	// 第二步：給目標帳戶入帳
	_, err = tx.ExecContext(ctx,
		"UPDATE accounts SET balance = balance + $1 WHERE id = $2", amountCents, toID)
	if err != nil {
		return fmt.Errorf("入帳失敗：%w", err) // 扣款那步也會一起被復原
	}

	// 兩步都成功，正式提交——到這一刻改動才真正生效
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("提交交易失敗：%w", err)
	}
	return nil
}
```

說明（交易的標準骨架，記起來）：

- `db.BeginTx(ctx, nil)` 開啟交易，回傳一個 `*sql.Tx`。**接下來所有操作都對 `tx` 做，不是對 `db`**——這很重要，對 `db` 做的操作不屬於這筆交易。
- **`defer tx.Rollback()` 是整段的保險**：Go 沒有例外機制，任何一步出錯都是 `return`。只要在 `Commit()` 之前 `return`，這個 defer 的 `Rollback()` 就會把已經做的部分（例如已扣的款）全部復原。這是 `go-3-3` defer「收尾」精神的經典應用——**先寫下 Rollback，再安心寫中間的步驟**。
- 若一路順利走到 `tx.Commit()`，改動才真正落地。Commit 之後那個 defer 的 Rollback 會回一個「交易已經結束」的無害錯誤，直接忽略它（這是慣用寫法，不是 bug）。
- 金額用 `amountCents int`（分）而非浮點數——呼應 `go-6-1`、`go-6-2` 反覆強調的「錢不要用浮點數」。

> 交易、ACID、隔離等級這些概念的完整說明 → [課外讀物 E-4-3：交易與 ACID](../../../課外讀物/E-4-database/E-4-3-transaction-acid.md)；交易牽涉的鎖 → [課外讀物 E-4-5：資料庫鎖](../../../課外讀物/E-4-database/E-4-5-database-lock.md)

## 弱項領域提醒：這些「能跑」不代表「對」

資料庫這塊有幾個典型的「正常跑、但其實錯了」的坑，照 `CLAUDE.md` 的原則主動標出來——這些在你熟的前端領域沒有對應，特別容易疏忽：

1. **忘了 `rows.Err()`**：查到一半出錯會被當成「查完了」，資料靜默變少、不報錯（範例二已處理）。
2. **忘了關 `rows` 或 `tx`**：功能完全正常，但連線悄悄洩漏，跑久了連線池耗盡、服務卡死——**壓力測試才會現形，平常測不出來**。
3. **字串拼接 SQL**：功能完全正常，直到有人用 SQL injection 打進來（一定要用 `$1` 參數化）。
4. **N+1 查詢**：迴圈裡對每一筆資料各發一次查詢，10 筆資料發 11 次查詢。資料少時毫無感覺，資料一多就爆炸。→ [課外讀物 E-4-4：N+1 問題](../../../課外讀物/E-4-database/E-4-4-n-plus-one.md)

這些共同點是：**在你的開發機、小資料量下全都「能跑起來」**，問題只在高流量、大資料、或遇到攻擊時才爆。所以資料庫相關的程式碼，不能只靠「我跑過了，有回正確結果」來驗收。

## 小練習

1. **寫入並拿回 ID**：寫一個 `createUser(ctx, db, name, email)`，用 `INSERT ... RETURNING id` 插入一筆 user 並拿回新產生的 `id`（提示：PostgreSQL 支援 `RETURNING`，所以用 `QueryRowContext` 而不是 `ExecContext`，這樣才能 `Scan` 出回傳的 id）。
2. **查無與出錯要分開**：延續範例二的 `getUserByID`，在呼叫端寫出「查到 → 印使用者」「查無（回 `nil, nil`）→ 印找不到」「真的出錯 → 印錯誤」三種分支，體會為什麼「查無」不該被當成錯誤。
3. **交易思考題**：範例四如果把 `defer tx.Rollback()` 拿掉，並且「扣款成功、但入帳那步因為目標帳戶不存在而失敗」，會發生什麼？錢跑去哪了？這說明了交易在這裡擋住了什麼災難？

<details>
<summary>參考解答</summary>

**第 1 題（INSERT ... RETURNING）**

```go
func createUser(ctx context.Context, db *sql.DB, name, email string) (int64, error) {
	var id int64
	// 用 QueryRowContext 因為要接 RETURNING 回來的 id；參數化防注入
	err := db.QueryRowContext(ctx,
		"INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
		name, email,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("建立 user 失敗：%w", err)
	}
	return id, nil
}
```

驗收點：插入成功回傳新的 `id`。重點是用 `QueryRowContext`＋`RETURNING id`＋`Scan`——因為我們要「拿回」資料庫產生的自增 ID。如果不需要回傳值的純寫入（如 UPDATE），才用 `ExecContext`。email 重複（違反 UNIQUE）時會回 error，被 `%w` 往上包。

**第 2 題（查無 vs 出錯分開處理）**

```go
u, err := getUserByID(ctx, db, 42)
switch {
case err != nil:
	fmt.Println("查詢出錯：", err) // 連線斷、SQL 壞 → 真正的系統錯誤
case u == nil:
	fmt.Println("找不到 id=42 的使用者") // 查無 → 在 Web 服務裡對應 HTTP 404
default:
	fmt.Printf("找到：%+v\n", *u)
}
```

驗收點：三種情況走三條不同的路。關鍵體會：「查無資料」是**預期內會發生的正常情況**（使用者打了一個不存在的 ID），不該和「資料庫連線斷掉」這種真正的系統錯誤混為一談。`getUserByID` 把 `sql.ErrNoRows` 轉成 `nil, nil`，呼叫端就能乾淨地用 `u == nil` 判斷「查無」、用 `err != nil` 判斷「出錯」——這正是 `go-3-1`「『沒有』是不是預期內的情況」那條判準的實踐。

**第 3 題（拿掉 Rollback 的災難）**

如果沒有 `defer tx.Rollback()`，而且扣款成功、入帳失敗後直接 `return`：

- 那筆交易**既沒 Commit 也沒 Rollback，就被丟著**。連線被歸還連線池時，`database/sql` 最終會幫你 rollback 這條懸空的交易（所以錢未必真的消失）——但你**不該依賴這個兜底行為**：它發生的時機不確定，期間那條連線和資料庫端的鎖都被佔著，而且不同驅動行為可能不同。
- 這題要體會的重點是：交易把「扣款」和「入帳」綁成一個**原子操作**——`Commit` 之前的任何失敗，整筆都不算數。沒有交易的話，你會真的遇到「A 的錢扣了、B 卻沒收到」，錢平白蒸發。`defer tx.Rollback()` 讓「出錯就全復原」變成寫死的保證，不管中途從哪一行 return 都守得住。

> 這正是 ACID 裡的「A — Atomicity（原子性）」 → [課外讀物 E-4-3：交易與 ACID](../../../課外讀物/E-4-database/E-4-3-transaction-acid.md)

</details>

## 課外讀物

> 交易、ACID、隔離等級 → [課外讀物 E-4-3：交易與 ACID](../../../課外讀物/E-4-database/E-4-3-transaction-acid.md)

> SQL injection 與參數化查詢 → [課外讀物 E-10-4：SQL Injection](../../../課外讀物/E-10-security/E-10-4-sql-injection.md)

> 索引、N+1、資料庫效能 → [課外讀物 E-4-1：什麼是索引](../../../課外讀物/E-4-database/E-4-1-what-is-index.md)、[課外讀物 E-4-4：N+1 問題](../../../課外讀物/E-4-database/E-4-4-n-plus-one.md)

> 資料庫基礎（表、SQL、關聯模型） → **basic 課程 Part 5**

> 把連線池接進 HTTP handler、交易邊界放哪裡 → Part 7 的 `go-7-4` 接資料庫
