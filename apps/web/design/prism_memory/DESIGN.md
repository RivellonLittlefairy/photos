# Design System Strategy: The Living Archive

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system rejects the clinical, "file-folder" aesthetic of traditional photo management. Instead, it treats user memories as premium editorial content. The "Digital Curator" philosophy balances the high-end precision of a modern gallery with the warmth of a physical scrapbook. 

We break the "template" look by utilizing **intentional asymmetry** and **tonal layering**. Elements are not merely placed on a grid; they are curated. Expect overlapping components (e.g., a photo card breaking the boundary of its container) and a typography scale that favors dramatic contrast between massive Display styles and intimate Body copy. This is not a utility; it is a stage for life’s best moments.

---

## 2. Color Strategy: Vibrancy through Restraint
The palette uses `surface` (`#f9f9f9`) as a canvas, allowing photos to remain the protagonist. Vibrancy is injected through "Energetic Accents" rather than flood-fills.

*   **Primary (`#b62430`):** A sophisticated Coral. Use for high-intent actions and "Love" micro-interactions.
*   **Secondary (`#006c5c`):** A deep Teal. Use for organizational elements and "Memory Timeline" markers to ground the experience.
*   **Tertiary (`#795a00`):** A Golden Ochre. Reserved for "Featured" moments or nostalgic highlights.

### The "No-Line" Rule
**1px solid borders are strictly prohibited for sectioning.** We define boundaries through background color shifts. 
*   *Implementation:* To separate a sidebar, use `surface-container-low` (`#f3f4f4`) against a `surface` (`#f9f9f9`) main stage. Use the `spacing-8` (2rem) scale to let negative space act as the divider.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Base:** `surface`
*   **Sectioning:** `surface-container`
*   **Interaction Cards:** `surface-container-lowest` (#ffffff) to create a natural "lift" when placed on the base.

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" feel, use **Glassmorphism** for floating navigation and overlays.
*   *Formula:* `surface-container-lowest` at 70% opacity + `backdrop-blur: 20px`.
*   *Signature Texture:* Apply a subtle linear gradient from `primary` (`#b62430`) to `primary-container` (`#ffaba8`) on primary CTAs to give them a 3D, tactile "soul."

---

## 3. Typography: The Editorial Voice
We use two distinct families to bridge the gap between "Nostalgic" and "Cutting-Edge."

*   **The Hero (Plus Jakarta Sans):** Our Display and Headline font. It’s geometric yet warm. Use `display-lg` (3.5rem) for timeline year headers to create an editorial, magazine-like feel.
*   **The Narrator (Be Vietnam Pro):** Our Title, Body, and Label font. It is highly legible and functional. Use `title-md` (1.125rem) for photo captions to ensure they feel personal and "friendly."

**Hierarchy Tip:** Pair a `display-sm` header in Plus Jakarta Sans with a `body-md` description in Be Vietnam Pro. The high contrast in scale and weight creates a professional, intentional aesthetic.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often heavy and muddy. We achieve depth through **Light and Tone.**

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card atop a `surface-container` background. The slight shift in hex value provides a sophisticated, "soft" lift.
*   **Ambient Shadows:** For floating elements like "Add Photo" buttons, use the `on-surface` color (`#2f3334`) at 6% opacity with a blur of `xl` (3rem). This mimics natural light rather than a digital drop shadow.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` (`#afb2b3`) at **15% opacity**. Never use a 100% opaque border.
*   **Roundedness:** Adhere to the `DEFAULT` (1rem) for standard cards. Use `xl` (3rem) for "Memory Bubbles" to lean into the playful, friendly aspect of the brand.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. `rounded-full`. 
*   **Secondary:** `secondary-container` background with `on-secondary-container` text. No border.
*   **Tertiary:** Transparent background, `primary` text. Use `spacing-2` (0.5rem) padding for a "chic" hover state using `surface-container-high`.

### The "Memory Card" (Photo Cards)
*   **Style:** `surface-container-lowest` background, `rounded-lg` (2rem). 
*   **Prohibition:** No divider lines between the photo and the caption. Use `spacing-4` (1rem) of padding to create separation.
*   **Interaction:** On hover, a subtle `primary-fixed` (`#ffaba8`) "Ghost Border" appears at 20% opacity.

### Timeline Markers
*   A vertical line using `secondary-fixed-dim` (`#5aeed2`) with a thickness of `px`. 
*   Key milestones use `rounded-full` chips in `tertiary-container` to highlight "Anniversaries" or "Trips."

### Input Fields
*   **Style:** `surface-container-low` background with a `rounded-sm` (0.5rem) corner.
*   **Focus State:** The background shifts to `surface-container-lowest` and a soft `primary-dim` shadow (4% opacity) is applied. No heavy blue focus rings.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** overlap a small element (like a date chip) over the edge of a photo card to create "The Digital Curator" look.
*   **Do** use `spacing-16` (4rem) or `spacing-20` (5rem) between major sections. White space is a luxury; use it.
*   **Do** use the `secondary` teal for "Success" states and `primary` coral for "Active/Love" states to keep the app vibrant.

### Don't:
*   **Don't** use black (`#000000`) for text. Use `on-surface` (`#2f3334`) for a softer, premium feel.
*   **Don't** use the `error` red for anything other than critical destructive actions. The `primary` coral is our "Action" color.
*   **Don't** use standard 90-degree corners. Everything must have a minimum of `sm` (0.5rem) rounding to maintain the "friendly" brand promise.