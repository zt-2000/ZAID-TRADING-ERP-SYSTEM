---
name: Wholesale ERP System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-default:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-uppercase:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an operational, high-efficiency interface engineered for wholesale distribution, multi-warehouse inventory, bulk sales order processing, and procurement operations. 

### Design Philosophy
- **Modern Minimalist & Utilitarian:** Form strictly follows function. Visual embellishment is eliminated to reduce cognitive fatigue during extended data-entry and inventory-auditing sessions.
- **Data-First Clarity:** Dense tabular structures, numeric accuracy, clear status attribution, and legible hierarchy take precedence over decorative art.
- **Restraint:** No gradients, no glassmorphism, no neo-brutalist heavy strokes, and no illustrative empty states. Icons are strictly functional stroke outlines (Lucide style) sized at consistent 16px and 20px bounding boxes.
- **Predictable Ergonomics:** Strict consistency in card definitions, unified 10px corner radiuses, soft border delimiters, and standard interaction states.

## Colors

The palette operates strictly in light mode, utilizing clean cool-slate neutrals paired with an intentional cobalt accent.

### Color Tokens & Rules
- **Canvas (`#F8FAFC`):** Global application background. Provides a low-strain contrast offset behind white content surfaces.
- **Surfaces (`#FFFFFF`):** Applied to the fixed left sidebar, top utility bar, floating panels, data tables, and cards.
- **Borders (`#E2E8F0`):** Single-pixel perimeter rules separating functional zones, table cells, inputs, and layout blocks.
- **Primary Accent (`#2563EB`) & Hover (`#1D4ED8`):** Reserved for primary calls-to-action (e.g., "Create Purchase Order", "Post Invoice"), active pagination indexes, and active sidebar navigation states.
- **Typography:**
  - **Main Text (`#0F172A`):** Used for primary figures, headers, table rows, and interactive labels.
  - **Secondary Text (`#64748B`):** Used for metadata, breadcrumbs, column headers, SKUs, and input placeholder strings.
- **Semantic Status Architecture (Text / Background):**
  - **Success (`#16A34A` / `#DCFCE7`):** "Fulfilled", "Paid", "In Stock".
  - **Warning (`#D97706` / `#FEF3C7`):** "Awaiting Approval", "Low Stock", "Partial Shipment".
  - **Danger (`#DC2626` / `#FEE2E2`):** "Out of Stock", "Overdue", "Cancelled", "Void".

## Typography

The typography system relies exclusively on **Inter**, optimized for screen readability and enterprise data density.

### Rules & Guidelines
- **Tabular Figures:** All financial figures, quantities, SKU identifiers, order balances, and timestamps must use `font-variant-numeric: tabular-nums` to guarantee vertical column alignment across records.
- **Hierarchy Mapping:**
  - `headline-xl` (28px / 700): Module-level landing screens (e.g., "Inventory Ledger", "Orders Overview").
  - `headline-lg` (22px / 600): Section drawers, modal master heads, order detail pages.
  - `headline-md` (18px / 600): Card container titles, dashboard KPI module headers.
  - `title-sm` (15px / 600): Sub-card groupings, table category groupings.
  - `body-default` (14px / 400): Standard data grid cell values, standard paragraphs.
  - `body-medium` (14px / 500): Active items, primary row labels, dropdown options.
  - `body-sm` (13px / 400): Secondary row values, batch descriptions, input hint copy.
  - `label-default` (12px / 500): Form field labels, badge text, tooltips.
  - `label-uppercase` (11px / 600): Table headers (`th`), sub-nav section dividers. Rendered in uppercase with +0.05em tracking.

## Layout & Spacing

Layouts adhere to an 8px base rhythm with strict standard application increments of 16px (`1rem`) and 24px (`1.5rem`).

### Grid & Layout Structure
- **Application Shell:** Fixed left sidebar (260px expanded, 72px collapsed) on a `#FFFFFF` layer, separated from `#F8FAFC` main canvas via a `1px solid #E2E8F0` right border.
- **Main Content Shell:** 
  - Standard horizontal page margin: `24px` (`space-lg`).
  - Standard vertical stack spacing between page header, KPI bar, and data tables: `24px` (`space-lg`).
  - Internal card padding: `24px` (`space-lg`) for major KPI and form modules; `16px` (`space-md`) for compact widgets and dense tables.
- **Data Densities:**
  - Default Table Row Height: `44px` (cell padding `8px 16px`).
  - Compact Table Row Height: `36px` (cell padding `6px 12px`).
- **Breakpoints:**
  - `Desktop (>= 1280px)`: 12-column fluid grid, 24px gutters, static sidebar.
  - `Tablet (768px - 1279px)`: 8-column fluid grid, 16px gutters, collapsed/icon-only sidebar.
  - `Mobile (< 768px)`: 4-column fluid grid, 16px margins, hidden off-canvas sidebar drawer. Tables become horizontally scrollable cards or stacked summary lists.

## Elevation & Depth

Depth is established via sharp structural borders supplemented by a single uniform, micro-subtle ambient drop shadow.

### Layer Architecture
1. **Canvas (`#F8FAFC`):** Base layer zero. No shadow.
2. **Surfaces & Cards (`#FFFFFF`):** Elevated over the canvas using a continuous structural perimeter:
   - Border: `1px solid #E2E8F0`
   - Shadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (`shadow-sm`)
3. **Dropdown Menus, Popovers, & Date Pickers:** 
   - Border: `1px solid #E2E8F0`
   - Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
4. **Modals & Slide-over Sheets:**
   - Overlay Backdrop: `#0F172A` with 30% opacity (`rgba(15, 23, 42, 0.30)`). Blur is deliberately avoided to preserve crisp performance and layout structure.
   - Container: `#FFFFFF`, `1px solid #E2E8F0`, `shadow-lg` (`0 10px 15px -3px rgba(0, 0, 0, 0.08)`).

## Shapes

The interface specifies a crisp, unified corner styling across every interactive and display element.

### Corner Radius System
- **Core Standard:** `10px` (`rounded-[10px]`). Applied to:
  - Cards, panels, and data table bounding frames.
  - Form inputs, textareas, select menus, and search bars.
  - Modals, action sheets, and flyout menus.
- **Interactive Controls:**
  - Standard Buttons: `10px`.
  - Icon-only Action Triggers (32x32px): `8px` or `10px`.
- **Badges & Status Tags:**
  - Status Indicators (Fulfilled, Low Stock, etc.): `6px` or fully rounded pill (`9999px`) for compact counters.
- **Nested Corners:** Inner elements set within a 10px container padded by 16px or more retain standard 6px to 8px radii to preserve optical alignment.

## Components

### Buttons
- **Primary Button:** Background `#2563EB`, text `#FFFFFF`, font-weight `500`, height `38px`, padding `0 16px`, border-radius `10px`. Hover state: `#1D4ED8`. Active state: `#1E40AF`.
- **Secondary / Outline Button:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`, height `38px`, padding `0 16px`, border-radius `10px`. Hover state: background `#F8FAFC`, border `#CBD5E1`.
- **Destructive Button:** Background `#DC2626`, text `#FFFFFF`, border-radius `10px`. Hover state: `#B91C1C`.
- **Icon Buttons (Table row actions):** 32x32px, transparent background, text `#64748B`, border-radius `8px`. Hover: background `#F1F5F9`, text `#0F172A`.

### Status Badges & Chips
- Structure: Height `22px`, horizontal padding `8px`, border-radius `6px`, font size `11px`, font-weight `600`, uppercase tracking `0.025em`.
- **Success:** Text `#16A34A`, background `#DCFCE7`, border `1px solid #BBF7D0`.
- **Warning:** Text `#D97706`, background `#FEF3C7`, border `1px solid #FDE68A`.
- **Danger:** Text `#DC2626`, background `#FEE2E2`, border `1px solid #FECACA`.
- **Neutral / Draft:** Text `#64748B`, background `#F1F5F9`, border `1px solid #E2E8F0`.

### Form Inputs & Search Fields
- Structure: Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `10px`, height `38px`, text `#0F172A`, placeholder `#64748B`, font-size `14px`, padding `0 12px`.
- Focus State: Border color `#2563EB`, box-shadow `0 0 0 1px #2563EB`. No thick rings.
- Disabled State: Background `#F8FAFC`, text `#94A3B8`, border `#E2E8F0`, cursor `not-allowed`.

### Checkboxes & Radio Controls
- Dimension: 16x16px.
- Checkbox Radius: `4px`.
- Radio Radius: `50%`.
- Unchecked: Background `#FFFFFF`, border `1px solid #CBD5E1`.
- Checked: Background `#2563EB`, border `#2563EB`, checkmark stroke `#FFFFFF` (1.5px stroke weight).

### Cards & KPI Blocks
- Foundation: Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `10px`, shadow `0 1px 2px 0 rgba(0, 0, 0, 0.05)`.
- KPI Metric Layout: Label (`label-uppercase`, `#64748B`), Value (`headline-xl`, `#0F172A`, tabular figures), Trend Indicator (`label-default`, colored badge with inline arrow).

### Data Tables
- Frame: Container `#FFFFFF` with `1px solid #E2E8F0`, border-radius `10px`, overflow hidden.
- Header: Background `#F8FAFC`, height `40px`, border-bottom `1px solid #E2E8F0`, text `#64748B`, font-weight `600`, font-size `11px`, uppercase, letter-spacing `0.05em`.
- Row: Height `44px`, border-bottom `1px solid #E2E8F0`, hover background `#F8FAFC`.
- Numbers/Pricing/Units: Align right, tabular numbers font feature. Text columns: Align left. Actions: Align right.