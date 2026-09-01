---
name: Nexofood Core
colors:
  surface: "#f4fbf4"
  surface-dim: "#d4dcd5"
  surface-bright: "#f4fbf4"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eef6ee"
  surface-container: "#e8f0e9"
  surface-container-high: "#e3eae3"
  surface-container-highest: "#dde4dd"
  on-surface: "#161d19"
  on-surface-variant: "#3c4a42"
  inverse-surface: "#2b322d"
  inverse-on-surface: "#ebf3eb"
  outline: "#6c7a71"
  outline-variant: "#bbcabf"
  surface-tint: "#006c49"
  primary: "#006c49"
  on-primary: "#ffffff"
  primary-container: "#10b981"
  on-primary-container: "#00422b"
  inverse-primary: "#4edea3"
  secondary: "#ab3500"
  on-secondary: "#ffffff"
  secondary-container: "#fe6a34"
  on-secondary-container: "#5d1900"
  tertiary: "#a43a3a"
  on-tertiary: "#ffffff"
  tertiary-container: "#fc7c78"
  on-tertiary-container: "#711419"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#6ffbbe"
  primary-fixed-dim: "#4edea3"
  on-primary-fixed: "#002113"
  on-primary-fixed-variant: "#005236"
  secondary-fixed: "#ffdbd0"
  secondary-fixed-dim: "#ffb59d"
  on-secondary-fixed: "#390c00"
  on-secondary-fixed-variant: "#832600"
  tertiary-fixed: "#ffdad7"
  tertiary-fixed-dim: "#ffb3af"
  on-tertiary-fixed: "#410005"
  on-tertiary-fixed-variant: "#842225"
  background: "#f4fbf4"
  on-background: "#161d19"
  surface-variant: "#dde4dd"
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: "800"
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: "800"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: "700"
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: "700"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is built to balance the precision of a high-growth SaaS platform with the sensory appeal of the culinary industry. The brand personality is "Tech-Forward Gourmet"—reliable enough to handle a restaurant's entire backend, yet vibrant enough to stimulate appetite and growth.

The design style utilizes **Modern Corporate** principles infused with **Soft Tactility**. It prioritizes extreme legibility and structural clarity to ensure high-pressure restaurant environments can navigate the UI with zero friction. Visual interest is generated through high-quality imagery, generous whitespace, and purposeful pops of "Appetite Tangerine" for conversion-critical actions.

## Colors

This design system employs a "Fresh & Functional" palette.

- **Fresh Mint Green (#10B981)**: Used for primary branding, success states, and growth indicators. It represents freshness and stability.
- **Appetite Tangerine (#FF6B35)**: Reserved strictly for primary "Call to Action" buttons, checkout flows, and notifications that require immediate attention.
- **Deep Navy (#0F172A)**: Provides high-contrast grounding for all primary text, ensuring maximum readability under various lighting conditions (kitchen tablets to office monitors).
- **Subtle Slate (#E2E8F0)**: Used for structural containment and hair-line dividers to maintain a clean, organized layout without visual clutter.

## Typography

The design system utilizes **Plus Jakarta Sans** to provide a modern, slightly rounded, and optimistic feel. The typeface’s open counters and geometric structure ensure that menu items and financial data remain legible even at small sizes.

Headlines should use tighter letter-spacing and heavier weights to command attention, while body text maintains standard spacing for long-form readability in order management screens. Use `label-sm` in all-caps for metadata and category headers to create a clear information hierarchy.

## Layout & Spacing

The design system follows a strict **8px grid system** to maintain mathematical harmony.

- **Desktop:** 12-column fluid grid with a 1280px max-width. Gutters are fixed at 24px.
- **Tablet:** 8-column fluid grid with 24px margins.
- **Mobile:** 4-column fluid grid with 16px margins.

Spacing should be used to group related items (e.g., product image and its price) using `sm` or `md` units, while major sections of the dashboard or storefront should be separated by `2xl` or `3xl` units to allow the design to "breathe."

## Elevation & Depth

Depth in this design system is created through **Soft Diffused Shadows** and **Tonal Layering**. We avoid harsh lines in favor of depth that mimics physical cards resting on a clean surface.

- **Level 0 (Floor):** Background color (#FFFFFF) or Surface color (#F8FAFC).
- **Level 1 (Cards):** White background with a subtle border (#E2E8F0) or an extremely soft shadow: `0px 1px 3px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Dropdowns/Popovers):** `0px 10px 15px -3px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Modals):** `0px 20px 25px -5px rgba(15, 23, 42, 0.12)`.

Interactive elements should "lift" slightly on hover by transitioning to a higher elevation shadow.

## Shapes

The shape language is defined by "Smooth Friendliness." Sharp corners are avoided to keep the UI feeling approachable and modern.

- **Standard Elements:** Buttons, input fields, and small widgets use `rounded-lg` (16px).
- **Containers:** Product cards, feature sections, and modals use `rounded-xl` (24px).
- **Buttons & Tags:** Small interactive elements like "Add to Cart" or Category Chips can utilize a full pill-shape (999px) to differentiate them from static containers.

## Components

Consistent component behavior ensures the platform is intuitive for both restaurant owners and their customers.

- **Buttons:**
  - _Primary (Action):_ Appetite Tangerine background, white text, bold weight. Use for "Place Order" or "Save Changes."
  - _Secondary (Brand):_ Fresh Mint Green background or outline. Use for "Add Item" or "View Analytics."
- **Input Fields:** Use the Surface color (#F8FAFC) for the background with a Subtle Slate border. On focus, the border should transition to Mint Green with a soft glow.
- **Product Cards:** Utilize `rounded-xl` corners. The image should be the focal point, with the price and name in Deep Navy. Ensure a subtle shadow appears on hover to indicate interactivity.
- **Chips/Badges:** Used for order status (e.g., "Pending," "Cooking," "Delivered"). Use low-opacity versions of the primary/secondary colors with high-saturation text for high glanceability.
- **Lists:** Order lists should use generous vertical padding (16px-24px) and subtle dividers to ensure line items are distinct in high-speed environments.
