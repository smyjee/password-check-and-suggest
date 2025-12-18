# Passwordr Design Guidelines

## Design Approach
**System Selected:** Material Design with security tool refinement (inspired by 1Password, Bitwarden, Linear)

**Rationale:** Passwordr is a utility-focused security tool requiring clear visual feedback, immediate comprehension, and trust-building through clean, professional aesthetics. The design prioritizes information hierarchy and real-time feedback over visual flair.

## Core Design Principles
1. **Clarity First:** Every element serves a functional purpose in communicating password strength
2. **Progressive Disclosure:** Show basic feedback immediately, reveal details on demand
3. **Trust Through Restraint:** Minimal, professional aesthetic builds confidence in security tool
4. **Responsive Precision:** Mobile-first design ensuring usability across all devices

---

## Typography System

**Font Stack:** Inter (primary), SF Pro (fallback), system-ui

**Hierarchy:**
- Main heading: text-3xl md:text-4xl, font-bold, tracking-tight
- Tool title: text-xl md:text-2xl, font-semibold
- Section labels: text-sm, font-medium, uppercase, tracking-wide
- Score display: text-5xl md:text-6xl, font-bold, tabular-nums
- Strength label: text-lg md:text-xl, font-semibold
- Factor text: text-sm md:text-base, font-normal
- Suggestion text: text-sm, font-normal, leading-relaxed
- Helper text: text-xs, font-normal

---

## Layout System

**Spacing Units:** Consistently use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (2-4): Between related inline elements, icon-text pairs
- Component spacing (6-8): Internal component padding, between form elements
- Section spacing (12-16): Between major UI sections
- Container spacing (20-24): Outer margins, page-level spacing

**Grid Structure:**
- Desktop: Single column max-w-2xl centered layout
- Mobile: Full-width with px-4 side padding
- No multi-column layouts needed - vertical stacking for clarity

---

## Component Library

### Primary Password Input Widget
**Structure:**
- Contained card with rounded-xl borders and subtle elevation (shadow-lg)
- Input field: h-14 md:h-16, text-lg, rounded-lg, with show/hide toggle icon (right-aligned)
- Real-time strength meter: Full-width progress bar below input (h-2, rounded-full)
- Score and label: Displayed prominently below meter (flex justify-between)

### Strength Indicator System
**Visual Representation:**
- Numerical score: Large, bold display (tabular numerals for consistent width)
- Categorical label: Distinct typography treatment (font-semibold, tracking-wide)
- Progress meter: Animated width transition (transition-all duration-300)
- Five-tier system: Very Weak → Weak → Moderate → Strong → Very Strong

### Factor Analysis Panel
**Layout:**
- Collapsible section with clear header (text-sm, font-medium, uppercase)
- List of factors with icon prefixes (checkmark for positive, warning for negative)
- Gap-3 between factor items
- Icons size-5, aligned with text baseline

### Suggestion Cards
**Structure:**
- Stacked list format (space-y-3)
- Each suggestion: p-4, rounded-lg, bordered card
- Icon + heading + description pattern
- Numbered list (1-5) with subtle numbering treatment

### Example Password Generator
**Implementation:**
- Initially hidden, revealed via "Show Examples" button
- 3-5 example passwords in monospace font (font-mono, text-sm)
- Each example in bordered container (p-3, rounded-md)
- Copy-to-clipboard button per example (icon-only, subtle)

### Call-to-Action Buttons
- Primary action: px-6 py-3, rounded-lg, font-semibold, text-base
- Secondary action: px-4 py-2, rounded-md, font-medium, text-sm
- Icon-only buttons: p-2, rounded-md, size-9 for consistent hit targets

---

## Page Structure

**Single-Page Tool Layout:**
1. **Header** (py-8, border-b)
   - App branding: "Passwordr" with lock icon
   - Tagline: "AI-Powered Password Strength Estimator"
   
2. **Main Tool Section** (py-12, max-w-2xl mx-auto)
   - Password input widget (central focus)
   - Real-time strength display
   - Factor analysis (collapsible)
   - Suggestions panel (conditional rendering)
   - Example generator (on-demand)

3. **Educational Content** (py-8, max-w-3xl mx-auto, grid md:grid-cols-3, gap-6)
   - Three info cards explaining: "How It Works", "Privacy Promise", "Best Practices"
   - Each card: p-6, rounded-xl, with icon, heading, and brief description

4. **Footer** (py-6, border-t, text-center)
   - Privacy statement: "No passwords stored. All processing happens in your browser."
   - Links: About, Privacy Policy, GitHub

---

## Interaction Patterns

**Real-Time Feedback:**
- Debounced input analysis (300ms delay to avoid excessive updates)
- Smooth transitions for strength meter (transition-all duration-300 ease-in-out)
- Fade-in animations for suggestions (animate-fade-in)

**Progressive Disclosure:**
- Factors initially collapsed, expand on click
- Examples hidden by default, shown via button action
- Advanced settings (future) behind "Advanced Options" accordion

**Mobile Optimization:**
- Touch-friendly input sizing (min-height 44px for all interactive elements)
- Show/hide toggle positioned for thumb reach
- Vertical stacking of all components (no horizontal scrolling)

---

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Screen reader announcements for score changes
- Focus indicators: ring-2, ring-offset-2
- Minimum contrast ratios per WCAG AA standards
- Password input maintains semantic role

---

## Visual Treatment Notes

**Elevation & Depth:**
- Main widget: Highest elevation (shadow-lg)
- Cards: Medium elevation (shadow-md)
- Hover states: Subtle lift (hover:shadow-xl, transform transition)

**Borders & Containers:**
- Primary containers: rounded-xl with subtle border
- Input fields: rounded-lg
- Buttons: rounded-lg (primary), rounded-md (secondary)
- Cards: rounded-lg with border treatment

**Icon System:**
- Heroicons for UI elements (outline style)
- Size-5 for inline icons, size-6 for standalone
- Consistent stroke-width across all icons

---

## Privacy & Trust Signals

- Prominent "No Storage" badge near input
- Lock icon in branding
- Clear privacy statement in footer
- Minimal, professional aesthetic reinforces security focus