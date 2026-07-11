# [sre-3-6] 🔧 動手做：依四個黃金訊號設計監控

> **本章目標**：在 infra 課架好的 Prometheus + Grafana 之上，為一個服務建立「依四個黃金訊號組織、對照 SLO」的監控儀表板。

## 你會學到

- 把 SLO（Part 2）、黃金訊號（3-1）、PromQL（3-3）、儀表板設計（3-4）全部整合
- 讓應用程式輸出 Prometheus 指標
- 用 PromQL 建出四個黃金訊號的面板
- 在圖上標出 SLO 線，讓超標一目了然

## 概念說明

### 這一章把 Part 2-3 全部串起來

這是 Part 2、3 的整合演練。你會把學過的東西組成一個真正可用的監控：

```mermaid
graph LR
    A["Part 2 SLO<br/>目標 99.9% / p95<300ms"]
    B["3-1 黃金訊號<br/>該看哪四個"]
    C["3-3 PromQL<br/>怎麼算出來"]
    D["3-4 儀表板設計<br/>怎麼擺才有用"]
    A --> E["一個對齊 SLO 的<br/>黃金訊號儀表板"]
    B --> E
    C --> E
    D --> E
```

> 前提：infra Part 7-4 的 Prometheus + Grafana 已經跑起來。在 WSL 上練完全可以。

## 程式碼範例

### 第一步：讓你的應用輸出指標

要監控應用層的黃金訊號（延遲、錯誤），應用本身要「吐出」Prometheus 格式的指標。以 Node 為例，用官方的 `prom-client`：

```bash
npm install prom-client
```

在你的服務（呼應 infra Part 4/5 那個 app）加入指標：

```javascript
const client = require("prom-client");

// Counter：累計請求數（依狀態碼與路徑分標籤）
const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "HTTP 請求總數",
  labelNames: ["method", "status", "path"],
});

// Histogram：請求延遲分布（用來算 p95）
const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP 請求延遲",
  labelNames: ["method", "path"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],   // 延遲分桶
});

// 在每個請求結束時記錄（中介層概念，呼應 basic Part 4）
function recordMetrics(req, res, durationSeconds) {
  httpRequests.inc({ method: req.method, status: res.statusCode, path: req.path });
  httpDuration.observe({ method: req.method, path: req.path }, durationSeconds);
}

// 開一個 /metrics 端點，讓 Prometheus 來抓
// app.get("/metrics", async (req, res) => {
//   res.set("Content-Type", client.register.contentType);
//   res.end(await client.register.metrics());
// });
```

重點：`/metrics` 這個端點，就是 Part 3-3 說的「把指標攤開成網頁，等 Prometheus 來拉」。Counter 算流量與錯誤、Histogram 算延遲 p95——正好對應黃金訊號。

---

### 第二步：讓 Prometheus 抓你的應用

在 infra Part 7-4 的 `prometheus.yml` 加一個抓取目標：

```yaml
scrape_configs:
  - job_name: 'myapp'
    static_configs:
      - targets: ['myapp:3000']    # 你的應用（容器名:port）
```

重啟 Prometheus（`docker compose restart prometheus`）。到 Prometheus 介面（`:9090`）確認 `myapp` 這個 target 是 `UP`。

---

### 第三步：在 Grafana 建黃金訊號面板

在 Grafana 新建一個儀表板，依 3-4 的原則，**最上層放四個黃金訊號**，每個用 3-3 的 PromQL：

**流量面板：**
```promql
sum(rate(http_requests_total[5m]))
```

**錯誤率面板（對應錯誤 SLI）：**
```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))
```

**延遲 p95 面板（對應延遲 SLI）：**
```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

**飽和度面板**（用 infra 的 node_exporter 指標）：
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

---

### 第四步：標出 SLO 線（3-4 的關鍵技巧）

在「錯誤率」面板，加一條 **0.1% 的閾值線**（對應你的 SLO）；在「延遲 p95」面板，加一條 **300ms 的線**。

Grafana 的面板設定裡有 **Thresholds（閾值）** 功能，設定後超過閾值的部分會變紅。這樣——**曲線只要碰到紅線，就代表正在違反 SLO**，不用心算、不用思考，一眼判斷。這就是 3-4 說的「把判斷內建進儀表板」。

---

### 第五步：製造狀況，驗證監控有效

像 infra Part 7-4 那樣，主動製造狀況看監控會不會反應：

```bash
# 對你的服務灌一些會 500 的請求（假設有個會出錯的端點）
for i in {1..50}; do curl -s http://localhost:3000/some-failing-endpoint > /dev/null; done
```

然後看 Grafana 的「錯誤率」面板——它應該在幾秒內竄高、甚至衝破你畫的 0.1% 紅線。**你親眼看到「SLO 被違反」這件事被監控即時捕捉到了**。這個監控接下來就能拿去設告警（Part 4）。

## 小練習

### 練習 1：建立黃金訊號儀表板

在你的環境，讓應用輸出指標、讓 Prometheus 抓到、在 Grafana 建出「流量 / 錯誤率 / 延遲 p95 / 飽和度」四個面板。

<details>
<summary>參考解答</summary>

這是動手題，成功的樣子與關鍵檢查點如下（照本章五步驟做即可）：

1. **應用輸出指標**：用 `prom-client` 加入一個 Counter（`http_requests_total`，標籤 `method/status/path`）和一個 Histogram（`http_request_duration_seconds`，設好 `buckets`），並開一個 `/metrics` 端點把指標攤開。**驗收**：瀏覽器打開 `http://localhost:3000/metrics`，能看到 `http_requests_total`、`http_request_duration_seconds_bucket` 等文字。

2. **Prometheus 抓到**：在 `prometheus.yml` 加 `job_name: 'myapp'`、`targets: ['myapp:3000']`，重啟 Prometheus。**驗收**：進 Prometheus 介面（`:9090`）的 Status → Targets，看到 `myapp` 是 **`UP`**。

3. **Grafana 四個面板**，各用本章的 PromQL：
   - 流量：`sum(rate(http_requests_total[5m]))`
   - 錯誤率：`sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
   - 延遲 p95：`histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
   - 飽和度：`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`

**驗收整體**：先對服務打一些請求製造流量，四個面板都要有數字/曲線在動，而不是「No data」。若延遲面板出現 NaN，多半是 `by (le)` 忘了加，或還沒有足夠請求落進各個 bucket。

（這題需要在你自己的環境實機操作，最終要回到畫面確認四個面板都正常顯示。）

</details>

---

### 練習 2：標出 SLO 線

幫「錯誤率」和「延遲 p95」面板各加一條對應 SLO 的閾值線。確認超標時會變紅。

<details>
<summary>參考解答</summary>

在 Grafana 每個面板的編輯畫面裡，找到 **Thresholds（閾值）** 設定：

- **錯誤率面板**：加一條閾值 **`0.001`**（因為這個 PromQL 算出來是「比例」，0.1% = 0.001；別誤填成 0.1）。base（綠）以上、超過 0.001 設成紅色。
- **延遲 p95 面板**：加一條閾值 **`0.3`**（單位是「秒」，因為 `http_request_duration_seconds` 是以秒為單位，300ms = 0.3 秒）。超過 0.3 設成紅色。

小技巧：
- 若用的是 **Time series** 圖，可把 Threshold 的顯示模式設成「As lines」，這樣紅線會直接畫在圖上，曲線衝破就一眼看到。
- 若用 **Stat / Gauge** 面板，超過閾值時整個數字/量表會直接變紅。

**驗收**：手動製造超標狀況（灌 500 或製造高延遲），對應面板應該從綠轉紅。這正是 3-4 說的「把判斷內建進儀表板」——不用心算，碰紅線就是違反 SLO。

（此題需實機操作並回到畫面確認顏色變化。）

</details>

---

### 練習 3：驗證它真的會反應

製造一些錯誤或負載，觀察對應的黃金訊號面板有沒有即時反應、有沒有衝破 SLO 線。寫下你的觀察。

<details>
<summary>參考解答</summary>

用本章第五步的做法製造狀況，例如對會出錯的端點灌一批請求：

```bash
for i in {1..50}; do curl -s http://localhost:3000/some-failing-endpoint > /dev/null; done
```

**預期觀察（示範）**：
- **流量面板**：RPS 在灌請求的那幾秒明顯上升，停手後回落。
- **錯誤率面板**：因為這批請求回 500，`status=~"5.."` 的速率上升，錯誤率在幾秒內竄高，**衝破你畫的 0.001（0.1%）紅線並變紅**——你親眼看到「SLO 正在被違反」被監控即時捕捉到。
- **延遲 p95 面板**：如果製造的是慢請求（而非快速失敗的 500），p95 會爬升；若衝破 0.3 秒紅線也會變紅。（注意：純 500「快速失敗」的延遲很低，反而不會讓延遲面板變紅——這正好呼應 3-1 說的「成功與失敗延遲要分開看」。）

**為什麼不是「立刻」變化**：PromQL 用的是 `rate(...[5m])`，是「過去 5 分鐘的平均速率」，所以曲線是平滑地爬升、也會平滑地回落，不會像開關一樣瞬間跳動——這是正常的，別誤以為監控壞了。

**重點心得**：監控不只是好看的圖，它真的會在「SLO 被違反」時反應。這個能反應的監控，下一步（Part 4）就能拿去設告警，讓你不用 24 小時盯著螢幕。

（此題需實機操作，最終要回到 Grafana 畫面觀察並記錄實際反應。）

</details>

> 你現在有了「對齊 SLO 的黃金訊號監控」。但光看圖還不夠——你不可能 24 小時盯著。下一個 Part 4 就要解決：怎麼讓系統在「SLO 快被違反時」主動通知你，而且只在「真的需要」時才響。

## 課外讀物

> 這章的 Prometheus/Grafana 環境，來自 infra 課的動手做 → 參見 **infra 課程** Part 7-4（`lessons/infra/課程大綱.md`）
