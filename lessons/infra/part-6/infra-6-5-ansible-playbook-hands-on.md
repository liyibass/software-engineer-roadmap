# [infra-6-5] 🔧 動手做：用 Ansible 一鍵建好整套環境

> **本章目標**：寫一份完整的 Ansible playbook，把你在 Part 2~4 手動做過的設定（使用者、防火牆、Nginx）變成「一鍵自動完成、可重複執行」，親身體驗 IaC 的威力。

## 你會學到

- 把手動設定步驟翻譯成 Ansible playbook
- 用 `apt`、`service`、`ufw`、`copy` 等常用 module
- 執行 playbook 並讀懂 `changed` / `ok` 的輸出
- 親手驗證冪等性：跑第二次，什麼都不會重做

## 概念說明

### 這一章在做什麼：把「手動」變「一鍵」

回顧你的學習軌跡，同一件事「部署一個網站環境」，你經歷了三個階段：

```mermaid
graph LR
    A["Part 4-5<br/>手動部署<br/>（SSH 進去一步步敲）"]
    B["Part 5-5<br/>容器化<br/>（複製檔案 + compose up）"]
    C["Part 6-5（這章）<br/>Ansible<br/>（一份 playbook，一鍵套用到任何機器）"]

    A --> B --> C
```

這一章是這條路的終點——你會把 Part 6-3 那份「手寫的設定筆記」，升級成**一份能真正自動執行的 playbook**。之後面對任何一台全新機器，跑一次就全部設定好，而且每次結果都一樣。

> 這章建議用你的 **AWS EC2** 當目標機（因為涉及防火牆、Nginx 這種伺服器設定）。控制機就用你的 WSL。

## 程式碼範例

### 專案結構

在 WSL 的練習資料夾整理出：

```
infra-practice/
├── inventory.ini          ← Part 6-4 建好的機器清單
├── site.yml               ← 這章的主 playbook
└── files/
    └── myapp.conf         ← 要送到伺服器的 Nginx 設定
```

---

### 第一步：準備 Nginx 設定檔

建立 `files/myapp.conf`（內容就是 Part 4-3 寫過的反向代理設定）：

```bash
mkdir -p ~/infra-practice/files
vi ~/infra-practice/files/myapp.conf
```

```nginx
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 第二步：寫主 playbook

建立 `site.yml`：

```bash
vi ~/infra-practice/site.yml
```

```yaml
- name: 設定網頁伺服器環境
  hosts: webservers
  become: yes

  tasks:
    - name: 更新 apt 套件清單
      apt:
        update_cache: yes

    - name: 安裝 nginx 與防火牆工具
      apt:
        name:
          - nginx
          - ufw
        state: present

    - name: 防火牆放行 SSH / HTTP / HTTPS
      ufw:
        rule: allow
        port: "{{ item }}"
      loop:
        - "22"
        - "80"
        - "443"

    - name: 啟用防火牆並預設拒絕進入
      ufw:
        state: enabled
        default: deny
        direction: incoming

    - name: 部署 Nginx 站台設定
      copy:
        src: files/myapp.conf
        dest: /etc/nginx/sites-available/myapp

    - name: 啟用站台設定
      file:
        src: /etc/nginx/sites-available/myapp
        dest: /etc/nginx/sites-enabled/myapp
        state: link

    - name: 確保 nginx 正在運行且開機自啟
      service:
        name: nginx
        state: started
        enabled: yes
```

對照你手動做過的，看每個 task 在做什麼：

| Task | 對應你手動做過的 | 用的 module |
|------|----------------|------------|
| 更新套件清單 | Part 2-5 `apt update` | `apt` |
| 安裝 nginx / ufw | Part 4-3、3-3 手動 install | `apt` |
| 防火牆放行 22/80/443 | Part 3-3 `ufw allow` | `ufw` |
| 啟用防火牆、預設拒絕 | Part 3-3 `ufw enable` | `ufw` |
| 送 Nginx 設定上去 | Part 4-3 手動編輯設定檔 | `copy` |
| 啟用站台（建連結） | Part 4-3 `ln -s` | `file` |
| 啟動並設開機自啟 | Part 4-3 `systemctl enable` | `service` |

幾個語法重點：`loop` 讓一個 task 對清單裡每個值各做一次（`{{ item }}` 是當前的值）；`become: yes` 等於全程用 sudo；每個 task 都在描述「期望狀態」——這就是宣告式 IaC。

> ⚠️ 防火牆順序：跟 Part 3-3 一樣，這份 playbook 刻意「先放行 22，才啟用防火牆」，避免把自己鎖在門外。Ansible 是由上而下執行 task 的，順序很重要。

---

### 第三步：執行 playbook

在 `infra-practice` 資料夾裡：

```bash
cd ~/infra-practice
ansible-playbook -i inventory.ini site.yml
```

Ansible 會連到你的伺服器，由上而下執行每個 task。執行時注意每個 task 後面的狀態：

```
TASK [安裝 nginx 與防火牆工具] ***
changed: [myserver]        ← changed：原本沒裝，現在裝好了（有改動）

TASK [確保 nginx 正在運行且開機自啟] ***
changed: [myserver]
```

最後會有一行總結：

```
PLAY RECAP ***
myserver : ok=8  changed=6  unreachable=0  failed=0
```

`failed=0` 代表全部成功。恭喜——你**一個指令**就完成了過去要 SSH 進去、手動敲十幾條指令的整套設定。

---

### 第四步：驗證冪等性（最重要的體會）

現在做一件神奇的事——**把同一個 playbook 再跑一次**：

```bash
ansible-playbook -i inventory.ini site.yml
```

這次注意看 PLAY RECAP：

```
myserver : ok=8  changed=0  unreachable=0  failed=0
```

**`changed=0`**！第二次跑，Ansible 發現所有東西**都已經是目標狀態了，所以什麼都不做**。這就是 Part 6-4 講的冪等性——你可以放心地一跑再跑，它只會處理「還沒達標」的部分。

這帶來一個超棒的工作方式：以後要改設定，**直接改 playbook、重跑**，Ansible 只會套用「有變的那幾項」。你的 playbook 變成了這台機器**永遠最新、最準確的設定文件**。

---

### 你完成了什麼

你把「一台機器該長什麼樣」變成了一份**程式碼**。這份 `site.yml`：

- 能套用到 1 台或 100 台機器（在 inventory 加機器就好）
- 能用 Git 版本控制（呼應 Part 6-3 的 IaC）
- 機器掛了，跑一次就重建——徹底告別「設定漂移」和「雪花伺服器」
- 本身就是最準確的設定文件

這就是現代 infra 工程師的核心工作方式。

## 小練習

### 練習 1：完成並執行 playbook

把這份 playbook 寫好，對你的 EC2 執行成功（`failed=0`）。然後從瀏覽器連伺服器 IP，確認 Nginx 起來了。

<details>
<summary>參考解答</summary>

這是動手題，要對你的 EC2 實機執行、並用瀏覽器驗證。步驟如下：

**第一步：把檔案準備齊全**（照本章的專案結構）

```
infra-practice/
├── inventory.ini      ← Part 6-4 建好的
├── site.yml           ← 本章的主 playbook
└── files/
    └── myapp.conf     ← Nginx 反向代理設定
```

`files/myapp.conf` 和 `site.yml` 的內容直接照本章「程式碼範例」抄好。

**第二步：執行 playbook**

```bash
cd ~/infra-practice
ansible-playbook -i inventory.ini site.yml
```

**驗收點 1**：看最後的 PLAY RECAP，確認 **`failed=0`**，例如：

```
myserver : ok=8  changed=6  unreachable=0  failed=0
```

`failed=0` 代表每個 task 都成功了。如果有 `failed`，看它卡在哪個 task 的紅字錯誤訊息去對症下藥（常見是 SSH 不通、或 sudo 權限問題——確認 `become: yes` 有加、deploy 使用者能免密碼 sudo）。

**驗收點 2**：打開瀏覽器，連 `http://你的EC2-IP`。因為這份 playbook 只裝了 Nginx、還沒有真的跑一個 listen 在 3000 埠的後端，Nginx 反向代理過去會拿到 502 Bad Gateway——這是**正常的**，看到 502（而不是連不上、逾時）就代表 Nginx 本身已經起來、防火牆的 80 埠也放行了，只是後端還沒接上。想看到完整頁面，可以先在伺服器上跑一個監聽 3000 埠的服務（例如 Part 5 的容器）再連。

（若你的安全群組 Security Group 沒開 80 埠，瀏覽器會連不上——記得 AWS 那層的防火牆也要放行 80。）

</details>

---

### 練習 2：親手驗證冪等性

連續跑兩次同一個 playbook，比較兩次的 PLAY RECAP。第二次的 `changed` 是多少？用自己的話解釋為什麼。

<details>
<summary>參考解答</summary>

把同一個 playbook 連跑兩次：

```bash
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml
```

**觀察到的結果**：

- 第一次：`ok=8  changed=6`（各項設定原本都還沒到位，Ansible 一項項幫你做出改動）。
- 第二次：`ok=8  changed=0`（沒有任何改動）。

**第二次的 `changed` 是 `0`**。

**為什麼**：因為 Ansible 是**冪等**的。它每個 task 描述的是「期望的狀態」（nginx 要 present、服務要 started、防火牆要放行某些埠……），執行時會**先檢查現況**：第一次跑時這些狀態都還沒達成，所以它動手去做，顯示 `changed`；第二次跑時，所有東西**都已經是目標狀態了**，Ansible 一檢查發現「不用做任何事」，就全部跳過，於是 `changed=0`、全都是 `ok`。

這正是冪等性的價值——你可以放心地一跑再跑，Ansible 只會處理「還沒達標」的部分，已經對的就不碰，不會因為重跑而把東西弄壞或重裝一遍。

</details>

---

### 練習 3：體驗「改一行、重跑」

在 playbook 加一個 task，例如「安裝 `htop`」（用 `apt` module）。重跑 playbook，觀察：

1. PLAY RECAP 的 `changed` 是多少？
2. 是不是只有新增的那個 task 顯示 `changed`，其他都是 `ok`？

> 提示：這證明了你能安全地「逐步演進」一台機器的設定，而不用擔心重跑會破壞已有的東西。把這份 playbook 放進 Git，你就擁有了一份可追溯、可重現的基礎設施定義——這是 Part 8 災難復原、Part 9 多機管理的基礎。

<details>
<summary>參考解答</summary>

在 `site.yml` 的 `tasks:` 底下，任一處加一個新的 task（習慣上放在安裝套件那一區附近）：

```yaml
    - name: 安裝 htop
      apt:
        name: htop
        state: present
```

也可以直接把 `htop` 併進原本那個「安裝 nginx 與防火牆工具」的清單裡：

```yaml
    - name: 安裝 nginx 與防火牆工具
      apt:
        name:
          - nginx
          - ufw
          - htop
        state: present
```

兩種寫法都對。存檔後重跑：

```bash
ansible-playbook -i inventory.ini site.yml
```

**回答兩個觀察點**：

1. **PLAY RECAP 的 `changed` 是多少**：`changed=1`。因為只有「安裝 htop」這件事是新的、還沒達標，Ansible 只做了這一項改動。（若你是併進原本清單的寫法，那個 `apt` task 會顯示 `changed`，因為清單裡多了一個還沒裝的套件。）

2. **是不是只有新增的 task 顯示 `changed`、其他都是 `ok`**：是的。其他 task（nginx、ufw、防火牆規則、設定檔、服務）之前都已經達到目標狀態了，這次重跑 Ansible 一檢查發現不用動，全部顯示 `ok`。只有新加的 htop 是 `changed`。

**這證明了什麼**：你能安全地「逐步演進」一台機器的設定——想加東西就改 playbook、重跑，Ansible 只套用「有變的那一項」，完全不會動到、也不會弄壞已經設好的其他部分。把這份 playbook 放進 Git，它就是一份可追溯、可重現的基礎設施定義。

（驗收：可自行 `ssh` 進 EC2 打 `htop` 確認真的裝好了。）

</details>

## 課外讀物

> Ansible 透過 SSH 連到目標機器執行，想複習 SSH 金鑰與連線設定 → [課外讀物 E-1-7：SSH 基礎](../../../課外讀物/E-1-terminal/E-1-7-ssh-basics.md)
