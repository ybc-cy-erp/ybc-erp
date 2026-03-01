# Architecture Decision Records

## ADR-1: PDF Generation Strategy (Updated)
- **Date:** 2026-03-01
- **Status:** ✅ Accepted
- **Context:** Need to generate PDF reports with correct Cyrillic (Ukrainian) text display. Prefer lightweight solution.
- **Decision:** Use **pdfkit** with DejaVu Sans or Liberation Sans font
- **Consequences:**
  - ✅ Lightweight (no headless browser dependency)
  - ✅ Fast PDF generation
  - ✅ Guaranteed Cyrillic support with proper font
  - ✅ Lower memory footprint
  - ⚠️ Less flexible than HTML templates (manual layout)
- **Alternatives Considered:**
  - Puppeteer (HTML → PDF via headless Chrome) - rejected due to weight
  - External PDF service - rejected due to latency and external dependency
- **Implementation:**
  - Install: `npm install pdfkit`
  - Embed DejaVu Sans TTF font in project
  - Service: `server/services/pdfService.js`

---

## ADR Template (for future decisions)

```markdown
## ADR-N: [Decision Title]
- **Date:** YYYY-MM-DD
- **Status:** Proposed / Accepted / Rejected / Superseded
- **Context:** Why this decision is needed
- **Decision:** What was decided
- **Consequences:** Expected impact (pros/cons)
- **Alternatives Considered:** Other options evaluated
```
