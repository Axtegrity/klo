#!/usr/bin/env node
/**
 * KLO App — Deep Link Configuration Guide Generator
 * Produces a branded PDF for Keith Odom to follow when retrieving
 * his Apple Team ID and Android App Signing SHA-256 fingerprint.
 *
 * Output: ~/klo-app/public/klo-deep-link-guide.pdf
 * Run:    node scripts/generate-deep-link-guide.mjs
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// ---------------------------------------------------------------------------
// Brand tokens
// ---------------------------------------------------------------------------
const COLOR = {
  bg:      rgb(0.051, 0.067, 0.090),   // #0D1117
  surface: rgb(0.071, 0.090, 0.122),   // #121720
  accent:  rgb(0.153, 0.392, 1.000),   // #2764FF
  gold:    rgb(0.831, 0.686, 0.216),   // #D4AF37
  white:   rgb(1, 1, 1),
  muted:   rgb(0.557, 0.600, 0.655),   // #8E99A7
  divider: rgb(0.133, 0.173, 0.220),   // #222C38
}

// ---------------------------------------------------------------------------
// Page geometry
// ---------------------------------------------------------------------------
const PAGE_W = 612   // US Letter width  (pts)
const PAGE_H = 792   // US Letter height (pts)
const MARGIN = 50
const CONTENT_W = PAGE_W - MARGIN * 2

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Draw a filled rectangle. */
function rect(page, x, y, w, h, color) {
  page.drawRectangle({ x, y, width: w, height: h, color })
}

/** Draw text, returning the rendered width. */
function text(page, str, x, y, font, size, color) {
  page.drawText(str, { x, y, font, size, color })
  return font.widthOfTextAtSize(str, size)
}

/** Draw a horizontal rule. */
function rule(page, y, color = COLOR.divider) {
  page.drawLine({
    start: { x: MARGIN, y },
    end:   { x: PAGE_W - MARGIN, y },
    thickness: 1,
    color,
  })
}

/**
 * Wrap a long string into lines that fit within maxWidth.
 * Returns an array of line strings.
 */
function wrapText(str, font, size, maxWidth) {
  const words = str.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Draw a numbered step block.
 * Returns the y position after the block (cursor moved downward).
 */
function drawStep(page, stepNum, label, bodyLines, boldFont, regularFont, startY) {
  const NUM_SIZE    = 11
  const LABEL_SIZE  = 11
  const BODY_SIZE   = 9.5
  const LABEL_LH    = 16
  const BODY_LH     = 14
  const BADGE_R     = 11
  const INDENT      = MARGIN + BADGE_R * 2 + 10
  const MAX_LABEL_W = CONTENT_W - (BADGE_R * 2 + 10)

  let y = startY

  // Number badge circle
  const cx = MARGIN + BADGE_R
  const cy = y - BADGE_R + 2

  page.drawCircle({ x: cx, y: cy, size: BADGE_R, color: COLOR.accent })

  const numStr = String(stepNum)
  const numW   = boldFont.widthOfTextAtSize(numStr, NUM_SIZE)
  text(page, numStr, cx - numW / 2, cy - NUM_SIZE / 2 + 1, boldFont, NUM_SIZE, COLOR.white)

  // Step label (bold) — wrap if needed
  const labelLines = wrapText(label, boldFont, LABEL_SIZE, MAX_LABEL_W)
  for (const line of labelLines) {
    text(page, line, INDENT, y - LABEL_SIZE + 2, boldFont, LABEL_SIZE, COLOR.white)
    y -= LABEL_LH
  }

  y -= 2

  // Body lines (regular, muted)
  for (const line of bodyLines) {
    text(page, line, INDENT, y, regularFont, BODY_SIZE, COLOR.muted)
    y -= BODY_LH
  }

  return y - 6
}

/**
 * Draw a section header pill.
 * Returns y after the element.
 */
function drawSectionHeader(page, title, boldFont, y) {
  const SIZE    = 13
  const PAD_X   = 14
  const PAD_Y   = 7
  const tW      = boldFont.widthOfTextAtSize(title, SIZE)
  const boxW    = tW + PAD_X * 2
  const boxH    = SIZE + PAD_Y * 2

  rect(page, MARGIN, y - boxH, boxW, boxH, COLOR.accent)
  text(page, title, MARGIN + PAD_X, y - boxH + PAD_Y + 1, boldFont, SIZE, COLOR.white)

  return y - boxH - 16
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function generate() {
  const doc  = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const reg  = await doc.embedFont(StandardFonts.Helvetica)

  const page = doc.addPage([PAGE_W, PAGE_H])

  // Full-page background
  rect(page, 0, 0, PAGE_W, PAGE_H, COLOR.bg)

  // ── Header band ──────────────────────────────────────────────────────────
  const HEADER_H = 110
  rect(page, 0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, COLOR.surface)

  // Gold accent bar at very top
  rect(page, 0, PAGE_H - 4, PAGE_W, 4, COLOR.gold)

  // Title
  const TITLE      = 'KLO App — Deep Link Configuration Guide'
  const TITLE_SIZE = 18
  const titleX     = MARGIN
  const titleY     = PAGE_H - 42
  text(page, TITLE, titleX, titleY, bold, TITLE_SIZE, COLOR.white)

  // Subtitle
  const SUBTITLE      = 'Steps to enable app deep linking on iOS and Android'
  const SUBTITLE_SIZE = 11
  text(page, SUBTITLE, titleX, titleY - 24, reg, SUBTITLE_SIZE, COLOR.muted)

  // Thin accent rule under header
  rect(page, 0, PAGE_H - HEADER_H - 2, PAGE_W, 2, COLOR.accent)

  // ── Body cursor ──────────────────────────────────────────────────────────
  let y = PAGE_H - HEADER_H - 30

  // ── SECTION 1 ────────────────────────────────────────────────────────────
  y = drawSectionHeader(page, 'Section 1: Apple Developer Team ID (for iOS Universal Links)', bold, y)

  const appleSteps = [
    {
      label: 'Go to https://developer.apple.com and sign in',
      body:  [],
    },
    {
      label: 'Click "Account" in the top navigation',
      body:  [],
    },
    {
      label: 'Under "Membership Details", find "Team ID"',
      body:  wrapText(
        'It is a 10-character alphanumeric code — for example: A1B2C3D4E5',
        reg, 10, CONTENT_W - 34
      ),
    },
    {
      label: 'Copy the Team ID and send it to Tim',
      body:  [],
    },
  ]

  for (let i = 0; i < appleSteps.length; i++) {
    const s = appleSteps[i]
    y = drawStep(page, i + 1, s.label, s.body, bold, reg, y)
  }

  y -= 10
  rule(page, y)
  y -= 26

  // ── SECTION 2 ────────────────────────────────────────────────────────────
  y = drawSectionHeader(page, 'Section 2: Android Signing Key SHA-256 (for Android App Links)', bold, y)

  const androidSteps = [
    {
      label: 'Open Google Play Console at https://play.google.com/console',
      body:  [],
    },
    {
      label: 'Select the "Keith L. Odom" app',
      body:  [],
    },
    {
      label: 'Go to Setup > App signing (left sidebar under "App integrity")',
      body:  [],
    },
    {
      label: 'Under "App signing key certificate", find the SHA-256 fingerprint',
      body:  [],
    },
    {
      label: 'It looks like this (hex characters separated by colons):',
      body:  [
        'AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:',
        'AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90',
      ],
    },
    {
      label: 'Copy the full SHA-256 fingerprint and send it to Tim',
      body:  [],
    },
  ]

  for (let i = 0; i < androidSteps.length; i++) {
    const s = androidSteps[i]
    y = drawStep(page, i + 1, s.label, s.body, bold, reg, y)
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const FOOTER_H = 46
  rect(page, 0, 0, PAGE_W, FOOTER_H, COLOR.surface)
  rect(page, 0, FOOTER_H - 1, PAGE_W, 1, COLOR.divider)

  const FOOTER_TEXT = 'Once Tim receives both values, the deep linking configuration will be completed automatically.'
  const FOOTER_SIZE = 9
  const ftW = reg.widthOfTextAtSize(FOOTER_TEXT, FOOTER_SIZE)
  text(page, FOOTER_TEXT, (PAGE_W - ftW) / 2, 16, reg, FOOTER_SIZE, COLOR.muted)

  // ── Write file ────────────────────────────────────────────────────────────
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const outPath   = path.resolve(__dirname, '..', 'public', 'klo-deep-link-guide.pdf')

  const pdfBytes = await doc.save()
  writeFileSync(outPath, pdfBytes)

  console.log(`PDF written → ${outPath}`)
  console.log(`Size: ${(pdfBytes.length / 1024).toFixed(1)} KB`)
}

generate().catch((err) => {
  console.error('PDF generation failed:', err)
  process.exit(1)
})
