# [E-8-5] Commit 訊息規範：Conventional Commits

> **這篇在說什麼**：為什麼 commit 訊息很重要，以及業界公認的寫法——Conventional Commits 格式。

## 概念說明

### 三個月後的你

想像一個情境：你做完一個功能，推上去，然後去做別的事情。

三個月後，老闆說：「上次那個訂單計算的 bug 是什麼時候修掉的？修了什麼？」

你打開 `git log`，看到這些：

```
fix
fix2
update
aaa
改好了
上班摸魚
緊急修復
```

完全不知道哪個是。就算你找到了那個 commit，打開 `git show`，還是要花時間看 diff 才能搞清楚改了什麼。

這就是爛 commit 訊息的代價：**它讓未來的你（和你的隊友）白費時間**。

### 好的 commit 訊息長什麼樣

好的 commit 訊息應該讓你一眼就知道：這個 commit 做了什麼、為什麼做。

```
# 壞的
fix
update
改動

# 好的
修復訂單金額計算錯誤（未計入折扣）
新增使用者大頭貼上傳功能
更新 README，加入本機開發步驟
```

一個簡單的自我測試：把 commit 訊息套進這個句子——「如果套用這個 commit，它會 ___」。如果填進去通順，訊息就及格了。

## 深入一點

### Conventional Commits 格式

Conventional Commits 是業界廣泛採用的 commit 訊息規範，格式是：

```
<類型>(<範圍>): <簡短描述>

（可選）詳細說明，解釋為什麼這樣改

（可選）BREAKING CHANGE: 如果這個改動會破壞相容性，在這裡說明
```

`<範圍>` 是可選的，說明這次改動影響哪個模組或功能。

### 常見的類型（type）

| 類型 | 什麼時候用 | 範例 |
|------|----------|------|
| `feat` | 新增功能 | `feat(auth): 新增 Google 登入功能` |
| `fix` | 修復 bug | `fix(cart): 修復購物車數量計算錯誤` |
| `docs` | 文件變更 | `docs: 更新 API 使用說明` |
| `style` | 格式調整（不影響邏輯） | `style: 統一縮排為 2 spaces` |
| `refactor` | 重構（不新增功能也不修 bug） | `refactor(user): 拆分 UserService 成多個模組` |
| `test` | 新增或修改測試 | `test(login): 新增登入失敗的測試案例` |
| `chore` | 維護性工作（更新套件、設定等） | `chore: 更新 dependencies` |

### 實際範例

```bash
# 太簡短，完全沒資訊
git commit -m "fix"

# 好一點，但還是不夠具體
git commit -m "fix login bug"

# 很好：類型清楚、範圍明確、描述具體
git commit -m "fix(auth): 修復 JWT token 過期後未正確導向登入頁"

# 帶詳細說明的版本（多行 commit）
git commit -m "feat(profile): 新增使用者大頭貼上傳功能

支援 JPG、PNG 格式，最大 5MB。
超過大小限制時顯示明確的錯誤訊息。
圖片上傳後自動壓縮至 200x200。"
```

### 一個實用的判斷規則

> 如果你的 commit 訊息需要用「and」連接兩件事，考慮拆成兩個 commit。

```bash
# 這個訊息有 "and"：
"新增登入頁面 and 修復首頁 CSS 跑版"

# 拆成兩個會更清楚：
git commit -m "feat(auth): 新增登入頁面"
git commit -m "fix(home): 修復首頁在手機版 CSS 跑版問題"
```

每個 commit 只做一件事，讓以後回溯或還原變得容易得多。

### 為什麼要費心遵守規範？

除了讓 log 好讀之外，Conventional Commits 還有一個實際用處：很多工具可以**自動讀取 commit 訊息**來做事。

例如：
- 自動產生 CHANGELOG（`feat` 就進「新功能」、`fix` 就進「Bug 修復」）
- 自動判斷版本號要升多少（`feat` 升 minor、`fix` 升 patch、`BREAKING CHANGE` 升 major）

這些自動化工具幫你省去手動維護文件的時間。

## 延伸閱讀

> 想了解 Git 的分支策略，什麼時候該開新分支、怎麼合併 → [課外讀物 E-8-7：Git Flow 與 GitHub Flow](./E-8-7-git-flow.md)
