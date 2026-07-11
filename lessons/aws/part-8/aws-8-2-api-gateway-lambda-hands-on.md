# [aws-8-2] 🔧 動手做：API Gateway + Lambda 做無伺服器 API

> **本章目標**：用 API Gateway + Lambda 做一個「無伺服器 API」——不用開任何 EC2、不用管伺服器，就能提供一個 HTTP API。

## 你會學到

- API Gateway 是什麼、怎麼和 Lambda 搭配
- 建立一個 Lambda 函式
- 用 API Gateway 給它一個 HTTP 端點
- 體驗「沒有伺服器」的 API 開發

## 概念說明

### 這一章在做什麼

aws-8-1 學了 Lambda。這章把它和 **API Gateway** 搭起來，做一個「**用網址就能呼叫的 API**」——但**完全沒有伺服器**。

對比你 basic Part 4 / aws-3-2 的做法：以前要「開 EC2、裝 Node、跑 Express、設 Nginx」才能有一個 API。這次——**只寫一個函式，就有一個能對外的 HTTP API**，AWS 處理其餘一切。

```mermaid
graph LR
    USER["使用者"]
    USER -->|"HTTP 請求"| APIGW["API Gateway<br/>（API 的入口）"]
    APIGW -->|"觸發"| LAMBDA["Lambda 函式<br/>（你的程式碼）"]
    LAMBDA -->|"回傳結果"| APIGW
    APIGW --> USER
```

### API Gateway 是什麼

**API Gateway** 是「**API 的受管入口**」——它接收 HTTP 請求、做路由、然後觸發後面的 Lambda（或其他後端）。它幫你處理「對外的 HTTP 端點、路由、限流、驗證」等，你不用自己架（呼應 aws-6-4 ALB 的「入口」角色，但這是給 serverless 用的）。

API Gateway + Lambda 是經典的 serverless API 組合——**API Gateway 當門面，Lambda 當大腦**。

## 程式碼範例

### 第一步：建立一個 Lambda 函式

1. Console 進入 **Lambda** → Create function。
2. 選「Author from scratch」。
3. Function name：`hello-api`。
4. Runtime：選 **Node.js**（或 Python，你熟悉的）。
5. 建立。

進入函式，寫程式碼（Lambda 的程式碼是一個「handler 函式」，事件來時被呼叫）：

```javascript
// Lambda handler：事件（請求）來時被呼叫
export const handler = async (event) => {
  // event 裡有請求的資訊（路徑、參數等）
  const name = event.queryStringParameters?.name || "世界";

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ message: `你好，${name}！這是無伺服器 API。` }),
  };
};
```

逐段看：

- `handler` 是 Lambda 的進入點——請求來時 AWS 呼叫它，把請求資訊放在 `event`。
- 從 `event` 取出查詢參數 `name`。
- 回傳一個物件（含狀態碼、標頭、body）——API Gateway 會把它變成 HTTP 回應。

注意：你**沒有寫任何「啟動伺服器、監聽 port」的程式碼**（對比 basic Part 4 的 Express `app.listen`）——因為沒有伺服器！你只寫「收到請求要做什麼」。

### 第二步：用 API Gateway 給它 HTTP 端點

1. 在 Lambda 函式頁面 → Add trigger（新增觸發器）。
2. 選 **API Gateway**。
3. 選「Create a new API」→ HTTP API（較簡單）。
4. Security：學習用先選 Open（之後正式環境要加驗證）。
5. 建立。

API Gateway 會給你一個**網址端點**（像 `https://xxxx.execute-api.../hello-api`）。

### 第三步：呼叫你的無伺服器 API

打開那個網址（或加參數）：

```bash
curl "https://xxxx.execute-api.../hello-api?name=小明"
```

你應該收到：

```json
{"message": "你好，小明！這是無伺服器 API。"}
```

**恭喜——你做出了一個 HTTP API，但你沒開過任何一台機器、沒設過任何伺服器。** 它平常不佔資源、被呼叫才跑、閒置零成本（aws-8-1）。AWS 自動處理擴縮——一個人呼叫和一萬個人同時呼叫，它都自動應付（自動起多個 Lambda 實例）。

---

### 對比傳統做法

```
傳統（basic Part 4 / aws-3-2）：
  開 EC2 → SSH → 裝 Node → 寫 Express（含 app.listen）
  → 跑起來 → 設 Nginx → 設 Security Group → 機器要一直開著計費
  → 還要自己處理「流量大了怎麼擴展」

Serverless（這章）：
  寫一個 handler 函式 → 接 API Gateway → 完成
  → 沒有機器、閒置零成本、自動擴縮
  → AWS 處理一切

差別：你只專注「業務邏輯（收到請求做什麼）」，
     基礎設施完全不用碰
```

這就是 serverless 的魅力——**極致地「只管程式、不管基建」**。

---

### 清理

學習做完，刪除 Lambda 函式和 API Gateway（這兩個閒置幾乎不計費，但好習慣，aws-1-3）。

## 小練習

### 練習 1：完成一個 serverless API

照步驟做一個 Lambda + API Gateway 的 API，用 curl 或瀏覽器呼叫成功。改一下回傳內容，重新測試。

<details>
<summary>參考解答</summary>

> ⚠️ 這是動手題，請自行在 AWS Console 實機操作驗證，這裡只給做法與驗收點。（做完記得依本章「清理」段落刪掉 Lambda 與 API Gateway。）

**做法**

1. **建 Lambda**：Console → Lambda → Create function → Author from scratch，Function name 填 `hello-api`，Runtime 選 Node.js（或你熟的），建立。
2. **貼程式碼**：把本章的 handler 貼進去，記得 **Deploy**（HTTP API 建好後改程式碼一定要按 Deploy 才會生效）。
3. **加觸發器**：函式頁 → Add trigger → 選 API Gateway → Create a new API → HTTP API → Security 選 Open → 建立。它會給你一個網址端點。
4. **呼叫測試**：

   ```bash
   curl "https://xxxx.execute-api.../hello-api?name=小明"
   ```

   應該收到 `{"message":"你好，小明！這是無伺服器 API。"}`。不帶 `name` 參數則會回「你好，世界！」（因為程式碼用了 `|| "世界"` 當預設值）。

5. **改回傳內容重測**：例如把訊息改成 `你好，${name}！今天是個好日子。`，記得再按一次 **Deploy**，然後重新 curl 一次確認變了。

**驗收點**

- curl / 瀏覽器打那個網址，能拿到 200 與 JSON 回應。
- 帶 `?name=某某` 時，回傳訊息裡出現你傳的名字；不帶時是預設值。
- 改完程式碼並 Deploy 後，重新呼叫看得到新內容。

**常見卡點**：改了程式碼卻沒按 Deploy（還是舊回應）；或忘了在網址後面加 `/hello-api` 這段路徑。

</details>

---

### 練習 2：對比傳統

回答：這個 serverless API，和 basic Part 4 用 Express 在 EC2 上跑的 API，在「你要管的東西」上有什麼根本差別？

<details>
<summary>參考解答</summary>

根本差別就是「**你要管的東西差非常多**」——serverless 幾乎只剩業務邏輯要管。

**傳統做法（basic Part 4 / aws-3-2，Express + EC2）你要管**：

- 開一台 EC2、SSH 進去、裝 Node.js。
- 寫 Express（含 `app.listen` 啟動伺服器、監聽 port）。
- 設定 Nginx、設定 Security Group。
- 機器要**一直開著**（就算沒人用也在計費）。
- 流量大了，得**自己想辦法擴展**（加機器、設負載平衡…）。

**Serverless 做法（本章，API Gateway + Lambda）你只要管**：

- 寫一個 handler 函式（收到請求要做什麼）。
- 接上 API Gateway。
- 完成。

其餘——機器、OS、啟動伺服器、擴縮——**全部 AWS 處理**。而且沒有一直開的機器，所以閒置零成本；一個人呼叫或一萬人同時呼叫，AWS 自動起對應數量的 Lambda 實例應付。

一句話：傳統做法你要同時顧「業務邏輯 + 一整套基礎設施」；serverless 讓你**只專注業務邏輯，基建完全不用碰**。這就是它的魅力。

</details>

---

### 練習 3：思考適用

回答：你的 Lambda 函式裡，為什麼沒有 `app.listen`（啟動伺服器）這種程式碼？這個「無伺服器 API」適合什麼樣的流量場景？（提示：aws-8-1 的計費、冷啟動）

<details>
<summary>參考解答</summary>

**為什麼沒有 `app.listen`**

因為**根本沒有一台由你啟動、持續監聽 port 的伺服器**。`app.listen` 的作用是「啟動一個伺服器行程，讓它一直開著、監聽某個 port、等請求進來」——這是「伺服器一直在跑」的模型。

Lambda 是**事件驅動**的：平常不存在、不佔資源，有請求（事件）進來時 AWS 才「瞬間起一個實例」呼叫你的 handler，跑完就結束。是 AWS（透過 API Gateway）在幫你「接住 HTTP 請求」，再把請求資訊塞進 `event` 丟給你的函式。所以你只需要寫「**收到請求要做什麼**」，完全不需要、也不該寫「啟動伺服器、監聽 port」的程式碼。

**適合什麼流量場景**

適合「**流量小、不定、突發性、有時閒**」的場景。原因對照 aws-8-1：

- **計費面**：Lambda 閒置零成本、按次計費，還有每月百萬次免費額度。所以流量小或半夜沒人用時，幾乎不花錢——非常划算。反之若是「持續高頻、超大流量」，一直被觸發累加下來可能比一台一直開的 EC2 還貴，就不划算。
- **冷啟動面**：如果是「偶爾才被呼叫」的 API，可能會撞上冷啟動、第一次呼叫慢一下。對一般輕量 API 通常可以接受；但如果是「延遲超敏感、不能忍受偶爾慢一下」的服務，就要考慮緩解手段或改用別的運算選項。

所以這種無伺服器 API 最適合：輕量 API、內部工具、流量不定的服務、原型驗證這類場景。

</details>

## 課外讀物

> 對比傳統的 Express API 開發，理解兩種模式的差異 → 參見 **basic 課程** Part 4（HTTP / Express）
