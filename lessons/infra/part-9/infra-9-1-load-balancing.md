# [infra-9-1] 反向代理與負載平衡：把流量分給多台

> **本章目標**：理解為什麼一台機器會不夠用，學會用負載平衡（load balancing）把流量分散到多台後端，並看懂它和你 Part 4 學的反向代理是同一個 Nginx 的延伸。

## 你會學到

- 為什麼「加機器」是擴展的常見手段（水平擴展）
- 負載平衡（Load Balancing）是什麼
- 常見的分流策略
- 用 Nginx 把流量分給多台後端（延伸 Part 4-3）

## 概念說明

### 一台機器的極限

到目前為止，你的服務都跑在**一台**機器上。這在流量小時很好，但會遇到兩個天花板：

1. **效能天花板**：使用者越來越多，一台機器的 CPU、記憶體再強也有上限，最後撐不住、變慢。
2. **可靠性天花板**：只有一台機器，它一掛，**整個服務就全掛**（這就是下一章要講的「單點故障」）。

解法很直覺：**多開幾台機器一起分攤**。但這帶來新問題——使用者的請求進來，**該送到哪一台**？這就需要「負載平衡」。

---

### 兩種長大的方式：垂直 vs 水平

先建立一個重要的擴展觀念（呼應課外讀物 E-13 規模化）：

```mermaid
graph TB
    subgraph V["垂直擴展 Scale Up"]
        V1["把一台機器升級得更強<br/>（更多 CPU / 記憶體）"]
    end
    subgraph H["水平擴展 Scale Out"]
        H1["加開更多台機器<br/>一起分攤工作"]
    end
```

| | 垂直擴展（Scale Up） | 水平擴展（Scale Out） |
|---|---------------------|----------------------|
| 做法 | 把單台機器升級得更強 | 加開更多台機器 |
| 比喻 | 把小貨車換成大卡車 | 多派幾台小貨車 |
| 極限 | 有硬體上限，且越高階越貴 | 理論上可無限加 |
| 可靠性 | 還是只有一台（單點） | 多台，一台掛了還有別台 |

水平擴展是現代主流——但它的前提，就是要有人「把工作分配給多台」。這個角色就是**負載平衡器**。

---

### 負載平衡：分流的「交通指揮」

**負載平衡（Load Balancing）** 就是把進來的流量，**平均分配給後面的多台伺服器**，讓大家一起分攤、沒有人累死也沒有人閒著。

用類比：負載平衡器像超市門口的**排隊引導員**——「這位往 3 號櫃台、那位往 5 號櫃台」，讓每個櫃台的負擔均衡，整體結帳更快。

好消息是：**你已經認識這個工具了**。Part 4-3 的 Nginx 反向代理（大樓櫃台），只要稍微設定一下，就能從「轉發給一台後端」升級成「分流給多台後端」——同一個 Nginx，多了一個能力。

```mermaid
graph LR
    U["使用者"]
    LB["Nginx<br/>（負載平衡器）"]
    A1["後端 1"]
    A2["後端 2"]
    A3["後端 3"]

    U --> LB
    LB -->|"分流"| A1
    LB -->|"分流"| A2
    LB -->|"分流"| A3
```

---

### 常見的分流策略

負載平衡器怎麼決定「這個請求給誰」？幾種常見策略：

| 策略 | 怎麼分 | 適合 |
|------|--------|------|
| **輪詢（Round Robin）** | 一台一個輪流發 | 最簡單，後端都差不多時很好用（預設） |
| **最少連線（Least Connections）** | 發給目前最閒的那台 | 各請求耗時差很多時 |
| **IP 雜湊（IP Hash）** | 同一個使用者固定到同一台 | 需要「黏住」同一台時（例如登入狀態） |

入門用預設的輪詢就很夠了。

## 程式碼範例

### 用 Nginx 設定負載平衡

延伸 Part 4-3 的設定。假設你有三台後端（或同一台上跑三個容器，分別在 3001/3002/3003），在 Nginx 設定裡這樣寫：

```nginx
# 定義一組後端（upstream = 上游伺服器群）
upstream myapp_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://myapp_backend;     # 轉給這組後端（自動分流）
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

關鍵差別在 `upstream`：

- `upstream myapp_backend { ... }` 定義了一**組**後端伺服器（取名 `myapp_backend`）。
- `proxy_pass http://myapp_backend`——注意這裡指向的不再是單一位址（Part 4-3 是 `localhost:3000`），而是這**整組**。Nginx 會自動用輪詢把請求分給組裡的三台。

想換策略？在 upstream 裡加一行，例如改用「最少連線」：

```nginx
upstream myapp_backend {
    least_conn;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

改完記得 `sudo nginx -t` 測試、`sudo systemctl reload nginx`（Part 4-3 的保命習慣）。

---

### 健康檢查：自動跳過掛掉的後端

負載平衡還有個隱藏好處：如果某台後端掛了，Nginx 會（在請求失敗時）**自動跳過它、把流量導到還活著的機器**。使用者幾乎無感。這正是水平擴展帶來的可靠性——下一章會深入這個「沒有單點故障」的概念。

## 小練習

### 練習 1：分清兩種擴展

用「貨車」的比喻回答：

1. 垂直擴展和水平擴展的差別？
2. 為什麼水平擴展在「可靠性」上比垂直擴展好？

<details>
<summary>參考解答</summary>

**1. 差別（用貨車比喻）**

- **垂直擴展（Scale Up）＝把小貨車換成大卡車**：同樣一台車，但升級成載得更多、跑得更猛的。對應到機器就是把單台的 CPU、記憶體加大加強。做法簡單，但有硬體天花板，而且越高階越貴，CP 值越差。
- **水平擴展（Scale Out）＝多派幾台小貨車**：不升級單台，而是加開更多台一起分攤工作。對應到機器就是多開幾台後端，用負載平衡器把流量分給大家。理論上想加多少台都行。

一句話：垂直是「讓一台變強」，水平是「讓多台一起做」。

**2. 為什麼水平擴展的可靠性比較好**

因為它天生就有**多台**。垂直擴展再怎麼升級，永遠**還是只有一台**——那一台掛了，整個服務就跟著全掛（這就是下一章要講的「單點故障」）。而水平擴展有好幾台，其中一台掛了，負載平衡器會自動把流量導到還活著的機器，服務照樣運作，使用者幾乎無感。多一份備援，就多一分可靠。

</details>

---

### 練習 2：理解 upstream

對照 Part 4-3 的單台設定，回答：

1. `upstream` 區塊的作用是什麼？
2. `proxy_pass http://myapp_backend` 和 Part 4-3 的 `proxy_pass http://localhost:3000` 差在哪？

<details>
<summary>參考解答</summary>

**1. `upstream` 區塊的作用**

`upstream` 是用來**定義一「組」後端伺服器**，並幫這組取一個名字（例如 `myapp_backend`）。像這樣：

```nginx
upstream myapp_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

它等於在跟 Nginx 說：「以後提到 `myapp_backend`，指的就是這三台。」有了這個群組，Nginx 才能在收到請求時，用某種策略（預設是輪詢 Round Robin）自動決定「這一個請求要發給組裡的哪一台」。你也可以在區塊裡加一行策略，例如 `least_conn;` 就改成「最少連線」。

**2. 兩種 `proxy_pass` 的差別**

- Part 4-3 的 `proxy_pass http://localhost:3000`：指向**單一一台**後端。所有請求都轉給同一個位址，沒有分流可言。
- 本章的 `proxy_pass http://myapp_backend`：指向的不是某個位址，而是上面定義的**那一整組** upstream。Nginx 會自動在組裡的三台之間輪流分配請求。

關鍵差異就是「指向一台」vs「指向一組」。從單台升級成負載平衡，程式碼上其實只多了一個 `upstream` 區塊、把 `proxy_pass` 的目標換成組名——同一個 Nginx，多了分流的能力。

</details>

---

### 練習 3：動手做負載平衡

在你的機器上，用 Docker（Part 5）跑三個同樣的後端容器，分別對應 3001/3002/3003，設定 Nginx 負載平衡到這組。然後連續重新整理網頁，想辦法觀察請求被分到不同容器（提示：可以讓每個容器回應帶上自己的編號）。

<details>
<summary>參考解答</summary>

> 這是動手實機題，以下給做法與驗收點，**實際跑起來的結果請自行在你的機器上驗證**。

**做法**

1. 準備一個會「回報自己身分」的後端。最省事的做法是用環境變數把編號傳進容器，讓回應帶上它。例如用官方的 `hashicorp/http-echo`（收到請求就回固定文字）：

   ```bash
   docker run -d --name app1 -p 3001:5678 hashicorp/http-echo -text="我是後端 1"
   docker run -d --name app2 -p 3002:5678 hashicorp/http-echo -text="我是後端 2"
   docker run -d --name app3 -p 3003:5678 hashicorp/http-echo -text="我是後端 3"
   ```

   （若你是自己的 app，也可以讀一個 `INSTANCE_ID` 環境變數，回應時附上它。）

2. Nginx 設定用本章的 upstream 寫法，分流到這三個 port：

   ```nginx
   upstream myapp_backend {
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
       server 127.0.0.1:3003;
   }

   server {
       listen 80;
       server_name localhost;

       location / {
           proxy_pass http://myapp_backend;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. 套用設定（本章的保命習慣）：

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. 連續打同一個網址觀察分流。用瀏覽器一直重新整理，或用命令列連打幾次：

   ```bash
   for i in {1..6}; do curl -s http://localhost/; done
   ```

**驗收點**

- 連打 6 次，回應應該在「我是後端 1 / 2 / 3」之間**輪流出現**（預設 Round Robin，大致是 1、2、3、1、2、3）。這代表分流成功。
- 進階驗證健康檢查：把其中一台停掉（`docker stop app2`），再連打幾次——Nginx 會**自動跳過掛掉的那台**，只在剩下兩台之間分流，使用者不會收到錯誤。這就是下一章「消除單點故障」的預告。

> 提示：如果每次都只回同一台，先確認 `proxy_pass` 指的是 upstream 組名（不是單一位址），也確認三個容器都真的起來了（`docker ps`）。

</details>

## 課外讀物

> 想了解流量變大時，從一台到多台、再到全球規模的完整演進 → [課外讀物 E-13-4：Monolith vs Microservices](../../../課外讀物/E-13-scaling/E-13-4-monolith-vs-microservices.md)
