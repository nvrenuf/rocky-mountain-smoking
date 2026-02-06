# /public
Static assets (images, fonts, icons) live here.

## Images
1. Add images to `public/images/`.
2. Reference them in frontmatter with `/images/filename.ext`.

## Recipes
Create new recipe Markdown files in `src/content/recipes/` with this frontmatter:

```yaml
---
title: "High-Altitude Brisket with Deep Bark"
description: "A Rocky Mountain brisket workflow tuned for dry air, steady bark, and an even flat-to-point finish."
date: 2026-02-01
author: "RMS Test Kitchen"
category: beef
cut: "Whole packer brisket"
method: smoke
pitTempF: 250
targetTempF: 203
finishTempF: 206
prepMinutes: 30
cookMinutes: 600
restMinutes: 180
servings: "12-14"
difficulty: advanced
equipment:
  - "Offset smoker"
  - "Probe thermometer"
fuel:
  - "Oak splits"
wood:
  - "Post oak"
altitudeNotes: "At 5,000+ feet, bark sets faster. Keep humidity higher with a water pan."
timingNotes: "Start probing for tenderness around the 7-hour mark."
tags:
  - "brisket"
  - "bark"
heroImage: "/images/placeholder-hero.svg"
heroImageAlt: "Smoked brisket sliced with deep bark"
canonicalUrl: "https://rockymountainsmoking.com/recipes/high-altitude-brisket/"
---
```

## Techniques
Create technique Markdown files in `src/content/techniques/` with this frontmatter:

```yaml
---
title: "Clean Smoke Fire Management at 5,000 Feet"
description: "How to hold a steady, clean burn in thin air without running the pit too hot."
date: 2026-01-20
author: "RMS Test Kitchen"
skillLevel: intermediate
durationMinutes: 45
keyTempsF:
  - 225
  - 250
altitudeNotes: "Thin air accelerates combustion; use smaller splits and tighter damper settings."
tags:
  - "fire management"
  - "smoke quality"
heroImage: "/images/placeholder-hero.svg"
heroImageAlt: "Clean blue smoke rolling from a smoker"
canonicalUrl: "https://rockymountainsmoking.com/techniques/clean-smoke-fire-management/"
---
```
