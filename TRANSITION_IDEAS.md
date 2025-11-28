# Space Toggle Transition Ideas

## Overview
Full-page, dramatic transitions when switching between Professional (`/`) and Personal (`/photography`) spaces.

---

## 🎬 Option 1: Camera Viewfinder Zoom
**Direction:** Professional → Photography

**Animation:**
- Screen zooms in through a circular camera viewfinder overlay
- Viewfinder frame appears (black border with corner brackets)
- Content zooms/scales up dramatically (2-3x) while fading
- Viewfinder "clicks" shut (circular iris close)
- New space fades in from center, zooming out to normal size
- Viewfinder frame disappears

**Duration:** ~800ms
**Aesthetic:** Perfect for photography space entry
**Tech:** CSS transforms + clip-path or mask

---

## 🎬 Option 2: Matrix Binary Rain
**Direction:** Photography → Professional

**Animation:**
- Screen fills with cascading green binary characters (0s and 1s)
- Binary "rain" falls from top to bottom
- Current content fades behind the matrix
- Terminal-style characters overlay everything
- Binary fades to reveal new professional space
- Scanlines effect intensifies during transition

**Duration:** ~1000ms
**Aesthetic:** Perfect hacker/terminal vibe
**Tech:** Canvas or CSS animations with random characters

---

## 🎬 Option 3: Film Strip Unroll
**Direction:** Professional → Photography

**Animation:**
- Horizontal film strip (with sprocket holes) scrolls across screen
- Current content scrolls away with the film
- New photography content scrolls in from opposite side
- Film strip effect (perforated edges, frame divisions)
- Optional: "click" sound effect timing

**Duration:** ~900ms
**Aesthetic:** Classic photography nostalgia
**Tech:** CSS transforms with repeating background pattern

---

## 🎬 Option 4: Terminal Boot Sequence
**Direction:** Photography → Professional

**Animation:**
- Screen goes black
- Green terminal text appears: `[SYSTEM] Initializing professional space...`
- Boot messages scroll: `[OK] Loading terminal...`, `[OK] Loading blog...`
- Progress bar fills (terminal-style)
- Screen "boots up" revealing new professional space
- Scanlines fade in

**Duration:** ~1200ms
**Aesthetic:** Retro computing boot sequence
**Tech:** Typed text animation + CSS

---

## 🎬 Option 5: Shutter Blink
**Direction:** Professional → Photography

**Animation:**
- Screen flashes white (like camera flash)
- Brief moment of pure white
- Content morphs/transforms during flash
- New photography space fades in from white
- Optional: subtle "click" sound

**Duration:** ~600ms (very quick, snappy)
**Aesthetic:** Instant camera feel
**Tech:** CSS flash animation + transform

---

## 🎬 Option 6: CRT Monitor Flicker
**Direction:** Photography → Professional

**Animation:**
- Screen flickers like old CRT monitor turning on
- Horizontal scan lines sweep down
- Screen "tunes in" with static/glitch effects
- Professional space appears with terminal aesthetic
- Scanlines settle into permanent overlay

**Duration:** ~800ms
**Aesthetic:** Retro computing nostalgia
**Tech:** CSS animations with scanline effects

---

## 🎬 Option 7: Iris Diaphragm (Camera Aperture)
**Direction:** Professional → Photography

**Animation:**
- Circular aperture blades close from edges (like camera lens)
- Screen becomes black circle in center
- Aperture opens in reverse direction
- New photography space revealed through opening aperture
- Smooth, mechanical feel

**Duration:** ~700ms
**Aesthetic:** Professional camera equipment
**Tech:** SVG path animation or CSS clip-path

---

## 🎬 Option 8: Data Stream / Glitch
**Direction:** Photography → Professional

**Animation:**
- Screen glitches (RGB channel separation)
- Digital noise/static overlay
- Content distorts and fragments
- Binary/hex data streams across screen
- Glitch resolves into clean professional space
- Terminal prompt appears with typing effect

**Duration:** ~900ms
**Aesthetic:** Cyberpunk/hacker aesthetic
**Tech:** CSS filters + transform + text overlay

---

## 🎬 Option 9: Polaroid Develop
**Direction:** Professional → Photography

**Animation:**
- Screen becomes white (like blank Polaroid)
- Photo "develops" from white (fade in from center)
- Optional: Polaroid frame appears around edges
- Content morphs into photography space
- Frame fades away

**Duration:** ~1000ms
**Aesthetic:** Analog photography charm
**Tech:** CSS gradients + transform

---

## 🎬 Option 10: Dual Split Screen Wipe
**Direction:** Both directions

**Animation:**
- Screen splits diagonally
- One half (current space) slides away
- Other half (new space) slides in from opposite direction
- Clean, geometric transition
- Optional: slight rotation during split

**Duration:** ~750ms
**Aesthetic:** Modern, clean, editorial
**Tech:** CSS clip-path or transform

---

## 🎬 Option 11: Film Reel Spin
**Direction:** Professional → Photography

**Animation:**
- Circular film reel appears, spinning
- Content wraps around reel (perspective transform)
- Reel spins, revealing new photography content
- Reel fades out, leaving new space

**Duration:** ~1000ms
**Aesthetic:** Classic cinema/projection
**Tech:** CSS 3D transforms

---

## 🎬 Option 12: Hex Dump / Memory Dump
**Direction:** Photography → Professional

**Animation:**
- Screen fills with hex dump format (addresses + hex values)
- Current content becomes "memory" being dumped
- Hex scrolls/updates rapidly
- Transforms into terminal/command line
- Professional space loads from "memory"

**Duration:** ~1100ms
**Aesthetic:** Deep hacker/developer aesthetic
**Tech:** Canvas or CSS with typed hex values

---

## 🎯 Recommended Combinations

### **Option A: Viewfinder + Matrix** (Most Thematic)
- **Professional → Photography:** Camera viewfinder zoom (Option 1)
- **Photography → Professional:** Matrix binary rain (Option 2)

### **Option B: Shutter + Terminal Boot** (Quick & Thematic)
- **Professional → Photography:** Shutter blink (Option 5)
- **Photography → Professional:** Terminal boot sequence (Option 4)

### **Option C: Film Strip + CRT Flicker** (Nostalgic)
- **Professional → Photography:** Film strip unroll (Option 3)
- **Photography → Professional:** CRT monitor flicker (Option 6)

### **Option D: Iris + Glitch** (Smooth + Edgy)
- **Professional → Photography:** Iris diaphragm (Option 7)
- **Photography → Professional:** Data stream glitch (Option 8)

---

## 💡 Implementation Notes

1. **Performance:** Use CSS transforms and opacity (GPU-accelerated)
2. **Accessibility:** Respect `prefers-reduced-motion`
3. **Timing:** Intercept link clicks, show transition, then navigate
4. **State:** Store transition state in sessionStorage to prevent double-trigger
5. **Fallback:** Simple fade if JavaScript disabled

---

## 🎨 Visual Style Matching

**Professional Space Transitions Should:**
- Use terminal-green (#22c55e) or terminal-cyan (#06b6d4)
- Feel technical, digital, hacker-like
- Include monospace fonts if text appears

**Photography Space Transitions Should:**
- Use warm tones (amber #f59e0b, cream backgrounds)
- Feel analog, mechanical, artistic
- Include camera/photography metaphors
