# POC V4 — 工具鏈升級

> **解鎖條件**：完成 Part 4-C（引入工具鏈）後

V3 證明了「功能正確」，V4 要證明「工程成熟」。功能跟 V3 完全一樣（還是那個 CRUD Todo App），但開發體驗和程式品質大幅升級——這些都是真實專案的標準配備。

---

## 這個版本做了什麼

- 前端改用 **Vite**：秒開、熱更新，改了存檔瀏覽器自動更新，不用再手動 `npm run build`
- 前後端**共用同一份型別**：`interface Todo` 只定義在 `shared/types.ts`，兩邊 import 它
- 設定改用**環境變數**：API 網址、CORS 來源不再寫死在程式碼裡
- **CORS 正確設定**：只允許指定來源，而非 V1~V3 的「無腦全開」

---

## 相較於 V3 的改變

- **新增**：`shared/types.ts`——前後端共用的型別定義（單一事實來源）
- **新增**：Vite 工具鏈（`vite.config.ts`、`npm run dev` 熱更新）
- **新增**：`.env` 環境變數機制（前端 `VITE_API_BASE`、後端 `FRONTEND_ORIGIN`）
- **修改**：前端 `API_BASE` 從寫死改成讀 `import.meta.env.VITE_API_BASE`
- **修改**：後端 CORS 從 `cors()` 全開改成 `cors({ origin: FRONTEND_ORIGIN })`
- **移除**：前端不再需要手動 `tsc` 編譯、不再有手寫的 `dist/main.js`

```
V3：功能正確，但前後端型別各一份、設定寫死、CORS 全開、要手動 build
V4：同樣功能，但型別共用、設定外置、CORS 收斂、Vite 熱更新
```

---

## 架構

```
┌──────────────────┐         ┌──────────────────┐
│  前端 (Vite)      │  HTTP   │  後端 (Express)   │
│  :5173           │ ──────> │  :3000           │
│  VITE_API_BASE    │ <────── │  FRONTEND_ORIGIN  │
└──────────────────┘         └──────────────────┘
          └──── 共用同一份型別 ────┘
               shared/types.ts
```

---

## 專案結構

```
poc/v4/
├── README.md
├── shared/
│   └── types.ts             # interface Todo —— 前後端唯一事實來源
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example         # 環境變數範本（進版控）
│   ├── .env                 # 真正的值（不進版控）
│   └── src/
│       └── server.ts        # 完整 CRUD + 環境變數 CORS
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html           # Vite 入口，直接載入 /src/main.ts
    ├── .env.example
    ├── .env
    └── src/
        ├── main.ts          # 讀 import.meta.env、import 共用型別
        ├── style.css
        └── vite-env.d.ts    # 讓 import.meta.env 有型別
```

---

## 如何跑起來

需要**開兩個終端機**，並先準備好 `.env`。

### 第一步：啟動後端

```bash
cd poc/v4/backend
cp .env.example .env        # 複製環境變數範本（第一次才需要）
npm install
npm run dev
```

看到 `後端已啟動，正在 http://localhost:3000 待命` 與 `允許的前端來源（CORS）：http://localhost:5173`，後端就緒。

### 第二步：啟動前端（Vite）

開另一個終端機：

```bash
cd poc/v4/frontend
cp .env.example .env
npm install
npm run dev
```

Vite 會印出 `http://localhost:5173`，用瀏覽器打開它。試著改 `src/main.ts` 存檔——畫面會**自動更新**，不用手動重整。

---

## 跑起來後，驗證這版的升級點

1. **熱更新**：改 `src/main.ts` 裡的標題文字，存檔，看瀏覽器是否自動更新。
2. **CORS 正確設定**：打開 DevTools → Network → 點 `/todos` 請求 → Response Headers，找到 `Access-Control-Allow-Origin: http://localhost:5173`。
3. **共用型別**：打開 `shared/types.ts`，幫 `Todo` 加一個欄位（例如 `createdAt: string`），存檔——前端和後端的 TypeScript 會**同時**知道這個改動。這就是單一事實來源的威力。
4. **環境變數**：把 `frontend/.env` 的 `VITE_API_BASE` 改成一個錯的網址，重啟前端，觀察 `fetch` 失敗——證明前端真的是讀這個變數，而非寫死。

---

## 學到了什麼

- 打包工具（Vite）解決的痛點：自動編譯、打包、熱更新、dev/build 分離
- 共用型別：前後端對資料形狀的單一事實來源，消除不同步風險
- 環境變數：把「會變的設定」與「機密」抽出程式碼，`.env` 不進版控
- CORS 正確設定：只允許信任的來源，並用環境變數管理

---

## 還有的限制（V5 之後會解決）

- **後端還是一支 `server.ts` 打天下**：所有邏輯擠在一個檔案。V5 會引入分層架構（Controller / Service / Repository）。
- **沒有登入**：任何人都能操作。V5 會加上 JWT 認證。
- **資料還在記憶體**：重啟就消失。永久保存要等接資料庫（V6）。

> 下一版 **V5** 解鎖條件：完成 Part 4-D（後端架構 + 認證）後。
