# comfy-1-10 📖 節點地圖（五）：影像與遮罩類

> **本章目標**：認識 `IMAGE` 與 `MASK` 的處理節點。**這是產線的最後一哩路**——去背、對齊、縮放、批次存檔全在這裡。

## 你會學到

- 影像的輸入輸出、縮放、裁切、拼接節點
- ⚠️ 縮放演算法的選擇：**nearest-exact 對像素風是唯一正解**
- 遮罩的產生與運算（反轉、擴張、模糊）
- 什麼事該在 ComfyUI 做、什麼事該交給外部腳本

---

## 概念說明

### 影像類的定位

`IMAGE` 是流程的**末端**——通常只在 `VAEDecode` 之後、`SaveImage` 之前這一小段。

但有兩個例外會讓 IMAGE 出現在流程前段：

1. **img2img / ControlNet 的參考圖**（`LoadImage` → 預處理 → 送進流程）
2. **多階段流程**（解碼 → 在像素層處理 → 再編碼回去）

---

## 輸入輸出

### `LoadImage`

| | |
|---|---|
| **輸出** | `IMAGE` / `MASK` |
| **讀哪裡** | 伺服器的 `input/` 資料夾 |

⚠️ 它同時吐出 `MASK`——那是圖片的 alpha 通道。**沒有透明度的圖，這個 MASK 是全白的**（等於「整張都選取」）。

> 介面上可以右鍵「Open in MaskEditor」直接畫遮罩，畫完的遮罩會存進圖片的 alpha。這是最快的 inpaint 手法。

---

### `SaveImage` / `PreviewImage`

| 節點 | 差別 |
|------|------|
| `SaveImage` | 存到 `output/`，**PNG metadata 含完整 workflow** |
| `PreviewImage` | 只顯示，存在 `temp/`，可隨時清掉 |

**實務建議**：探索階段全用 `PreviewImage`，確定要留才接 `SaveImage`。否則 `output/` 會被幾千張垃圾淹沒。

> ⚠️ `SaveImage` 的 `filename_prefix` 可以用斜線建子資料夾（`crashgame/portrait`）。你的產線就靠這個分類。

---

### `SaveAnimatedWEBP` / `SaveAnimatedPNG`

把一批 IMAGE 存成動圖。做 sprite 動畫預覽時會用到（見 Part 8）。

---

## 縮放與裁切 ⚠️ 重點

### `ImageScale` / `ImageScaleBy`

| | |
|---|---|
| **參數** | 目標尺寸或倍率、`upscale_method`、`crop` |

**`upscale_method` 的選擇是本章最重要的一件事**：

| 方法 | 特性 | 適合 |
|------|------|------|
| `nearest-exact` | **硬邊，不做任何插值** | ⚠️ **像素風唯一正解** |
| `bilinear` | 平滑，快 | 一般照片縮小 |
| `bicubic` | 較銳利的平滑 | 一般照片放大 |
| `lanczos` | 最銳利的平滑 | 一般照片，⚠️ **對像素風是災難** |
| `area` | 平均，適合縮小 | 大幅縮小 |

> ⚠️ **這正是你專案 LoRA v3 失敗的原因**：`split_sheet.py` 用 LANCZOS 把 960px 高的人物拉到 1024，6.44px 的格線被糊成漸層，LoRA 學到的就是糊的。
>
> **鐵律**：像素風圖片**只用 nearest-exact，且只做整數倍**。做不到就不要縮放。

---

### `ImageCrop`

按座標裁切。做 sprite sheet 切分、或裁掉不要的邊緣時用。

> 複雜的批次裁切**建議交給外部腳本**（Pillow）處理，ComfyUI 的節點做這種事很笨拙。判斷原則見本章最後。

---

### `ImagePadForOutpaint`

在圖片周圍加上空白區域並產生對應遮罩，供 outpaint（外擴）使用。見 `comfy-5-5`。

---

## 合成與批次

### `ImageBatch`

把兩個 IMAGE 合併成一個批次。用於「把多張圖一起送進下一個處理」。

### `ImageCompositeMasked`

依遮罩把一張圖疊到另一張上。

> **這是 inpaint 的收尾利器**：`comfy-1-8` 提過「遮罩外的區域經過 VAE 會有輕微變化」，解法就是最後用這個節點把原圖的未遮罩區域**貼回去**，確保真的逐位元不變。

### `ImageInvert`

顏色反轉。做某些 ControlNet 預處理時需要（例如某些 lineart 模型要黑底白線，有些要反過來）。

---

## 遮罩類

### 遮罩是什麼

`MASK` 是單通道的灰階資料：

```
白（1.0）= 這裡要處理
黑（0.0）= 這裡不動
灰       = 部分處理（邊緣過渡）
```

### 常用遮罩節點

| 節點 | 做什麼 | 什麼時候用 |
|------|--------|-----------|
| `ImageToMask` | 從圖片的某個通道取遮罩 | 用外部畫好的黑白圖當遮罩 |
| `MaskToImage` | 遮罩轉成圖片 | **除錯用**——把遮罩顯示出來看對不對 |
| `InvertMask` | 黑白反轉 | 「除了這裡以外」 |
| `GrowMask` | 擴張 / 收縮遮罩 | 讓 inpaint 接縫更自然 |
| `MaskComposite` | 兩個遮罩做運算（加、減、交集） | 組合複雜選區 |
| `FeatherMask` | 邊緣羽化 | 讓過渡更柔和 |
| `SolidMask` | 產生純色遮罩 | 當作運算的基底 |

> ⚠️ **除錯技巧**：遮罩出問題時，先用 `MaskToImage` + `PreviewImage` 把它顯示出來。**九成的 inpaint 問題是遮罩本身不對**，不是參數不對。

---

## 一個重要的判斷：什麼該在 ComfyUI 做

ComfyUI 有一堆影像處理節點，但**不代表都該用它做**。

| 該在 ComfyUI 做 | 該交給外部腳本（Pillow / OpenCV） |
|----------------|--------------------------------|
| 跟生成流程直接相關的（VAE 編解碼、ControlNet 預處理） | 批次去背、色鍵 |
| 需要在流程中間處理的（兩階段之間的縮放） | 統一人物高度、腳底對齊 |
| 簡單的縮放裁切 | 複雜的幾何運算、連通元件分析 |
| 要看即時效果的 | 需要精確量測與驗證的 |

> **你的專案已經是這樣分工的**：ComfyUI 負責生成，`tools/portrait/align.py`（去背、統一高度、腳底對齊）與 `measure_grain.py`（格線量測）在外面用 Python 做。
>
> **這個分工是對的。** 理由：外部腳本可以測試、可以進版控、可以精確驗證；而在 ComfyUI 裡用二十個節點做的後製，三個月後沒人看得懂，也沒辦法寫測試。

⚠️ **一個具體的坑**：你的專案發現 **Pillow 11 的 `ImageDraw.floodfill` 在灰階圖上完全沒作用**——這種等級的問題只有在寫程式碼時才發現得了，在節點裡是黑箱。

---

## 對照總表

| 節點 | 吃 | 吐 | 一句話 |
|------|---|---|--------|
| `LoadImage` | — | IMAGE, MASK | 從 input/ 讀圖 |
| `SaveImage` | IMAGE | — | 存檔含 workflow metadata |
| `PreviewImage` | IMAGE | — | 只看不存 |
| `ImageScale` | IMAGE | IMAGE | ⚠️ 像素風用 nearest-exact |
| `ImageCrop` | IMAGE | IMAGE | 裁切 |
| `ImageBatch` | IMAGE×2 | IMAGE | 合成批次 |
| `ImageCompositeMasked` | IMAGE×2+MASK | IMAGE | 依遮罩疊圖 |
| `ImageInvert` | IMAGE | IMAGE | 反轉顏色 |
| `MaskToImage` | MASK | IMAGE | **除錯必備** |
| `GrowMask` | MASK | MASK | 擴張遮罩 |
| `InvertMask` | MASK | MASK | 反轉遮罩 |

---

## 小練習

1. **驗證縮放的破壞力**：拿一張你的像素立繪，分別用 `lanczos` 與 `nearest-exact` 放大 1.5 倍，放大看臉。**這個對照會讓你永遠記得 v3 的教訓。**

2. **把遮罩顯示出來**：接一個 `LoadImage` → `MaskToImage` → `PreviewImage`，看看沒有 alpha 的圖吐出什麼樣的遮罩。

3. **畫一次遮罩**：用 MaskEditor 在一張立繪的臉部畫遮罩，接 `VAEEncodeForInpaint` 做一次局部重繪。這是 Part 5 的預習。

---

## 課外讀物

> 為什麼非整數倍重新取樣會殺死像素格線 → `comfy-6-1`、`comfy-4-17`
> 去背、統一比例這些後製該怎麼做 → `comfy-6-5` ~ `comfy-6-7`
> 「工具各司其職」——什麼該用哪個工具做 → [課外讀物 E-7-2：S — Single Responsibility Principle](../../../課外讀物/E-7-solid/E-7-2-srp.md)
