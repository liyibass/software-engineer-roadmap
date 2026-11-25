# [go-3-2] 包裝與檢查錯誤：`fmt.Errorf("...: %w", err)`、`errors.Is` / `errors.As`

> **本章目標**：學會把一個底層錯誤「包」上你這一層的脈絡再往上傳，讓錯誤訊息像麵包屑一樣串成一條路徑；也學會在上層把包裝拆開、判斷「這到底是不是某個特定錯誤」——用 `errors.Is` 和 `errors.As`。

## 你會學到

- 「錯誤往上傳」為什麼常常需要「加一層脈絡」
- `fmt.Errorf` 裡的 `%w`：把底層錯誤「包」進新錯誤，而不是蓋掉它
- `errors.Is`：判斷「錯誤鏈裡有沒有某個特定錯誤」（像判斷身分）
- `errors.As`：從錯誤鏈裡「取出某個型別的錯誤」拿它的細節（像拆包裹）
- 用「哨兵錯誤（sentinel error）」定義可比對的錯誤值

## 概念說明

### 問題：錯誤一路往上傳，但「在哪裡出的事」不見了

後端程式常常是一層呼叫一層：`handler` 呼叫 `service`，`service` 呼叫 `repository`，`repository` 去讀資料庫或檔案。最底層出錯時，如果每一層都只是原封不動把錯誤往上丟：

```
最底層回傳： "file not found"
     ↑ 原封不動
中間層回傳： "file not found"
     ↑ 原封不動
最上層收到： "file not found"   ← 到底是讀哪個檔？哪個功能在讀？不知道。
```

`"file not found"` 這種光禿禿的訊息，到了最上層完全看不出前因後果。我們希望每一層都能**補上自己這一層的脈絡**，像麵包屑一樣，最後串成一條「從哪裡開始、經過哪裡、最後在哪出事」的路徑。

### 解法一：用 `%w` 把錯誤「包」起來

`go-3-1` 用過 `fmt.Errorf` 組錯誤訊息。它有一個特別的動詞（verb）`%w`，意思是 **wrap（包裝）**：它會把你給的那個錯誤**包進新錯誤裡，而且保留原本那個錯誤的本體**，不只是把它變成一段文字。

```
fmt.Errorf("讀取設定檔失敗: %w", 底層錯誤)
            └─ 你這一層補的脈絡 ─┘  └ %w 把底層錯誤包進去，日後還拆得出來 ┘
```

和 `%v` 的差別很關鍵：

- `%v`：只是把底層錯誤**當文字印進去**，底層錯誤的「本體」就丟了，日後沒辦法再判斷它原本是什麼。
- `%w`：把底層錯誤**整個包進去**，形成一條「錯誤鏈（error chain）」，日後可以用 `errors.Is` / `errors.As` 一層層拆開來看。

```mermaid
graph LR
    A["讀設定檔失敗<br/>(最上層看到的)"] -->|"包著"| B["開檔 config.json 失敗<br/>(中間層補的)"]
    B -->|"包著"| C["file does not exist<br/>(最底層的原始錯誤)"]
```

這張圖在說：`%w` 把錯誤一層層包起來，形成一條鏈。最外層的訊息讀起來是完整的故事，而最裡面的原始錯誤仍然完好地躺在鏈的末端，隨時能被取出來判斷。

### 解法二：上層怎麼判斷「這是不是某個特定錯誤」

包起來之後，上層常常需要**根據錯誤的種類做不同反應**。例如「找不到使用者」就回 404、「資料庫斷線」就重試。但錯誤已經被包了好幾層，你不能用 `err == 某個錯誤` 直接比——因為最外層那個 `err` 是新做的、不等於裡面被包住的原始錯誤。

Go 標準庫 `errors` 套件給了兩把鑰匙，它們會**自動沿著整條錯誤鏈往裡找**：

- **`errors.Is(err, target)`**：問「這條鏈裡，有沒有哪一層**就是** `target` 這個錯誤？」——用來比對「身分」。回傳 `true` / `false`。
- **`errors.As(err, &target)`**：問「這條鏈裡，有沒有哪一層是 `target` 那個**型別**？有的話把它塞進 `target`，讓我拿它身上的欄位細節。」——用來「拆出」某型別的錯誤。

一句話記差別：**`Is` 問身分（是不是這個錯誤），`As` 拆型別（給我那個錯誤的本體好讀它的欄位）。**

### 哨兵錯誤（sentinel error）：先定義好一個可比對的錯誤值

要讓 `errors.Is` 有東西可比，通常會在套件層級先用 `errors.New` 宣告一個**固定的錯誤變數**，當作「這種錯誤的身分證」。這種公開、可供比對的錯誤值，慣稱**哨兵錯誤**，名字慣例以 `Err` 開頭：

```go
var ErrUserNotFound = errors.New("找不到使用者")
```

之後不管它被包了幾層，上層都能用 `errors.Is(err, ErrUserNotFound)` 把它認出來。標準庫自己也這樣做，例如 `io.EOF`（讀到結尾）、`sql.ErrNoRows`（查詢沒有資料）。

## 程式碼範例

### 範例一：一層層包上脈絡

模擬「讀取使用者設定」這個三層呼叫：最底層讀檔失敗，中間層與上層各自補一句脈絡再往上傳。

```go
package main

import (
	"errors"
	"fmt"
)

// 最底層：模擬讀檔，直接回傳一個原始錯誤
func readFile(path string) error {
	return errors.New("file does not exist")
}

// 中間層：補上「在開哪個檔」的脈絡
func openConfig(path string) error {
	if err := readFile(path); err != nil {
		return fmt.Errorf("開啟設定檔 %s 失敗: %w", path, err)
	}
	return nil
}

// 上層：補上「在做哪件事」的脈絡
func loadSettings() error {
	if err := openConfig("config.json"); err != nil {
		return fmt.Errorf("載入使用者設定失敗: %w", err)
	}
	return nil
}

func main() {
	err := loadSettings()
	fmt.Println(err)
	// 載入使用者設定失敗: 開啟設定檔 config.json 失敗: file does not exist
}
```

說明：每一層用 `%w` 包上一句自己的脈絡。最後印出來的是一條完整路徑——「載入設定 → 開 config.json → 檔案不存在」，看 log 的人一眼就懂整件事的來龍去脈。注意每一層只補**自己知道的**脈絡（上層不知道是哪個檔，那是中間層的事），各司其職。

### 範例二：用 `errors.Is` 判斷身分

定義一個哨兵錯誤，把它包進好幾層，再從最外層認出它：

```go
package main

import (
	"errors"
	"fmt"
)

// 哨兵錯誤：這種錯誤的「身分證」
var ErrUserNotFound = errors.New("找不到使用者")

// 最底層：查不到就回傳哨兵錯誤
func queryUser(id int) error {
	if id != 1 {
		return ErrUserNotFound
	}
	return nil
}

// 上層：把哨兵錯誤包上脈絡再往上傳
func getUserProfile(id int) error {
	if err := queryUser(id); err != nil {
		return fmt.Errorf("取得使用者 %d 的個人資料失敗: %w", id, err)
	}
	return nil
}

func main() {
	err := getUserProfile(99)

	// 雖然 err 被包了一層，errors.Is 仍能沿著鏈找到 ErrUserNotFound
	if errors.Is(err, ErrUserNotFound) {
		fmt.Println("這是『找不到使用者』，回應 404")
	} else if err != nil {
		fmt.Println("其他錯誤：", err)
	}
}
```

說明：最外層的 `err` 其實是 `fmt.Errorf` 做的新錯誤，**它本身不等於 `ErrUserNotFound`**——所以你不能寫 `err == ErrUserNotFound`（那會是 `false`）。但 `errors.Is` 會順著 `%w` 的鏈往裡找，找到末端的 `ErrUserNotFound`，於是回傳 `true`。這就是為什麼要用 `errors.Is` 而不是 `==`。

### 範例三：用 `errors.As` 拆出自訂錯誤的細節

有時候你不只想知道「是不是某種錯誤」，還想拿它身上的**欄位**。這時要自訂一個錯誤型別，再用 `errors.As` 把它拆出來。先回憶 `go-3-1`：任何有 `Error() string` 方法的型別都是 `error`。

```go
package main

import (
	"errors"
	"fmt"
)

// 自訂錯誤型別：帶著「哪個欄位、為什麼」的細節
type ValidationError struct {
	Field  string
	Reason string
}

// 有了這個方法，ValidationError 就是一個 error
func (e *ValidationError) Error() string {
	return fmt.Sprintf("欄位 %q 驗證失敗：%s", e.Field, e.Reason)
}

// 最底層：驗證失敗就回傳帶細節的 ValidationError
func validateAge(age int) error {
	if age < 0 {
		return &ValidationError{Field: "age", Reason: "不可以是負數"}
	}
	return nil
}

// 上層：包上脈絡
func registerUser(age int) error {
	if err := validateAge(age); err != nil {
		return fmt.Errorf("註冊使用者失敗: %w", err)
	}
	return nil
}

func main() {
	err := registerUser(-5)

	var validationErr *ValidationError
	if errors.As(err, &validationErr) {
		// 拆出來了，可以讀它的欄位
		fmt.Printf("是驗證錯誤，問題出在欄位 %q\n", validationErr.Field)
	} else if err != nil {
		fmt.Println("其他錯誤：", err)
	}
}
```

說明：`errors.As(err, &validationErr)` 沿著鏈找「型別是 `*ValidationError`」的那一層，找到就塞進 `validationErr`，於是我們能讀它的 `.Field`、`.Reason`。注意傳的是 `&validationErr`（指標的指標），因為 `As` 要把找到的值**寫回**你的變數——忘了加 `&` 會在編譯時報錯，這是常見的小坑。

> **什麼時候用 `Is`、什麼時候用 `As`？** 只想知道「是不是這個特定錯誤」（通常是哨兵錯誤）→ 用 `Is`。想拿到錯誤身上的欄位資料（通常是自訂的錯誤 struct）→ 用 `As`。

## 小練習

1. 定義一個哨兵錯誤 `ErrEmptyInput = errors.New("輸入不可為空")`。寫一個函式 `parseConfigLine(line string) error`：`line` 是空字串就回傳這個哨兵錯誤，否則回傳 `nil`。再寫一個上層函式把它用 `%w` 包成「解析設定行失敗: ...」。在 `main` 用 `errors.Is` 判斷空輸入的情況。
2. 幫範例三的 `ValidationError` 多加一個欄位 `Value int`（記錄「使用者實際填了什麼」），`Error()` 訊息也把它印出來。在 `main` 用 `errors.As` 拆出來後，印出 `Field`、`Value` 兩個欄位。
3. 思考題：同樣是把底層錯誤放進 `fmt.Errorf` 的訊息，用 `%w` 和用 `%v` 差在哪？如果你在中間層用了 `%v`，上層還能用 `errors.Is` 認出最底層的哨兵錯誤嗎？為什麼？

<details>
<summary>參考解答</summary>

**練習 1：哨兵錯誤 + `errors.Is`**

```go
package main

import (
	"errors"
	"fmt"
)

var ErrEmptyInput = errors.New("輸入不可為空")

func parseConfigLine(line string) error {
	if line == "" {
		return ErrEmptyInput
	}
	return nil
}

func parseConfig(line string) error {
	if err := parseConfigLine(line); err != nil {
		return fmt.Errorf("解析設定行失敗: %w", err)
	}
	return nil
}

func main() {
	err := parseConfig("")
	if errors.Is(err, ErrEmptyInput) {
		fmt.Println("偵測到空輸入，請使用者補上內容")
	} else if err != nil {
		fmt.Println("其他錯誤：", err)
	}
}
```

`parseConfig("")` 回傳的是被 `%w` 包過一層的錯誤，但 `errors.Is` 沿鏈找得到末端的 `ErrEmptyInput`，所以印出「偵測到空輸入」。

**練習 2：給 `ValidationError` 加 `Value` 欄位**

```go
type ValidationError struct {
	Field  string
	Value  int
	Reason string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("欄位 %q 的值 %d 驗證失敗：%s", e.Field, e.Value, e.Reason)
}

func validateAge(age int) error {
	if age < 0 {
		return &ValidationError{Field: "age", Value: age, Reason: "不可以是負數"}
	}
	return nil
}

// main 裡：
// var validationErr *ValidationError
// if errors.As(err, &validationErr) {
//     fmt.Printf("欄位 %q 填了 %d\n", validationErr.Field, validationErr.Value)
// }
```

重點是 `errors.As` 把整個 `*ValidationError` 本體拆出來，所以新增的 `Value` 欄位也能一起讀到——這正是 `As` 比 `Is` 強的地方：它給你「整個錯誤物件」，不只是「是或不是」。

**練習 3：思考題（`%w` vs `%v`）**

- `%w` 會把底層錯誤**整個包進去**，保留它的本體，形成可追溯的錯誤鏈；`%v` 只是把底層錯誤**轉成一段文字**塞進訊息，底層錯誤的「身分」就此遺失。
- 如果中間層用了 `%v`，上層就**認不出**最底層的哨兵錯誤了。因為鏈在那一層被「剪斷」——`errors.Is` 往裡找，走到那個用 `%v` 做出來的錯誤時，裡面已經沒有被包住的原始錯誤可以繼續往下找，只剩一段死掉的文字。所以：**只要你希望上層還能用 `errors.Is` / `errors.As` 判斷，整條鏈上每一層都要用 `%w`。** 反過來說，如果你**故意**不想讓上層看到內部細節（例如不想洩漏底層實作），那就刻意用 `%v` 把鏈切斷——這偶爾也是對的設計選擇。

</details>

## 課外讀物

> 一致的錯誤格式、讓錯誤帶有意義的脈絡，是後端錯誤處理設計的核心 → **[課外讀物 E-6-8] 後端 Clean Code（錯誤處理）**：[後端 Clean Code（錯誤處理）](../../../課外讀物/E-6-best-practices/E-6-8-backend-clean-code.md)

> 想看另一種語言怎麼做「包裝錯誤、附加脈絡」——Rust 常用 `anyhow` 的 `.context(...)` 做同一件事 → 參見 **rust 課程** Part 4

> 上一節：為什麼 Go 要把 `error` 當成值 → [go-3-1]；下一節：收尾動作怎麼寫才乾淨 → [go-3-3]
