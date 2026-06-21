# [sre-3-3] Prometheus 深入：資料模型與 PromQL

> **本章目標**：在 infra 課「會架 Prometheus」的基礎上，深入它的資料模型與查詢語言 PromQL，讓你能自己寫查詢、把黃金訊號和 SLI 真正算出來。

## 你會學到

- Prometheus 的資料模型：時間序列與標籤（labels）
- 四種指標型別：Counter、Gauge、Histogram、Summary
- PromQL 基礎：怎麼查詢、怎麼算出「率」
- 怎麼用 PromQL 算出黃金訊號與 SLI

## 概念說明

### 複習：Prometheus 在做什麼

infra Part 7 你已經架過 Prometheus 了——它定時去各個 exporter「拉」指標、存進時序資料庫。這一章我們深入「**它怎麼存資料、你怎麼查資料**」，因為這是把「四個黃金訊號」「SLI」真正算出來的關鍵。

---

### 資料模型：時間序列 + 標籤

Prometheus 的核心是**時間序列（time series）**——「一個指標，隨時間記錄的一連串數值」。但它的精髓在**標籤（labels）**。

一筆 Prometheus 資料長這樣：

```
http_requests_total{method="GET", status="200", path="/api/notes"}  →  15234
└──────┬──────┘ └──────────────────┬───────────────────────┘    └─┬─┘
   指標名稱                      標籤（labels）                     數值
```

- **指標名稱**：`http_requests_total`（總請求數）。
- **標籤**：用 `{}` 包起來的鍵值對，幫指標「分類」——這筆是 `GET`、狀態 `200`、路徑 `/api/notes`。
- **數值**：目前的數字。

標籤超級重要，因為它讓你能**任意切片**：「只看 status=500 的」「只看某個 path 的」「依 method 分組」。這是 Prometheus 強大的來源。

---

### 四種指標型別

Prometheus 指標分四型，搞懂它們才知道怎麼用：

| 型別 | 特性 | 例子 | 白話 |
|------|------|------|------|
| **Counter** | 只增不減 | 總請求數、總錯誤數 | 「累計到現在發生幾次」 |
| **Gauge** | 可上可下 | CPU 使用率、記憶體、當前連線數 | 「此刻的瞬時值」 |
| **Histogram** | 分桶統計分布 | 請求延遲的分布 | 「能算出 p95/p99」 |
| **Summary** | 類似 Histogram | 延遲分位數 | （client 端先算好分位數） |

最常搞混的是 Counter 和 Gauge：

- **Counter（計數器）只會往上加**，例如「總請求數」永遠在增加。你不會直接看它的值（看「總共 1500 萬個請求」沒意義），而是看它**增加的速度**（用 `rate()`，下面講）。
- **Gauge（量規）可上可下**，例如「目前記憶體用量」，看當下的值就有意義。

**Histogram** 特別重要——它把延遲分到不同「桶」裡（0-100ms 幾個、100-300ms 幾個…），讓你能算出 p95、p99（Part 2-2 的百分位數）。

---

### PromQL 基礎

**PromQL（Prometheus Query Language）** 是查詢這些資料的語言。幾個你一定要會的：

**最基本——查一個指標：**

```promql
http_requests_total
```

**用標籤過濾：**

```promql
http_requests_total{status="500"}
```

只看狀態 500 的請求數。

**最重要的函式 `rate()`——算 Counter 的「每秒速率」：**

```promql
rate(http_requests_total[5m])
```

這算「過去 5 分鐘內，每秒增加幾個請求」。**對 Counter，你幾乎總是用 `rate()`**——因為你關心的是「速率」（每秒多少請求、每秒多少錯誤），不是累計總數。這就是「流量」黃金訊號。

---

### 用 PromQL 算出黃金訊號與 SLI

把上面組合起來，就能算出你 Part 2、Part 3-1 學的東西。這是這章的重點：

**流量（每秒請求數）：**

```promql
sum(rate(http_requests_total[5m]))
```

`sum()` 把所有標籤的加起來，得到總 RPS。

**錯誤率（= 錯誤 SLI）：**

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
sum(rate(http_requests_total[5m]))
```

「5xx 請求的速率」除以「總請求速率」= 錯誤比例。`status=~"5.."` 是用正規表示式比對所有 5 開頭的狀態碼。**這就是你的錯誤率 SLI，用 PromQL 算出來了。**

**延遲 p95（用 Histogram）：**

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

`histogram_quantile(0.95, ...)` 從 Histogram 算出 p95。**這就是你的延遲 SLI。**

看到了嗎？Part 2 抽象定義的 SLI，到這裡變成了**真的能執行、能畫成圖、能設告警的查詢**。這就是「把可靠性工程落地」。

## 範例：把 SLO 變成可監控的查詢

回到 Part 2-6 那個筆記 App，把它的 SLO 變成 PromQL：

```
SLO：可用率 99.9%（錯誤率 < 0.1%）

監控查詢（即時錯誤率）：
  sum(rate(http_requests_total{status=~"5.."}[5m]))
    / sum(rate(http_requests_total[5m]))

  → 這個值如果 > 0.001（0.1%），就代表正在違反 SLO
  → 可以拿這個查詢去設告警（Part 4）、畫進儀表板（3-4）

SLO：延遲 p95 < 300ms

監控查詢：
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
  → 這個值如果 > 0.3（秒），就代表延遲超標
```

你的 SLO 不再是文件上的數字，而是**活生生、即時計算、隨時可對照的查詢**。這是 SRE 把「可靠性」真正工程化的關鍵一步。

## 小練習

### 練習 1：分清 Counter 與 Gauge

下面的指標，是 Counter 還是 Gauge？

1. 伺服器啟動至今的總請求數
2. 目前的 CPU 使用率
3. 累計發生的錯誤總數
4. 當前資料庫連線數

---

### 練習 2：為什麼 Counter 要用 rate()

回答：為什麼看 Counter（如總請求數）時，幾乎都用 `rate()` 算速率，而不是直接看它的值？

---

### 練習 3：寫一個 PromQL

試著寫出「過去 5 分鐘，`/api/login` 這個路徑的每秒請求數」的 PromQL。

> 提示：用 `rate()` + 標籤過濾 `{path="/api/login"}`。

## 課外讀物

> 想複習 Prometheus 的架構與「pull 模型」怎麼運作 → 參見 **infra 課程** Part 7-3（`lessons/infra/課程大綱.md`）
