/**
 * Admin Design System – Single source of truth
 * Extracted from ADMINPAGE.pen design file
 * ─────────────────────────────────────────────
 * Import in every admin page:
 *   import { T, cardStyle, pillStyle } from "@/components/admin/adminTheme";
 */

// ── Color Tokens ──────────────────────────────────────────────────────────────
export const T = {
    // Surfaces
    base:           "#060B12",   // Page background
    panel:          "#0B131D",   // Sidebar / panel background
    card:           "#101A25",   // Card backgrounds
    card2:          "#122130",   // Highlighted card backgrounds (e.g. metric with accent)
    overlay:        "#0E1E2A",   // Inner card surfaces, nested panels

    // Borders
    border:         "#183042",   // Default border
    borderStrong:   "#1D5A74",   // Active / accent borders

    // Text
    textPrimary:    "#F2FAFF",   // Headings, primary text
    textSecondary:  "#A6BCD0",   // Descriptions, labels
    textMuted:      "#72879E",   // Dimmed text, placeholders

    // Accents
    cyan:           "#18D3F6",   // Primary accent
    cyanDim:        "#0A3A4A",   // Dimmed cyan background
    purple:         "#9074FF",   // Secondary accent
    green:          "#31D79B",   // Success / growth
    amber:          "#FFB65C",   // Warning / attention
    red:            "#f87171",   // Error / danger

    // Legacy aliases (for backwards compat during migration)
    cardBg:         "#101A25",
    surfaceBg:      "#0B131D",
    activeHighlight:"#0E2C37",
    textPrimary_:   "#F2FAFF",
    success:        "#31D79B",
    warning:        "#FFB65C",
    error:          "#f87171",
    danger:         "#f87171",

    // Hover / Interaction
    rowHover:       "rgba(24,211,246,0.03)",
};

// ── Radii ─────────────────────────────────────────────────────────────────────
export const RADIUS = {
    card:  24,
    inner: 18,
    pill:  999,
    sm:    10,
};

// ── Shadows ───────────────────────────────────────────────────────────────────
export const SHADOW = {
    card: "0 16px 28px rgba(2,6,10,0.53)",
    pill: "0 10px 24px rgba(24,211,246,0.16)",
};

// ── Gradient Fills (for metric cards) ─────────────────────────────────────────
export const GRADIENTS = {
    cyan:   "linear-gradient(180deg, #122230 0%, #0F1824 100%)",
    amber:  "linear-gradient(180deg, #101B27 0%, #0C151F 100%)",
    purple: "linear-gradient(180deg, #101824 0%, #0B141D 100%)",
    green:  "linear-gradient(180deg, #0F1822 0%, #0B141C 100%)",
    default:"linear-gradient(180deg, #101A25 0%, #0D1620 100%)",
};

// ── Reusable Styles ───────────────────────────────────────────────────────────

/** Standard card container */
export const cardStyle = {
    backgroundColor: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: RADIUS.card,
    boxShadow: SHADOW.card,
};

/** Metric card (gradient bg) */
export const metricCardStyle = (gradient = GRADIENTS.default) => ({
    background: gradient,
    border: `1px solid ${T.border}`,
    borderRadius: RADIUS.card,
    boxShadow: SHADOW.card,
    padding: 20,
});

/** Inner surface (plots, nested cards) */
export const innerSurface = {
    backgroundColor: T.overlay,
    border: `1px solid ${T.border}`,
    borderRadius: RADIUS.inner,
};

/** Pill / tag */
export const pillStyle = (bg = T.overlay, borderColor = T.border) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    backgroundColor: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: RADIUS.pill,
    fontSize: 13,
    fontWeight: 600,
});

/** Section label (uppercase, small) */
export const sectionLabel = {
    color: T.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    margin: 0,
};

/** Tier badge color map */
export const TIER_COLORS = {
    starter: { bg: "rgba(114,135,158,0.12)", color: T.textMuted,   border: "rgba(114,135,158,0.25)", bar: "#72879E" },
    growth:  { bg: "rgba(24,211,246,0.12)",  color: T.cyan,        border: "rgba(24,211,246,0.25)",  bar: T.cyan    },
    scale:   { bg: "rgba(144,116,255,0.12)", color: T.purple,      border: "rgba(144,116,255,0.25)", bar: T.purple  },
};
