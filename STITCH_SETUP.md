# Google Stitch MCP 設定指南 — Global Meals 專案

> 這份文件提供給新筆電（或任何新環境）設定 Google Stitch + Claude Code 整合用。  
> 設定完成後 Claude Code 可直接呼叫 Stitch 產生 UI 設計稿並取得 HTML/CSS。  
> 最後更新：2026-04-16

---

## 前置需求

- **Node.js** v18+ 已安裝（`node -v` 確認）
- **Claude Code** CLI 已安裝並登入
- **Google AI Studio API Key**（取得方式見下方）

---

## Step 1：取得 Google AI Studio API Key

1. 前往 [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. 點選「Create API Key」
3. 選擇 Google Cloud 專案（或建立新的）
4. 複製產生的 API Key（格式：`AIzaSy...`）

---

## Step 2：安裝 stitch-mcp

```bash
npm install -g @_davideast/stitch-mcp
```

確認安裝：

```bash
npx @_davideast/stitch-mcp --version
```

---

## Step 3：安裝 stitch-skills（Claude Code 技能）

逐一執行以下指令：

```bash
npx skills add google-labs-code/stitch-skills --skill stitch-design --global --yes
npx skills add google-labs-code/stitch-skills --skill stitch-loop --global --yes
npx skills add google-labs-code/stitch-skills --skill enhance-prompt --global --yes
npx skills add google-labs-code/stitch-skills --skill design-md --global --yes
npx skills add google-labs-code/stitch-skills --skill taste-design --global --yes
```

安裝完成後確認 skills 存在：

```bash
ls ~/.claude/skills/ | grep stitch
```

應看到：`stitch-design@`、`stitch-loop@`、`enhance-prompt@`、`design-md@`、`taste-design@`

---

## Step 4：設定 Claude Code MCP Server

開啟 `~/.claude.json`，在最外層加入（若已有 `mcpServers` 欄位則只加內層）：

```json
"mcpServers": {
  "stitch": {
    "type": "http",
    "url": "https://stitch.googleapis.com/mcp",
    "headers": {
      "Accept": "application/json",
      "X-Goog-Api-Key": "你的_API_KEY"
    }
  }
}
```

將 `你的_API_KEY` 替換成 Step 1 取得的 key。

或者用 Claude Code CLI 執行（但這個指令是 stdio proxy 模式，HTTP 模式需手動編輯）：

```bash
# 手動編輯更直接，照上面 JSON 格式填入即可
```

---

## Step 5：設定專案 .env

在專案根目錄（`global_meals/`）建立或編輯 `.env`：

```
STITCH_API_KEY=你的_API_KEY
```

> `.env` 已列在 `.gitignore`，不會被 commit。

---

## Step 6：重啟 Claude Code

設定完成後**完全關閉並重新啟動** Claude Code。  
MCP server 只在啟動時載入。

---

## Step 7：確認運作

重啟後在 Claude Code 輸入：

```
/stitch-design
```

若 Stitch skill 正常啟動，代表設定成功。

---

## 已安裝的 Stitch Skills 說明

| Skill | 用途 |
|-------|------|
| `/stitch-design` | 主要入口：描述需求 → Stitch 產生 UI |
| `/stitch-loop` | 多頁面批次生成 |
| `/enhance-prompt` | 模糊描述 → 優化成 Stitch 適用的詳細 prompt |
| `/design-md` | 從 Stitch 專案產生 DESIGN.md 設計文件 |
| `/taste-design` | 高品質 UI 審查（避免通用設計） |

---

## 版本紀錄

| 日期 | 說明 |
|------|------|
| 2026-04-16 | 首次建立，stitch-mcp v0.5.3，HTTP 直連模式 |
