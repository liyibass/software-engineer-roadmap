# [實戰 05] 無線搬有線：一行 `umask 077`，讓整台機器從網路上消失

> **本篇目標**：把兩台機器的 IP 從 WiFi 網卡搬到有線網卡，第一次就失敗——失敗的原因跟網路無關，是檔案權限。以及「自動還原」為什麼是遠端改網路唯一可靠的退路。
> **發生時間**：2026-11-08　**機器**：`98`（失敗＋修好）、`90`（照修好的版本一次成功）
> **成果**：兩台都走有線，IP 沿用 `.90`／`.98`，WiFi 關閉。決策見 [ADR-003](../決策紀錄/ADR-003-網路介面與IP規劃.md)

## 你會學到

- 遠端改網路怎麼留退路：**先排好「5 分鐘後自動還原」，再套用**
- 為什麼一個保護設定檔的 `umask 077`，會讓 systemd-networkd 讀不到自己的設定
- 設定「被忽略」時系統不會報錯，而是**安靜地換成某個預設值**——這次的預設值讓機器拿到一個沒人知道的 IP
- 為什麼「同一個 IP 掛在兩張網卡上」不是好的過渡方案
- 換網卡時，其他機器的 ARP 快取為什麼會讓你以為連不上

---

## 背景：要做什麼

兩台都是同款 Mac mini，各有一張 WiFi（`wlp2s0b1`，Broadcom b43，之前好幾次失聯都是它）跟一張有線（`enp1s0f0`）。switch 接好之後，要把 IP **原封不動**從 WiFi 搬到有線：

```
之前：wlp2s0b1 = 192.168.10.98   enp1s0f0 = （安裝時的 DHCP 設定）
之後：enp1s0f0 = 192.168.10.98   wlp2s0b1 = 關閉
```

IP 不變，所以 nginx upstream、Prometheus targets、ufw 規則、ssh 別名一個都不用改。

難的不是設定本身，是**你正透過要被改掉的那條網路連進去改它**。

---

## 第一部分：退路——讓機器自己退

[ADR-003](../決策紀錄/ADR-003-網路介面與IP規劃.md) 當初的待確認清單寫著「先確認實體鍵盤螢幕可用」。實際做法換成讓機器自己退，腳本流程：

```bash
cp -a /etc/netplan /etc/netplan-backup-<時間>     # 1. 整個資料夾先備份
# 2. 寫新的有線設定、把 WiFi 設定移進備份資料夾
netplan generate                                   # 3. 先產生、檢查，還沒套用
# 4. 排好 5 分鐘後的自動還原
systemd-run --unit=netplan-rollback --on-active=300 \
  /bin/bash -c "cp -a <備份>/. /etc/netplan/; netplan apply"
# 5. 套用。用 nohup：ssh 斷了，apply 也要跑完
nohup netplan apply &
```

套用後從新連線跑 `confirm`：確認有線有 IP、WiFi 沒有 IP、ping 得到路由器，**全部通過才** `systemctl stop netplan-rollback.timer`。

連不回來的話什麼都不用做——5 分鐘後機器自己回到舊設定。

> 💡 這跟 Cisco 的 `reload in 5`、Juniper 的 `commit confirmed` 是同一個概念：**改變自己的連線路徑時，預設結果要是「還原」，而不是「維持」**。人連得回來才去確認；連不回來，不作為就等於還原。

---

## 第二部分：第一次就失敗了

98 套用後，ssh 斷線——預期內。但 30 秒、1 分鐘過去：

- `ping 192.168.10.98`：不通
- 原本有線 DHCP 拿到的 `192.168.10.170`：**也不通**
- Mac 上 `arp -a`：`.98` 是 `(incomplete)`

5 分鐘到，自動還原執行，機器回來了。**退路有效**——這是整件事裡唯一順利的部分。

### 看日誌

機器回來後讀 journal（`adm` 群組不用 sudo 就能讀）：

```
12:21:22 systemd-networkd: Failed to open /run/systemd/network/10-netplan-enp1s0f0.network: Permission denied
12:21:22 systemd-networkd: enp1s0f0: Reconfiguring with /run/systemd/network/zzzz-dracut-default.network.
12:21:22 systemd-networkd: enp1s0f0: DHCP lease lost
12:21:25 systemd-networkd: enp1s0f0: DHCPv4 address 192.168.10.171/24 ...
```

逐行翻譯：

1. networkd **讀不到** netplan 產生的設定檔
2. 於是改用另一個它讀得到的：開機程式（dracut）留在 `/run` 裡的預設設定——「所有網卡都 DHCP」
3. 用新的設定重新跟路由器要 IP
4. 拿到 **`.171`**，不是 `.98`，也不是原本的 `.170`

為什麼是 `.171`：dracut 那份預設設定用 `ClientIdentifier=mac` 跟路由器要 IP，跟 netplan 平常用的識別方式不同，路由器把它當成另一台新機器，發了一個新位址。所以機器其實**一直活著**，只是活在一個沒人知道的 IP 上。WiFi 那邊，設定檔已經移走、網卡關了，也沒有 IP。

### 為什麼讀不到

```
$ ls -l /run/systemd/network/
-rw-r----- 1 root systemd-network  141  10-netplan-enp1s0f0.network    ← 正常的樣子
```

正常是 `640`、群組 `systemd-network`：root 寫、networkd（用 `systemd-network` 帳號跑）讀。

出事那次是 `600`。原因是腳本前面這兩行：

```bash
umask 077                       # 想保護接下來寫的設定檔
cat > /etc/netplan/10-wired-static.yaml <<YAML
...
YAML
```

本意只是讓這份 yaml 不給別人讀。但 `umask` 是**整個 shell 的設定**，之後同一支腳本跑的每個程式都會繼承——包括 `netplan generate` 和 `netplan apply`。它們建出來的 `.network` 檔原本該是 `640`，被 `077` 遮掉群組讀取權，變成 `600`。

在 98 上用一般帳號、假的根目錄重現（不碰 `/etc`）：

```bash
for mask in 022 077; do
  ( umask $mask; netplan generate --root-dir /tmp/test-$mask )
  stat -c '%a' /tmp/test-$mask/run/systemd/network/*.network
done
# umask 022 → 640
# umask 077 → 600
```

> ⚠️ **這類故障最難查的地方：沒有任何東西報錯。** `netplan generate` 成功、`netplan apply` 成功、networkd 也正常運作——它只是安靜地換了一份設定。唯一的線索是 journal 裡一行 `Permission denied`，而且要機器回來之後才讀得到。

---

## 第三部分：修法

**1. `umask` 只包住真正要保護的那一步**

```bash
( umask 077; cat > "$WIRED_FILE" ) <<YAML
...
YAML
```

括號開一個子 shell，`umask` 只在裡面生效，後面的 `netplan` 不受影響。

**2. 套用前，用服務自己的帳號確認讀得到**

```bash
generated=/run/systemd/network/10-netplan-enp1s0f0.network
runuser -u systemd-network -- test -r "$generated" || { 還原; exit 1; }
grep -qx "Address=192.168.10.98/24" "$generated"    || { 還原; exit 1; }
```

`root` 什麼都讀得到，用 root 檢查等於沒檢查。要用**實際會讀這個檔的那個帳號**去試。

**3. 中途失敗還原時，也要重新 `netplan generate`**

`/run/systemd/network/` 裡已經是新產出的檔；只把 `/etc/netplan` 復原的話，networkd 下次重載還是會讀到新的那份。

---

## 第四部分：分兩段切，而不是「兩張網卡同時掛同一個 IP」

修好之後，有人提議：先讓有線也掛上 `.98`、WiFi 暫時不關，確認有線通了再關 WiFi。聽起來很穩，但**同網段、同一個 IP、兩張網卡**會出問題：

```
$ sysctl net.ipv4.conf.all.arp_ignore
net.ipv4.conf.all.arp_ignore = 0
```

`arp_ignore=0` 是 Linux 預設：**任何一張網卡都會回應「本機任何一個 IP」的 ARP 詢問**。別台機器問「`.98` 在哪」，兩張網卡都回，誰先到記誰。結果就是 [ADR-003](../決策紀錄/ADR-003-網路介面與IP規劃.md) 開頭講的那種「時好時壞」——比全壞更難查。

改成兩段：

| | 有線 | WiFi | 連進去的路 |
|---|---|---|---|
| 第一段 `network` | 固定 `.98` **＋ 保留 DHCP（`.170`）** | 關 | `.98`；不行的話後門 `.170` |
| 第二段 `finalize` | 只剩固定 `.98` | 關 | `.98` |

第一段的後門是**同一張網卡上的另一個 IP**，不會有 ARP 搶答的問題。兩段各自有 5 分鐘自動還原：第一段失敗回到 WiFi，第二段失敗回到第一段。

---

## 第五部分：Mac 那邊也要清一下

`.98` 從 WiFi 網卡搬到有線網卡，**MAC 位址變了**（兩張網卡各有自己的 MAC）。Mac 的 ARP 快取還記著舊的：

```
192.168.10.98 → 28:cf:e9:01:96:03（WiFi 那張）
```

不清的話要等快取過期（macOS 約 20 分鐘）才會重新詢問。這段時間你會以為切換失敗，然後在 5 分鐘自動還原之前慌張地做錯事。

```bash
sudo arp -d 192.168.10.98
```

最後把「等 30 秒 → 清 ARP → 跑 confirm」寫進 Mac 端的包裝腳本，人只要跑一個指令。

> 💡 伺服器可以主動廣播「我換網卡了」（gratuitous ARP，`arping -U`），這兩台沒裝 `arping`，所以在客戶端清。

---

## 結果

| | 98 | 90 |
|---|---|---|
| 第一次 | 失敗（umask），5 分鐘自動還原 | 等 98 成功後才做 |
| 修好之後 | 兩段都過 | 兩段都過 |

```
$ ip -4 -br addr
enp1s0f0   UP     192.168.10.98/24
$ ip route show default
default via 192.168.10.1 dev enp1s0f0 proto static
```

---

## 指令速查

```bash
# 看 networkd 為什麼沒用你的設定
journalctl -u systemd-networkd --since "10 min ago" | grep -iE "failed|reconfiguring"
networkctl status enp1s0f0            # 現在實際用的是哪一份 .network

# 產出的設定檔權限（正常是 640 root:systemd-network）
ls -l /run/systemd/network/

# 一般帳號拿假設定測 netplan（不碰 /etc）
netplan generate --root-dir /tmp/x
netplan get --root-dir /tmp/x ethernets.enp1s0f0

# 排一個 5 分鐘後的自動還原；確認後取消
systemd-run --unit=rollback --on-active=300 /bin/bash -c '...'
systemctl stop rollback.timer

# Mac 清掉某個 IP 的 ARP 快取
sudo arp -d 192.168.10.98
```

---

## 學到的事

1. **`umask` 會被之後跑的每個程式繼承。** 要保護單一檔案，用 `( umask 077; cat > 檔 )` 或 `install -m 600`，不要整支腳本設。
2. **設定沒被讀到時，系統常常不報錯，而是換成某個預設值。** 驗證要驗「實際生效的設定」（`networkctl status`、用服務帳號讀檔），不是「我寫進去的設定」。
3. **遠端改自己的連線路徑，預設結果要是還原。** 這次救回 98 的不是除錯能力，是事前排好的 timer。
4. **同 IP 兩張網卡不是過渡方案，是另一個問題。** 要留後門，留在同一張網卡的另一個 IP。

---

## 課外讀物與課程對照

> ARP 與區網位址 → [課外讀物 E-3-1：網際網路是怎麼運作的？](../../../課外讀物/E-3-network/E-3-1-how-internet-works.md)

> 當初的網路規劃 → [ADR-003：網路介面與 IP 規劃](../決策紀錄/ADR-003-網路介面與IP規劃.md)

> `wait-online` 與開機等網卡的那次追查 → [實戰筆記 01](01-開機慢兩分鐘的追查.md)

---

## 小練習

1. 用一般帳號跑：`umask 077; touch a; ( umask 022; touch b ); touch c`，再 `ls -l` 看三個檔的權限，理解子 shell 的範圍。
2. 寫一份最小的 netplan 設定，分別在 `umask 022` 與 `077` 下 `netplan generate --root-dir /tmp/x`，比較 `/tmp/x/run/systemd/network/` 底下檔案的權限。
3. 在自己的 Linux 上 `systemd-run --on-active=60 /bin/touch /tmp/rolled-back`，再用 `systemctl list-timers` 看它在倒數，然後在 60 秒內 `systemctl stop` 取消，確認檔案沒出現。
4. **進階**：如果這台機器只有一張網卡（沒有後門可留），兩段切要怎麼改？提示：想想 `netplan try`。
