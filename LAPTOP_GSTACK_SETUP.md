# 公司端筆電 gstack + Claude Code 完整設定指南

> 適用：全新 Windows 筆電，從零開始設定 Claude Code 開發環境與 gstack 助手

---

## 前置需求

以下工具必須先安裝完成，才能繼續後面的步驟。

| 工具 | 用途 | 安裝說明 |
|------|------|----------|
| **Node.js** (v22 LTS) | JavaScript 執行環境 | https://nodejs.org/ → 選 LTS 版本 |
| **Git** | 版本控制 | https://git-scm.com/download/win |
| **Bun** (v1.0+) | gstack 執行環境（必須） | 見下方安裝步驟 |
| **Claude Code** | AI 助手 CLI | 見下方安裝步驟 |

---

## 步驟一：安裝 Node.js

1. 前往 https://nodejs.org/
2. 下載「LTS」版本（建議 v22）
3. 執行安裝程式，全部選預設即可
4. 開啟終端機（PowerShell 或 Git Bash）驗證：

```bash
node --version   # 應顯示 v22.x.x
npm --version    # 應顯示 10.x.x
```

---

## 步驟二：安裝 Git

1. 前往 https://git-scm.com/download/win
2. 下載並安裝，建議選 **Git Bash** 作為預設終端機
3. 驗證：

```bash
git --version   # 應顯示 git version 2.x.x
```

---

## 步驟三：安裝 Bun

> Bun 是 gstack 的必要執行環境，缺少此步驟 gstack 的 `/browse`、`/qa` 等功能無法運作。

在 **PowerShell（以系統管理員身份執行）** 中輸入：

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

安裝完成後，**重新開啟終端機**，驗證：

```bash
bun --version   # 應顯示 1.x.x
```

> 若仍找不到 `bun` 指令，請確認 `C:\Users\你的使用者名稱\.bun\bin` 是否已加入 PATH 環境變數。

---

## 步驟四：安裝 Claude Code

Claude Code 是透過 npm 安裝的 CLI 工具。

```bash
npm install -g @anthropic-ai/claude-code
```

驗證：

```bash
claude --version
```

> 首次啟動時需要登入 Anthropic 帳號：直接執行 `claude` 並依照畫面指示授權。

---

## 步驟五：安裝 GitHub CLI（建議）

`gh` CLI 讓 Claude Code 的 `/ship`（發 PR）等功能正常運作。

```bash
winget install --id GitHub.cli
```

驗證並登入：

```bash
gh --version
gh auth login   # 依照提示選 GitHub.com → HTTPS → 瀏覽器授權
```

---

## 步驟六：安裝 gstack

開啟 **Git Bash** 或 **PowerShell**，執行：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

> - 這個指令會把 gstack 下載到 `~/.claude/skills/gstack/`（即 `C:\Users\你的使用者名稱\.claude\skills\gstack\`）
> - `./setup` 會自動編譯 `/browse` 瀏覽器工具，並向 Claude Code 註冊所有 skills

安裝過程中會詢問 Skill 命名方式：
- 選 `1`（Short names）→ 指令為 `/qa`、`/ship`、`/review`（建議）
- 選 `2`（Namespaced）→ 指令為 `/gstack-qa`、`/gstack-ship`（若與其他 skill pack 衝突時使用）

---

## 步驟七：設定 `~/.claude/CLAUDE.md`

此檔案是 Claude Code 的全域指令，所有專案都會套用。

### 建立或編輯檔案

路徑：`C:\Users\你的使用者名稱\.claude\CLAUDE.md`

在終端機中執行（Git Bash）：

```bash
mkdir -p ~/.claude
nano ~/.claude/CLAUDE.md
```

或直接用 VS Code 開啟：

```bash
code ~/.claude/CLAUDE.md
```

### 貼入以下內容

```markdown
## gstack
Use /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /retro, /investigate, /document-release, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade
Skills location: ~/.claude/skills/gstack
Please always respond in Traditional Chinese (繁體中文).
```

儲存後，重新開啟 Claude Code 即生效。

---

## 步驟八：複製專案的 CLAUDE.md（Skill Routing）

把專案的 `CLAUDE.md` 設定好，這樣 Claude Code 在這個專案裡會自動選擇正確的 skill。

`global_meals` 專案根目錄已有 `CLAUDE.md`，內容如下（已存在，不需要再建立）：

```markdown
## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
```

---

## 步驟九：驗證安裝結果

開啟終端機，進入專案目錄：

```bash
cd ~/Desktop/global_meals   # 或你的實際路徑
claude
```

Claude Code 啟動後，輸入以下指令測試：

```
/qa
```

若畫面出現 QA 流程提示，代表 gstack 安裝成功。

也可以測試：

```
/office-hours
/review
/ship
```

---

## 常見問題

### `./setup` 報錯：`bun: command not found`
→ Bun 未安裝或 PATH 未設定。請重新執行步驟三，並確認重新開啟終端機。

### gstack skill 無法使用（`Unknown skill`）
→ 重新執行 setup：
```bash
cd ~/.claude/skills/gstack && ./setup
```

### `/browse` 無法開啟瀏覽器
→ gstack 使用 Playwright 無頭瀏覽器，首次使用需下載瀏覽器：
```bash
cd ~/.claude/skills/gstack && bun run browse/install-browser.ts
```

### Claude Code 找不到 CLAUDE.md 的設定
→ 確認 `~/.claude/CLAUDE.md` 存在，且路徑無誤。重新啟動 Claude Code。

### `gh auth login` 失敗
→ 確認已安裝 GitHub CLI，並選擇「GitHub.com → HTTPS → Login with a web browser」。

---

## 安裝完成後的目錄結構

```
~/.claude/
├── CLAUDE.md               ← 全域 gstack 設定
├── settings.json           ← Claude Code 全域設定
├── settings.local.json     ← 本機設定（不要 commit）
└── skills/
    └── gstack/             ← gstack 主體（由 git clone 安裝）
        ├── setup           ← 安裝腳本
        ├── browse/         ← 無頭瀏覽器工具
        ├── qa/             ← /qa skill
        ├── ship/           ← /ship skill
        ├── review/         ← /review skill
        └── ... 共 23+ skills
```

---

## 可用 Skills 一覽

| Skill | 用途 |
|-------|------|
| `/office-hours` | 產品想法討論、值不值得做 |
| `/plan-ceo-review` | CEO 視角審視計畫 |
| `/plan-eng-review` | 架構設計審查 |
| `/review` | PR 合入前程式碼審查 |
| `/qa` | QA 測試網站並修復 bug |
| `/qa-only` | QA 測試（不自動修復） |
| `/ship` | 完整發版流程（PR + 推送）|
| `/investigate` | 偵錯、追查錯誤原因 |
| `/design-consultation` | 設計系統、品牌顧問 |
| `/design-review` | 視覺設計品質審查 |
| `/retro` | 週回顧總結 |
| `/document-release` | 發版後更新文件 |
| `/browse` | 無頭瀏覽器（所有網頁操作） |
| `/benchmark` | 效能基準測試 |
| `/autoplan` | 自動生成實作計畫 |
| `/careful` | 高風險操作前安全確認 |
| `/freeze` | 凍結目前狀態 |
| `/guard` | 守衛關鍵檔案 |
| `/gstack-upgrade` | 升級 gstack 至最新版本 |

---

## 升級 gstack

日後需要升級 gstack 時，直接執行：

```
/gstack-upgrade
```

或手動：

```bash
cd ~/.claude/skills/gstack && git pull && ./setup
```

---

> 文件建立時間：2026-04-05
> 目前使用版本：gstack v0.15.2.1
