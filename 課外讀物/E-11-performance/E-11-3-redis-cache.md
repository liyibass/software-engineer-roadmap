# [E-11-3] Redis 與快取策略

> **你會了解**：Redis 是什麼、快取的基本策略是如何運作的，以及什麼情況下用快取才真的有意義。

---

## 一個讓資料庫喘不過氣的故事

假設你做了一個熱門的新聞網站。每次用戶打開首頁，後端就要查資料庫：「給我最新的 10 篇文章」。

這個查詢要 10ms。

一個用戶，沒問題。一百個用戶，還好。

然後你的某篇文章上了熱搜——每秒有 1000 個用戶打開首頁。每秒 1000 次查詢，每次 10ms……你的資料庫開始冒煙了。

但等等，這 1000 個人要的是**同一份資料**。你真的需要查 1000 次嗎？

不。你只需要查一次，然後把答案**暫存**起來，之後直接給。

這就是快取（Cache）的概念，而 Redis 是最常用來做這件事的工具。

---

## Redis 到底是什麼？

Redis 全名是 **Remote Dictionary Server**（遠端字典伺服器）。

「字典」這個詞很關鍵——它的核心結構就是 **Key-Value**，跟 JavaScript 的 object 概念一模一樣：

```
// 用 JavaScript object 的概念理解 Redis
const redis = {
  "user:123": '{"name": "Alice", "email": "alice@example.com"}',
  "news:top10": '[{"title": "..."}, {"title": "..."}]',
  "session:abc": "userId=123"
}
```

但 Redis 有一個關鍵差異：**資料存在 RAM（記憶體）裡，不是硬碟**。

這讓它的讀寫速度快得誇張：

| 儲存位置 | 典型讀取速度 |
|---------|------------|
| 硬碟（HDD） | ~10ms |
| SSD | ~1ms |
| 一般資料庫（有 SSD） | ~5–20ms |
| Redis（RAM） | **~0.1ms** |

速度差了 50–200 倍。這不是優化，是質的飛躍。

---

## Redis 支援的資料結構

Redis 不只是 Key-Value 字串存取，它支援幾種實用的資料結構：

| 結構 | 用途 |
|------|------|
| **String** | 最基本的值，存 JSON 字串、數字等 |
| **List** | 有序的清單，適合 queue、最近瀏覽紀錄 |
| **Hash** | 像 object 的 field:value 結構，存用戶資料 |
| **Set** | 不重複的集合，適合追蹤「誰按過讚」 |
| **Sorted Set** | 有分數的集合，適合排行榜 |

大多數時候你只會用到 String——把一個 JSON 字串存進去，取出來再 parse。其他的等真的有需求再學。

---

## 快取的核心比喻：廚房工作台的備料

想像你是一個廚師，今天菜單上有「蔥花炒飯」。

每次有客人點這道菜，你都要：走到冰箱 → 拿出蔥 → 洗 → 切 → 放回工作台。

這樣很慢。

有經驗的廚師會這樣做：**開始營業前，先把蔥切好放在工作台上**。客人點餐，直接抓就用，不用每次跑冰箱。

這個「工作台上的備料」就是快取。

- **冰箱** = 資料庫（慢，但完整）
- **工作台的備料** = Redis 快取（快，但有限、會用完）
- **備料過期腐壞** = 快取 TTL 到期需要更新

---

## 兩種基本快取策略

### 1. Cache-Aside（旁路快取）——最常用

應用程式自己負責管理快取。流程長這樣：

```sequenceDiagram
    participant App as 應用程式
    participant Redis as Redis 快取
    participant DB as 資料庫

    Note over App,DB: Cache Hit（快取命中）
    App->>Redis: GET user:123
    Redis-->>App: ✅ 有資料，直接回傳

    Note over App,DB: Cache Miss（快取未命中）
    App->>Redis: GET user:123
    Redis-->>App: ❌ 沒有資料
    App->>DB: SELECT * FROM users WHERE id=123
    DB-->>App: 查詢結果
    App->>Redis: SET user:123 {...} EX 3600
    App-->>App: 回傳結果給用戶
```

這張圖說明：命中快取時直接回傳（省掉 DB 查詢）；沒命中時才去查 DB，查完存進 Redis 備用。

程式碼大概長這樣：

```typescript
async function getUserById(userId: string) {
  const cacheKey = `user:${userId}`;

  // 先查快取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached); // Cache Hit
  }

  // 快取沒有，查資料庫
  const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

  // 存入快取，1 小時後過期
  await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);

  return user;
}
```

### 2. Write-Through（寫穿快取）

每次**寫入**資料時，同時更新資料庫和快取。

```
寫入流程：
應用程式
  → 寫入資料庫
  → 同時更新快取
  → 完成
```

優點是快取永遠跟資料庫同步，不會有讀到舊資料的問題。缺點是每次寫入都多一步，而且如果這份資料根本沒人讀，快取就白存了。

兩種策略不是互斥的，很多系統混著用：讀取用 Cache-Aside，寫入用 Write-Through。

---

## TTL：快取的保鮮期

快取不能永遠存著，因為原始資料可能會改變。

TTL（**Time To Live**，存活時間）就是給快取設一個有效期限，過期就自動刪掉：

```
// 設定 user:123 快取 1 小時後過期
SET user:123 '{"name":"Alice"}' EX 3600
```

TTL 要設多久？這沒有標準答案，取決於資料的「新鮮度要求」：

| 資料類型 | 建議 TTL |
|---------|---------|
| 用戶基本資料（名字、頭像） | 30 分鐘 ~ 1 小時 |
| 商品列表 | 5 ~ 10 分鐘 |
| 熱門文章排行 | 1 ~ 5 分鐘 |
| 即時股票價格 | 不適合快取 |

---

## 兩個你遲早會遇到的問題

### 快取失效（Cache Invalidation）

有一句電腦科學界的名言：

> 「電腦科學最難的兩件事：命名，還有快取失效。」

問題很簡單：用戶改了自己的名字。資料庫更新了，但 Redis 裡的 `user:123` 快取還是舊的，要等 TTL 過期才會更新。

這 1 小時內，其他人看到的可能還是舊名字。

解法有幾種：更新資料時主動刪除快取（`DEL user:123`）、縮短 TTL、或接受一定程度的不一致性（很多場景其實可以接受的）。

### 快取雪崩（Cache Stampede）

假設一批快取同時過期，然後恰好這個時間點有大量請求進來——所有請求全部去查資料庫，資料庫承受不住，崩了。

防禦方法：讓不同資料的 TTL 加一點隨機數，避免大批快取同時過期。

---

## Redis 的其他用途

Redis 不只拿來做 API 快取，它在後端系統裡的應用非常廣：

- **Session 儲存**：用戶登入的 session 存在 Redis，比存在 DB 快很多
- **Rate Limiting（限流）**：記錄每個 IP 每分鐘打了幾次 API，超過就擋掉
- **Pub/Sub 訊息**：簡單的即時通訊，一個服務發訊息，另一個服務收
- **排行榜**：用 Sorted Set 計算分數排名，天然支援

---

## 小結

Redis 是一個存在記憶體裡的 Key-Value 資料庫，讀寫速度比一般資料庫快 50–200 倍。快取策略中最常用的是 **Cache-Aside**：先查快取，沒有才查 DB，查完存入快取。

使用快取時記住三件事：

1. **設 TTL**：資料會過時，不要讓它永遠活著
2. **快取失效是難題**：資料更新後要記得讓舊快取失效
3. **不是所有資料都適合快取**：即時性高、個人化強的資料，快取反而會造成問題

---

## 延伸閱讀

> 想了解快取在整個系統的角色 → [課外讀物 E-11-8：多層次快取全景：瀏覽器到資料庫](./E-11-8-cache-layers.md)

> 想了解 CDN 怎麼快取靜態資源 → [課外讀物 E-11-5：CDN 是什麼？靜態資源如何加速](./E-11-5-cdn.md)
