/**
 * Fonts for glyph (CRT) levels. They're layered so every character has something to draw it:
 *
 *   1. A retro "face" font for ASCII: VT323 (default), Sixtyfour or Workbench. Each covers only
 *      a few hundred characters.
 *   2. DMD Unifont: GNU Unifont split into unicode-range chunks (scripts/build-unifont.py). It
 *      covers ~57k BMP characters (box drawing, blocks, arrows, Greek, Cyrillic, CJK…). The
 *      browser falls back to it per character and downloads only the chunks a page uses.
 *   3. Noto Emoji: monochrome emoji, so they take the phosphor color instead of rendering in color.
 *
 * Switch the face font with the --crt-face CSS variable (see styles.css).
 */
import '@fontsource/vt323';
import '@fontsource/sixtyfour';
import '@fontsource/workbench';
import '@fontsource/noto-emoji';
import './unifont.css';
