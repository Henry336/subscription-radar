---
name: "Subscription Radar"
description: "A dark local detector paired with a warm, evidence-first ledger."
colors:
  void: "#091016"
  void-raised: "#101a23"
  steel: "#6f8495"
  steel-light: "#9eb0be"
  dark-line: "#2b3a46"
  paper: "#f2eee5"
  paper-bright: "#fbf8f1"
  paper-deep: "#e6dfd0"
  paper-line: "#c9c1b3"
  ink: "#161b1f"
  ink-soft: "#566068"
  signal: "#d7ff43"
  signal-dark: "#263607"
  alert: "#ff694a"
  focus: "#62c9ff"
typography:
  display:
    fontFamily: "\"Arial Narrow\", \"Aptos Display\", \"Roboto Condensed\", \"Helvetica Neue\", sans-serif"
    fontSize: "clamp(3.4rem, 6.2vw, 5.9rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "\"Arial Narrow\", \"Aptos Display\", \"Roboto Condensed\", \"Helvetica Neue\", sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 4rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  title:
    fontFamily: "\"Arial Narrow\", \"Aptos Display\", \"Roboto Condensed\", \"Helvetica Neue\", sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "\"Aptos\", \"Segoe UI\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  control:
    fontFamily: "\"Aptos\", \"Segoe UI\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 750
    lineHeight: 1
    letterSpacing: "normal"
  data:
    fontFamily: "\"Cascadia Mono\", \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  receipt: "4px"
  field: "7px"
  control: "8px"
  panel: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  compact: "0.75rem"
  control: "1rem"
  panel: "1.25rem"
  section: "2rem"
components:
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "{spacing.compact} {spacing.control}"
    height: "46px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper-bright}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "{spacing.compact} {spacing.control}"
    height: "46px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "{spacing.compact} {spacing.control}"
    height: "46px"
  field-ledger:
    backgroundColor: "{colors.paper-bright}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0.55rem 0.65rem"
    height: "42px"
  source-badge:
    backgroundColor: "transparent"
    textColor: "{colors.signal}"
    typography: "{typography.data}"
    rounded: "{rounded.pill}"
    padding: "0.45rem 0.6rem"
  drop-zone:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
    height: "112px"
  privacy-receipt:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.receipt}"
    padding: "{spacing.section}"
  finding-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "{spacing.control} 0"
    height: "86px"
  renewal-row:
    backgroundColor: "{colors.void-raised}"
    textColor: "{colors.paper}"
    padding: "0.9rem 0"
---

# Design System: Subscription Radar

## Overview

**Creative North Star: "The Signal Desk"**

The Signal Desk treats a bank statement as an instrument reading before it becomes a plan. Discovery happens in a near-black detector room of steel rules, sparse luminous signals, and precise readouts; review happens on warm paper where every estimate is attached to evidence and a human decision.

The system is serious without becoming sterile. Condensed headlines provide editorial urgency, monospace labels make evidence feel measured, and native controls keep the workflow trustworthy. Expression comes from the transition between detector and ledger, not from decoration or a generic finance-dashboard grid.

**Key Characteristics:**

- Dark detector field paired with warm paper work surfaces
- Sharp instrument geometry with selective soft control corners
- Sparse acid-lime signals and coral urgency marks
- Condensed display type, system body text, and monospace evidence
- Dense operational information with progressive disclosure
- Native, accessible controls with explicit focus and reduced-motion behavior

## Colors

The palette separates machine observation from human review: cool near-black and steel operate the detector, while cream paper and dark ink carry the ledger.

### Primary

- **Acid Signal Lime:** The `signal` token marks primary actions, detector points, selected attention, and high-value readouts.
- **Deep Signal Green:** The `signal-dark` token carries the scan-progress mark on light paper without turning the whole ledger neon.

### Secondary

- **Urgency Coral:** The `alert` token marks costly or time-sensitive signals; it is not a general decoration color.

### Tertiary

- **Focus Blue:** The `focus` token is reserved for keyboard focus outlines so interaction state remains unmistakable in both material modes.

### Neutral

- **Detector Void / Raised Void:** The `void` and `void-raised` tokens define the dark field and its one-step structural lift.
- **Instrument Steel / Light Steel:** The `steel` and `steel-light` tokens carry secondary copy, inactive navigation, and detector annotations.
- **Steel Rule:** The `dark-line` token separates dark regions with one-pixel instrument lines.
- **Ledger Paper / Bright Paper / Deep Paper:** The `paper`, `paper-bright`, and `paper-deep` tokens distinguish the work surface, editable fields, and receipt-like evidence.
- **Ledger Rule:** The `paper-line` token structures tables, disclosure rows, and form groups.
- **Ledger Ink / Soft Ink:** The `ink` and `ink-soft` tokens carry primary and secondary content on paper.

### Named Rules

**The Rare Signal Rule.** Lime identifies a detected signal or a consequential action; its scarcity is what makes the detector legible.

**The Two-Material Rule.** Detector neutrals never masquerade as paper, and paper neutrals never become a dark glass panel; the transition communicates the move from discovery to consent.

## Typography

**Display Font:** Arial Narrow with Aptos Display, Roboto Condensed, Helvetica Neue, and sans-serif fallbacks

**Body Font:** Aptos with Segoe UI, system UI, and platform sans-serif fallbacks

**Label/Mono Font:** Cascadia Mono with SFMono-Regular, Consolas, Liberation Mono, and monospace fallbacks

**Character:** Condensed system display type feels like a decisive editorial dispatch; the body stack stays familiar and readable; the monospace stack turns costs, timings, ranks, and status labels into instrument data. No webfont or font asset is required.

### Hierarchy

- **Display** (800, fluid 3.4rem–5.9rem, 0.92): Hero-only language, kept to roughly eleven characters per line.
- **Headline** (800, fluid 2.2rem–4rem, 0.98): Major station changes such as scanner, results, and method.
- **Title** (800, 1.6rem, 1): Queue, renewal, receipt, and other operational section titles.
- **Body** (400, 1rem, 1.55): Explanations and method copy; long introductory copy stays near 60 characters.
- **Control** (750, 0.9rem, 1): Buttons and decisive interactive labels.
- **Data** (700, 0.72rem, 1.5, 0.08em): Uppercase station labels, detector metadata, amounts, ranks, and compact status text.

### Named Rules

**The Instrument Hierarchy Rule.** Display type states the question, body type explains it, and monospace type records the evidence; do not swap those jobs for visual variety.

## Layout

The application sits inside a centered shell capped at 1500px, with one-pixel rules preserving the feeling of an instrument enclosure. The 72px sticky masthead anchors navigation. The opening view uses an asymmetric two-column split—copy at roughly 44% and detector at 56%—with a minimum height of 720px.

Paper workflow sections use edge-to-edge ruled grids instead of detached cards. The scanner begins as three columns for intake, processing, and the privacy receipt; the signal desk pairs a flexible decision queue with a 390px renewal rail. Section padding scales with `clamp()` while component interiors follow the compact-to-section spacing rhythm captured in frontmatter.

At 1180px, radar keys and summaries reflow and the scanner drops the receipt below. At 920px, the hero, scanner, desk, and method become single-column, while the rail temporarily holds two columns. At 660px, controls become full-width, evidence rows stack, the desk shortcuts become a sticky horizontal strip, and the masthead contracts to 62px.

## Elevation & Depth

The system is flat by default and uses tonal contrast plus one-pixel rules for most depth. Soft elevation appears only on the local-mode popover; the privacy receipt uses a hard printed offset, and signal points use small glows to communicate live detector state rather than atmospheric decoration.

### Shadow Vocabulary

- **Detector Popover** (`0 18px 44px rgba(0, 0, 0, 0.28)`): Separates the open local-mode explanation from the sticky masthead.
- **Ledger Receipt Offset** (`5px 7px 0 #cec4b2`): Makes the privacy receipt feel like a physical proof slip on the paper station.
- **Signal Glow** (`drop-shadow(0 3px 7px rgba(215, 255, 67, 0.38))`): Gives plotted lime points enough salience against the detector field.
- **Urgency Glow** (`drop-shadow(0 3px 7px rgba(255, 105, 74, 0.32))`): Applies the same detector logic to coral urgency points.

### Named Rules

**The Structural Depth Rule.** Use borders and material changes first; reserve shadows for an open overlay, a physical receipt, or an active signal.

## Shapes

The base form language is sharp and ruled. Page regions, summary strips, tables, and decision rows remain square; fields and buttons receive restrained 7–10px corners for usability. Pills are limited to status and source labels, while circles identify radar marks, ranks, scan stages, and the brand reticle. The privacy receipt uses a tight 4px corner and a single clipped page-like corner on its CSV glyph.

## Components

### Buttons

Buttons are compact, confident controls with a 46px minimum height and restrained 8px corners.

- **Shape:** Gently squared controls with a consistent 8px radius and compact horizontal padding.
- **Primary:** Signal lime on ledger ink for import and scan actions.
- **Hover / Focus:** Hover lifts 2px over 160ms; primary lime brightens. Keyboard focus uses a 3px focus-blue outline with a 3px offset.
- **Ghost:** Transparent with a steel border and bright paper text on the detector field.
- **Quiet:** Transparent with a paper-rule border and soft ink for secondary ledger actions.
- **Export:** Bright paper with ledger ink in the dark results header; disabled state reduces opacity.

### Chips

- **Style:** Source and review badges are compact mono labels with a one-pixel border and full-pill shape.
- **State:** Lime denotes detector source/status on dark surfaces; paper-side review badges use green for ready and coral for needs-review.

### Cards / Containers

- **Corner Style:** Major work regions stay square; the privacy receipt alone uses the 4px receipt radius.
- **Background:** Detector containers use raised void; decision work uses ledger paper; fields use bright paper.
- **Shadow Strategy:** Follow the Structural Depth Rule; most containers use tonal layering and rules only.
- **Border:** One-pixel steel or ledger rules define structure.
- **Internal Padding:** Dense rows use compact spacing; stations and receipts use panel-to-section spacing.

### Inputs / Fields

- **Style:** Native inputs, selects, and textareas sit on bright paper with ledger ink, a one-pixel ledger rule, and 7–8px corners.
- **Focus:** A 3px focus-blue outline with 3px offset is shared across every native interactive control.
- **Error / Disabled:** Errors use pale coral paper, dark coral text, and a coral border; disabled buttons retain their form and drop to 45% opacity.

### Navigation

The masthead navigation is small system sans in light steel, with lime appearing only on hover. The local-mode control is a pill-shaped disclosure. Below 920px the primary link group hides; within the results desk, compact ruled shortcuts remain available and become a sticky horizontal scroller on phones.

### Drop Zone

The CSV intake is a ruled paper instrument: a dashed neutral border, a file-shaped mono glyph, and a strong condensed title. Hover, drag, and focus-within sharpen the border and move the surface to bright paper.

### Finding Row

Each recurring signal is a native disclosure row. A circular mono rank, condensed merchant name, annualized cost, and pill review state stay visible; opening the row reveals ruled evidence, editable controls, and the user-owned action.

### Renewal Row

Renewals form a compact three-column timetable on raised void. Relative timing uses lime by default and coral for imminent or overdue entries; merchant and amount remain bright while metadata recedes to steel.

### Privacy Receipt

The privacy proof is deliberately physical: deep paper, a dark border, a hard offset shadow, compact monospace captioning, and ruled assurances. It is evidence, not a generic promotional card.

## Do's and Don'ts

### Do:

- **Do** preserve the detector-to-ledger transition when adding analysis and review surfaces.
- **Do** keep lime for detected signals and consequential actions, and coral for genuine urgency.
- **Do** use one-pixel rules, tabular alignment, and progressive disclosure to organize dense evidence.
- **Do** use native semantic controls, visible focus, text alternatives, and the shipped reduced-motion fallback.
- **Do** label estimates and illustrative data in the same visual hierarchy as the values they qualify.

### Don't:

- **Don't** add external fonts, icon fonts, third-party scripts, raster decoration, or runtime visual assets.
- **Don't** turn the workflow into a generic grid of detached metric cards.
- **Don't** introduce decorative glass, gradient text, atmospheric gradients, or ambient looping animation.
- **Don't** flood a surface with lime or coral; both colors lose meaning when they become background decoration.
- **Don't** round every region into a soft card or remove the ruled ledger and instrument geometry.
