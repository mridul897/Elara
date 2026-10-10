---
created: 2026-09-22
updated: 2026-09-22
type: reference
status: copy-paste prompt for a Figma AI agent — under 2000 characters
tags: [figma, prompt, style-guide, elara]
---

# Prompt for the Figma agent — create ELARA's colour and text styles

Copy everything in the box below (1,884 characters, fits Figma's 2,000-character prompt limit) and paste it into the Figma agent, in the ELARA file.

---

```
Set up Figma Paint Styles + Text Styles for ELARA (fashion e-commerce, warm cream brand, NOT dark theme). New page "Foundations" with a labelled sample of each.

COLOR STYLES (name=hex):
Color/Background/Primary=#F7F1E8
Color/Background/Secondary=#EFE6DB
Color/Background/Inverse=#1C1B1A (ONE dark section only, never a general bg)
Color/Text/Primary=#4A4741
Color/Text/On-Inverse=#F7F1E8
Color/Text/Muted=#838280
Color/Text/Faint=#A8A5A0
Color/Border/Default=#4A4741 25%
Color/Border/Inverse=#5A5958
Color/Rail=#D3D1CE
Color/Accent/Default=#2A72DE
Color/Accent/Hover=#2056A6
Color/Focus-Ring=#3184FF
Color/Status/Warning-BG=#EEE6DC
Color/Status/Success-BG=#E2EDD5
Color/White=#FFFFFF
No pure black #000000 background.

TEXT STYLES — serif=Fraunces (or Playfair Display), light weight only, never bold; sans=Inter. name — font weight, mobile/desktop size, line-height, letter-spacing:
Text/Display/Hero — Fraunces Light300, 36/104px, lh1.1, ls-5%
Text/Display/H2 — Fraunces Reg400, 24/48px, lh1.1, ls-3%
Text/Display/Pull-Quote — Fraunces ExtralightItalic200, 20/24px, lh1.3
Text/Card-Title — Inter Light300, 16/24px, lh1.3
Text/Inverse-H2 — Inter Reg400, 20/40px, lh1.25, ls-5%
Text/Subhead — Inter Reg400, 16/24px, lh1.4
Text/Body — Inter Reg400, 16px, lh1.5
Text/Body-Small — Inter Reg400, 14px, lh1.5
Text/Eyebrow — Inter Bold700 uppercase, 12px, lh1.5
Text/Caption — Inter Reg400, 12px, lh1.5
Text/Button-Label — Inter Medium500, 15px, lh1
(Use the mobile size as base; note desktop size in the style description.)

Variables (collection "Foundations"): Spacing 4,8,12,16,24,32,40,48,64,80. Radius 999 (pill, all buttons/chips), 8 (small card), 12 (media card).

Shadowless system — depth via imagery/borders/blur, not shadows. One exception, note as text only: modal shadow 0 25px 50px -12px rgba(0,0,0,.25).

Show me the Foundations page when done.
```

---

## If the Figma agent gets stuck

- **"Fraunces isn't installed"** → use Playfair Display, or any light-weight serif with visible thick/thin contrast.
- **"Do you want a dark mode?"** → No. `Color/Background/Inverse` is one deliberate section, not a mode toggle.
- **"Can I round the desktop sizes differently?"** → Keep them close; the ratio between mobile and desktop matters more than the exact number.

## After it runs

Send me a screenshot or the list of style names it created. I'll check it against `style-guide-figma.md` and flag anything that drifted — a wrong hex, a bold weight where it should be light, or a shadow it invented on its own.
