# comfy-3-3 ⚠️ 為什麼你的模型吃 tag 不吃句子

> **本章目標**：搞懂「tag 式模型」與「句子式模型」的根本差異——這不是偏好，是**訓練資料決定的硬性差異**。

## 你會學到

- 🔬 為什麼同一句話在兩種模型上效果天差地遠
- ⚠️ tag 式模型**做不到**的三件事，以及該用什麼取代
- 為什麼你的專案選 WAI Illustrious 是對的決定
- 一個實用的心法：**tag 是查詢，句子是描述**

---

## 概念說明

### 一個立刻能做的對照

同樣的需求，兩種寫法：

```
寫法 A（tag 式）：
    1girl, solo, long hair, grey hair, purple eyes,
    khaki coat, black bikini, night park, from side, full body

寫法 B（句子式）：
    A girl with long grey hair and purple eyes stands in a
    night park, wearing a khaki coat over a black bikini,
    seen from the side, full body shot.
```

在你的 Illustrious 上：**A 明顯好，B 會鬆散、細節掉一堆。**
在 Flux 上：**B 明顯好，A 反而綁手綁腳。**

**同一個需求，因為模型不同，最佳寫法完全相反。**

---

### 🔬 為什麼

回到 `comfy-2-4` 的機制：文字要先經過編碼器才能變成條件。**兩種模型的編碼器不一樣**：

| | **tag 式模型**（Illustrious / Pony） | **句子式模型**（Flux / SD3） |
|---|---|---|
| 文字編碼器 | CLIP ×2 | CLIP + **T5** |
| CLIP 在做什麼 | ⚠️ **關鍵詞的向量疊加** | 同左 |
| T5 在做什麼 | — | ✅ **真正解析句子結構** |
| 訓練 caption | Danbooru 的結構化標籤 | 完整的自然語言描述 |

兩個原因疊加：

#### 原因一：CLIP 本質上是「關鍵詞袋」

CLIP 對句子結構的理解很弱。它大致上是把每個詞的意義加起來，**語法關係大部分會流失**。

```
"a girl standing to the LEFT of a tree"
CLIP 讀到的大約是：{girl, standing, left, tree}
→ ⚠️ 「誰在誰的左邊」這個關係基本上沒了
```

#### 原因二：訓練 caption 決定了「熟悉的形狀」

Illustrious 看過的每一張圖，caption 都長這樣：

```
1girl, solo, long hair, school uniform, classroom, sitting
```

**幾百萬次。** 所以當你也用這個格式寫，模型處在它最熟悉的分布裡。你改寫成優美的英文句子，反而是它相對陌生的形式。

> 這跟 `comfy-2-5` 講的「tag 順序」是同一個道理：**符合訓練分布 = 表現最穩定**。

---

### ⚠️ tag 式模型做不到的三件事

知道邊界，才不會浪費時間。

#### 做不到一：空間關係

```
❌ "girl on the left, tree on the right"
❌ "the cat is under the table"
```

**CLIP 幾乎不理解方位。** 你寫了，模型大致上只知道「有女孩、有樹」。

> ✅ **正確工具**：ControlNet（Part 5）或區域控制（`comfy-1-7`）。
>
> 你的專案就是這樣解的——場景構圖用**色塊圖 + segment ControlNet**，而不是用文字描述「樹在左邊」。⚠️ 那份紀錄還特別寫到：**用文字要「side view」，模型永遠畫成透視縱深**。那不是 prompt 寫得不好，是 CLIP 根本傳達不了這個資訊。

#### 做不到二：否定

```
❌ "no hat"
❌ "without glasses"
```

**CLIP 沒有否定的概念。** 寫 `no hat`，模型讀到的是 `{no, hat}`——⚠️ **反而可能真的畫出帽子**。

> ✅ **正確工具**：把 `hat` 寫進負面提示詞（`comfy-2-6`）。

#### 做不到三：數量與計數

```
⚠️ "three girls"        → 可能出 2 個或 5 個
✅ "3girls"             → Danbooru 有這個 tag，準確度高很多
```

> **這示範了一個原則**：**Danbooru 有對應 tag 的概念，準確度就高；沒有的就很弱。**

---

### 一個實用心法

```
tag 式模型 → 你在「查詢」一張圖
             （像在圖庫網站打關鍵字）

句子式模型 → 你在「描述」一張圖
             （像在跟人說明你要什麼）
```

用「查詢」的心態寫 tag，你會自然地：

- 用標準詞彙（模型認識的 tag），而不是自創描述
- 一個概念一個 tag，不要寫成子句
- 不寫關係詞、連接詞、冠詞（`a`、`the`、`with`、`of` 基本上是浪費 token）

---

### 為什麼你專案選 WAI Illustrious 是對的

回頭檢視這個決定，它符合幾個條件：

| 需求 | Illustrious 是否滿足 |
|------|:---:|
| 二次元 / 像素風角色 | ✅ 這條線就是為此而生 |
| 精確控制服裝、姿勢、表情 | ✅ Danbooru tag 詞彙極豐富 |
| 要掛像素風 LoRA | ✅ SDXL 系生態完整 |
| 要訓練自己的角色 LoRA | ✅ kohya 工具鏈成熟 |
| 12GB VRAM | ✅ 輕鬆 |
| 要用 ControlNet 控構圖 | ✅ SDXL ControlNet 完整 |
| 圖裡要有文字 | ❌ 但你已經決定 UI 用程式畫 |

**七項裡六項滿足，唯一不滿足的那項你已經繞過了。** 這是很乾淨的技術選型。

> ⚠️ 反過來說：**如果你的需求是「一張圖裡要有可讀的招牌文字」，Illustrious 是錯的工具**，那時該考慮 Qwen-Image 或直接用程式畫。**選型要跟著需求走，不是跟著流行走。**

---

### 混合寫法可行嗎

實務上你會看到有人在 Illustrious 上寫半句半 tag：

```
masterpiece, 1girl, solo, standing in a dimly lit park at night,
long hair, purple eyes
```

**這通常還好**，因為 CLIP 反正是抽關鍵詞。句子部分不會壞事，只是**效率比較差**（吃掉更多 token，而傳達的資訊量比純 tag 少）。

> **建議**：能用 tag 表達的就用 tag。真的沒有對應 tag 的概念（例如很特殊的氛圍），才用短句補充。

---

## 程式碼範例

把「寫給 tag 式模型」的規則寫成檢查清單：

```python
# 一組可以自我檢查的 prompt 撰寫規則
def review_prompt_for_tag_model(prompt: str) -> list[str]:
    """檢查一段 prompt 是否適合 tag 式模型（Illustrious / Pony）。"""
    warnings = []

    if any(word in prompt.lower() for word in [" no ", "without", "not "]):
        warnings.append("❌ CLIP 不理解否定 → 移到負面提示詞")

    if any(word in prompt.lower() for word in ["left of", "right of", "behind", "next to"]):
        warnings.append("❌ CLIP 幾乎不理解空間關係 → 改用 ControlNet")

    if any(word in prompt.lower() for word in [" a ", " the ", " with ", " and "]):
        warnings.append("⚠️ 冠詞/連接詞浪費 token，且不會提升效果")

    if "score_" in prompt:
        warnings.append("⚠️ score_ 是 Pony 專用，在 Illustrious 上是模型不認識的詞")

    return warnings


# 你專案的 prompt 拿來測
review_prompt_for_tag_model(
    "masterpiece, nightheroine, 1girl, solo, open coat, bikini, night park"
)
# → []  ✅ 全部通過
```

> 你現行的 prompt 格式**完全符合**這些規則。這不是巧合——那是十輪迭代磨出來的。

---

## 小練習

1. **驗證句子 vs tag**：同 seed，把你的 prompt 改寫成通順的英文句子，跟原本的 tag 版比較。**確認 tag 版明顯好。**

2. **測試否定的失效**：正面寫 `no hat`，同 seed 跟不寫的比較。**看看它是不是反而更容易出現帽子。**

3. **測試空間關係**：試著用 prompt 要求「角色站在畫面左邊」，產五張。**統計命中率**——這個數字會讓你以後不再嘗試用文字控構圖。

---

## 課外讀物

> CLIP 為什麼是「關鍵詞袋」 → `comfy-2-4`
> Danbooru tag 的完整慣例與詞彙 → `comfy-3-8`
> 句子式模型該怎麼寫 → `comfy-3-9`
> 空間關係的正確工具 → `comfy-5-1`
