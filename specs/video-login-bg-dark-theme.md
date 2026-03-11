# Chore: Video Login Background + Navy Dark Mode Theme

## Chore Description
Replace the Three.js animated background on the login page with the video `public/Image_to_video_delpmaspu_.mp4` and update the dark mode color palette across the entire application to use dark blue/navy tones that match the video's aesthetic.

## Agent Reports

### Scope Analysis

**What exactly is being asked?**
1. Replace `ThreeBackground` (Three.js canvas) with an autoplay, looping, muted `<video>` element on both the LoginPage and ForgotPasswordPage
2. Update the `.dark` CSS variables in `globals.css` to use dark blue/navy tones instead of the current pure black/gray palette

**What is NOT being asked?**
- Not changing the light mode theme
- Not changing the primary orange color (it contrasts beautifully with navy)
- Not modifying any component logic, auth flow, or layout structure
- Not adding video controls or user interaction with the video

**Assumptions:**
1. The video has dark blue/navy dominant tones (confirmed by user)
2. The video should loop infinitely, autoplay, and be muted (standard background video UX)
3. The orange primary color should remain — it complements navy well
4. The video is ~19MB — acceptable for a login page background served locally

**Edge Cases:**
- Mobile: video autoplay may be restricted on some mobile browsers — need a CSS fallback background
- Performance: 19MB video on slow connections — the navy gradient fallback covers this
- Safari: requires `playsInline` attribute for autoplay

**Acceptance Criteria:**
1. Login page shows the video playing as a fullscreen background behind the card
2. Forgot Password page also shows the video background
3. Dark mode uses navy/blue-tinted backgrounds across the entire app
4. Cards, popovers, sidebars, inputs, and borders all reflect the navy palette
5. Orange primary color is preserved

### Architecture Decision

**Files to modify (3):**
1. `components/auth/LoginPage.js` — Replace `ThreeBackground` with inline `<video>` element
2. `app/globals.css` — Update `.dark` CSS variables to navy palette

**Files to delete (1):**
1. `components/auth/ThreeBackground.js` — No longer needed (replaced by video)

**Change Strategy:**

**Login Page:** Replace the `<ThreeBackground />` component with a `<video>` element positioned absolutely behind the card. Use `object-fit: cover` for fullscreen coverage. Add a dark overlay for readability. Include a CSS gradient fallback.

**Dark Mode Palette (navy tones):**
Current pure black → navy blue shift:
- Background: `0 0% 3.9%` → `222 47% 5%` (deep navy #070b14)
- Card: `0 0% 6%` → `222 41% 8%` (dark navy card #0c1220)
- Secondary/Muted: `0 0% 10%` → `220 35% 12%` (navy muted)
- Border: `0 0% 14%` → `220 30% 16%` (navy border)
- Sidebar: follows the same navy shift
- Primary stays: `24.6 95% 53.1%` (orange — unchanged)
- Accent stays: `20.5 90.2% 48.2%` (warm orange — unchanged)

**No new dependencies needed.** The Three.js dependency (`@react-three/fiber`, `@react-three/drei`, `three`) can be kept for now since other pages might use them later.

### Plan Review

**Verdict: APPROVED**

- Plan is minimal: 2 file edits + 1 file deletion
- No over-engineering — simple HTML video element, no fancy video player library
- Correct order: CSS changes first (foundational), then component changes
- Reversible: revert CSS variables and restore ThreeBackground import
- Risk: low — only touches login page and CSS variables

### Security Review

**Verdict: CLEAR**

- Video is a local static asset served from `/public` — no external URLs
- No user input involved
- No new dependencies
- No auth changes
- CSS-only theme changes pose zero security risk

### Test Plan

**Existing tests that could break:** None found in project.

**Manual validation:**
1. Open login page in dark mode — verify video plays as background
2. Open forgot password page — verify video plays as background
3. Navigate to dashboard — verify navy dark mode colors apply globally
4. Toggle light/dark mode — verify light mode is unchanged
5. Check mobile viewport — verify fallback gradient appears if video doesn't autoplay
6. Verify the login card is readable over the video (backdrop blur + overlay)

## Relevant Files

- `components/auth/LoginPage.js` — Login + ForgotPassword components with ThreeBackground
- `components/auth/ThreeBackground.js` — Current Three.js background (to be removed)
- `app/globals.css` — CSS custom properties for light/dark mode

### New Files
None.

## Step by Step Tasks

### Step 1: Update dark mode CSS variables to navy palette
*Implements: Architect's dark mode palette*

- Update `.dark` block in `app/globals.css`
- Change all neutral grays to navy-tinted blues
- Keep primary (orange) and accent colors unchanged
- Update sidebar colors to match

### Step 2: Replace ThreeBackground with video background in LoginPage
*Implements: Architect's login page change*

- Remove `ThreeBackground` import
- Add `<video>` element with autoplay, loop, muted, playsInline
- Add dark overlay div for readability
- Add CSS gradient fallback background on the container
- Apply to both LoginPage and ForgotPasswordPage

### Step 3: Delete ThreeBackground component
*Implements: Architect's cleanup*

- Remove `components/auth/ThreeBackground.js`

### Step 4: Visual validation
*Implements: Test Engineer's manual checks*

- Load login page and verify video background + card readability
- Toggle dark/light mode and verify both work
- Check dashboard for navy dark mode colors

## Validation Commands

```bash
# Verify the app compiles without errors
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

## Notes
- The 19MB video is acceptable for a login page but could be optimized later with compression or a poster image for faster initial paint.
- The Three.js packages (`three`, `@react-three/fiber`, `@react-three/drei`) remain in package.json — can be removed later if no other component needs them.
