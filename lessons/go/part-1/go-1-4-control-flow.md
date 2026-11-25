# [go-1-4] 流程控制：if、for、switch

> **本章目標**：學會 Go 的三個流程控制關鍵字——`if`（可以帶初始化）、`for`（Go **唯一**的迴圈關鍵字）、`switch`，並認識它們和別的語言不一樣的幾個貼心設計。

## 你會學到

- `if` 的寫法，以及 Go 特有的「帶初始化的 if」
- 為什麼 Go 只有 `for` 一個迴圈關鍵字，卻能做到 while、無窮迴圈、遍歷
- 用 `range` 遍歷集合
- `switch` 比別的語言聰明在哪（不用寫 `break`、`case` 可放條件）

## 概念說明

### Go 砍掉花招，只留必要的

延續 Go「用簡單換可維護」的精神，流程控制被刻意精簡：

```
別的語言常有：  if / else、for、while、do-while、foreach、switch ...
Go 只有：       if / else、for、switch
```

少了 `while` 和 `do-while`？不是做不到，而是 Go 認為**一個 `for` 就能涵蓋所有迴圈需求**，與其給你三四個關鍵字，不如給你一個、用不同寫法變化。少即是多。

### 一個共同的小規則：條件不加括號、大括號不能省

Go 的 `if`、`for`、`switch` 有兩個和 C／Java 不同的硬規則：

```
條件「不用」加小括號：  if x > 0 { ... }     ← 不是 if (x > 0)
大括號「不能」省略：    if x > 0 { doIt() }  ← 就算只有一行也要 { }
```

第二點是刻意的——很多語言允許 `if (x) doIt();` 省略大括號，結果釀成不少著名 bug（有人多加一行以為在 if 裡、其實不是）。Go 乾脆不給省，永遠要 `{ }`。

## 程式碼範例

### `if` / `else`：條件不加括號

```go
package main

import "fmt"

func main() {
	score := 72

	if score >= 60 {
		fmt.Println("及格")
	} else {
		fmt.Println("不及格")
	}
}
```

說明：條件 `score >= 60` 沒有括號，身體一定要用 `{ }` 包住。`else` 要和前一個 `}` 寫在同一行（`} else {`），這是 gofmt 強制的格式。

### Go 特有：帶初始化的 `if`

Go 的 `if` 可以在條件前面先跑一個「初始化語句」，用分號隔開。這在搭配 [go-1-3] 的 `(結果, error)` 時超級常見——**先呼叫、拿到結果和 error，馬上在同一個 if 判斷**：

```go
func main() {
	// 先執行 divide，拿到 result 和 err，再判斷 err
	if result, err := divide(10, 2); err != nil {
		fmt.Println("出錯：", err)
	} else {
		fmt.Println("結果：", result)
	}
	// 注意：result 和 err 只在這個 if/else 範圍內存在，出去就沒了
}
```

好處是：`result` 和 `err` 的「作用範圍」被限制在這個 `if` 裡面，用完就消失，不會污染外面——變數活得越短，越不容易出錯。這是你在 Go 程式裡會一直看到的慣用寫法。

### `for`：一個關鍵字，四種用法

Go 只有 `for`，但它能變出別的語言需要好幾個關鍵字才做得到的事。

**用法一：傳統三段式（初始化; 條件; 後置）**

```go
func main() {
	for i := 0; i < 3; i++ {
		fmt.Println("第", i, "次")
	}
}
```

**用法二：只留條件 = 別的語言的 `while`**

```go
func main() {
	n := 1
	for n < 100 { // 等同 while (n < 100)
		n *= 2
	}
	fmt.Println(n) // 128
}
```

**用法三：什麼都不寫 = 無窮迴圈**（搭配 `break` 跳出）

```go
func main() {
	count := 0
	for { // 無窮迴圈
		count++
		if count == 5 {
			break // 跳出迴圈
		}
	}
	fmt.Println(count) // 5
}
```

說明：同一個 `for`，省掉不同部分就變成三種迴圈。這就是 Go「一個關鍵字涵蓋所有」的設計。

### `for range`：遍歷集合

要「把一個集合從頭到尾走一遍」，用 `for ... range`。它會吐出「索引」和「值」兩個東西：

```go
func main() {
	fruits := []string{"蘋果", "香蕉", "橘子"}

	for index, fruit := range fruits {
		fmt.Println(index, fruit)
	}
	// 0 蘋果
	// 1 香蕉
	// 2 橘子
}
```

如果你不需要索引，用 `_` 丟掉它（又見 [go-1-3] 的空白識別字）：

```go
func main() {
	fruits := []string{"蘋果", "香蕉", "橘子"}
	for _, fruit := range fruits { // 只要值，丟掉索引
		fmt.Println(fruit)
	}
}
```

> `slice`、`map` 這些集合本身，是下一章 [go-1-5] 的主題；這裡先學會「怎麼遍歷它們」。

### `switch`：比你想的聰明

Go 的 `switch` 修掉了 C 系語言兩個著名的坑：

**第一：不用寫 `break`，不會「貫穿（fallthrough）」**

C／Java 裡每個 `case` 結尾忘了寫 `break`，程式就會「掉下去」繼續跑下一個 case——這是無數 bug 的來源。Go 反過來：**每個 `case` 自動 break，不會貫穿**：

```go
func main() {
	day := 6

	switch day {
	case 6, 7: // 一個 case 可以列多個值
		fmt.Println("週末")
	case 1, 2, 3, 4, 5:
		fmt.Println("上班日")
	default:
		fmt.Println("不是有效的星期")
	}
	// 輸出：週末（跑完這個 case 就結束，不會掉到下一個）
}
```

**第二：`case` 可以放「條件」，取代一長串 if-else**

`switch` 後面不接任何值時，每個 `case` 可以放一個布林條件，誰先成立就跑誰。這讓一長串 `if / else if` 變得清爽：

```go
func gradeOf(score int) string {
	switch {
	case score >= 90:
		return "優"
	case score >= 60:
		return "及格"
	default:
		return "不及格"
	}
}

func main() {
	fmt.Println(gradeOf(85)) // 及格
}
```

說明：`switch {` 後面沒有變數，所以每個 `case` 後面放的是條件。`switch` 由上往下找第一個成立的 case——所以 85 會命中 `score >= 60`（不會再往下比），回傳「及格」。

> 另外，`switch` 也和 `if` 一樣可以帶初始化：`switch x := f(); { ... }`。這個模式和 Part 2 的「type switch」會再碰到。

## 小練習

1. 用帶初始化的 `if` 改寫這段：先算 `remainder := n % 2`，再判斷它是不是 0，印出「偶數」或「奇數」。讓 `remainder` 只活在 if 裡。
2. 用 `for` 的三種寫法各印一次 1 到 5：一次用三段式、一次用「只留條件（while 式）」、一次用「無窮迴圈 + break」。
3. 寫一個函式 `season(month int) string`，用 `switch` 把月份轉成季節（12、1、2＝冬；3、4、5＝春；以此類推），用「一個 case 列多個值」的寫法。

<details>
<summary>參考解答</summary>

**練習 1：帶初始化的 if**

```go
package main

import "fmt"

func main() {
	n := 7

	if remainder := n % 2; remainder == 0 {
		fmt.Println("偶數")
	} else {
		fmt.Println("奇數") // n=7，輸出這個
	}
	// 這裡 remainder 已經不存在了，作用範圍只在上面的 if/else
}
```

重點：`remainder` 在 `if` 的初始化段宣告，用分號隔開條件，出了 `if/else` 就消失。這讓暫時用的變數不會外洩。

**練習 2：for 的三種寫法**

```go
package main

import "fmt"

func main() {
	// 三段式
	for i := 1; i <= 5; i++ {
		fmt.Print(i, " ")
	}
	fmt.Println()

	// 只留條件（while 式）
	n := 1
	for n <= 5 {
		fmt.Print(n, " ")
		n++
	}
	fmt.Println()

	// 無窮迴圈 + break
	count := 1
	for {
		if count > 5 {
			break
		}
		fmt.Print(count, " ")
		count++
	}
	fmt.Println()
}
```

三種都印出 `1 2 3 4 5`。平常最常用三段式；「只留條件」適合「不知道要跑幾次、靠條件決定停」的情況；「無窮迴圈 + break」適合「迴圈裡才知道何時該停」（例如一直讀輸入直到結束）。

**練習 3：switch 轉季節**

```go
package main

import "fmt"

func season(month int) string {
	switch month {
	case 12, 1, 2:
		return "冬"
	case 3, 4, 5:
		return "春"
	case 6, 7, 8:
		return "夏"
	case 9, 10, 11:
		return "秋"
	default:
		return "無效月份"
	}
}

func main() {
	fmt.Println(season(4))  // 春
	fmt.Println(season(12)) // 冬
	fmt.Println(season(13)) // 無效月份
}
```

重點：一個 `case` 用逗號列多個值很適合這種「幾個值對應同一個結果」的情境。而且每個 case 跑完自動結束，不會像 C 那樣掉到下一個——不用寫半個 `break`。

</details>

## 課外讀物

> 用「帶條件的 switch」取代一長串 if-else、用「early return」壓平巢狀，都是避免「巢狀地獄」反模式的手法 → [課外讀物 E-6-6：程式碼異味與反模式](../../../課外讀物/E-6-best-practices/E-6-6-anti-patterns.md)
