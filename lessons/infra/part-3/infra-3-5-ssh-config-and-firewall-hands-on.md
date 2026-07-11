# [infra-3-5] 🔧 動手做：用 SSH config 管理多台機器 + 設好防火牆

> **本章目標**：把整個 Part 3 學的東西實際做一遍——用 `~/.ssh/config` 管理你的伺服器、用 `ufw` 設定「只放行必要 port」的防火牆，並驗證它真的生效。

## 你會學到

- 寫一份能管理多台機器的 `~/.ssh/config`
- 在伺服器上設好一套「預設拒絕、只開 22/80/443」的防火牆
- 用 Part 3-4 的工具驗證防火牆規則真的有效
- 把「連線管理」和「網路安全」整合成你的標準起手式

## 概念說明

### 這一章在做什麼

前面四章分別學了 IP/Port/DNS（3-1）、SSH 進階（3-2）、防火牆（3-3）、除錯工具（3-4）。這一章把它們**串成一套你每次拿到新伺服器都會做的標準流程**：

```mermaid
graph LR
    A["① 本機：<br/>設定 SSH config<br/>方便連線"]
    B["② 伺服器：<br/>設定防火牆<br/>只開必要的門"]
    C["③ 驗證：<br/>用工具確認<br/>規則生效"]

    A --> B --> C
```

做完這套，你的伺服器就有了「好管理 + 基本安全」的底子。

> ⚠️ 這章會動到 SSH 連線和防火牆，請全程記住前幾章的保命原則：**先確保自己進得來，再做會切斷連線的操作**。

## 程式碼範例

### Part A：設定 SSH config（在你自己電腦）

編輯設定檔：

```bash
vi ~/.ssh/config
```

假設你有兩台機器：一台對外的網頁伺服器、一台只能透過它進去的內部資料庫機。寫成這樣：

```
# 對外的網頁伺服器
Host web
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519

# 內部資料庫機（透過 web 當跳板進去）
Host db
    HostName 10.0.1.50
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ProxyJump web
```

存檔後測試別名連線：

```bash
ssh web
```

如果順利進到網頁伺服器，第一段就成功了。`db` 那台則會自動透過 `web` 跳進去（ProxyJump，3-2 學過）。

---

### Part B：在伺服器上設定防火牆

SSH 進入 `web` 之後，依 3-3 的「保命順序」設定 `ufw`。**先放行 SSH，最後才啟用**：

```bash
# 1. 先放行 SSH（最重要，第一個做）
sudo ufw allow 22

# 2. 放行網頁服務
sudo ufw allow 80
sudo ufw allow 443

# 3. 設定預設策略：進來的擋掉、出去的放行
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 4. 確認 22 已放行後，才啟用防火牆
sudo ufw enable
```

`ufw enable` 會警告可能中斷連線，確認 22 已在規則裡，輸入 `y`。

---

### Part C：驗證規則生效

先看防火牆目前的規則：

```bash
sudo ufw status verbose
```

應該看到「預設拒絕進入、只放行 22/80/443」的狀態。

接著用 3-4 的工具驗證。**最關鍵的驗證**：開一個**新的終端機**，確認 SSH 還連得進去（如果連不進去，代表 22 沒放行成功——但你舊視窗還在，可以救）：

```bash
ssh web
```

新視窗能進去 → SSH 規則正確，你沒把自己鎖在外面。✅

最後，從你自己電腦測試「該開的開、該關的關」。例如測網頁 port（443）通不通：

```bash
curl -I https://203.0.113.10 --insecure
```

再試一個**你沒有放行**的 port（例如資料庫的 5432），它應該會**連線逾時**（被防火牆擋下）——這代表你的「預設拒絕」真的在保護機器。

---

### 你完成了什麼

做完這三部分，你建立了：

- 一份能用別名、自動跳板的 SSH 連線設定
- 一套「預設拒絕、白名單放行」的主機防火牆
- 用工具驗證過「該開的能連、該關的被擋」

這就是一個 infra 工程師拿到新機器後的標準起手式。

## 小練習

### 練習 1：完成整套流程

在你的伺服器上，從 Part A 做到 Part C。如果你只有一台機器，`db` 那段可以先略過，專注把 `web` 的連線與防火牆設好。

<details>
<summary>參考解答</summary>

> ⚠️ 這是整合實作題，請照 Part A→B→C 實際跑一遍，以下是完整流程與各步驟的驗收點。

**Part A：在你自己電腦設 SSH config**

```bash
vi ~/.ssh/config
```

```
# 對外的網頁伺服器
Host web
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
```

（只有一台機器就先只寫 `web` 這段，`db` / ProxyJump 那段略過。）
→ **驗收**：`ssh web` 能進到伺服器。

**Part B：在伺服器上設防火牆（照保命順序，先放行 22、最後才 enable）**

```bash
sudo ufw allow 22            # 最重要，第一個做
sudo ufw allow 80
sudo ufw allow 443
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable              # 確認 22 已放行後，輸入 y
```

→ **驗收**：`sudo ufw status verbose` 顯示「預設 deny incoming，只放行 22/80/443」。

**Part C：驗證**

- **最關鍵**：**另開一個新終端機**跑 `ssh web`，確認還連得進去（代表 22 放行成功、你沒把自己鎖在外面）。舊視窗先別關，萬一連不進去還能救。
- 從自己電腦測該開的門：`curl -I https://203.0.113.10 --insecure`（有回應代表 443 通）。
- 測沒放行的門：`curl -m 5 http://203.0.113.10:5432` 應該逾時（被擋下）。

→ **驗收點**：新視窗進得去、443 連得到、5432 被擋，三者都符合就代表整套流程成功。

</details>

---

### 練習 2：驗證「門關起來了」

從你自己電腦，試著連一個你**沒有放行**的 port，確認它被擋下：

```bash
curl -m 5 http://203.0.113.10:5432
```

`-m 5` 是最多等 5 秒。如果它逾時失敗，恭喜——你的防火牆正在做它該做的事。

<details>
<summary>參考解答</summary>

> ⚠️ 實機題，請實際跑一次觀察結果。

從**你自己電腦**（不是伺服器上）執行：

```bash
curl -m 5 http://203.0.113.10:5432
```

（`-m 5`：最多等 5 秒就放棄，避免一直卡著。把 IP 換成你自己伺服器的、port 換成你**沒有放行**的那個。）

**預期結果 / 驗收點**：出現類似 `curl: (28) Connection timed out after 5001 milliseconds` 的**逾時**訊息。這代表封包送到那個 port 後，被防火牆**默默丟棄**（沒回應），所以一路等到逾時——正是「預設拒絕」在保護機器。

**判讀小提醒**：

- **逾時（timed out）** → 防火牆把封包丟掉、不回應（`ufw` 的 deny 預設就是這樣）。這是**你要的結果**。
- 如果反而馬上出現 **`Connection refused`（連線被拒）**，那表示封包有到、但沒有服務在聽，且**沒被防火牆擋**——代表這個 port 其實是通的（防火牆沒擋到），要回頭檢查 `ufw` 規則是不是漏放行了什麼。
- 如果它**成功連上並回應**，就代表那個 port 對外開著，得檢查為何沒被擋。

</details>

---

### 練習 3：寫下你的「標準起手式」

用條列把「拿到一台新伺服器後，我會依序做哪些事」整理成一份自己的清單。把 Part 2-6（建立安全使用者）和這一章（SSH config + 防火牆）整合進去。

> 提示：這份清單之後在 Part 6（自動化）會超有用——因為你會把這些手動步驟，變成「一鍵自動完成」的 Ansible playbook。

<details>
<summary>參考解答</summary>

這是開放題，重點是**把 Part 2-6（建立安全使用者）和 Part 3（SSH config + 防火牆）整合成一份有順序的清單**。以下是一份示範，你可以依自己習慣增減：

**拿到一台新伺服器的標準起手式：**

1. **首次登入**：用主機商給的帳號 / 金鑰連進去（此時多半還是 root 或預設帳號）。
2. **系統更新**：`sudo apt update && sudo apt upgrade -y`，先把已知漏洞補掉。
3. **建立專用使用者**（Part 2-6）：`sudo adduser deploy`，加入 sudo 群組 `sudo usermod -aG sudo deploy`，不要平常都用 root。
4. **設定金鑰登入**：把你的公鑰放進 `deploy` 的 `~/.ssh/authorized_keys`。
5. **強化 SSH 設定**（Part 2-6，改前保留一個舊視窗別關）：關閉密碼登入（`PasswordAuthentication no`）、關閉 root 直接登入（`PermitRootLogin no`），改完 `sudo systemctl restart ssh`，**另開視窗驗證新帳號進得來**。
6. **設定防火牆**（Part 3-3）：**先 `sudo ufw allow 22`**，再 allow 80/443，設 `default deny incoming` / `allow outgoing`，**最後 `sudo ufw enable`**。
7. **在自己電腦設 `~/.ssh/config`**（Part 3-2 / 3-5）：給機器取別名、需要的話設 ProxyJump 跳板，之後 `ssh web` 一鍵連。
8. **驗證**（Part 3-4）：新視窗 `ssh` 進得去、`ufw status verbose` 規則正確、`curl` 測該開的通 / 該關的被擋。

**貫穿全程的原則**：**做任何會切斷連線的操作前，先確保自己還進得來**（保留舊視窗、先放行 22）。這份清單到 Part 6 就能改寫成 Ansible playbook，一鍵套用到每一台新機器。

</details>

## 課外讀物

> 想把這套「安全起手式」背後的攻防思維補齊 → [課外讀物 E-10-1：Web 安全總覽 — OWASP Top 10](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)
