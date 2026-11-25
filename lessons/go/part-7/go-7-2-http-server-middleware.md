# [go-7-2] 起一個 HTTP 服務：`http.ServeMux`、handler 與 middleware

> **本章目標**：親手用標準庫 `net/http` 跑起一個 HTTP 伺服器，搞懂「handler」到底是什麼形狀、`ServeMux` 怎麼把路徑對應到 handler，並學會 Go 寫 middleware 的核心手法——「包一層 handler」，用它做出記錄請求與 panic 復原這兩個每個服務都該有的中介層。

`go-7-1` 看完地圖，知道標準庫就能做後端。這章開始動手。你會發現 Go 做這件事的方式異常簡單——沒有魔法註解、沒有框架初始化，就是幾個函式和一個介面。先把 handler 和 ServeMux 搞懂，再學 middleware；middleware 是後半這整個 Part 都會靠著的骨架。

## 你會學到

- `http.Handler` 介面與 `http.HandlerFunc`：Go 裡「一個 handler」到底長什麼形狀
- `http.ServeMux`：把「路徑」對應到 handler 的路由器
- 怎麼把伺服器跑起來、用瀏覽器與 `curl` 測
- **middleware 是什麼**：為什麼 Go 不需要特別的 API，「包一層 handler」就是 middleware
- 寫兩個實用的 middleware：請求記錄（logging）、panic 復原（recovery）

## 概念說明

### handler：Go 裡「處理一條請求的東西」長什麼樣

`go-7-1` 說 handler 是「處理某條路由的函式」。在 Go 裡，這件事被定義成一個**介面**（`go-2-3`）——`http.Handler`：

```
http.Handler 這個介面，只要求一個方法：
    ServeHTTP(w 回應寫入器, r 請求)
```

只要某個型別有 `ServeHTTP(w http.ResponseWriter, r *http.Request)` 這個方法，它就「是」一個 handler（`go-2-3` 的隱式實作——長得像就算）。`w` 是你用來**寫回應**的出口，`r` 是進來的**請求**。

但每次都定義一個型別＋寫 method 太囉嗦。99% 的情況你只想寫「一個函式」當 handler，所以標準庫給了一個轉接器 `http.HandlerFunc`：

```
把一個 func(w, r) 包成 http.HandlerFunc，
它就自動變成一個合格的 http.Handler。
```

比喻：`http.Handler` 是「職位說明書」（要會 `ServeHTTP`），`http.HandlerFunc` 是「把一個普通函式套上這張說明書，讓它能上工」的轉接頭。你寫函式，轉接頭幫你補上 `ServeHTTP`。

### ServeMux：把路徑分給對的 handler

一個真實服務有很多條路由。`http.ServeMux`（**mux** 是 multiplexer「多工器」的縮寫，白話就是「總機」）就是那張路由表：你登記「哪個路徑 → 哪個 handler」，請求進來時它負責比對、轉交。

```
ServeMux 像公司總機：
    來電找 /books  → 轉給「列出書的 handler」
    來電找 /health → 轉給「健康檢查 handler」
```

`ServeMux` 自己也是一個 `http.Handler`（它也有 `ServeHTTP`）——它的 `ServeHTTP` 做的事就是「比對路徑、把請求轉給登記的那個 handler」。這種「handler 裡面包 handler」的設計，正是等一下 middleware 能成立的關鍵。

```mermaid
graph LR
    REQ["GET /books"] --> MUX["ServeMux<br/>(總機/路由表)"]
    MUX -->|"比對到 /books"| H["列出書的 handler"]
    H --> RESP["回應"]
```

這張圖在說：請求進來，`ServeMux` 依路徑比對，把它交給登記好的 handler，handler 產生回應。這是每個 Go HTTP 服務最核心的運作。

## 程式碼範例

### 最小可運行的伺服器

延續 `go-7-1` 的 `bookapi` 專案，把 `main.go` 改成：

```go
package main

import (
	"fmt"
	"net/http"
)

// 一個 handler：形狀固定是 func(w http.ResponseWriter, r *http.Request)。
// w 是寫回應的出口，r 是進來的請求。
func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "ok") // 往 w 寫字，就是把回應內容送回去
}

func main() {
	mux := http.NewServeMux()     // 建一個路由器
	mux.HandleFunc("/health", health) // 登記：/health 交給 health 函式

	fmt.Println("伺服器跑在 http://127.0.0.1:8080")
	// ListenAndServe 會一直跑著接請求；它只有在出錯時才回傳 error
	if err := http.ListenAndServe("127.0.0.1:8080", mux); err != nil {
		fmt.Println("伺服器錯誤：", err)
	}
}
```

逐項說明：

- `health` 函式的形狀 `func(w http.ResponseWriter, r *http.Request)` 就是 handler 的標準長相。往 `w` 寫東西（`fmt.Fprintln(w, ...)`）就是在寫回應 body。
- `http.NewServeMux()` 建一個路由器；`mux.HandleFunc("/health", health)` 把 `health` 這個**普通函式**登記成 `/health` 的 handler——`HandleFunc` 內部就幫你用 `http.HandlerFunc` 轉接了，你不用自己包。
- `http.ListenAndServe("127.0.0.1:8080", mux)`：在本機 8080 埠監聽，把 `mux` 當總入口。它會**阻塞**（一直跑著接請求），只有出錯才回傳 error——所以用 `if err := ...; err != nil` 接住（`go-3-1` 的錯誤是值）。

跑起來、測測看：

```bash
go run .
# 伺服器跑在 http://127.0.0.1:8080
```

另開一個終端機（或用瀏覽器打開 `http://127.0.0.1:8080/health`）：

```bash
curl http://127.0.0.1:8080/health
# ok
```

你的第一個 Go HTTP 伺服器跑起來了。`Ctrl + C` 停掉它。

> **為什麼埠號用 8080？** 1024 以下的埠（如 80、443）在多數系統要管理員權限才能綁定，開發時慣用 8080、3000 這類高位埠避開麻煩。這是慣例，不是規定。

### middleware：為什麼「包一層 handler」就是 middleware

想像每條請求進來，你都想先做兩件共用的事：**記一筆 log**（誰在什麼時候打了哪個路徑）、以及**萬一 handler 裡 panic 了別讓整個伺服器掛掉**。你當然不想在每個 handler 裡複製貼上這段——這就是 **middleware（中介層）** 要解決的：把「每條請求都要做的共用處理」抽出來，包在真正的 handler 外面。

Go 做這件事不需要任何特別的框架 API。回想 `go-7-2` 開頭說的：`ServeMux` 自己也是一個 handler、handler 裡可以包 handler。所以 middleware 在 Go 就是一個**「吃一個 handler、回傳一個新 handler」的函式**：

```
middleware 的形狀：
    輸入：一個 handler（真正幹活的那個）
    輸出：一個「外面多包了一層共用處理」的新 handler
```

```mermaid
graph LR
    REQ["請求"] --> LOG["logging<br/>(記一筆)"]
    LOG --> REC["recovery<br/>(攔 panic)"]
    REC --> H["真正的 handler"]
    H --> REC2["(回程)"]
    REC2 --> LOG2["(回程:算耗時)"]
    LOG2 --> RESP["回應"]
```

這張圖在說：請求像剝洋蔥一樣，一層層穿過 middleware 才到達真正的 handler，回應再一層層穿回去。每一層都能在「進」和「出」兩個時機插手做事（例如 logging 在進來時記時間、出去時算耗時）。

### 範例一：請求記錄 middleware

這個 middleware 在請求進來時記下時間，handler 跑完後印出「方法、路徑、耗時」：

```go
import (
	"log"
	"net/http"
	"time"
)

// logging 吃一個 handler，回傳一個「外面包了記錄」的新 handler。
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r) // ← 呼叫被包住的 handler，真正幹活
		// 它跑完回來後，才執行下面這行：算耗時、記一筆
		log.Printf("%s %s 耗時 %v", r.Method, r.URL.Path, time.Since(start))
	})
}
```

逐項說明：

- 參數 `next http.Handler` 是「被包住、真正要跑的下一層」。
- 回傳的是一個新的 `http.HandlerFunc`——裡面先記 `start`，呼叫 `next.ServeHTTP(w, r)`（把球傳給內層），等它回來後再算 `time.Since(start)`（`go-6-1` 的 `time`）印 log。
- `r.Method`、`r.URL.Path` 是從請求 `r` 取出的 HTTP 方法與路徑。
- 「呼叫 `next` 之前」和「之後」各是一個插手時機——這就是洋蔥圖的「進」與「出」。

### 範例二：panic 復原 middleware

`go-3-4` 學過：Go 的正道是回傳 `error`，`panic` 是給「不該發生、發生就代表程式有 bug」的情況。但在伺服器裡有個現實問題：**某一條請求的 handler 若 panic，預設只會中斷那條請求，但你最好主動攔住它、回一個乾淨的 500 錯誤**，避免 panic 的堆疊細節外洩、也讓服務繼續招呼其他請求。這正是 `recover`（`go-3-4`）唯一真正常見的正當用途：

```go
import (
	"log"
	"net/http"
)

// recovery 攔住 handler 裡沒接住的 panic，轉成一個 500 回應，別讓它炸穿。
func recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// recover() 不是 nil，代表內層 panic 了（go-3-4）
				log.Printf("攔到 panic：%v", rec)
				http.Error(w, "伺服器內部錯誤", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
```

說明：

- `defer func(){ ... }()`（`go-3-3` 的 defer）登記一個收尾函式，無論內層正常結束或 panic 都會執行。
- `recover()` 只有在「真的發生 panic」時才回傳非 `nil` 的值（`go-3-4`）。攔到就記 log，並用 `http.Error` 回一個 HTTP 500（`http.StatusInternalServerError` 是標準庫的具名常數，比裸寫 `500` 清楚——`CLAUDE.md` 的「magic number 換具名常數」）。
- 沒有這層，一個 handler 的 panic 雖然不會讓整個行程立刻結束（`net/http` 有最低限度的保護），但你拿不到乾淨的錯誤回應、也可能把內部細節吐給使用者。**攔在 middleware 這一層，是標準做法。**

### 把 middleware 串起來

middleware 既然是「handler → handler」的函式，串接就是「一層包一層」。這也示範一次完整的 `main`：

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

type Book struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Author    string `json:"author"`
	Year      int    `json:"year"`
	Available bool   `json:"available"`
}

func health(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "ok")
}

// 故意會 panic 的 handler，用來驗證 recovery 真的有攔住
func boom(w http.ResponseWriter, r *http.Request) {
	panic("假裝這裡有個 bug")
}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s 耗時 %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("攔到 panic：%v", rec)
				http.Error(w, "伺服器內部錯誤", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", health)
	mux.HandleFunc("/boom", boom)

	// 串接：請求先經過 logging，再經過 recovery，最後才到 mux。
	// 寫法是由外往內包：logging(recovery(mux))。
	var handler http.Handler = mux
	handler = recovery(handler)
	handler = logging(handler)

	fmt.Println("伺服器跑在 http://127.0.0.1:8080")
	if err := http.ListenAndServe("127.0.0.1:8080", handler); err != nil {
		fmt.Println("伺服器錯誤：", err)
	}
}
```

說明：

- `logging(recovery(mux))` 的意思是：最外層是 `logging`（所以它最早看到請求、最晚看到回應，能量到整段耗時），往內是 `recovery`，最內是 `mux`（真正分流到各 handler）。
- 這裡用三行 `handler = ...(handler)` 由內往外一層層包，比巢狀寫 `logging(recovery(mux))` 更好讀、加減 middleware 也方便。順序會影響行為：要能記錄「連 panic 在內的所有請求」，`logging` 就該在 `recovery` 外面。

驗證兩件事：

```bash
go run .

# 正常請求：/health 回 ok，終端機會看到 logging 印出耗時
curl http://127.0.0.1:8080/health
# ok

# 會 panic 的請求：recovery 攔住，回一個 500，而伺服器沒掛、還能繼續服務
curl -i http://127.0.0.1:8080/boom
# HTTP/1.1 500 Internal Server Error
# ...
# 伺服器內部錯誤
```

關鍵觀察：打完 `/boom`（它 panic 了）之後，伺服器**依然活著**，再打 `/health` 還是回 `ok`。這就是 recovery middleware 的價值——一條請求的 bug 不會拖垮整個服務。`curl -i` 的 `-i` 會連 HTTP 狀態列一起印出來，方便確認狀態碼是 500。

## 小練習

1. 跑起本章最後那個完整伺服器，分別 `curl` 打 `/health` 和 `/boom`，確認：`/health` 回 `ok`、`/boom` 回 500，而且打完 `/boom` 後 `/health` 仍正常。觀察終端機 logging 印了什麼。
2. 寫第三個 middleware `addRequestID`：在每個回應加一個自訂 header `X-Request-Id`（值隨便，例如用奈秒時間戳）。串進鏈裡，用 `curl -i` 確認回應 header 有它。（提示：寫 header 要用 `w.Header().Set(...)`，而且**要在寫 body 之前**。）
3. 思考題：如果把串接順序改成 `recovery(logging(mux))`（recovery 在外、logging 在內），當某個 handler panic 時，logging 那行「耗時」的 log 還會被印出來嗎？為什麼？

<details>
<summary>參考解答</summary>

**第 1 題（驗證，需自行實機執行）**

直接用本章「把 middleware 串起來」那段完整程式。驗收點：

```bash
curl http://127.0.0.1:8080/health   # ok
curl -i http://127.0.0.1:8080/boom  # HTTP/1.1 500 ...，body 是「伺服器內部錯誤」
curl http://127.0.0.1:8080/health   # 仍然是 ok（伺服器沒掛）
```

終端機（logging）會看到類似 `GET /health 耗時 23µs`。注意打 `/boom` 時，終端機同時有 `攔到 panic：假裝這裡有個 bug`（recovery 印的）和一行 `/boom` 的耗時（logging 印的）。

**第 2 題（加 X-Request-Id middleware）**

```go
import (
	"net/http"
	"strconv"
	"time"
)

func addRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// header 必須在寫 body 之前設定，否則 header 已經送出去就改不動了
		id := strconv.FormatInt(time.Now().UnixNano(), 10)
		w.Header().Set("X-Request-Id", id)
		next.ServeHTTP(w, r)
	})
}
```

串進鏈裡（放最外層或任一層都行）：

```go
handler = addRequestID(handler)
```

驗收點：

```bash
curl -i http://127.0.0.1:8080/health
# HTTP/1.1 200 OK
# X-Request-Id: 1710000000123456789
# ...
# ok
```

重點觀念：**`w.Header().Set()` 一定要在往 `w` 寫 body（或呼叫會寫 body 的下一層）之前做**。HTTP 回應是「header 先送、body 後送」，一旦開始寫 body，header 就定稿送出了，之後再 `Set` 不會生效。

**第 3 題（順序 recovery 在外、logging 在內）**

`recovery(logging(mux))` 代表：請求先進 recovery，再進 logging，最後到 mux。當內層 handler panic：

- panic 往外層層「炸穿」，先炸到 `logging`。`logging` 的程式是 `start := ...; next.ServeHTTP(...); log.Printf(耗時)`——panic 發生在 `next.ServeHTTP` 那一行，會讓 `logging` 的函式**直接中止**，**後面那行印耗時的 `log.Printf` 不會執行**。
- panic 繼續往外炸到 `recovery`，被它的 `recover()` 攔住，回 500。

所以：**不會印耗時 log**。這就是為什麼實務上通常把 `recovery` 放在**最外層**（`logging(recovery(mux))`）——讓 `recovery` 先把 panic 轉成正常回傳，這樣外面的 `logging` 才能正常走完、記錄到「連 panic 在內的每一條請求」。middleware 的順序會實際改變行為，不是隨便排的。

</details>

## 課外讀物

> middleware 這種「把共用處理包在外面」的設計，和「開閉原則」的精神一致（加功能用包的、不改原本的 handler） → [課外讀物 E-7-3：開閉原則](../../../課外讀物/E-7-solid/E-7-3-ocp.md)

> `recover` 到底該用在哪、`panic` 與 `error` 的分界 → 複習 `go-3-4`；`defer` 收尾 → `go-3-3`

> HTTP 狀態碼（200、500…）的完整意義 → [課外讀物 E-3-3：HTTP 協定](../../../課外讀物/E-3-network/E-3-3-http-protocol.md)

> 下一節：補上真正的路由（方法 + 路徑參數）、JSON 進出與輸入驗證，把書籍 API 做出 CRUD → `go-7-3`
