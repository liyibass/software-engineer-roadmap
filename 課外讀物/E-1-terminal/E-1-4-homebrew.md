# [E-1-4] Homebrew：Mac 的套件管理員

> **目標**：理解 Homebrew 是什麼——Mac 上「用一行指令安裝軟體」的套件管理員，以及它為什麼好用。

## 在 Mac 上裝軟體的好方法

在 Mac 裝開發工具（git、node、各種指令），你可以「上網找、下載、拖進應用程式」——但更好的方式是用 **Homebrew**。

> **Homebrew 是 Mac 的「套件管理員」——打一行指令，它幫你下載、安裝、設定好軟體。**

這跟你在 infra Part 2-5 學的 `apt`（Linux）、課外讀物 E-2 的 `npm`（Node）是同一種東西——**套件管理員**，只是 Homebrew 是給 Mac 用的。

## 為什麼用 Homebrew

對比「手動下載安裝」：

- **一行搞定**：`brew install git` 就裝好 git，不用上網找、不用拖拉。
- **自動處理依賴**：要裝的東西需要別的東西，brew 自動一起裝。
- **好更新、好移除**：`brew upgrade`、`brew uninstall` 統一管理。
- **安全**：從官方來源裝，不會裝到來路不明的東西。

## 基本指令

```bash
# 安裝 Homebrew 本身（第一次，從官網複製安裝指令）
# /bin/bash -c "$(curl -fsSL https://...）"

# 安裝軟體
brew install git
brew install node

# 更新
brew update            # 更新 brew 的軟體清單
brew upgrade           # 升級已裝的軟體

# 移除
brew uninstall git

# 查看裝了什麼
brew list
```

邏輯和 `apt`（infra Part 2-5）幾乎一樣——`update`（更新清單）、`upgrade`（升級軟體）、`install`/`uninstall`。學會一個，其他套件管理員都好上手。

## Formula 與 Cask

Homebrew 裝兩種東西：

- **Formula**：命令列工具（git、node、wget…）——`brew install`。
- **Cask**：圖形介面 App（Chrome、VS Code…）——`brew install --cask google-chrome`。

所以連桌面應用程式都能用 brew 裝、統一管理，很方便。

## 一個趣味：為什麼叫「Homebrew」

Homebrew 的命名很有玩心——「Homebrew」是「**自釀（啤酒）**」的意思。所以它的術語都跟釀酒有關：軟體配方叫 **Formula（配方）**、軟體倉庫叫 **Tap（水龍頭/酒桶開關）**、`brew`（釀）就是它的指令。這種「主題式命名」是工程界的趣味傳統（像 Docker 用鯨魚馱貨櫃、Git 的各種典故）。

## 小結

- Homebrew = Mac 的套件管理員，一行指令裝軟體（類比 Linux 的 apt、Node 的 npm）。
- 好處：一行搞定、自動處理依賴、好更新移除、安全。
- 指令邏輯類似 apt：install / update / upgrade / uninstall。
- Formula（命令列工具）vs Cask（圖形 App）。

> Linux 的套件管理員 → 參見 **infra 課程** Part 2-5（apt）；Node 的套件管理 → [課外讀物 E-2-1：npm 是什麼](../E-2-npm/E-2-1-npm-intro.md)
