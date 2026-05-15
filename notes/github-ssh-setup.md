# 如何在一台電腦上設定多個 GitHub 帳號的 SSH 金鑰

當你在同一台電腦上需要使用多個 GitHub 帳號（例如：公司帳號與個人帳號）時，如果你只使用預設的 SSH 金鑰，Git 推送時會因為身份驗證錯誤而失敗，出現類似 `ERROR: Repository not found` 的錯誤訊息。

這是因為 GitHub 認證身份時是看你的 SSH 金鑰，而不是 `git config` 裡的 `user.name` 和 `user.email`。

為了解決這個問題，我們需要為不同的帳號建立專屬的 SSH 金鑰，並透過 SSH Config 進行分流。

## 步驟一：為你的新帳號產生一組專屬的 SSH 金鑰

打開終端機，執行以下指令（請將 Email 替換為你的新帳號信箱，並給金鑰一個好辨識的名稱，例如 `id_ed25519_personal`）：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_personal
```

遇到提示要求設定密碼（passphrase）時，可以直接按 Enter 跳過。

## 步驟二：將金鑰加入電腦的 SSH Agent

為了讓系統知道這把新金鑰的存在，我們需要將它加入 SSH Agent：

```bash
ssh-add ~/.ssh/id_ed25519_personal
```

## 步驟三：設定 SSH Config 分流

我們要告訴電腦：「當我連線到特定名稱的 GitHub 時，請用這把專屬的金鑰」。

你可以編輯或建立 `~/.ssh/config` 檔案：

```bash
nano ~/.ssh/config
```

並在檔案中加入以下內容：

```text
# 個人帳號 (Personal Account)
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
```

> **提示**：`Host github-personal` 是一個別名，你可以自己取任何名稱（例如：`github-liyibass`）。

## 步驟四：把新金鑰複製到你的 GitHub 帳號

將剛剛產生的公鑰內容複製到剪貼簿：

```bash
pbcopy < ~/.ssh/id_ed25519_personal.pub
```

接著：

1. 登入你要設定的 **GitHub 帳號**。
2. 點擊右上角頭像，選擇 **Settings**。
3. 在左側選單點選 **SSH and GPG keys**。
4. 點擊綠色的 **New SSH key** 按鈕。
5. 給這把金鑰一個名稱（Title），並將剛剛複製的內容貼到 **Key** 欄位中，最後點擊 Add SSH key。

## 步驟五：設定專案的 Remote URL

完成上述設定後，未來如果你要 clone 這個新帳號的專案，或者更改現有專案的遠端網址，只要把原本的 `github.com` 替換成你在 `~/.ssh/config` 裡設定的別名（例如 `github-personal`）即可。

### 更改現有專案的 Remote URL：

```bash
# 原本的寫法：
# git remote set-url origin git@github.com:username/repo.git

# 更改後的寫法：
git remote set-url origin git@github-personal:username/repo.git
```

### Clone 新專案時的寫法：

```bash
# 原本的寫法：
# git clone git@github.com:username/repo.git

# 更改後的寫法：
git clone git@github-personal:username/repo.git
```

## 步驟六：設定專案的 Git User (選擇性)

最後，為了確保你在這個專案的 Commit 紀錄也是對應的帳號，請在專案目錄下設定區域（Local）的 user.name 與 user.email：

```bash
git config user.name "你的名字"
git config user.email "你的信箱"
```

完成以上步驟後，你就可以順利推送到對應的 GitHub 帳號了！
