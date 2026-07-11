# [aws-3-2] 🔧 動手做：開一台 EC2、SSH 進去、架 web server

> **本章目標**：親手啟動一台 EC2、用 SSH 連進去、裝上 Nginx 架起一個對外網站——把你的 infra 功力第一次用在 AWS 雲端機器上。

## 你會學到

- 在 AWS Console 啟動一台 EC2 instance
- 用金鑰 SSH 連進 EC2
- 設定 Security Group 開放正確的 port
- 在 EC2 上架起一個 Nginx 網站

## 概念說明

### 這一章把 infra 搬上雲

這是個令人興奮的時刻——你 infra 課學的「SSH 登入、裝 Nginx、架網站」，這次要在**真正的雲端機器**上做一遍。你會發現：**一旦 SSH 進去，它就是一台普通的 Linux 機器，infra 學的全部適用。** AWS 的部分只是「怎麼把這台機器開出來、怎麼讓它能被連到」。

流程：

```mermaid
graph LR
    A["① 啟動 EC2<br/>選 AMI/規格/金鑰"]
    B["② 設 Security Group<br/>開 22 / 80"]
    C["③ SSH 連進去<br/>（infra Part 2-6 的技能）"]
    D["④ 裝 Nginx 架網站<br/>（infra Part 4 的技能）"]
    A --> B --> C --> D
```

> 用 Free Tier 的 `t3.micro`（或 `t2.micro`），練習花費接近零。**做完記得 terminate**（aws-1-3、3-1）。

## 程式碼範例

### 第一步：啟動一台 EC2

1. 確認**右上角 Region** 選好（如東京）。Console 搜尋進入 **EC2** → **Launch instance**。
2. **Name**：取個名字（如 `my-first-server`）。
3. **AMI**：選 **Ubuntu**（這門課和 infra 課一致；或 Amazon Linux 也行）。選有標 "Free tier eligible" 的。
4. **Instance type**：選 **t3.micro**（或 t2.micro，Free tier eligible）。
5. **Key pair**：**Create new key pair**，取名、下載那個 `.pem` 私鑰檔（**這是你 SSH 進去的鑰匙，下載後好好保存，不會再給第二次**）。
6. **Network settings**：先用預設 VPC（Part 4 會深入網路）。重點是 **Security Group**——下一步設定。
7. 暫時先啟動，下面調整 Security Group。

### 第二步：設定 Security Group（防火牆）

Security Group 是 EC2 的防火牆（雲端那一層，呼應 infra Part 3-3）。要開放：

| Type | Port | Source | 用途 |
|------|------|--------|------|
| SSH | 22 | My IP（建議）| 讓你 SSH 進去 |
| HTTP | 80 | Anywhere | 讓大家連網站 |

> ⚠️ **SSH（22）的 Source 建議選「My IP」**（只允許你自己的 IP 連），而不是「Anywhere」——這縮小攻擊面（呼應 infra Part 3-3、aws-2-2 最小權限的精神）。網站的 80 才需要對所有人開。

啟動 instance。等狀態變成 "Running"，記下它的 **Public IPv4 address（公開 IP）**。

### 第三步：SSH 連進去

在你電腦的終端機（WSL 也可以，呼應 infra Part 0），先把下載的金鑰權限設好（SSH 要求私鑰不能被別人讀，infra Part 2-2 的權限概念）：

```bash
chmod 400 你的金鑰.pem
```

然後連線（Ubuntu AMI 的預設使用者是 `ubuntu`）：

```bash
ssh -i 你的金鑰.pem ubuntu@你的EC2公開IP
```

第一次問信任輸入 `yes`。成功的話——**你人就在這台雲端機器裡了！** 跑個 `whoami`、`uname -a`（infra Part 1-4 的「認識機器」），確認這就是一台 Ubuntu。

### 第四步：裝 Nginx 架網站（infra Part 4 重現）

接下來完全是 infra Part 4 學的，在雲端機器上做一遍：

```bash
# 更新套件清單（infra Part 2-5）
sudo apt update

# 裝 Nginx（infra Part 4-3）
sudo apt install nginx -y

# 確認服務在跑（infra Part 4-1）
systemctl status nginx
```

改一下首頁內容，證明是你的：

```bash
echo "<h1>🚀 我的網站跑在 AWS EC2 上！</h1>" | sudo tee /var/www/html/index.html
```

### 第五步：見證成果

打開瀏覽器，連 `http://你的EC2公開IP`。你應該看到「🚀 我的網站跑在 AWS EC2 上！」

**恭喜——你親手在雲端開了一台機器、SSH 進去、架起了一個對外網站。** 這結合了 aws（開機器、Security Group）和 infra（SSH、Nginx）的能力。如果連不到，照 infra Part 3-4 分層排查：先確認 EC2 是 Running、Security Group 有開 80、Nginx 在跑。

---

### 第六步：清理（重要！）

練習完，依 aws-1-3 的習慣清理：

- 短期還要用 → **Stop**（關機，之後可再開）。
- 不要了 → **Terminate**（徹底刪除，不再計費）。

> 在 EC2 console 選取 instance → Instance state → Stop / Terminate。別讓它忘了關一直計費。

## 小練習

### 練習 1：完成完整流程

照六步，開一台 EC2、SSH 進去、架起 Nginx 網站，從瀏覽器看到你的網頁。最後記得清理。

<details>
<summary>參考解答</summary>

這是動手題，實際操作請自行在你的 AWS 帳號裡完成（本解答只給做法與驗收點，不會真的幫你建立資源）。完整做法照本章六步：

1. **啟動 EC2**：選好 Region → EC2 → Launch instance → 取名 → AMI 選 Ubuntu（Free tier eligible）→ Instance type 選 `t3.micro`（或 `t2.micro`）→ Create new key pair 並**下載 `.pem` 私鑰檔妥善保存**。
2. **設 Security Group**：開放 SSH（22，Source 選 My IP）和 HTTP（80，Source 選 Anywhere），然後啟動，等狀態變 Running，記下 Public IPv4 address。
3. **SSH 進去**：先 `chmod 400 你的金鑰.pem`，再 `ssh -i 你的金鑰.pem ubuntu@你的公開IP`，第一次問信任輸入 `yes`。
4. **裝 Nginx**：`sudo apt update` → `sudo apt install nginx -y` → `systemctl status nginx` 確認在跑，再用 `echo "..." | sudo tee /var/www/html/index.html` 改首頁。
5. **見證成果**：瀏覽器開 `http://你的公開IP`，看到自己的網頁。
6. **清理**：EC2 console 選 instance → Instance state → Stop（短期還要用）或 Terminate（不要了）。

**驗收點**（怎麼算成功）：
- `ssh` 能成功連進去，`whoami` 顯示 `ubuntu`、`uname -a` 看到 Linux。
- `systemctl status nginx` 顯示 `active (running)`。
- 從**你電腦的瀏覽器**（不是機器內）連公開 IP 能看到你改的網頁。
- 練習後 instance 已 Stop 或 Terminate，不再無謂計費。

> ⚠️ 這題必須自行在 AWS 實機操作驗證；請務必在做完後清理資源，避免忘了關而計費。

</details>

---

### 練習 2：理解 Security Group

回答：

1. 為什麼 SSH（22）的 Source 建議設「My IP」而不是「Anywhere」？
2. 如果你忘了開 80 port，會發生什麼？（提示：用 infra Part 3-4 的排查思路想）

<details>
<summary>參考解答</summary>

**1. 為什麼 SSH 的 Source 建議設「My IP」：**

因為 SSH（22 port）是「登入你機器的大門」，權限很大。如果 Source 設「Anywhere（0.0.0.0/0）」，等於**全世界任何 IP 都能來敲你的 SSH 門**——網路上有大量自動化程式整天掃描開放的 22 port，猜帳號密碼。設成「My IP」表示**只允許你自己現在這個 IP 連進來**，把攻擊面縮到最小（呼應 infra Part 3-3 防火牆、aws-2-2 最小權限的精神）。相對地，網站的 80 port 本來就是要給大家看的，所以才對 Anywhere 開放。

**2. 如果忘了開 80 port：**

**SSH 還是連得進去（22 有開），但從瀏覽器連 `http://公開IP` 會連不到、一直轉圈或逾時**。原因是：即使 EC2 是 Running、Nginx 也在跑，Security Group 這道雲端防火牆會**把外面進來的 80 port 流量擋掉**，請求根本到不了 Nginx。

用 infra Part 3-4 的分層排查思路：先確認 EC2 是 Running（機器層 OK）→ SSH 進去看 `systemctl status nginx` 是 active（服務層 OK）→ 在機器**內**用 `curl localhost` 能拿到網頁（本機層 OK）→ 但機器**外**連不到，就能鎖定問題在「網路/防火牆層」，也就是 Security Group 沒開 80。補開 80（Source: Anywhere）後就通了。

</details>

---

### 練習 3：對照 infra

回答：這次在 EC2 上做的事，哪些是「AWS 特有的」、哪些是「infra 課學過、在哪台 Linux 都一樣的」？

> 提示：開機器、Security Group、公開 IP 是 AWS 的；SSH、apt、Nginx、systemctl 是通用 Linux 的。這就是「先學 infra、再學 AWS 會很快」的原因。

<details>
<summary>參考解答</summary>

把這次做的事分成兩類：

**AWS 特有的（換一朵雲或換供應商就不一樣）：**
- 在 Console 按 **Launch instance** 開機器、選 AMI / Instance type / Key pair。
- 設定 **Security Group**（AWS 的雲端防火牆）。
- 拿到 **Public IPv4 address（公開 IP）**、以及 Stop / Terminate 這些機器生命週期操作。
- 這些是「怎麼把機器開出來、怎麼讓它能被連到」的部分，是 AWS 平台幫你管的那一層。

**infra 學過、在哪台 Linux 都一樣的（通用技能）：**
- 用 `ssh -i 金鑰 ubuntu@IP` 連線、`chmod 400` 設金鑰權限（infra Part 2）。
- `sudo apt update`、`sudo apt install nginx`（套件管理，infra Part 2-5、4-3）。
- `systemctl status nginx` 看服務狀態（infra Part 4-1）。
- 改 `/var/www/html/index.html`、用 `curl` 排查（infra Part 4、3-4）。

**重點**：一旦 SSH 進去，它就是一台普通的 Linux 機器，infra 的知識全部適用；AWS 只是多了「把機器開出來、接上網路」這一層。這就是為什麼「先學 infra、再學 AWS 會很快」——你只要多學 AWS 那薄薄一層的操作，底下的 Linux 功力直接沿用。

</details>

## 課外讀物

> SSH 連線、Nginx 設定的完整原理，在 infra 課有詳細教學 → 參見 **infra 課程** Part 2-6、Part 4（`lessons/infra/課程大綱.md`）
