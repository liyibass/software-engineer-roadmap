# [cache-3-2] Cache-Control 完全詳解

> **本章目標**：搞懂 `Cache-Control` 這個控制瀏覽器快取最核心的標頭——`max-age` / `no-cache` / `no-store` / `private` / `immutable` 到底各是什麼、差在哪。

## 你會學到

- `Cache-Control` 是什麼、為什麼是快取控制的核心
- 各個指令：`max-age`、`no-cache`、`no-store`、`private`、`public`、`immutable`
- 最容易混的 `no-cache` vs `no-store`
- 常見資源該怎麼設

## 概念說明

### Cache-Control：快取的總開關

cache-3-1 說「伺服器用標頭控制瀏覽器快取」。其中最重要、最常用的標頭就是 **`Cache-Control`**。它用一連串「指令」告訴瀏覽器怎麼處理快取：

```
Cache-Control: max-age=3600, public
```

下面把常用的指令一個個講清楚。它們可以組合使用（用逗號分隔）。

---

### max-age：可以快取多久

```
Cache-Control: max-age=3600
```

**最常用的指令**。`max-age=3600` 代表「這個資源**新鮮 3600 秒（1 小時）**」。在這段時間內，瀏覽器直接用快取、**完全不問伺服器**（這就是 cache-3-1 的「強快取」）。超過 1 小時，才需要去問伺服器（協商快取，cache-3-3）。

這就是 cache-1-2 的「TTL」在瀏覽器這層的具體實現——你用 `max-age` 設定「速度 vs 新鮮度」的平衡點。

---

### no-store：完全不要快取

```
Cache-Control: no-store
```

「**絕對不要存任何副本**」。瀏覽器每次都得重新跟伺服器拿。

用在「**絕對不能快取**」的敏感或即時資料：

- 銀行帳戶餘額、個人隱私資料。
- 即時性極高、過時就出事的資料。

這對應 cache-1-2 的「不快取」那一格——過時後果嚴重的資料。

---

### no-cache：可以存，但用前一定要問

這是**最容易誤會**的指令——`no-cache` **不是「不要快取」**！

```
Cache-Control: no-cache
```

它的意思是「**可以存快取，但每次用之前，一定要先問伺服器『我這份還能用嗎』**」（也就是強制走「協商快取」，cache-3-3）。

- 如果伺服器說「沒變」（回 304）→ 用本機快取（省下重新下載）。
- 如果「變了」→ 下載新版。

所以 `no-cache` 適合「**會變、但變的時候要立刻拿到新版**」的資源——它兼顧了「不會拿到舊版」和「沒變時省流量」。

---

### no-cache vs no-store：務必分清

這兩個名字超像，但完全不同：

| 指令 | 意思 | 會存快取嗎 | 用前問伺服器嗎 |
|------|------|:---:|:---:|
| `no-store` | 完全不快取 | ❌ 不存 | 每次都重新下載 |
| `no-cache` | 存，但用前必問 | ✅ 存 | ✅ 每次都驗證 |

記憶法：

- **`no-store`** = 「**不准存**」（store = 儲存）→ 真的不快取。
- **`no-cache`** = 「**不要直接用快取**（要先驗證）」→ 其實有存，只是用前要問。

很多人以為 `no-cache` 是「不快取」，導致設錯——記住這個區別。

---

### private vs public：誰可以快取

```
Cache-Control: private
Cache-Control: public
```

- **`private`**：只有「**使用者的瀏覽器**」可以快取，**中間的 CDN / 代理伺服器不可以**。用在「個人化內容」（例如「你的」購物車、「你的」個人頁）——這些不該被共享的 CDN 快取（否則 A 看到 B 的內容，cache-4-5 的大坑！）。
- **`public`**：**大家都可以快取**，包括 CDN、代理。用在「對所有人都一樣」的公開資源（logo、公開文章）。

判斷：**這個資源對每個人都一樣嗎？** 是 → `public`；是「某人專屬」→ `private`。

---

### immutable：永遠不會變

```
Cache-Control: max-age=31536000, immutable
```

`immutable`（不可變）告訴瀏覽器「這個資源**永遠不會變**，在 max-age 內**連『過期後去問伺服器』都免了**」。

這配 `max-age` 設超長（如一年 = 31536000 秒）使用，專門給**「檔名帶版本指紋」的資源**——例如 `app.a1b2c3.js`。因為內容一變，檔名就變（hash 變），所以「這個檔名的內容」確實永遠不變，可以放心快取一年。這正是 cache-3-5 解決「前端更新」坑的關鍵技巧。

---

### 常見資源怎麼設（總整理）

| 資源 | 建議 Cache-Control | 為什麼 |
|------|-------------------|--------|
| 帶 hash 的 JS/CSS（`app.a1b2c3.js`）| `max-age=31536000, immutable` | 內容變檔名就變，可永久快取（cache-3-5）|
| `index.html`（入口頁）| `no-cache`（或很短 max-age）| 要立刻拿到最新版，才能載入新的 hash 檔（cache-3-5）|
| 公開圖片、字型 | `max-age=86400, public` | 不常變、對大家一樣 |
| 個人化頁面 | `private, no-cache` | 不可被 CDN 共享、要最新 |
| API 回應（敏感/即時）| `no-store` | 不該快取 |

這張表是瀏覽器快取設定的精華——尤其前兩行（hash 檔永久快取 + index.html 不快取）是 cache-3-5 解決前端部署坑的核心組合。

## 程式碼範例

在 Nginx 設定不同資源的 Cache-Control（呼應 infra Part 4-3）：

```nginx
# 帶 hash 的靜態資源 → 永久快取（內容變檔名就變）
location ~* \.(js|css)$ {
    add_header Cache-Control "max-age=31536000, immutable";
}

# index.html → 不要強快取，每次驗證（確保拿到最新版）
location = /index.html {
    add_header Cache-Control "no-cache";
}

# API → 不快取
location /api/ {
    add_header Cache-Control "no-store";
}
```

這份設定就體現了「該永久快取的永久快取、該即時的即時」的精準控制。

## 小練習

### 練習 1：no-cache vs no-store

不看表，說出 `no-cache` 和 `no-store` 的差別。哪一個「其實有存快取」？

<details>
<summary>參考解答</summary>

- **`no-store`** = 「**不准存**」。瀏覽器**完全不保留任何副本**，每次都得重新跟伺服器拿整個資源。用在絕對不能快取的敏感／即時資料（銀行餘額、隱私資料）。
- **`no-cache`** = 「**可以存，但用之前一定要先問伺服器**」。它其實**有把快取存下來**，只是每次要用之前都強制走「協商快取」去驗證——伺服器說沒變（304）就用本機那份（省下重新下載），變了才下載新版。

所以「**其實有存快取**」的是 **`no-cache`**。

記憶法：`no-store` 的 store 是「儲存」，真的不存；`no-cache` 是「不要（未經驗證就）直接用快取」，其實有存、只是用前要問。很多人以為 `no-cache` 是「不快取」而設錯，這是最常見的誤會。

</details>

---

### 練習 2：private vs public

回答：「使用者的購物車內容」該設 `private` 還是 `public`？如果設錯成 `public` 會發生什麼可怕的事？（提示：cache-4-5）

<details>
<summary>參考解答</summary>

應該設 **`private`**。

因為購物車是「**某個使用者專屬**」的個人化內容——每個人的購物車都不一樣。`private` 代表「只有使用者自己的瀏覽器可以快取，中間的 CDN／代理伺服器不准快取」，這正是我們要的。

如果錯設成 **`public`**，就等於允許**中間的共享 CDN／代理伺服器把它快取起來給大家共用**。於是可能發生：使用者 A 的購物車內容被 CDN 快取了，接著使用者 B 來訪、CDN 直接把「A 的購物車」當成快取回應丟給 B——**B 看到了 A 的私人內容**。這是嚴重的資料外洩／隱私事故（cache-4-5 會深入這個 CDN 共享快取的大坑）。

判斷原則：**這個資源對每個人都一樣嗎？** 是（logo、公開文章）→ `public`；是「某人專屬」（購物車、個人頁）→ `private`。個人化內容一律不能讓共享快取碰。

</details>

---

### 練習 3：設 Cache-Control

為下面資源各選一個 `Cache-Control`：

1. `app.f3a9b1.js`（檔名帶 hash 的打包檔）
2. `index.html`
3. 一個回傳「使用者帳戶餘額」的 API

<details>
<summary>參考解答</summary>

1. **`app.f3a9b1.js`** → `Cache-Control: max-age=31536000, immutable`
   檔名帶了 content hash，內容一改 hash 就變、檔名就變，所以「這個檔名的內容」永遠不會變。可以放心設超長 `max-age`（一年 = 31536000 秒）+ `immutable`（連過期後去問伺服器都免了），讓它永久落在強快取，最快（cache-3-5 的核心技巧）。

2. **`index.html`** → `Cache-Control: no-cache`（或設一個很短的 `max-age`）
   它是「指路牌」，必須總是拿到最新版，才能指向最新的 hash 檔。`no-cache` 讓瀏覽器每次用前都去驗證：沒變回 304（省流量）、變了拿到新版指路牌。絕對不能永久強快取，否則會一直指向舊的 hash 檔。

3. **帳戶餘額 API** → `Cache-Control: no-store`
   餘額是敏感又即時的資料，過時就會出事，絕對不能留任何副本。`no-store` 讓瀏覽器每次都重新跟伺服器拿最新值。（注意不是 `no-cache`——`no-cache` 還是會把資料存在本機，敏感資料連存都不該存。）

</details>

## 課外讀物

> Cache-Control 的簡版介紹 → [課外讀物 E-11-2 在 E-11 效能系列]（本書是完整版）；HTTP 標頭基礎 → [課外讀物 E-3-3：HTTP 協定詳解](../../../課外讀物/E-3-network/E-3-3-http-protocol.md)
