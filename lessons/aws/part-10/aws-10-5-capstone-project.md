# [aws-10-5] 🏆 總整理專案：完整部署一個 app 上 AWS

> **本章目標**：把整門 AWS 課學的全部整合——把一個真實 app 完整部署上 AWS（VPC + ECS + RDS + ALB + CloudFront + 自訂網域 + 監控 + 預算），這是你的 AWS 畢業專案。

## 你會學到

- 把 Part 1~10 的能力整合成一個完整的雲端部署
- 一個正式級 AWS 架構該有的所有要素
- 怎麼驗收「我具備 AWS 實戰能力了」
- 你的下一步

## 概念說明

### 你的 AWS 畢業專案

恭喜你走到 AWS 課的最後。回顧這趟旅程：從「雲端是什麼」開始，學了帳號安全、IAM、EC2、VPC、儲存、受管服務、容器、Serverless、CI/CD、IaC、觀測與成本。

這一章，把所有東西**組裝成一個完整的、正式級的雲端服務**。目標是部署一個真實 app，配齊一個專業 AWS 架構該有的一切：

```mermaid
graph TB
    CAP["完整的 AWS 部署"]
    CAP --> NET["① 網路：VPC + 子網路 + Multi-AZ（Part 4）"]
    CAP --> SEC["② 安全：IAM 最小權限（Part 2）"]
    CAP --> COMPUTE["③ 運算：ECS Fargate（Part 7）"]
    CAP --> DATA["④ 資料：RDS + ElastiCache（Part 6）"]
    CAP --> ENTRY["⑤ 入口：ALB + CloudFront + Route53 + ACM（Part 6）"]
    CAP --> CICD["⑥ 部署：CI/CD + IaC（Part 9）"]
    CAP --> OBS["⑦ 觀測 + 成本：CloudWatch + Budgets（Part 10）"]
```

每一塊你都學過、都動手做過——這章是總整合。

---

### 完整架構藍圖

把你 aws-7-9 看懂的那種架構，自己親手蓋出來：

```
                使用者
                  ↓
         Route 53（DNS, 6-6）
                  ↓
       CloudFront（CDN + HTTPS, 6-5）
                  ↓
  ╔══════════════════════════════════════╗ VPC（Part 4）
  ║  公開子網路（跨 AZ-a/b）               ║
  ║    ALB（6-4, 用 ACM 憑證 6-6）         ║
  ║         ↓                             ║
  ║  私有子網路（跨 AZ-a/b）               ║
  ║    ECS Fargate 服務（7-4）            ║ ← 你的 app（跨 AZ、自動擴縮）
  ║    （image 來自 ECR 7-2）             ║
  ║         ↓                             ║
  ║  私有子網路（跨 AZ-a/b）               ║
  ║    RDS Multi-AZ（6-2）                ║ ← 資料庫（高可用）
  ║    ElastiCache（6-3）                 ║ ← 快取
  ╚══════════════════════════════════════╝
   全程：IAM 最小權限（Part 2）
        CloudWatch 監控 + 告警（10-1）
        Budgets 預算控管（10-3）
        整個架構用 Terraform 寫成 IaC（9-3）
        GitHub Actions 自動部署（9-1）
```

---

### 部署流程（整合所有 Part）

```
① 用 IaC（Terraform, 9-3）建好基礎設施：
   VPC + 子網路 + IGW/NAT（Part 4）
   RDS Multi-AZ（6-2）+ ElastiCache（6-3）
   ECS cluster、ALB（6-4, 7-4）
   IAM Role 最小權限（Part 2）
   → 一份程式碼建出整個架構

② 把 app 容器化、推上 ECR：
   Dockerfile（infra Part 5）→ build → push 到 ECR（7-2）

③ 部署到 ECS Fargate（7-4）：
   ECS service 跨 AZ 跑容器、接 ALB、設自動擴縮

④ 設定入口與網域：
   ACM 憑證（6-6）→ CloudFront（6-5）→ Route 53 指向（6-6）
   → https://myapp.com 上線

⑤ 設定 CI/CD（9-1）：
   GitHub Actions：push → 測試 → build → 推 ECR → 部署 ECS
   → 之後改程式碼，push 就自動上線

⑥ 設定觀測與成本（Part 10）：
   CloudWatch 儀表板（黃金訊號）+ 告警
   Budgets 預算警示

完成！一個正式級的雲端服務上線了。
```

---

### 驗收清單：你具備 AWS 實戰能力了嗎？

對照這份清單，每項都能做到，你就具備了 AWS 的核心實戰能力：

- [ ] 能安全地管理帳號（root 保護、IAM、MFA、預算警示）（Part 1-2）
- [ ] 懂 IAM，能設計最小權限的 Role/Policy（Part 2）
- [ ] 能開 EC2、選對規格、理解計費（Part 3）
- [ ] **能設計並讀懂 VPC 架構**（公開/私有、IGW/NAT、SG、路由、Multi-AZ）（Part 4）
- [ ] 懂 S3 與儲存選型（EBS/EFS/S3）（Part 5）
- [ ] 能用受管服務（RDS/ElastiCache/ALB/CloudFront/Route53）（Part 6）
- [ ] 能把 app 部署到容器平台（ECS Fargate），讀懂 EKS 架構（Part 7）
- [ ] 懂 Serverless（Lambda），能做運算選型（Part 8）
- [ ] 能用 CI/CD 自動部署、用 IaC（Terraform）管理基礎設施（Part 9）
- [ ] 能監控（CloudWatch/X-Ray）、控管成本（Part 10）
- [ ] 能在各種選擇間做出合理的「取捨」

---

### 三本書 + 課外讀物：你的完整能力地圖

走到這裡，你完成了整個學習旅程的最後一塊。把全貌串起來：

```mermaid
graph LR
    BASIC["basic<br/>程式 + 全端基礎"] --> INFRA["infra<br/>系統怎麼跑起來、自架維護"]
    INFRA --> AWS["aws（這本）<br/>雲端怎麼實現這一切"]
    INFRA --> SRE["sre<br/>怎麼讓系統跑得可靠"]
    AWS --> SRE
    EXTRA["課外讀物 E-1~E-13<br/>通用知識庫"] -.-> BASIC
    EXTRA -.-> INFRA
    EXTRA -.-> AWS
    EXTRA -.-> SRE
```

- **basic** 給你寫程式、做全端的能力。
- **infra** 讓你懂「系統怎麼跑起來、怎麼自架維護」——AWS 的底層原理。
- **aws**（這本）讓你懂「雲端怎麼實現這一切，並提供託管、擴展、高可用」。
- **sre** 讓你懂「怎麼用數據和工程，讓這一切跑得可靠」。

四本書 + 共用的課外讀物，組成了「**從寫第一行程式，到設計、部署、運維一個可靠的雲端系統**」的完整能力。而你在 infra 打的底，讓你學 AWS 特別快、特別深——因為你不只會點按鈕，你**真懂底層在做什麼**。

---

### 你的下一步

| 方向 | 怎麼做 |
|------|--------|
| **考證照** | AWS 的 Solutions Architect 等證照，能系統驗證你的能力 |
| **深化 K8s** | EKS / Kubernetes 是大型系統的核心（課外讀物 E-13-3）|
| **深化 SRE** | 把可靠性做到更深（SRE 課 + 經典書）|
| **實戰** | 把你的真實專案部署上 AWS，用這套架構 |

最重要的是——**去實踐**。你現在有完整的地圖和工具，剩下的是在真實專案中累積。每部署一個服務、每解決一個問題，你的功力就深一層。

## 小練習

### 練習 1：完整部署

把一個 app（你的專案或範例）完整部署上 AWS，盡量配齊：VPC、ECS、RDS、ALB、CloudFront、網域、監控、預算。用 IaC（Terraform）管理。

<details>
<summary>參考解答</summary>

這是動手題，沒有標準答案，這裡給你**做法（解題大綱）+ 驗收點**。實際要**自行在 AWS 實機部署驗證**——但請隨時留意成本、用完立刻 `terraform destroy`，別讓資源忘了關而爆帳（aws-10-3）。

**建議步驟（照這章「部署流程」走）**：
1. **用 Terraform 建基礎設施（9-3）**：VPC + 公開/私有子網路（跨 AZ）+ IGW/NAT（Part 4）、RDS Multi-AZ（6-2）、ElastiCache（6-3）、ECS cluster + ALB（6-4/7-4）、IAM Role 最小權限（Part 2）。`terraform plan` 先預覽再 apply。
2. **容器化並推上 ECR（7-2）**：寫 Dockerfile（infra Part 5）→ build → push。
3. **部署到 ECS Fargate（7-4）**：ECS service 跨 AZ 跑容器、掛到 ALB、設自動擴縮（3-4）。
4. **入口與網域**：ACM 憑證（6-6）→ CloudFront（6-5）→ Route 53 指向（6-6），讓 `https://你的網域` 上線。
5. **CI/CD（9-1）**：GitHub Actions：push → 測試 → build → 推 ECR → 部署 ECS。
6. **觀測與成本（Part 10）**：CloudWatch 儀表板（依黃金訊號）+ 告警、Budgets 預算警示。

**驗收點（怎麼算做到）**：
- [ ] `https://你的網域` 能開，且是有效 HTTPS 憑證（不是自簽警告）。
- [ ] app 能正常讀寫 RDS、命中 ElastiCache 快取。
- [ ] ECS 服務跨兩個 AZ、關掉一個 task 仍能服務（高可用）。
- [ ] `git push` 後 CI/CD 自動把新版本部署上線。
- [ ] CloudWatch 看得到 ALB/ECS/RDS 的指標，告警設定生效。
- [ ] Budgets 已設好預算與警示。
- [ ] 整套用 `terraform apply` 能重建、`terraform destroy` 能清乾淨。

> ⚠️ 這些資源（NAT、ALB、RDS Multi-AZ、CloudFront…）都會計費，**練習完務必 destroy**。畫面/實際上線效果只有你自己能驗證，別只看設定就宣稱完成。

</details>

---

### 練習 2：對照驗收清單

誠實對照上面的驗收清單，哪幾項還不夠熟？回去重看對應的 Part，補強它。

<details>
<summary>參考解答</summary>

這題是自我盤點，沒有標準答案——重點是**誠實**。給你一個檢查方法：

對驗收清單每一項，問自己「**我能不看教材、從頭做出來/講清楚嗎？**」，分成三級標記：
- ✅ **能獨立做/講** → 過關。
- 🟡 **看提示能做** → 半熟，找機會多練一次。
- ❌ **完全卡住** → 回去重看對應 Part，並動手做一遍。

**對照表（哪項不熟看哪裡）**：

| 清單項目 | 回去補強 |
|---|---|
| 帳號安全（root/IAM/MFA/預算） | Part 1-2 |
| IAM 最小權限 Role/Policy | Part 2 |
| EC2 開機、選規格、計費 | Part 3 |
| VPC 架構（子網路/IGW/NAT/SG/路由/Multi-AZ）| Part 4 |
| S3 與儲存選型（EBS/EFS/S3）| Part 5 |
| 受管服務（RDS/ElastiCache/ALB/CloudFront/Route53）| Part 6 |
| 容器（ECS Fargate / EKS）| Part 7 |
| Serverless（Lambda）與運算選型 | Part 8 |
| CI/CD 與 IaC（Terraform）| Part 9 |
| 監控（CloudWatch/X-Ray）與成本 | Part 10 |
| 在各選擇間做合理取捨 | 貫穿全課 |

**最重要的心法**：不熟不丟臉，**發現不熟卻不補才可惜**。針對 🟡/❌ 的項目，最好的補強是「動手再做一次」，而不是只重讀。

</details>

---

### 練習 3：（終極挑戰）整合三本書

做一個真正完整的專案：
- 用 **basic** 的能力寫出 app
- 用 **infra** 的能力容器化、理解底層
- 用 **aws** 的能力部署上雲（這章的架構）
- 用 **sre** 的能力定 SLO、設監控告警、做可靠性設計

能做到這個，你就完成了從「初學程式」到「能獨立設計、部署、運維可靠雲端系統」的完整蛻變。🎓

<details>
<summary>參考解答</summary>

這是終極整合專案，沒有標準答案，這裡給你**解題大綱 + 各書該產出什麼 + 驗收清單**。實際要**自行動手做並在 AWS 實機驗證**（記得控管成本、用完 destroy）。

**四本書怎麼各司其職**：

| 書 | 你要產出的東西 | 驗收點 |
|---|---|---|
| **basic** | 一個真的能用的 app（前端 + 後端 + 資料庫互動）| 功能跑得起來、程式碼遵守命名/函式/型別規範（見 CLAUDE.md 程式碼標準）|
| **infra** | 把 app 容器化（Dockerfile），並能講清楚底層怎麼跑 | 本機 `docker run` 能起、你能解釋映像/網路/儲存在做什麼 |
| **aws** | 用這章的架構部署上雲（VPC+ECS+RDS+ALB+CloudFront+網域+IaC+CI/CD）| `https://網域` 上線、push 自動部署、Terraform 可重建可銷毀 |
| **sre** | 定 SLO/SLI、設監控與告警、做可靠性設計（降級/斷路器/Multi-AZ）| 有可量測的 SLO、告警對症狀、關掉一個 AZ 仍能服務 |

**整合順序建議**：先 basic 把 app 做出來 → infra 容器化 → aws 部署上雲 → sre 補上可靠性與觀測。每一層都建立在前一層之上。

**最終驗收（做到就畢業）**：
- [ ] app 有真實功能，不是 hello world。
- [ ] 全部基礎設施用 Terraform 管理，能一鍵重建/銷毀。
- [ ] CI/CD 讓 `git push` 自動測試 + 部署。
- [ ] 定義了至少一個 SLO，並有對應的 CloudWatch 告警（對症狀、不擾民）。
- [ ] 做過至少一個可靠性設計（如：依賴服務逾時/降級、Multi-AZ、快取）。
- [ ] 能對外人講清楚「從程式碼到上線、到可靠運維」整條鏈路。

> ⚠️ 這是最大型的動手題，實際成果（上線畫面、故障演練效果）只有你自己能驗證。別只做設定就宣稱完成——真的部署、真的觀察、真的演練一次，能力才是你的。做完記得 `terraform destroy` 收乾淨。

</details>

> 恭喜你完成整門 AWS 課程，也完成了 basic → infra → aws → sre 的完整學習旅程！你現在具備的，是現代軟體工程最核心、最搶手的綜合能力——能寫程式、懂系統、會上雲、能把系統做得可靠。去把它用在你的專案、你的職涯上吧。這趟旅程辛苦了，也恭喜你！

## 課外讀物

> 想把可靠性做到更深 → 參見 **SRE 課程**（`lessons/sre/課程大綱.md`）；想看更大規模的架構演進 → [課外讀物 E-13-4：Monolith vs Microservices](../../../課外讀物/E-13-scaling/E-13-4-monolith-vs-microservices.md)
