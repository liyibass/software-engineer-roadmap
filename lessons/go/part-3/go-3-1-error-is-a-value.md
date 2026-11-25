# [go-3-1] 🐹 `error` 是一個值：顯式回傳、`if err != nil` 的哲學與取捨

> **本章目標**：理解 Go 錯誤處理的根——錯誤不是會「飛出來」的例外（exception），而是一個**普通的回傳值**。你會懂 `if err != nil` 為什麼囉嗦、為什麼 Go 覺得這種囉嗦值得，以及它和 try/catch 的根本差別。

## 你會學到

- Go 沒有例外，錯誤是一個普通的回傳值這件事到底是什麼意思
- `error` 其實只是一個很小的 interface，你自己也能做一個錯誤
- `if err != nil` 這個招牌寫法的哲學：「囉嗦，但無處可逃」
- 對照 try/catch：各自犧牲了什麼、換到了什麼
- 建立錯誤的兩個基本工具：`errors.New` 與 `fmt.Errorf`

## 概念說明

### 先看一個你可能已經習慣的世界：try/catch

很多語言（Java、JavaScript、C#、Python）用**例外（exception）**處理錯誤。它的畫面大概是這樣：

```
嘗試：
    開啟檔案          // 這行可能「丟出」例外
    讀取內容          // 這行也可能「丟出」例外
    解析成數字        // 這行還是可能「丟出」例外
如果中途有人丟出例外：
    接住它，決定怎麼辦
```

這種設計有個特色：**錯誤會自己「飛」**。某一行出錯，控制權會直接跳到最近的 `catch`，中間的程式碼全部被跳過。好處是正常流程（happy path）讀起來很乾淨；壞處是，**你從函式的樣子看不出來它會不會丟例外**，很容易忘了接，結果例外一路往上竄，最後整個程式炸掉。

### Go 的選擇：錯誤是一個「回傳值」

Go 走完全相反的路。它**沒有例外機制**（`panic` 不算，那是別的東西，`go-3-4` 會講）。在 Go 裡，一個可能失敗的函式，會**把錯誤當成一個普通的回傳值交給你**：

```
function 讀檔(路徑):
    回傳 (內容, 錯誤)       // 一次回傳兩個東西

內容, 錯誤 = 讀檔("設定檔")
如果 錯誤 不是空的:
    處理錯誤
否則:
    正常使用 內容
```

這裡的關鍵是 Go 的「多回傳值」能力（你在 `go-1-3` 見過）。慣例是：**最後一個回傳值放 `error`**。成功時 `error` 是 `nil`（Go 的「空」），失敗時它裝著一個描述錯誤的值。

```mermaid
graph LR
    CALL["呼叫 讀檔(路徑)"] --> RET["回傳 (內容, err)"]
    RET --> CHECK{"err != nil ?"}
    CHECK -->|"是 (出錯了)"| HANDLE["當場處理<br/>記錄 / 回傳上層 / 給預設值"]
    CHECK -->|"否 (err 是 nil)"| USE["正常使用 內容"]
```

這張圖在說：錯誤不會自己飛走，它就安靜地躺在回傳值裡等你檢查。檢查 `err != nil` 是你**主動**做的動作，不是被動被例外打斷。

### `error` 到底是什麼？一個很小的 interface

這是 Go 很美的地方：`error` 不是什麼魔法關鍵字，它就是標準庫裡一個**只有一個方法的 interface**（interface 的隱式實作見 `go-2-3`）：

```go
type error interface {
    Error() string
}
```

意思是：**任何型別，只要有一個 `Error() string` 方法，它就是一個 `error`**。沒有繼承、不用宣告「我要實作 error」，長得像就算（鴨子型別）。所以錯誤在 Go 裡真的就是一個再普通不過的值——你可以把它存進變數、放進 slice、當參數傳、當回傳值交出去。

大多數時候你不用自己做錯誤，用標準庫給的兩個工具就夠：

- `errors.New("訊息")`：做一個只帶固定文字的錯誤。
- `fmt.Errorf("格式 %d", 值)`：像 `Printf` 那樣組出帶變數的錯誤訊息。

### `if err != nil`：囉嗦，但無處可逃

寫 Go 你會一直看到這五個字：

```go
result, err := doSomething()
if err != nil {
    return err   // 或記錄、或給預設值……總之你得做點什麼
}
```

一支函式裡出現五六次 `if err != nil` 是家常便飯。很多人第一次看到會嫌「怎麼這麼囉嗦」。Go 團隊的回答是：**這份囉嗦是故意的，而且它買到了一個很重要的東西——錯誤無處可逃。**

比較一下兩種世界犧牲了什麼、換到了什麼：

| | try/catch（例外） | Go（錯誤是值） |
|---|---|---|
| 正常流程好不好讀 | 很乾淨，看不到錯誤處理 | 被一堆 `if err != nil` 切斷，比較吵 |
| 會不會忘記處理錯誤 | 很容易——型別看不出會丟例外 | 很難——錯誤就擺在回傳值，不理它編譯器／工具會提醒 |
| 錯誤在哪裡被處理 | 可能飛到很遠的上層才被接住 | 就在呼叫的下一行，一眼看得到 |
| 控制流程 | 會「跳走」，中間程式碼被略過 | 老實地一行接一行，沒有隱形跳躍 |

一句話抓重點：**try/catch 用「可能忘記處理」換「程式碼乾淨」；Go 用「囉嗦」換「你絕對逃不掉要面對每一個錯誤」。** Go 賭的是：後端服務動輒跑好幾年、經手很多人，與其讓錯誤偷偷溜走、半夜才爆，不如當場攤在你眼前，就算醜一點。

> **常見錯誤** — 很多人剛從別的語言過來，會想「我不管這個錯誤」然後這樣寫：
> ```go
> result, _ := doSomething()   // 用 _ 把 err 丟掉，假裝沒這回事
> ```
> 問題是：這跟 try/catch 裡「忘記 catch」一樣危險，而且更糟——你是**明明看到了還刻意丟掉**。`doSomething()` 失敗時 `result` 可能是個半殘的零值，你卻拿去用，bug 就被你親手種下了。
> 正確做法：除非你能說清楚「為什麼這個錯誤真的可以不理」，否則一律檢查。真的要忽略，也在旁邊寫一句註解解釋為什麼。

## 程式碼範例

### 範例一：標準庫怎麼交出錯誤——字串轉數字

Go 標準庫裡會失敗的函式，都遵守「最後回傳 `error`」的慣例。例如 `strconv.Atoi` 把字串轉成整數（使用者可能亂打）：

```go
package main

import (
	"fmt"
	"strconv"
)

func main() {
	number, err := strconv.Atoi("42")
	if err != nil {
		fmt.Println("轉換失敗：", err)
		return
	}
	fmt.Println("轉換成功，數字是", number)
}
```

說明：`strconv.Atoi` 回傳 `(int, error)`。成功時 `err` 是 `nil`，`number` 是 `42`；如果字串是 `"abc"`，`err` 就會裝著一個錯誤、`number` 是零值 `0`。注意我們**先檢查 `err`、沒事才用 `number`**——這是 Go 最基本的節奏。

### 範例二：自己寫一個會回傳錯誤的函式——安全除法

輪到我們自己定義「可能失敗」的函式。除以零在整數運算會讓程式當掉，所以我們把它變成一個可處理的錯誤回傳出去：

```go
package main

import (
	"errors"
	"fmt"
)

// divide 回傳 a 除以 b 的結果；當 b 為 0 時回傳錯誤，而不是讓程式當掉。
func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, errors.New("除數不能為零")
	}
	return a / b, nil
}

func main() {
	result, err := divide(10, 2)
	if err != nil {
		fmt.Println("出錯：", err)
	} else {
		fmt.Println("10 / 2 =", result)
	}

	result, err = divide(10, 0)
	if err != nil {
		fmt.Println("出錯：", err)
	} else {
		fmt.Println("10 / 0 =", result)
	}
}
```

說明：失敗時我們回傳 `(0, errors.New(...))`——**第一個回傳值給零值、第二個給錯誤**，這是 Go 的慣例。成功時回傳 `(a / b, nil)`。呼叫端被迫先看 `err` 才敢用 `result`。執行會印出 `10 / 2 = 5` 和 `出錯：除數不能為零`。

### 範例三：讓錯誤訊息帶上脈絡——`fmt.Errorf`

`errors.New` 只能放固定文字。實務上錯誤訊息要帶「是哪個東西、什麼值」才有用（這個原則跨所有語言通用）。這時用 `fmt.Errorf`，它像 `Printf` 一樣能塞變數：

```go
package main

import (
	"fmt"
)

// findUser 假裝去查使用者；查不到就回傳一個帶著 id 的錯誤。
func findUser(id int) (string, error) {
	users := map[int]string{1: "Alice", 2: "Bob"}
	name, ok := users[id]
	if !ok {
		// 帶上具體的 id，讓看 log 的人知道是誰沒找到
		return "", fmt.Errorf("找不到 ID 為 %d 的使用者", id)
	}
	return name, nil
}

func main() {
	name, err := findUser(99)
	if err != nil {
		fmt.Println(err) // 找不到 ID 為 99 的使用者
		return
	}
	fmt.Println("找到了：", name)
}
```

說明：`fmt.Errorf("找不到 ID 為 %d 的使用者", id)` 把 `id` 嵌進訊息，出錯時你一眼就知道是「99」沒找到，不用回去翻程式碼猜。比起 `errors.New("not found")` 這種空話，帶脈絡的訊息能省下大把追查時間。

> 這裡用到 `name, ok := users[id]` 這個「逗號 ok」寫法：查 map 時第二個回傳值 `ok` 告訴你鍵到底存不存在。「查不到」是預期內會發生的正常情況，所以用這種明確檢查、而不是假裝一定查得到——這正是 `go-3-4` 會談的「`error` vs `panic`」分界的縮影。

## 小練習

1. 寫一個函式 `parsePort(s string) (int, error)`：用 `strconv.Atoi` 把字串轉成埠號（port），轉失敗就把錯誤往外回傳；若轉成功但數字不在 `1~65535` 範圍內，用 `fmt.Errorf` 回傳一個帶著該數字的錯誤（例如「埠號 70000 超出範圍」）。在 `main` 分別測 `"8080"`、`"abc"`、`"70000"`。
2. 把本章範例二的 `divide` 的錯誤訊息，從固定文字改成用 `fmt.Errorf` 帶上被除數與除數（例如「無法計算 10 / 0：除數不能為零」）。
3. 思考題：你在寫一個後端的「使用者註冊」函式。「使用者填的 email 格式不對」和「程式內部傳進來一個 `nil` 的資料庫連線」——這兩種狀況，哪一種適合回傳 `error`、哪一種其實代表程式有 bug？說說你的判斷（答案的分界線，`go-3-4` 會正式講）。

<details>
<summary>參考解答</summary>

**練習 1：`parsePort`**

```go
package main

import (
	"fmt"
	"strconv"
)

func parsePort(s string) (int, error) {
	port, err := strconv.Atoi(s)
	if err != nil {
		// 轉換本身就失敗（例如 "abc"），把底層錯誤往外回傳
		return 0, err
	}
	if port < 1 || port > 65535 {
		return 0, fmt.Errorf("埠號 %d 超出範圍（必須在 1~65535）", port)
	}
	return port, nil
}

func main() {
	for _, s := range []string{"8080", "abc", "70000"} {
		port, err := parsePort(s)
		if err != nil {
			fmt.Printf("%q 無效：%v\n", s, err)
			continue
		}
		fmt.Printf("%q 的埠號是 %d\n", s, port)
	}
}
```

`"8080"` 會正常回傳 `8080`；`"abc"` 在 `strconv.Atoi` 就失敗，我們直接把那個錯誤回傳；`"70000"` 轉得出數字但超出範圍，我們用 `fmt.Errorf` 自己做一個帶該數字的錯誤。注意兩種失敗都在失敗分支回傳零值 `0` 搭配錯誤，符合 Go 慣例。

**練習 2：帶脈絡的 `divide`**

```go
func divide(a, b int) (int, error) {
	if b == 0 {
		return 0, fmt.Errorf("無法計算 %d / %d：除數不能為零", a, b)
	}
	return a / b, nil
}
```

差別只在把 `errors.New("除數不能為零")` 換成 `fmt.Errorf(...)` 並嵌入 `a`、`b`。`divide(10, 0)` 現在會回傳「無法計算 10 / 0：除數不能為零」。帶上實際數值，讓錯誤自己說清楚是哪一次計算出的問題。

**練習 3：思考題**

- 「使用者填的 email 格式不對」→ 適合回傳 **`error`**。使用者手滑是「預期之內」會發生的事，後端本來就該檢查、好好回一個「email 格式不正確」給前端，請使用者重填。程式完全不該因為別人打錯字就崩潰。
- 「程式內部傳進來一個 `nil` 的資料庫連線」→ 這比較像是**程式有 bug**。正常情況下，你的程式該保證「要用資料庫時連線一定已經準備好」。如果真的收到 `nil`，代表某處的初始化邏輯壞了、進入了「絕不該發生」的狀態——這種情況光回傳 error 可能還不夠，往往該讓它直接 `panic` 把 bug 暴露出來（`go-3-4` 會正式講這條分界）。

一句話抓重點：錯誤來自「外界的正常變化」（使用者輸入、檔案不存在、網路斷線）就回傳 `error`；來自「自己程式的邏輯壞掉」就該當成 bug 處理。

</details>

## 課外讀物

> 錯誤訊息要對人有意義、不要默默吞掉錯誤——這套設計原則跨語言通用 → **[課外讀物 E-6-8] 後端 Clean Code（錯誤處理）**：[後端 Clean Code（錯誤處理）](../../../課外讀物/E-6-best-practices/E-6-8-backend-clean-code.md)

> 想看另一種「不用例外、把失敗寫進型別」的對照——Rust 用 `Result` enum 做同一件事 → 參見 **rust 課程** Part 4（`error` 值 vs `Result`：殊途同歸，寫法不同）

> 下一節：錯誤怎麼「包裝」成一層層脈絡、又怎麼在上層把它拆開來判斷種類 → [go-3-2]
