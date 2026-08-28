# comfy-3-8 📖 Prompt 工程（一）：Danbooru tag 的寫法慣例

> **本章目標**：給你一套可以直接用的 tag 寫作規範與詞彙表。**這是參考章節**——寫 prompt 時翻回來查。

## 你會學到

- 📖 標準的 tag 順序，以及每一段放什麼
- 📖 **鏡頭與構圖 tag 速查表**（遊戲素材最需要的一類）
- ⚠️ 怎麼確認一個 tag 模型認不認識
- 你專案的 prompt 慣例拆解

---

## 概念說明

### 標準順序

`comfy-2-5` 講過：順序的價值不在「權重」，而在**符合訓練分布**。Danbooru 的慣例順序是：

```
品質詞 → 角色數 → 角色特徵 → 服裝 → 動作/姿勢 → 鏡頭/構圖 → 背景 → 光線/氛圍
```

實例：

```
masterpiece,                          ← 品質
1girl, solo,                          ← 角色數
long hair, grey hair, purple eyes,    ← 特徵
khaki coat, black bikini,             ← 服裝
hands on hips, standing,              ← 動作
full body, from side,                 ← 鏡頭
night park, streetlight,              ← 背景
dim lighting                          ← 氛圍
```

> ⚠️ **不用死守**。順序錯了不會毀掉圖，只是不夠穩。**真正重要的是「用對 tag」，不是「排對順序」。**

---

### 📖 分段速查表

#### ① 品質詞

| tag | 說明 |
|-----|------|
| `masterpiece` | 最常用的一個 |
| `best quality`, `high quality` | 常見 |
| `absurdres`, `highres` | 高解析度標記 |

> ⚠️ `comfy-2-5` 講過：**現代模型上品質詞的邊際效益很低**。留一兩個就好，不要塞一長串。
> ⚠️ Pony 系要用 `score_9, score_8_up, score_7_up`，**Illustrious 上寫它是無效的**。

#### ② 角色數量

| tag | 說明 |
|-----|------|
| `1girl` / `1boy` | ✅ 最重要的一個 tag |
| `solo` | ⚠️ **強烈建議加上**——防止多出人物 |
| `2girls`, `3girls` | 多角色（比 `two girls` 準確） |
| `no humans` | 純物件 / 場景（⚠️ **產場景元件時必加**） |

> ⚠️ **`solo` 是最有價值的一個 tag**。不加它，模型常常在旁邊多畫一個人。你的專案 prompt 都有加——這是對的。
>
> 產場景元件（樹、路燈、草叢）時，記得用 `no humans`，否則常常會冒出人影。

#### ③ 角色特徵

| 類別 | 常用 tag |
|------|---------|
| 髮長 | `long hair`, `short hair`, `medium hair`, `very long hair` |
| 髮型 | `straight hair`, `twintails`, `ponytail`, `braid`, `messy hair` |
| 瀏海 | `blunt bangs`, `swept bangs`, `hair between eyes` |
| 髮色 | `black hair`, `grey hair`, `silver hair`, `blonde hair` |
| 眼睛 | `purple eyes`, `blue eyes`, `heterochromia` |
| 眼神 | ⚠️ `jitome`（冷淡半瞇眼）, `tsurime`, `tareme`, `half-closed eyes` |
| 表情 | `expressionless`, `smile`, `closed mouth`, `blush`, `nervous` |
| 體型 | `slender`, `medium breasts`, `mature female`, `petite` |

> ⚠️ `jitome` 這類日文原詞在 Danbooru 體系裡是標準 tag，**比用英文描述準確得多**。你的專案就用了它。

#### ④ 服裝

| 類別 | 常用 tag |
|------|---------|
| 外套 | `coat`, `trench coat`, `jacket`, `open coat`, `closed coat` |
| 狀態 | ⚠️ `coat off shoulders`, `clothes pull`, `undressing` |
| 上身 | `shirt`, `bikini`, `bikini top`, `crop top` |
| 下身 | `skirt`, `shorts`, `thighhighs` |
| 鞋 | `boots`, `brown boots`, `high heels` |
| 配件 | `hairband`, `hair ribbon`, `black nails`, `choker` |

> ⚠️ **服裝狀態 tag 對你的五階段設計特別重要**。你專案 v2 的 caption 就明寫了五種狀態：
> `closed coat` / `coat off shoulders, coat front closed` / `coat skirt open` / `coat pulled down to elbows, coat front wide open` / `bikini only, no coat`
>
> **這是對的做法**——用 Danbooru 既有的狀態 tag，而不是自創描述。

#### ⑤ 動作與姿勢

| 類別 | 常用 tag |
|------|---------|
| 站姿 | `standing`, `walking`, `running`, `leaning forward` |
| 坐姿 | `sitting`, `kneeling`, `squatting`, `lying` |
| 手 | `hands on hips`, `arms crossed`, `hand on own cheek`, `clutching collar` |
| 頭 | `looking at viewer`, `looking back`, `looking away`, `head tilt` |
| 情緒動作 | `shy`, `nervous`, `embarrassed` |

> 你專案驗證過情緒詞有效：`nervous, clutching collar` / `shy, hand on cheek` **叫得出對應表情且仍是同一張臉**。

#### ⑥ 📖 鏡頭與構圖（遊戲素材最需要的一類）⚠️

**這一段值得特別記，因為它直接對應你的素材規格：**

| tag | 畫到哪裡 | 用途 |
|-----|---------|------|
| `full body` | 全身含腳 | ✅ **立繪、sprite** |
| `cowboy shot` | 大腿以上 | 半身立繪 |
| `upper body` | 腰以上 | 對話頭像 |
| `portrait` | 肩以上 | 特寫 |
| `close-up` | 臉部 | 表情表 |
| `from side`, `profile` | ⚠️ 側面 | 三視圖 |
| `from behind` | 背面 | 三視圖 |
| `three-quarter view` | 四分之三 | 三視圖 |
| `from above`, `from below` | 俯視 / 仰視 | 特殊構圖 |
| `facing viewer` | 面向鏡頭 | 正面 |

> ⚠️ **重要限制**：`from side` 對**角色**有效，但對**場景**幾乎無效——你的專案實測過：「ComfyUI 用文字要 side view 永遠畫成透視縱深」。
>
> **原因**：`comfy-3-3` 講過，CLIP 傳達不了空間關係。角色的側面是一個「有 tag 的姿勢概念」，場景的側視是「空間關係」——後者只能靠 ControlNet。

#### ⑦ 背景與氛圍

| 類別 | 常用 tag |
|------|---------|
| 場景 | `night park`, `outdoors`, `indoors`, `forest`, `street` |
| ⚠️ 純色底 | `simple background`, `white background`, **`light grey background`**, `plain flat background` |
| 光線 | `dim lighting`, `backlighting`, `night`, `moonlight` |
| 元素 | `streetlight`, `bench`, `tree`, `bush`, `moon` |

> ⚠️ **`light grey background` 是你專案實測選定的**——品紅會漏色、綠幕被腦補成植物、深灰讓靴子跟底混（`comfy-6-5`）。**這種踩過坑得到的 tag 比通用建議值錢。**

---

### ⚠️ 怎麼確認模型認不認識一個 tag

`comfy-2-4` 講過：**模型不認識的詞不是被忽略，而是往隨機方向拉**。所以確認 tag 有效很重要。

| 方法 | 說明 |
|------|------|
| 1. **tag 自動補全工具** | pythongosssss 的套件會顯示每個 tag 的使用次數 |
| 2. **查 Danbooru** | 直接搜尋那個 tag，看有幾張圖 |
| 3. **實測** | 同 seed，加 / 不加，看有沒有差 |

**使用次數的參考標準**：

```
> 10 萬張   → ✅ 模型一定學得好
1 萬~10 萬  → ✅ 通常可靠
1000~1 萬   → ⚠️ 可能不穩
< 1000     → ❌ 基本上等於自創詞
```

---

### 你專案的 prompt 慣例拆解

```
masterpiece, nightheroine, 1girl, solo, <姿勢/鏡頭/大衣狀態/情緒>, night park
```

逐項檢視：

| 部分 | 為什麼這樣寫 |
|------|------------|
| `masterpiece` | 只留一個品質詞（不塞長串） |
| `nightheroine` | ⚠️ 觸發詞放最前面 |
| `1girl, solo` | 標準角色數 tag，`solo` 防多人 |
| 變動部分 | 只寫「會變的東西」 |
| **不寫髮色、髮箍、臉、身材** | ⚠️ **那些由 LoRA 管** |
| `night park` | 場景 |

> ⚠️ **「不寫 LoRA 該管的東西」是最關鍵的一條**，理由在 `comfy-4-7`：**caption 沒寫的東西會被吸進觸發詞，寫了的反而變成可以被關掉的開關**。
>
> 這條規則讓你的 prompt 短、穩定、而且不會跟 LoRA 打架。

---

## 小練習

1. **建立你的 tag 庫**：把你專案常用的 tag 依上面的分類整理成一份文件。**特別是服裝狀態與鏡頭那兩類**——那是你切換素材規格時要反覆用的。

2. **驗證可疑的 tag**：挑三個你不確定的 tag，去 Danbooru 查使用次數。**低於 1000 的就換掉。**

3. **測試 `solo` 的價值**：同 seed，一張有 `solo` 一張沒有，各產四張。**統計「多出人物」的比例。**

---

## 課外讀物

> 為什麼 tag 式模型吃 tag 不吃句子 → `comfy-3-3`
> 自然語言式模型該怎麼寫 → `comfy-3-9`
> 為什麼不該寫 LoRA 該管的東西 → `comfy-4-7`
