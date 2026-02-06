# Rocky Mountain Smoking — Content Pipeline

A repeatable, altitude-first workflow for BBQ recipes and techniques. This keeps posts consistent, measurable, and easy to reproduce.

## Phase 0 — Topic intake
**Owner:** Human

**Inputs**
- Cook logs and pit notes
- Competitions or local pitmasters
- Common failure modes (dry flat, bitter bark, rubber skin)

**Output**
- Topic packet (what, why it matters at altitude, expected outcome)

## Phase 1 — Test cook + instrumentation
**Owner:** Human

**Inputs**
- Recipe or technique hypothesis
- Calibrated thermometer(s)

**Outputs**
- Temp graph (pit + internal)
- Timing log (prep, cook, rest)
- Fuel/wood usage
- Photos (prep, bark, slice, final)

**Rules**
- Record altitude, humidity, and outside temperature
- Note wind and airflow changes

## Phase 2 — Draft recipe or technique
**Owner:** Writer

**Inputs**
- Test cook logs
- Photos + temperature targets

**Outputs**
- Draft Markdown
- Frontmatter fields filled (temps, timings, altitude notes)

## Phase 3 — Editorial pass
**Owner:** Editor

**Focus**
- Verify temps/timings are explicit
- Ensure altitude notes are clear
- Tighten titles and SEO descriptions

## Phase 4 — Publish prep
**Owner:** Codex or Human

**Steps**
- Save final `.md` in `src/content/recipes/` or `src/content/techniques/`
- Add hero image to `public/images/`
- Confirm `canonicalUrl` matches route

## Phase 5 — QA
**Owner:** Human

**Checklist**
- `npm run build` passes
- Links and images resolve
- Recipe temps and timing blocks render
- Altitude notes are present

## Phase 6 — Distribution
**Owner:** Human

**Outputs**
- Email send (newsletter)
- Social post with a single key takeaway
- Update cook log archive
