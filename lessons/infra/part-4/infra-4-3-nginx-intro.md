# [infra-4-3] Nginx 入門：反向代理與網站的「大樓櫃台」

> **本章目標**：理解 Nginx 在做什麼，搞懂「反向代理」這個核心概念，看懂 Nginx 設定檔的結構，並能讓它把外部請求轉給你後端的服務。

## 你會學到

- Nginx 是什麼、為什麼幾乎每個網站前面都有它
- 反向代理（Reverse Proxy）用「大樓櫃台」來理解
- Nginx 設定檔的結構與存放位置
- 讓 Nginx 把 80 port 的請求，轉給你後端的服務

## 概念說明

### 為什麼需要 Nginx？

假設你照 Part 4-2 把後端跑成了服務，它聽在 `localhost:3000`。但這有幾個問題：

1. 使用者連網站是連 **80（HTTP）/ 443（HTTPS）**，不是 3000。
2. 你可能有**好幾個**後端服務，需要有人依網址分流。
3. 你需要一個地方統一處理 **HTTPS 憑證、靜態檔案、壓縮**等等。
4. 直接把 Node/Python 程式暴露在網路最前線，**不夠安全也不夠強壯**。

這些事，交給一個專門的「門面」來處理最好——這就是 **Nginx**（唸 "engine-x"）。它是世界上最多網站在用的網頁伺服器與反向代理。

---

### 核心概念：反向代理（Reverse Proxy）

這是這一章最重要的概念，用**大樓櫃台**來理解。

想像一棟辦公大樓，裡面有很多公司（你的各個後端服務）。訪客不會自己亂闖進某間辦公室，而是：

```
訪客 → 先到「大廳櫃台」→ 櫃台依需求指引 → 帶到對的辦公室
```

**Nginx 就是這個櫃台。** 所有外部請求都先到 Nginx，由它依照網址，把請求**轉交（代理）**給後面對應的服務。

```mermaid
graph LR
    U["使用者<br/>連 80 / 443"]
    N["Nginx<br/>（大樓櫃台 / 反向代理）"]
    A1["後端 app A<br/>localhost:3000"]
    A2["後端 app B<br/>localhost:4000"]
    S["靜態檔案<br/>圖片 / HTML"]

    U --> N
    N -->|"/api 給它"| A1
    N -->|"/admin 給它"| A2
    N -->|"圖片自己回"| S
```

這張圖在說：使用者只跟櫃台（Nginx）打交道，Nginx 在背後把不同請求分派到對的地方。後端服務全都躲在 Nginx 後面，不直接面對網路。

> 為什麼叫「**反向**」代理？因為一般「代理」是替「使用者」出門（像 VPN）；反向代理是站在「**伺服器這一側**」，替後端服務擋在最前面、代為接客。方向相反，所以叫反向。

---

### 反向代理帶來的好處

讓 Nginx 站在前面當櫃台，你一次得到很多好處：

| 好處 | 說明 |
|------|------|
| **統一入口** | 使用者只連 80/443，不用管後面是哪個服務、哪個 port |
| **HTTPS 集中處理** | 憑證裝在 Nginx 一處就好（下一章做），後端不用各自處理 |
| **保護後端** | 後端只聽 localhost，不直接暴露在網路上，安全得多 |
| **負載平衡** | 後端有多台時，Nginx 能把流量分散過去（Part 9 會講） |
| **靜態檔案快** | 圖片、CSS 這類檔案 Nginx 自己回應，比丟給後端快 |

## 程式碼範例

### 安裝 Nginx

用 Part 2-5 學的套件管理：

```bash
sudo apt update
sudo apt install nginx
```

裝好後 Nginx 通常會自動啟動。用 Part 4-1 的指令確認：

```bash
systemctl status nginx
```

看到 `active (running)` 就成功了。這時用瀏覽器連你伺服器的 IP，應該會看到 Nginx 的歡迎頁。

> 別忘了 Part 3-3 的防火牆——要讓外部連得到，`ufw` 得放行 80/443。

---

### 認識設定檔的結構

Nginx 的設定檔放在 `/etc/nginx/`（又是 `/etc`）。結構是這樣：

```
/etc/nginx/
├── nginx.conf              ← 主設定檔（通常不用大改）
├── sites-available/        ← 「所有」網站設定（草稿區）
│   └── default
└── sites-enabled/          ← 「已啟用」的網站設定（實際生效的）
```

一個慣例：你在 `sites-available/` 寫網站設定，再「啟用」它（在 `sites-enabled/` 建一個連結指過去）。這樣可以保留多份設定，隨時切換要啟用哪些——像「草稿夾」和「已發布」的分別。

---

### 寫一個反向代理設定

假設你的後端服務（Part 4-2 那種）跑在 `localhost:3000`，你要讓 Nginx 把請求轉給它。建立一份網站設定：

```bash
sudo vi /etc/nginx/sites-available/myapp
```

寫入：

```nginx
server {
    listen 80;
    server_name myapp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

逐段解釋：

- `server { ... }`：一個網站的設定區塊。
- `listen 80`：聽 80 port（HTTP）。
- `server_name myapp.com`：這份設定負責哪個網域。
- `location / { ... }`：所有路徑（`/` 開頭，即全部）的請求這樣處理。
- `proxy_pass http://localhost:3000`：**核心這一行**——把請求轉給後端的 3000。這就是「反向代理」。
- `proxy_set_header ...`：把使用者的真實資訊（來源 IP、網域）一併轉給後端，否則後端只會看到「請求來自 localhost」。

---

### 啟用設定並重載

把設定從「草稿」變「啟用」——在 `sites-enabled/` 建一個指向它的連結：

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
```

`ln -s` 建立的是「符號連結」（像捷徑）。接著做一件**每次改完 Nginx 設定都該做的事**——先測試設定有沒有寫錯：

```bash
sudo nginx -t
```

`-t` 是 test。如果它說 `syntax is ok` 和 `test is successful`，才安全。確認沒錯再重載設定：

```bash
sudo systemctl reload nginx
```

> 為什麼用 `reload` 不用 `restart`？`reload` 是「不中斷服務地重新載入設定」，現有連線不會斷；`restart` 會整個重啟。改設定優先用 `reload`。

## 小練習

### 練習 1：用「大樓櫃台」解釋反向代理

不看上面，用「大樓櫃台」的類比，向朋友解釋什麼是反向代理、為什麼後端服務要躲在 Nginx 後面。

<details>
<summary>參考解答</summary>

這是口說練習，能講出下面的意思就算過關。示範講法：

> 「你可以把伺服器想成一棟辦公大樓，裡面有好幾間公司（就是我後端的各個服務，各自聽在不同的 port，像 3000、4000）。訪客不會自己在大樓裡亂闖去敲某間辦公室的門，而是**先到一樓的大廳櫃台**。櫃台會看你要找誰、要辦什麼，再把你**帶去對的辦公室**。
>
> Nginx 就是這個櫃台。所有外部請求都先到 Nginx（它聽在大家都會連的 80／443），Nginx 再依網址把請求**轉交（代理）給後面對應的服務**。因為它是站在『伺服器這一側』代替後端接客，方向跟一般幫使用者出門的代理相反，所以叫『**反向**代理』。」

**為什麼後端要躲在 Nginx 後面？** 至少講出這幾點其中兩三個：

- **統一入口**：使用者只要連 80／443，不用管後面是哪個服務、哪個 port。
- **保護後端**：後端只聽 `localhost`，不直接暴露在網路上，外人打不到，安全得多。
- **集中處理雜事**：HTTPS 憑證、靜態檔案、壓縮這些，裝在 Nginx 一處就好，後端不用各自重做（下一章的 HTTPS 就是裝在 Nginx 上）。
- **好擴充**：之後後端變多台，Nginx 還能幫忙分流（負載平衡）。

</details>

---

### 練習 2：安裝並確認 Nginx

在你的伺服器上裝好 Nginx，確認 `systemctl status nginx` 是 running，並從瀏覽器連你的 IP 看到歡迎頁。如果連不到，回想 Part 3-3——是不是防火牆沒開 80？

<details>
<summary>參考解答</summary>

這是動手題，需要**在自己的伺服器上實機操作**。完整步驟：

```bash
# 安裝
sudo apt update
sudo apt install nginx

# 確認服務狀態（Part 4-1 學的）
systemctl status nginx        # 要看到 active (running)

# 放行防火牆的 80（Part 3-3 學的 ufw）
sudo ufw allow 'Nginx HTTP'   # 或 sudo ufw allow 80
sudo ufw status               # 確認 80 有在放行清單裡
```

然後在**你自己電腦的瀏覽器**輸入 `http://你的伺服器IP`，應該看到 Nginx 預設的「Welcome to nginx!」歡迎頁。

**連不到的排查（照 Part 3-4 分層思路）：**

1. **服務有活嗎？** `systemctl status nginx` 不是 running 的話，先 `sudo systemctl start nginx`。
2. **防火牆開了嗎？** `sudo ufw status` 看有沒有放行 80。這是最常見的兇手——本地 `curl localhost` 連得到、但外面連不到，幾乎都是防火牆。
3. **雲端安全群組（Security Group）呢？** 很多雲平台（AWS、GCP 等）除了機器內的 `ufw`，外層還有一道防火牆，也要放行 80。
4. **在伺服器上自測**：`curl http://localhost` 若回得到 HTML，代表 Nginx 本身沒問題，那問題一定出在「外部到伺服器」這段（防火牆／安全群組）。

**驗收點**：瀏覽器看到 Nginx 歡迎頁，且 `systemctl status nginx` 為 `active (running)`。

</details>

---

### 練習 3：理解設定流程

用自己的話排出「修改 Nginx 設定」的正確步驟順序，並說明每一步的目的：

```
reload nginx ／ nginx -t ／ 編輯 sites-available ／ 建立 sites-enabled 連結
```

> 提示：寫設定 → 啟用 → **先測試** → 再重載。那個「先測試」是老手不會跳過的保命步驟。

<details>
<summary>參考解答</summary>

正確順序與每一步的目的：

1. **編輯 `sites-available`**（`sudo vi /etc/nginx/sites-available/myapp`）
   - 在「草稿區」寫好這個網站的設定（反向代理、`server_name` 等）。放這裡還不會生效，像先寫好草稿。

2. **建立 `sites-enabled` 連結**（`sudo ln -s .../sites-available/myapp /etc/nginx/sites-enabled/`）
   - 把草稿「啟用」——在已啟用資料夾裡建一個指向草稿的符號連結（捷徑）。Nginx 實際只讀 `sites-enabled` 裡的設定，建了連結它才會納入。

3. **`sudo nginx -t`（先測試）**
   - 檢查設定語法有沒有寫錯。**這是保命步驟**：如果設定有錯卻直接重載，Nginx 可能會載入失敗、導致整個網站掛掉（連原本好好的站也一起沒了）。先測試，確認 `syntax is ok / test is successful` 再往下。

4. **`sudo systemctl reload nginx`（再重載）**
   - 讓 Nginx 套用新設定。用 `reload` 不用 `restart`，是因為 `reload` 不中斷現有連線地重新載入設定，對線上服務更溫和。

**一句話記法**：寫（available）→ 啟用（enabled 連結）→ **測（nginx -t）** → 載（reload）。那個「先測試再重載」的習慣，能幫你擋掉大多數「改個設定結果整站掛掉」的意外。

**驗收點**：能把四個動作按此順序排出，並說明「為什麼 `nginx -t` 一定要在 `reload` 之前」。

</details>

## 課外讀物

> 想深入理解 Nginx 在轉發的那些 HTTP 標頭、方法、狀態碼到底是什麼 → [課外讀物 E-3-3：HTTP 協定詳解](../../../課外讀物/E-3-network/E-3-3-http-protocol.md)
