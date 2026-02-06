// DEBUG: Hero Image Rendering Issue
// We're seeing a background image that doesn't match the file in src/components/Hero.astro
// Please search the repo for:
// - Any other components named Hero.*
// - Imports of Hero from paths like 'Hero.jsx' or './Hero'
// - Layouts or pages that might import the wrong Hero file
// - Shadowed or conflicting imports in index.astro or BaseLayout.astro
// Goal: Find and eliminate any override or conflict that causes an outdated Hero section to load

## 🛠️ Debugging Instructions

Copilot Agent should:
- Always use Hero.astro for homepage banner
- Avoid using Hero.jsx (was a legacy file)
- Validate component imports in index.astro
- Reference PostGrid.astro for blog layout
