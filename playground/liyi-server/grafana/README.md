# Grafana Dashboard 備份

Dashboard 的定義只存在 98 的 Grafana 資料庫裡（Docker volume）。
**volume 掛了就全沒了**，所以在這裡留一份跟著 git 走的副本。

| 檔案 | 內容 |
|---|---|
| `nodes-overview.json` | 兩台機器總覽：存活狀態、CPU／記憶體／磁碟／網路，以及收在下方的診斷指標 |

檔案是**可攜格式**——datasource 寫成 `${DS_PROMETHEUS}` 而非寫死的 uid，
所以 Grafana 重建、datasource 重新建立之後也還原得回來。

## 還原

Grafana → **Dashboards → New → Import** → 貼上 JSON 或上傳檔案 → 選 Prometheus datasource → Import。

uid 是 `liyi-nodes-overview`，還原後網址仍是
`http://grafana.liyibass.internal/d/liyi-nodes-overview`。

## 重新備份

在 Grafana UI 改過排版或 panel 之後，記得更新這份檔案，否則還原回來的是舊版。

需要一組 Service Account token（Administration → Users and access → Service accounts，
Viewer 權限就夠）：

```bash
TOKEN=glsa_xxxxx
curl -s -H "Authorization: Bearer $TOKEN" \
  http://grafana.liyibass.internal/api/dashboards/uid/liyi-nodes-overview \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)['dashboard']
d.pop('id',None); d.pop('version',None)
d['__inputs']=[{'name':'DS_PROMETHEUS','label':'Prometheus','description':'','type':'datasource','pluginId':'prometheus','pluginName':'Prometheus'}]
def swap(o):
    if isinstance(o,dict):
        if o.get('type')=='prometheus' and 'uid' in o: o['uid']='\${DS_PROMETHEUS}'
        [swap(v) for v in o.values()]
    elif isinstance(o,list): [swap(v) for v in o]
swap(d)
json.dump(d,open('nodes-overview.json','w'),ensure_ascii=False,indent=2)
print('done')
"
```

## 設計取捨

寫查詢時決定的幾件事，改動前值得先知道：

- **記憶體用 `MemAvailable` 不用 `MemFree`** — 後者不含可回收的 cache／buffer，會嚴重高估用量
- **網路只取 `en*`／`wl*`** — 98 上有 `docker0`、`br-*`、`veth*` 等虛擬介面，不濾掉圖上會多出 6 條雜訊
- **溫度只取 `coretemp` 不用 `applesmc`** — applesmc 有 59 個 sensor、命名只有 `temp1`~`temp59` 看不出位置，
  且會回報 103°C 這種無效值（Mac mini 2012 的非官方支援機型常見）。coretemp 只有 3 個，全是 CPU 核心
- **磁碟只看 `mountpoint="/"`** — `/boot/efi` 太小沒有觀察價值
- **有線介面 `enp1s0f0` 的零線刻意保留** — 待辦裡有「90 改走有線」，改完不必動 dashboard 就會出現

> 排查過程與 PromQL 的完整說明 → [實戰筆記](../實戰筆記/)
