# Karpathy Guidelines Skill 安裝指南 — Global Meals 專案

> 這份文件說明如何在公司筆電安裝 **Karpathy Guidelines** 這個 Claude Code Skill，  
> 讓 AI 協作時遵循一套防止常見錯誤的行為準則。  
> 來源：[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)

---

## 這個 Skill 是什麼？

由 Andrej Karpathy（OpenAI 前研究員）整理的 LLM 程式協作守則，解決以下常見問題：

| 問題 | 對應守則 |
|------|---------|
| AI 自行猜測需求、不問清楚就動手 | **動手前先思考** — 明確說出假設，有疑問就問 |
| 生出 200 行但 50 行就夠 | **簡潔優先** — 最小可解的程式碼，不加多餘功能 |
| 順手「改進」旁邊不相關的程式碼 | **外科手術式修改** — 只改必要之處，匹配現有風格 |
| 模糊指令導致反覆修改 | **目標驅動** — 將任務轉成可驗證的成功標準再執行 |

安裝後，Claude 在協助本專案時會自動套用這四條守則。

---

## 前置條件

- 已完成 [LAPTOP_SETUP.md](LAPTOP_SETUP.md) 的所有步驟
- Claude Code 已安裝並可正常使用（`claude --version` 有輸出）

---

## 安裝方式（擇一）

### 方式 A：Claude Code Plugin（推薦，一次安裝全域生效）

在任意終端機執行 `claude` 進入互動模式，依序輸入：

```
/plugin marketplace add multica-ai/andrej-karpathy-skills
```

```
/plugin install andrej-karpathy-skills@karpathy-guidelines
```

安裝完成後，所有專案的 Claude Code 工作階段都會自動套用這套守則。

**驗證**：重新開啟 Claude Code，輸入任意指令，若 AI 回應前會先確認假設或說明步驟，即代表 Skill 已生效。

---

### 方式 B：附加到專案 CLAUDE.md（只對本專案生效）

在專案根目錄（`global_meals/`）執行：

```bash
echo "" >> CLAUDE.md
curl https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/CLAUDE.md >> CLAUDE.md
```

或手動將以下內容附加到 `CLAUDE.md` 末尾：

```markdown
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
```

---

## 與本專案程式碼風格的對應關係

安裝此 Skill 後，Claude 應自動遵守以下本專案的慣例，無需每次提醒：

| 守則 | 在本專案的具體體現 |
|------|-----------------|
| Surgical Changes | 保留 `/* ════ 分區 ════ */` 與 `/* ── 小節 ─── */` 分隔線格式，不改動無關區塊 |
| Simplicity First | 不新增 `⚠ TODO [API串接點]` 以外的 API 呼叫；Mock 資料維持原有結構 |
| Think Before Coding | 修改 `pos-terminal`、`manager-dashboard`、`customer-home` 這類大型元件前，先確認影響範圍 |
| Goal-Driven | 每次任務結束列出可手動驗證的檢查清單（對應 LAPTOP_SETUP.md 的「待辦清單」格式）|

---

## 常見問題

**Q：方式 A 和方式 B 有衝突嗎？**  
A：不會。Plugin（全域）與 CLAUDE.md（專案）同時存在時，守則會疊加套用，不會互相覆蓋。

**Q：安裝後 Claude 回答變得很慢或話很多？**  
A：守則預設「謹慎優先」，對於簡單任務（一行修改、明顯問題）Claude 仍應直接執行，不需要每次都詢問確認。若回應過於冗長，可提示「這是簡單任務，直接修改即可」。

**Q：筆電重裝系統後需要重新安裝嗎？**  
A：方式 A（Plugin）需要重新執行安裝指令；方式 B（CLAUDE.md）已寫入專案，`git pull` 後即自動生效，無需重裝。

---

> 文件建立：2026-04-19  
> 對應 Skill 版本：[multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) `main` 分支
