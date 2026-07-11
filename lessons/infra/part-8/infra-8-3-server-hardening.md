# [infra-8-3] 伺服器加固：把攻擊面縮到最小

> **本章目標**：學會「伺服器加固（hardening）」的核心思維與具體做法——關閉沒用的服務、自動安全更新、用 fail2ban 擋暴力破解，把機器被攻破的機會降到最低。

## 你會學到

- 「加固（hardening）」是什麼、「攻擊面」的概念
- 關閉不必要的服務與 port
- 設定自動安全更新
- 用 fail2ban 自動封鎖暴力破解的攻擊者

## 概念說明

### 你的伺服器，無時無刻被攻擊

這不是嚇你——任何一台有公開 IP 的伺服器，**上線幾分鐘內**就會開始被全世界的自動化程式掃描、嘗試入侵。你在 Part 7-1 用 `grep "Failed" /var/log/auth.log` 可能已經看到滿滿的失敗登入——那些都是機器人在猜你的密碼。

**加固（hardening）** 就是有系統地把機器「武裝」起來，讓這些攻擊更難得逞。

---

### 核心思維：縮小「攻擊面」

加固最重要的觀念叫**攻擊面（attack surface）**：

> 攻擊面 = 攻擊者「可能下手的所有入口」的總和。**入口越少，越安全。**

用類比：一棟房子，門窗越多越難守。加固就是**把不用的門窗都封死，只留必要的、而且每個都裝好鎖**。

```mermaid
graph TB
    BIG["大攻擊面（危險）<br/>開一堆用不到的服務和 port<br/>用密碼登入、root 可登入<br/>系統有已知漏洞沒修"]
    SMALL["小攻擊面（安全）<br/>只開必要服務<br/>金鑰登入、root 不可登入<br/>自動修補漏洞 + 自動封鎖攻擊者"]
    BIG -->|"加固"| SMALL
```

好消息是，你**已經做了一大半加固**了：

| 你做過的加固 | 在哪學的 |
|------------|---------|
| 不用 root、改用一般使用者 + sudo | Part 2-6 |
| 金鑰登入、關閉密碼登入 | Part 2-6 |
| 防火牆只開必要 port | Part 3-3 |

這一章再補上三招，把加固做完整。

---

### 加固三招

**第一招：關閉不必要的服務**

每多跑一個服務，就多一個潛在入口。原則：**用不到的就關掉、移除**。例如機器上裝了某個你根本沒在用的服務，它卻開著 port 聽著——這就是白白多出來的攻擊面。用 Part 3-1 的 `ss -tlnp` 盤點「開了哪些門」，把不認得、用不到的關掉。

**第二招：自動安全更新**

軟體會不斷被發現漏洞，廠商會發布修補（這就是 Part 2-5 的 `apt upgrade`）。但你不可能天天手動更新。**自動安全更新**讓系統自己安裝重要的安全修補，把「有漏洞卻沒修」這個大洞補起來。

**第三招：fail2ban——自動封鎖攻擊者**

就算你用了金鑰登入，那些猜密碼的機器人還是會一直敲門、塞爆你的日誌。**fail2ban** 會盯著日誌（Part 7-1 的 auth.log），發現「某個 IP 短時間內失敗太多次」，就**自動把那個 IP 封鎖**一段時間。等於請了一個保全，看到有人一直試錯鑰匙，就直接把他擋在門外。

## 程式碼範例

> ⚠️ 加固涉及「對外伺服器」的防護，這章建議在你的 **EC2** 上練（WSL 不對外，這些防護意義不大）。

### 第一招：盤點並關閉沒用的服務

看目前開了哪些 port（Part 3-1）：

```bash
sudo ss -tlnp
```

如果發現某個用不到的服務在聽，停掉並停用它（Part 4-1）：

```bash
sudo systemctl disable --now 服務名
```

`disable --now` = 立刻停止 + 取消開機自啟。

---

### 第二招：開啟自動安全更新

Ubuntu 上裝 `unattended-upgrades`：

```bash
sudo apt update
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

最後一行會跳出設定畫面，選「Yes」啟用自動安全更新。之後系統會自動安裝重要的安全修補，你不用記得手動做。

---

### 第三招：安裝設定 fail2ban

```bash
sudo apt install fail2ban -y
```

fail2ban 裝好後預設就會保護 SSH。看它的運作狀態：

```bash
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

第二行會顯示 SSH 這個「監獄（jail）」目前封鎖了哪些 IP、擋下了多少次嘗試。跑一下你可能會驚訝——它已經默默幫你擋掉一堆攻擊了。

如果要調整封鎖規則（例如失敗幾次才封、封多久），複製設定檔來改（別直接改原始檔，這是好習慣）：

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vi /etc/fail2ban/jail.local
```

在 `jail.local` 裡可調 `maxretry`（容許失敗次數）、`bantime`（封鎖時長）等。改完重啟：

```bash
sudo systemctl restart fail2ban
```

> 用 `.local` 覆蓋 `.conf` 是 fail2ban 的慣例——這樣套件更新時不會蓋掉你的設定。這跟 Part 4-3 Nginx 的 `sites-available` 概念類似：把「自己的設定」和「預設的」分開。

## 小練習

### 練習 1：盤點你已完成的加固

對照本章開頭的表格，列出你在 Part 2-6、3-3 已經做過的加固項目。你會發現自己其實已經做了不少——這一章只是補完。

<details>
<summary>參考解答</summary>

對照本章表格，你在前面幾章其實已經做了不少加固——每一項都在**縮小攻擊面**：

| 已完成的加固 | 在哪學的 | 縮小了什麼攻擊面 |
|------------|---------|----------------|
| 不用 root，改用一般使用者 + `sudo` | Part 2-6 | 就算帳號被攻破，攻擊者也不是直接拿到最高權限；`sudo` 還留下操作紀錄 |
| 改用金鑰登入、關閉密碼登入 | Part 2-6 | 機器人猜密碼再也沒用——沒有你的私鑰就進不來，直接堵死「暴力破解密碼」這條路 |
| 禁止 root 直接 SSH 登入 | Part 2-6 | 攻擊者連「要猜哪個帳號」都不知道，不能直接對人人皆知的 `root` 下手 |
| 防火牆只開必要 port（例如 22 / 80 / 443） | Part 3-3 | 沒開的 port 一律拒絕連線，把「可下手的入口」縮到最少 |

把這些對照本章開頭那張「大攻擊面 → 小攻擊面」的圖，你會發現「金鑰登入、root 不可登入、只開必要服務」這幾點你早就做到了。這一章的三招（關閉沒用的服務、自動安全更新、fail2ban）只是把剩下的缺口補完——加固不是一次工程，而是一路累積下來的習慣。

</details>

---

### 練習 2：看看你被攻擊得多兇

在你的 EC2 上跑：

```bash
sudo grep "Failed password" /var/log/auth.log | wc -l
sudo fail2ban-client status sshd
```

第一行數有多少次失敗登入嘗試，第二行看 fail2ban 擋了多少。感受一下「公開伺服器無時無刻被攻擊」是真的。

<details>
<summary>參考解答</summary>

> 這題要在你自己對外的 EC2 上跑才有意義（WSL 不對外，數字會是 0），需自行實機驗證。以下解釋每行在做什麼、你會看到什麼。

**第一行——數失敗登入次數：**

```bash
sudo grep "Failed password" /var/log/auth.log | wc -l
```

- `grep "Failed password" /var/log/auth.log`——從 SSH 的驗證日誌裡撈出所有「密碼登入失敗」的紀錄（Part 7-1 學的）。
- `| wc -l`——把撈出來的行數數一數（`wc -l` = word count 的 line 模式，算行數）。

一台開著幾天的公開 EC2，這個數字常常是**成百上千甚至上萬**——那全是全世界的機器人在猜你的密碼。第一次看到會有點嚇到，但這正是本章開頭說的：任何有公開 IP 的機器，上線幾分鐘內就開始被掃。（順帶一提，因為你早就關掉密碼登入、只用金鑰，這些猜密碼的嘗試**注定失敗**，進不來。）

> 小提醒：有些系統的日誌會輪替（logrotate），舊紀錄跑到 `/var/log/auth.log.1`、`auth.log.2.gz` 去了。想連舊的一起數，可以用 `sudo zgrep "Failed password" /var/log/auth.log*`。

**第二行——看 fail2ban 擋了多少：**

```bash
sudo fail2ban-client status sshd
```

會顯示 SSH 這個「監獄（jail）」的狀態，重點看幾個數字：

- `Total failed`——累計偵測到多少次失敗嘗試。
- `Currently banned` / `Total banned`——目前正被封鎖、以及累計封鎖過多少個 IP。
- `Banned IP list`——目前被關在門外的 IP 清單。

把兩個數字擺在一起看，你就能實際感受到：攻擊是**持續不斷**的（第一行的大數字），而 fail2ban 正默默幫你把那些一直試錯的 IP 擋在門外（第二行）。這就是「請了一個保全」的效果。

</details>

---

### 練習 3：完成三招加固

在你的 EC2 上完成：關閉一個沒用的服務（如果有）、開啟自動安全更新、裝好 fail2ban。完成後，你的伺服器攻擊面就縮到很小了。

> 提示：加固不是一次做完就結束，而是持續的習慣。但你現在已經把「最關鍵的幾道防線」都建立起來了。

<details>
<summary>參考解答</summary>

> 這題是動手題，要在你自己的 EC2 上實作，需自行實機驗證。以下給三招的完整步驟與驗收點。

**第一招：關閉一個沒用的服務（如果有）**

先盤點目前開了哪些 port、聽著哪些服務：

```bash
sudo ss -tlnp
```

看清單裡有沒有你**用不到**卻在聽的服務（例如某個當初隨手裝、現在沒在用的東西）。有的話就停掉並取消開機自啟：

```bash
sudo systemctl disable --now 服務名
```

`disable --now` = 立刻停止 + 取消開機自啟。**驗收點**：再跑一次 `sudo ss -tlnp`，那個 port 應該不見了。（如果盤點下來每個服務都是必要的，例如只剩 SSH 和 Nginx，那這招就「不用關」——這也是正確結果，代表你的攻擊面本來就很乾淨。）

**第二招：開啟自動安全更新**

```bash
sudo apt update
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

最後一行會跳出設定畫面，選 **Yes** 啟用。**驗收點**：確認 `/etc/apt/apt.conf.d/20auto-upgrades` 這個檔存在且內容把自動更新設為 `"1"`：

```bash
cat /etc/apt/apt.conf.d/20auto-upgrades
```

**第三招：裝好 fail2ban**

```bash
sudo apt install fail2ban -y
```

裝好後預設就會保護 SSH。**驗收點**：確認服務有在跑、且 sshd 這個 jail 是 active 的：

```bash
sudo systemctl status fail2ban          # 應該是 active (running)
sudo fail2ban-client status sshd        # 能看到 sshd jail 的封鎖統計
```

（選配）若要調封鎖規則，複製設定檔再改，**不要直接改原始的 `jail.conf`**——用 `.local` 覆蓋是 fail2ban 的慣例，套件更新時才不會蓋掉你的設定：

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vi /etc/fail2ban/jail.local        # 調 maxretry、bantime 等
sudo systemctl restart fail2ban
```

三招都完成後，加上你 Part 2-6、3-3 早就做過的（金鑰登入、關密碼、防火牆），你的伺服器攻擊面就縮到很小了。記住：加固是**持續的習慣**，不是一次做完就結束——但最關鍵的幾道防線，你現在已經都建立起來了。

</details>

## 課外讀物

> 想建立完整的 Web 安全攻防觀念，了解攻擊者都用哪些手法 → [課外讀物 E-10-1：Web 安全總覽 — OWASP Top 10](../../../課外讀物/E-10-security/E-10-1-web-security-overview.md)
