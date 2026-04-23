
## 專案啟動設定（Demo / 開發環境）

### 必要工具
- **Node.js** + **Angular CLI**：`npm install -g @angular/cli`
- **ngrok**：到 https://ngrok.com/download 下載，或 `winget install ngrok.ngrok`
  - 安裝後執行：`ngrok config add-authtoken <TOKEN>`（Token 向專案負責人索取）

### 每次啟動步驟

**第一步：安裝相依套件（第一次或 pull 後）**
```bash
npm install
```

**第二步：開兩個終端機**

終端機 1 — 啟動前端：
```bash
ng serve
```

終端機 2 — 建立公開通道（讓手機可掃 QR Code）：
```bash
ngrok http 4200
```

> QR Code 網址會**自動抓當前網址**，不需要修改任何設定檔。

### 注意事項
- 手機掃 QR Code 時，電腦的 `ng serve` 與 `ngrok` 都必須保持執行中
- ngrok 免費版每次重啟網址會更換，重新執行 `ngrok http 4200` 即可，**不需改程式碼**
- `angular.json` 已設定允許所有 ngrok 網域，ngrok 網址更換後**不需修改任何設定**

### 分支說明
- 主要開發分支：`dev-Ataya`
- 每次開始工作前先 pull 最新版本：
```bash
git pull origin dev-Ataya
```

---

## gstack

- Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.
- Available gstack skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

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

---

## Karpathy Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

### 4. Goal-Driven Execution

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"
