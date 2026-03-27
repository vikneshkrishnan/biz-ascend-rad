import { jsPDF } from 'jspdf'
import { PILLAR_WEIGHTS, PILLAR_NAMES, MATURITY_BANDS, DIAGNOSTIC_PILLARS, CAUSAL_LINKAGES } from '@/lib/constants'

const COLORS = {
  primary: [29, 107, 114],     // Teal #1d6b72
  tealLight: [42, 144, 153],   // Teal Light #2a9099
  accent: [42, 144, 153],      // Teal Light #2a9099 (gradient endpoint)
  dark: [26, 43, 53],          // Dark #1a2b35
  medium: [74, 85, 104],       // Mid #4a5568
  light: [74, 85, 104],        // Mid #4a5568 (secondary text)
  lavender: [184, 184, 209],   // Soft Lavender #B8B8D1 (neutral/informational accent)
  white: [255, 255, 255],
  bg: [247, 249, 251],         // Light #f7f9fb
  border: [221, 227, 234],     // Border #dde3ea
  pearl: [247, 249, 251],      // Light #f7f9fb (same as bg)
  green: [29, 107, 114],       // Teal #1d6b72 (Strong)
  sage: [107, 143, 113],       // Sage #6b8f71 (Developing)
  gold: [201, 168, 76],        // Gold #c9a84c (Fragile)
  coral: [192, 57, 43],        // Coral #c0392b (At Risk)
  darkCard: [26, 43, 53],      // Dark #1a2b35
  oceanBlue: [42, 144, 153],   // Teal Light #2a9099
}

// Default thresholds - can be overridden via platform_settings
const DEFAULT_THRESHOLDS = { green: 80, yellow: 65, orange: 50 }
let activeThresholds = DEFAULT_THRESHOLDS

function getBandColor(score) {
  if (score >= 80) return COLORS.green     // Soft Teal — Strong
  if (score >= 60) return COLORS.sage      // Warm Sage — Developing
  if (score >= 50) return COLORS.gold      // Muted Gold — Fragile/Amber
  return COLORS.coral                       // Warm Coral — At Risk
}

// 4-tier maturity band colour (cover page badge, overall maturity)
function getMaturityColor(score) {
  if (score >= 80) return COLORS.green     // Strong
  if (score >= 60) return COLORS.sage      // Developing
  if (score >= 50) return COLORS.gold      // Fragile
  return COLORS.coral                       // At Risk
}

function getBandLabel(score) {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Developing'
  if (score >= 50) return 'Fragile'
  return 'At Risk'
}

function getBandName(score) {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Developing'
  if (score >= 50) return 'Fragile'
  return 'At Risk'
}

function getScoreColor(score, isQuestion = false) {
  if (isQuestion) {
    if (score <= 2) return COLORS.coral
    if (score === 3) return COLORS.gold
    return COLORS.green
  }
  if (score < 40) return COLORS.coral
  if (score < 60) return COLORS.gold
  if (score < 80) return COLORS.sage
  return COLORS.green
}

function pillarLabel(pid) {
  return `P${pid.replace('p', '')} ${PILLAR_NAMES[pid] || pid}`
}

async function loadImageAsBase64(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function buildCrossPillarFallback(pillarScores) {
  const pLabel = (pid) => `P${pid.replace('p', '')}. ${PILLAR_NAMES[pid] || pid}`
  const pScore = (pid) => pillarScores[pid]?.score ?? 0
  const band = (s) => s < 40 ? 'Critical' : s < 60 ? 'Developing' : s < 80 ? 'Functional' : 'Strong'

  // Find active causal linkages (from_pillar < 65%)
  const activeLinkages = CAUSAL_LINKAGES.filter(link => {
    const score = pScore(link.from)
    return score < 65 || link.to === 'all'
  })

  // Sort pillars by score ascending to find weakest
  const sortedPillars = Object.keys(PILLAR_NAMES).sort((a, b) => pScore(a) - pScore(b))
  const weakest3 = sortedPillars.slice(0, 3)

  // Build primary causal chain from weakest pillars that have a linkage path
  const chainPillars = []
  for (const link of activeLinkages) {
    if (chainPillars.length >= 3) break
    if (!chainPillars.includes(link.from)) chainPillars.push(link.from)
    if (link.to !== 'all' && !chainPillars.includes(link.to)) chainPillars.push(link.to)
  }
  // Pad with weakest pillars if needed
  for (const pid of weakest3) {
    if (chainPillars.length >= 3) break
    if (!chainPillars.includes(pid)) chainPillars.push(pid)
  }
  const chain3 = chainPillars.slice(0, 3)

  // Find reinforcing loop pairs (both < 50%)
  const loopLinks = CAUSAL_LINKAGES.filter(link =>
    link.to !== 'all' && pScore(link.from) < 50 && pScore(link.to) < 50
  )
  const loopPillars = new Set()
  for (const link of loopLinks) {
    loopPillars.add(link.from)
    loopPillars.add(link.to)
  }
  // Ensure at least 4 nodes for the loop, padding with weakest pillars
  const loopArr = [...loopPillars]
  for (const pid of sortedPillars) {
    if (loopArr.length >= 4) break
    if (!loopArr.includes(pid)) loopArr.push(pid)
  }
  const loop4 = loopArr.slice(0, 4)

  // Build intervention sequence from weakest 4 pillars
  const intervene4 = sortedPillars.slice(0, 4)
  const timelines = ['0-30 days', '30-60 days', '60-90 days', '90-120 days']

  return {
    introduction: `This analysis examines how ${PILLAR_NAMES[chain3[0]] || 'key pillars'} and related pillars interact to create cascading effects across the growth system. The scores reveal interdependencies where weakness in one area compounds challenges in others, creating systemic drag on commercial performance.`,
    narrative: null,
    primary_causal_chain: {
      nodes: chain3.map((pid, i) => ({
        pillar_label: PILLAR_NAMES[pid] || pid,
        connector_label: i < chain3.length - 1 ? 'drives' : '',
      })),
      explanation_bullets: [
        `Root cause -- ${pLabel(chain3[0])} (${pScore(chain3[0])}%, ${band(pScore(chain3[0]))}): This pillar's low score creates the initial weakness in the growth system.`,
        `First-order consequence -- ${pLabel(chain3[1])} (${pScore(chain3[1])}%, ${band(pScore(chain3[1]))}): Directly impacted by upstream weakness, compounding performance gaps.`,
        `Second-order consequence -- ${pLabel(chain3[2])} (${pScore(chain3[2])}%, ${band(pScore(chain3[2]))}): The downstream effect further degrades commercial outcomes.`,
        `Cascade effect: Each step degrades the next. ${PILLAR_NAMES[chain3[0]]} weakness flows through ${PILLAR_NAMES[chain3[1]]} into ${PILLAR_NAMES[chain3[2]]}.`,
        `Why ${pLabel(chain3[0])} is the highest-leverage entry point: Fixing the root cause at ${pScore(chain3[0])}% unlocks improvements across all downstream pillars.`,
      ],
    },
    reinforcing_loop: {
      title: 'Reinforcing Loop: The Vicious Cycle',
      nodes: loop4.map(pid => ({
        pillar_id: pid,
        label: PILLAR_NAMES[pid] || pid,
        sub_label: `${pScore(pid)}%, ${band(pScore(pid))}`,
      })),
      explanation_bullets: [
        `Weak ${PILLAR_NAMES[loop4[0]]} (${pLabel(loop4[0])}, ${pScore(loop4[0])}%): Low performance here initiates the negative feedback cycle.`,
        `${PILLAR_NAMES[loop4[1]]} drag (${pLabel(loop4[1])}, ${pScore(loop4[1])}%): Compounds the weakness from ${PILLAR_NAMES[loop4[0]]}.`,
        `${PILLAR_NAMES[loop4[2]]} impact (${pLabel(loop4[2])}, ${pScore(loop4[2])}%): Further reinforces the downward spiral.`,
        `Self-sustaining nature: These pillars form a mathematically self-reinforcing loop where each weakness feeds the others.`,
        `The unlock: Breaking the cycle at ${PILLAR_NAMES[loop4[0]]} (the weakest link at ${pScore(loop4[0])}%) offers the highest leverage for systemic improvement.`,
      ],
    },
    intervention_sequence: {
      steps: intervene4.map((pid, i) => ({
        step_number: i + 1,
        title: `Fix ${PILLAR_NAMES[pid]}`,
        subtitle: `Currently at ${pScore(pid)}%`,
        timeline: timelines[i],
      })),
      explanation_bullets: intervene4.map((pid, i) =>
        `Fix ${PILLAR_NAMES[pid]} -- Address ${PILLAR_NAMES[pid]} (${timelines[i]}): Currently scoring ${pScore(pid)}%, this pillar requires targeted intervention to break the constraint chain and unlock downstream improvements.`
      ),
    },
    section_takeaway: [
      `The cross-pillar analysis reveals that ${PILLAR_NAMES[chain3[0]]}, ${PILLAR_NAMES[chain3[1]]}, and ${PILLAR_NAMES[chain3[2]]} form an interconnected chain where weakness compounds across the growth system. With scores of ${pScore(chain3[0])}%, ${pScore(chain3[1])}%, and ${pScore(chain3[2])}% respectively, these pillars represent the primary drag on commercial performance.`,
      `The recommended intervention sequence prioritises ${PILLAR_NAMES[intervene4[0]]} as the highest-leverage starting point, followed by systematic improvements across the remaining weak pillars over a 120-day horizon. Breaking the reinforcing loop at its weakest point will create positive momentum across the entire growth system.`,
    ],
    causal_links: activeLinkages.map(link => ({
      from_pillar: link.from,
      to_pillar: link.to,
      mechanism: link.label,
      severity: pScore(link.from) < 40 ? 'critical' : 'moderate',
    })),
    reinforcing_loops: loopLinks.map(link => ({
      pillars: [link.from, link.to],
      description: `${PILLAR_NAMES[link.from]} and ${PILLAR_NAMES[link.to]} form a reinforcing loop where weakness in one compounds the other.`,
    })),
    data_source: 'deterministic_fallback',
  }
}

export async function generateClientPdf({ scores, report, project, screenerResponses, diagnosticResponses, thresholds }) {
  if (thresholds) activeThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 0

  const sr = screenerResponses || {}
  const dr = diagnosticResponses || {}
  const company = sr.q4 || project?.company_name || 'Company'
  const industry = sr.q5 || 'Industry'
  const markets = sr.q6 || 'N/A'
  const marketsStr = Array.isArray(markets) ? markets.join(', ') : String(markets)
  const radScore = scores?.radScore || 0
  const maturityBand = (MATURITY_BANDS.find(b => radScore >= b.min && radScore <= b.max) || {}).label || getBandName(radScore)
  const constraint = scores?.primaryConstraint || {}
  const pillarScores = scores?.pillarScores || {}
  const raps = scores?.raps || {}
  const bandColor = getMaturityColor(radScore)
  const dateStr = report?.generated_at
    ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const marketReport = report?.market_report || {}
  const isHighPerformer = radScore > 75
  const clusterScores = scores?.clusterScores || {}
  const aiReadinessIndex = scores?.aiReadinessIndex || null
  // diagnosticResponses is now passed as a parameter

  // --- Utility functions ---
  function addPage() {
    doc.addPage()
    y = margin + 16
    addFooter()
  }

  function checkSpace(needed) {
    if (y + needed > pageH - 15) {
      addPage()
      return true
    }
    return false
  }

  function addFooter() {
    const pageNum = doc.internal.getNumberOfPages()
    // Save current font state before footer rendering
    const prevFontSize = doc.getFontSize()
    const prevFont = doc.getFont()
    const prevTextColor = doc.getTextColor()

    doc.setFontSize(7)
    doc.setTextColor(...COLORS.medium)
    doc.text('Biz Ascend RAD\u2122 is the proprietary growth diagnostic tool of Biz Ascend Pte. Ltd.', margin, pageH - 8)
    // Page number placeholder — total pages filled in at the end via addPageNumbers()
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 8, { align: 'right' })

    // Restore previous font state so callers aren't affected by footer rendering
    doc.setFontSize(prevFontSize)
    doc.setFont(prevFont.fontName, prevFont.fontStyle)
    doc.setTextColor(prevTextColor)
  }

  // Call after all pages are generated to overwrite footers with "Page X of Y"
  function addPageNumbers() {
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(...COLORS.medium)
      // White-out the old page number area then redraw
      doc.setFillColor(255, 255, 255)
      doc.rect(pageW - margin - 30, pageH - 11, 30, 6, 'F')
      doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
    }
  }

  function drawLine(yPos, color = COLORS.border) {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageW - margin, yPos)
  }

  function drawRoundedRect(x, yPos, w, h, r, fillColor) {
    doc.setFillColor(...fillColor)
    doc.roundedRect(x, yPos, w, h, r, r, 'F')
  }

  function sectionTitle(title) {
    checkSpace(20)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(title.toUpperCase(), margin, y)
    y += 2
    drawLine(y, COLORS.primary)
    y += 12
  }


  function subHeading(text) {
    checkSpace(14)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(text, margin, y)
    y += 9
  }

  // Sanitize text for jsPDF — replace unicode chars that Helvetica can't render
  function sanitizeText(text) {
    if (!text) return text
    return text
      .replace(/→|➜|➡|⟶|►|▶/g, '-->')
      .replace(/←|◄|◀/g, '<--')
      .replace(/↑/g, '^')
      .replace(/↓/g, 'v')
      .replace(/•/g, '-')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/…/g, '...')
      .replace(/—/g, ' -- ')
      .replace(/–/g, '-')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/[^\x00-\x7F]/g, c => {
        // Replace any remaining non-ASCII with closest ASCII or remove
        return c.charCodeAt(0) > 127 ? '' : c
      })
  }

  // Uppercase all pillar references (p1, p2_q3, etc.) in text
  function capPillarRefs(text) {
    if (!text) return text
    return text.replace(/\b(p\d+(?:_q\d+)?)\b/gi, match => match.toUpperCase())
  }

  // Render a line of text with pillar references (P1, P2_Q3, etc.) in bold
  function renderLineWithBoldPillars(line, x, yPos, baseFontStyle) {
    // Split line into segments: alternating normal text and pillar refs
    const segments = []
    const pillarPattern = /\b(P\d+(?:_Q\d+)?)\b/g
    let lastIdx = 0
    let match
    while ((match = pillarPattern.exec(line)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ text: line.substring(lastIdx, match.index), bold: false })
      }
      segments.push({ text: match[1], bold: true })
      lastIdx = match.index + match[1].length
    }
    if (lastIdx < line.length) {
      segments.push({ text: line.substring(lastIdx), bold: false })
    }

    // Render each segment, measuring width in the correct font
    let curX = x
    for (const seg of segments) {
      const style = seg.bold ? 'bold' : baseFontStyle
      doc.setFont('helvetica', style)
      doc.text(seg.text, curX, yPos)
      curX += doc.getTextWidth(seg.text)
    }
    // Restore base font
    doc.setFont('helvetica', baseFontStyle)
  }

  function bodyText(text, opts = {}) {
    if (!text) return
    text = sanitizeText(capPillarRefs(text))
    const { fontSize = 10, color = COLORS.dark, indent = 0, bold = false, italic = false, lineHeight = 1.5 } = opts
    const baseFontStyle = bold ? 'bold' : italic ? 'italic' : 'normal'
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', baseFontStyle)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW - indent)
    const lineSpacing = fontSize * 0.353 * lineHeight
    for (const line of lines) {
      checkSpace(lineSpacing + 2)
      if (/\bP\d+(?:_Q\d+)?\b/.test(line)) {
        renderLineWithBoldPillars(line, margin + indent, y, baseFontStyle)
      } else {
        doc.text(line, margin + indent, y)
      }
      y += lineSpacing
    }
    y += 5
  }

  function bulletPoint(text, opts = {}) {
    if (!text) return
    text = sanitizeText(capPillarRefs(String(text)))
    const { indent = 0, fontSize = 9, color = COLORS.dark, boldLeadIn = true } = opts
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)

    // Detect bold lead-in: find "label: rest" where label ends with ": " (colon + space)
    // Matches: "ROOT CAUSE:", "Root cause — P4: ... (38.2%, At Risk):", "Cascade effect:", "**bold:**"
    // Strategy: find the last ": " preceded by ")" or a word boundary within first 120 chars
    let colonIdx = -1
    if (boldLeadIn) {
    // For patterns like "Root cause — P4: Sales System Repeatability (38.2%, At Risk): explanation"
    // find the colon that's followed by a space and lowercase/normal text (the explanation start)
    const colonSpaceMatch = text.match(/:\s/)
    if (colonSpaceMatch) {
      // Check if there's a later ": " after a closing paren — that's the real split point
      const afterParenMatch = text.match(/\):\s/)
      if (afterParenMatch && afterParenMatch.index < 120) {
        colonIdx = afterParenMatch.index + 1
      } else if (colonSpaceMatch.index < 100) {
        colonIdx = colonSpaceMatch.index
      }
    }
    }
    const leadIn = colonIdx > 0 ? text.substring(0, colonIdx + 1) : null
    const isBoldLeadIn = leadIn && (leadIn.length < 120) && (/^[A-Z]/.test(leadIn) || /^\*\*/.test(leadIn))

    if (isBoldLeadIn) {
      const boldPart = leadIn.replace(/^\*\*|\*\*$/g, '')
      const restPart = text.substring(colonIdx + 1).trim()
      const lineSpacing = fontSize * 0.353 * 1.4
      const textW = contentW - indent - 5

      // Check if bold part fits on one line
      doc.setFont('helvetica', 'bold')
      const boldW = doc.getTextWidth(boldPart + ' ')

      if (boldW < textW) {
        // Bold + start of rest on same line
        checkSpace(lineSpacing + 2)
        doc.text('\u2022', margin + indent, y)
        doc.setFont('helvetica', 'bold')
        doc.text(boldPart, margin + indent + 4, y)

        doc.setFont('helvetica', 'normal')
        const availW = textW - boldW
        const firstLineText = doc.splitTextToSize(restPart, availW)
        doc.text(firstLineText[0] || '', margin + indent + 4 + boldW, y)
        y += lineSpacing

        // Remaining normal text
        if (restPart.length > (firstLineText[0] || '').length) {
          const remaining = restPart.substring((firstLineText[0] || '').length).trim()
          const remLines = doc.splitTextToSize(remaining, textW)
          for (const line of remLines) {
            checkSpace(lineSpacing + 2)
            if (/\bP\d+(?:_Q\d+)?\b/.test(line)) {
              renderLineWithBoldPillars(line, margin + indent + 4, y, 'normal')
            } else {
              doc.text(line, margin + indent + 4, y)
            }
            y += lineSpacing
          }
        }
      } else {
        // Bold part wraps across multiple lines, then rest follows
        checkSpace(lineSpacing + 2)
        doc.text('\u2022', margin + indent, y)
        doc.setFont('helvetica', 'bold')
        const boldLines = doc.splitTextToSize(boldPart, textW)
        for (let bi = 0; bi < boldLines.length; bi++) {
          if (bi > 0) checkSpace(lineSpacing + 2)
          doc.text(boldLines[bi], margin + indent + 4, y)
          y += lineSpacing
        }

        // Rest as normal text
        if (restPart) {
          doc.setFont('helvetica', 'normal')
          const restLines = doc.splitTextToSize(restPart, textW)
          for (const line of restLines) {
            checkSpace(lineSpacing + 2)
            if (/\bP\d+(?:_Q\d+)?\b/.test(line)) {
              renderLineWithBoldPillars(line, margin + indent + 4, y, 'normal')
            } else {
              doc.text(line, margin + indent + 4, y)
            }
            y += lineSpacing
          }
        }
      }
      y += 1
    } else {
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(text, contentW - indent - 5)
      const lineSpacing = fontSize * 0.353 * 1.4
      for (let i = 0; i < lines.length; i++) {
        checkSpace(lineSpacing + 2)
        if (i === 0) {
          doc.text('\u2022', margin + indent, y)
        }
        if (/\bP\d+(?:_Q\d+)?\b/.test(lines[i])) {
          renderLineWithBoldPillars(lines[i], margin + indent + 4, y, 'normal')
        } else {
          doc.text(lines[i], margin + indent + 4, y)
        }
        y += lineSpacing
      }
      y += 1
    }
  }

  // Draw a simple table
  function drawTable(headers, rows, opts = {}) {
    const { colWidths, fontSize = 9, rowHeight = 7, rowColors, headerColor } = opts
    const totalCols = headers.length
    const cws = colWidths || headers.map(() => contentW / totalCols)

    checkSpace(rowHeight * (rows.length + 1) + 4)

    // Header
    let x = margin
    drawRoundedRect(margin, y - 1, contentW, rowHeight + 1, 1, headerColor || COLORS.primary)
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    for (let i = 0; i < totalCols; i++) {
      doc.text(headers[i], x + 2, y + 4)
      x += cws[i]
    }
    y += rowHeight + 1

    // Rows
    doc.setFont('helvetica', 'normal')
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      checkSpace(rowHeight + 2)
      x = margin

      // Alternating Pearl rows
      if (ri % 2 === 0) {
        drawRoundedRect(margin, y - 1, contentW, rowHeight, 0, COLORS.pearl)
      }

      drawLine(y - 1, COLORS.border)
      for (let i = 0; i < totalCols; i++) {
        const cell = String(row[i] || '')
        const truncated = cell.length > Math.floor(cws[i] / 1.8) ? cell.substring(0, Math.floor(cws[i] / 1.8)) + '..' : cell
        if (rowColors && i === totalCols - 1 && rowColors[ri]) {
          doc.setFillColor(...rowColors[ri])
          doc.circle(x + 2, y + 3, 1.5, 'F')
          doc.setTextColor(...rowColors[ri])
          doc.text(truncated, x + 7, y + 4)
        } else {
          doc.setTextColor(...COLORS.dark)
          doc.text(truncated, x + 2, y + 4)
        }
        x += cws[i]
      }
      y += rowHeight
    }
    y += 6
  }

  // --- Chart drawing functions ---

  // Draw a radar/spider chart
  function drawRadarChart(data, opts = {}) {
    const { cx, cy, radius = 40, labelOffset = 12 } = opts
    const n = data.length
    if (n < 3) return
    const angleStep = (2 * Math.PI) / n
    const startAngle = -Math.PI / 2 // start from top

    // Helper: get point on radar
    const getPoint = (index, value) => {
      const angle = startAngle + index * angleStep
      const r = (value / 100) * radius
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    }

    // Draw grid rings (20, 40, 60, 80, 100) — Slate Grey at 15% opacity per spec
    for (let ring = 20; ring <= 100; ring += 20) {
      doc.setDrawColor(...COLORS.medium)
      doc.setGState(new doc.GState({ opacity: 0.20 }))
      doc.setLineWidth(0.2)
      for (let i = 0; i < n; i++) {
        const p1 = getPoint(i, ring)
        const p2 = getPoint((i + 1) % n, ring)
        doc.line(p1.x, p1.y, p2.x, p2.y)
      }
    }
    doc.setGState(new doc.GState({ opacity: 1 }))

    // Draw axis lines — Slate Grey at 20% opacity per spec
    doc.setDrawColor(...COLORS.medium)
    doc.setGState(new doc.GState({ opacity: 0.20 }))
    doc.setLineWidth(0.15)
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, 100)
      doc.line(cx, cy, p.x, p.y)
    }
    doc.setGState(new doc.GState({ opacity: 1 }))

    // Draw data polygon (filled)
    const points = data.map((d, i) => getPoint(i, d.score))

    // Draw data polygon outline - Soft Teal at 0.8 opacity per spec
    doc.setDrawColor(...COLORS.green)
    doc.setGState(new doc.GState({ opacity: 0.8 }))
    doc.setLineWidth(0.8)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      doc.line(p1.x, p1.y, p2.x, p2.y)
    }
    doc.setGState(new doc.GState({ opacity: 1 }))

    // Fill with semi-transparent Soft Teal at 0.15 opacity per spec
    doc.setLineWidth(0)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      doc.setFillColor(...COLORS.green)
      doc.setGState(new doc.GState({ opacity: 0.15 }))
      doc.triangle(cx, cy, p1.x, p1.y, p2.x, p2.y, 'F')
    }
    doc.setGState(new doc.GState({ opacity: 1 }))

    // Draw 80% target ring — dashed gold line
    if (opts.showTarget) {
      doc.setDrawColor(...COLORS.gold)
      doc.setLineWidth(0.4)
      doc.setLineDashPattern([2, 2], 0)
      for (let i = 0; i < n; i++) {
        const p1 = getPoint(i, 80)
        const p2 = getPoint((i + 1) % n, 80)
        doc.line(p1.x, p1.y, p2.x, p2.y)
      }
      doc.setLineDashPattern([], 0)
    }

    // Draw data points — band-colored if scores provided
    for (let i = 0; i < points.length; i++) {
      const dotColor = opts.bandColors ? getBandColor(data[i].score) : COLORS.green
      doc.setFillColor(...dotColor)
      doc.circle(points[i].x, points[i].y, 1.5, 'F')
    }

    // Draw labels
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep
      const lx = cx + (radius + labelOffset) * Math.cos(angle)
      const ly = cy + (radius + labelOffset) * Math.sin(angle)
      const label = data[i].label
      const align = Math.abs(Math.cos(angle)) < 0.1 ? 'center' : Math.cos(angle) > 0 ? 'left' : 'right'
      // Wrap long labels
      const words = label.split(' ')
      const lines = []
      let current = ''
      for (const w of words) {
        if (current && (current + ' ' + w).length > 16) { lines.push(current); current = w }
        else { current = current ? current + ' ' + w : w }
      }
      if (current) lines.push(current)
      for (let li = 0; li < lines.length; li++) {
        doc.text(lines[li], lx, ly + li * 3, { align })
      }
    }
  }

  // Draw horizontal bar chart
  function drawHBarChart(data, opts = {}) {
    const { barHeight = 6, gap = 3, labelWidth = 50, maxWidth } = opts
    const barMaxW = (maxWidth || contentW) - labelWidth - 20
    let barItemIdx = 0

    // Pre-check: ensure entire chart fits on one page
    const totalChartH = data.length * (barHeight + gap) + 6
    checkSpace(totalChartH)

    for (const item of data) {

      // Label
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const truncLabel = item.label.length > 38 ? item.label.substring(0, 38) + '..' : item.label
      doc.text(truncLabel, margin, y + barHeight / 2 + 1)

      // Background bar — flat rectangle
      const barX = margin + labelWidth
      doc.setFillColor(...COLORS.border)
      doc.rect(barX, y, barMaxW, barHeight, 'F')

      // Value bar — flat rectangle, semi-transparent fill
      const color = getBandColor(item.score)
      doc.setFillColor(...color)
      doc.setDrawColor(...color)
      doc.setLineWidth(0.5)
      const valW = Math.max(barMaxW * (item.score / 100), 1)
      doc.setGState(new doc.GState({ opacity: 0.85 }))
      doc.rect(barX, y, valW, barHeight, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.rect(barX, y, valW, barHeight, 'S')

      // Score label
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(String(item.score) + '%', barX + barMaxW + 3, y + barHeight / 2 + 1)

      // 80% target dashed line
      const targetX = barX + (barMaxW * 0.8)
      doc.setDrawColor(...COLORS.gold)
      doc.setLineWidth(0.4)
      doc.setLineDashPattern([2, 2], 0)
      doc.line(targetX, y, targetX, y + barHeight)
      doc.setLineDashPattern([], 0)
      // On first item only, add "Target (80%)" label
      if (barItemIdx === 0) {
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.gold)
        doc.text('Target (80%)', targetX - 1, y - 1.5, { align: 'center' })
      }

      y += barHeight + gap
      barItemIdx++
    }
    y += 4
  }

  // Draw a semicircle gauge
  function drawGauge(score, opts = {}) {
    const { cx, cy, radius = 30, label = '' } = opts
    const startAngle = Math.PI // left (180deg)

    // Background arc segments - new colors
    const segments = [
      { from: 0, to: 0.5, color: COLORS.coral },
      { from: 0.5, to: 0.64, color: COLORS.gold },
      { from: 0.64, to: 0.79, color: COLORS.sage },
      { from: 0.79, to: 1, color: COLORS.green },
    ]

    for (const seg of segments) {
      const a1 = startAngle - seg.from * Math.PI
      const a2 = startAngle - seg.to * Math.PI
      doc.setDrawColor(...seg.color)
      doc.setLineWidth(5)
      const steps = 20
      for (let i = 0; i < steps; i++) {
        const t1 = a1 + (a2 - a1) * (i / steps)
        const t2 = a1 + (a2 - a1) * ((i + 1) / steps)
        const x1 = cx + radius * Math.cos(t1)
        const y1 = cy - radius * Math.sin(t1)
        const x2 = cx + radius * Math.cos(t2)
        const y2 = cy - radius * Math.sin(t2)
        doc.line(x1, y1, x2, y2)
      }
    }

    // Needle - Deep Navy
    const normalizedScore = Math.min(Math.max(score / 100, 0), 1)
    const needleAngle = startAngle - normalizedScore * Math.PI
    const nx = cx + (radius - 8) * Math.cos(needleAngle)
    const ny = cy - (radius - 8) * Math.sin(needleAngle)
    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(1)
    doc.line(cx, cy, nx, ny)

    // Center dot - Deep Navy
    doc.setFillColor(...COLORS.primary)
    doc.circle(cx, cy, 2, 'F')

    // Score text - 24pt with %, status colour per spec
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...getBandColor(score))
    doc.text(`${score}%`, cx, cy + 10, { align: 'center' })

    if (label) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      doc.text(label, cx, cy + 16, { align: 'center' })
    }

    // Scale labels
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.light)
    doc.text('0', cx - radius - 4, cy + 3, { align: 'center' })
    doc.text('100', cx + radius + 4, cy + 3, { align: 'center' })
    doc.text('50', cx, cy - radius - 3, { align: 'center' })
  }

  // Draw revenue waterfall chart
  function drawWaterfallChart(data, opts = {}) {
    if (!data) return
    const { width = contentW, height = 60 } = opts
    const startX = margin
    const startY = y
    const bars = [
      { label: 'FY Target', value: data.target || 0, color: COLORS.primary },
      { label: 'YTD Invoiced', value: data.invoiced || 0, color: COLORS.sage },
      { label: 'Remaining Target', value: data.remaining || 0, color: COLORS.gold },
      { label: 'Expected\nConvertible', value: data.expected_convertible || 0, color: COLORS.primary },
      { label: 'Revenue at Risk', value: data.gap || 0, color: COLORS.coral },
    ]

    const maxVal = Math.max(...bars.map(b => Math.abs(b.value)), 1)
    const chartLeftPad = 18
    const barAreaW = width - chartLeftPad - 4
    const barW = barAreaW / bars.length

    checkSpace(height + 20)

    // Y-axis labels
    const axisSteps = 5
    doc.setFontSize(5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.medium)
    for (let s = 0; s <= axisSteps; s++) {
      const val = (maxVal / axisSteps) * s
      const axisY = startY + height - 10 - ((val / maxVal) * (height - 20))
      const fmtVal = val >= 1000000 ? `US$${(val / 1000000).toFixed(0)}M` : val >= 1000 ? `US$${Math.round(val / 1000)}k` : `US$${Math.round(val)}`
      doc.text(s === 0 ? 'US$0M' : fmtVal, startX, axisY + 1)
    }

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const barH = Math.max((Math.abs(bar.value) / maxVal) * (height - 20), 2)
      const bx = startX + chartLeftPad + i * barW
      const by = startY + height - barH - 10

      doc.setFillColor(...bar.color)
      doc.rect(bx + 2, by, barW - 6, barH, 'F')

      // Value label above bar
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const absVal = Math.abs(bar.value)
      const valStr = absVal >= 1000000 ? `US$${(absVal / 1000000).toFixed(1)}M` : absVal >= 1000 ? `US$${(absVal / 1000).toFixed(0)}k` : `US$${absVal}`
      doc.text(valStr, bx + barW / 2, by - 2, { align: 'center' })

      // Label below
      doc.setFontSize(5.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      const labelLines = bar.label.split('\n')
      for (let li = 0; li < labelLines.length; li++) {
        doc.text(labelLines[li], bx + barW / 2, startY + height - 2 + li * 3, { align: 'center' })
      }
    }
    y = startY + height + 6
  }

  // Draw horizontal scorecard strip
  function drawScorecardStrip(pScores) {
    const entries = Object.entries(pScores).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return

    checkSpace(18)
    const stripH = 14
    const totalWeight = entries.reduce((sum, [pid]) => sum + (PILLAR_WEIGHTS[pid] || 0), 0) || 1

    let sx = margin
    for (const [pid, data] of entries) {
      const weight = PILLAR_WEIGHTS[pid] || 0
      const segW = (weight / totalWeight) * contentW
      const score = data.score || 0
      const color = getBandColor(score)

      doc.setFillColor(...color)
      doc.rect(sx, y, segW, stripH, 'F')

      // Score number in segment
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.white)
      if (segW > 10) {
        doc.text(String(score), sx + segW / 2, y + stripH / 2 + 1, { align: 'center' })
      }

      sx += segW
    }

    // Labels below strip
    y += stripH + 2
    sx = margin
    doc.setFontSize(5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.medium)
    for (const [pid] of entries) {
      const weight = PILLAR_WEIGHTS[pid] || 0
      const segW = (weight / totalWeight) * contentW
      const shortName = `P${pid.replace('p', '')}`
      if (segW > 8) {
        doc.text(shortName, sx + segW / 2, y + 3, { align: 'center' })
      }
      sx += segW
    }
    y += 8
  }

  // Two-column info table (Field | Value | Field | Value)
  function drawInfoTable(pairs) {
    const rowH = 7
    const halfW = contentW / 2

    // Measure widest label to set column width dynamically
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    let maxLabelW = 0
    for (const [label] of pairs) {
      const w = doc.getTextWidth(label)
      if (w > maxLabelW) maxLabelW = w
    }
    const labelW = Math.min(maxLabelW + 4, halfW * 0.65)
    const valMaxW = halfW - labelW - 4

    for (let i = 0; i < pairs.length; i += 2) {
      checkSpace(rowH + 2)
      const isEven = (i / 2) % 2 === 0
      if (isEven) {
        drawRoundedRect(margin, y - 1, contentW, rowH + 1, 0, COLORS.pearl)
      }
      // Left pair
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.medium)
      doc.text(pairs[i][0], margin + 2, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const val1 = String(pairs[i][1] || 'N/A')
      const tVal1 = doc.getTextWidth(val1) > valMaxW ? val1.substring(0, 28) + '..' : val1
      doc.text(tVal1, margin + labelW, y + 4)

      // Right pair (if exists)
      if (i + 1 < pairs.length) {
        const rightX = margin + halfW
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.medium)
        doc.text(pairs[i + 1][0], rightX + 2, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const val2 = String(pairs[i + 1][1] || 'N/A')
        const tVal2 = doc.getTextWidth(val2) > valMaxW ? val2.substring(0, 28) + '..' : val2
        doc.text(tVal2, rightX + labelW, y + 4)
      }
      y += rowH + 1
    }
    y += 6
  }

  // --- v2 helper: Section Takeaway callout box ---
  function renderSectionTakeaway(takeaway) {
    if (!takeaway || !Array.isArray(takeaway) || takeaway.length < 2) return

    const pad = 6
    const textW = contentW - pad * 2
    const lineH = 8.5 * 0.353 * 1.5

    // Measure total height without rendering
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    let measuredH = pad + 5 // top padding + label
    takeaway.forEach((para, i) => {
      const lines = doc.splitTextToSize(String(para || ''), textW)
      measuredH += lines.length * lineH + 3
      if (i === 0) measuredH += 2
    })
    measuredH += pad // bottom padding

    // Ensure it all fits on one page
    checkSpace(measuredH + 4)

    const boxStartY = y

    // Draw light grey background
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, boxStartY, contentW, measuredH, 'F')

    // Draw teal left border
    doc.setDrawColor(...COLORS.green)
    doc.setLineWidth(1.5)
    doc.line(margin + 1, boxStartY, margin + 1, boxStartY + measuredH)
    doc.setLineWidth(0.2)

    // Render content on top of background
    y = boxStartY + pad

    // "SECTION TAKEAWAY" label
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.green)
    doc.text('S E C T I O N   T A K E A W A Y', margin + pad, y)
    y += 6

    // Render paragraphs manually (no bodyText to avoid checkSpace/page breaks inside box)
    takeaway.forEach((para, i) => {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const lines = doc.splitTextToSize(String(para || ''), textW)
      for (const line of lines) {
        doc.text(line, margin + pad, y)
        y += lineH
      }
      y += 3
      if (i === 0) y += 2
    })

    y = boxStartY + measuredH + 4
  }

  // --- v2 helper: Draw a wrapped-text table (for tables with long cell content) ---
  function drawWrappedTable(headers, rows, opts = {}) {
    const { colWidths, fontSize = 8, headerFontSize = 8, headerColor, boldFirstCol = false, rowColors } = opts
    const totalCols = headers.length
    const cws = colWidths || headers.map(() => contentW / totalCols)

    // Header row
    checkSpace(12)
    let x = margin
    drawRoundedRect(margin, y - 1, contentW, 8, 1, headerColor || COLORS.primary)
    doc.setFontSize(headerFontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    for (let i = 0; i < totalCols; i++) {
      doc.text(headers[i], x + 2, y + 4)
      x += cws[i]
    }
    y += 9

    // Data rows
    doc.setFont('helvetica', 'normal')
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]

      // Compute wrapped lines for each cell to determine row height
      doc.setFontSize(fontSize)
      const cellLines = row.map((cell, ci) => {
        let text = sanitizeText(String(cell || ''))
        // For non-first columns, normalize whitespace for clean left-aligned wrapping
        if (ci > 0) text = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        return doc.splitTextToSize(text, cws[ci] - 6)
      })
      const maxLines = Math.max(...cellLines.map(l => l.length))
      const lineH = fontSize * 0.353 * 1.3
      const rowH = Math.max(maxLines * lineH + 3, 7)

      checkSpace(rowH + 2)

      // Alternating row background
      if (ri % 2 === 0) {
        drawRoundedRect(margin, y - 1, contentW, rowH, 0, COLORS.pearl)
      }
      drawLine(y - 1, COLORS.border)

      // Score-colored left border per row
      if (rowColors?.[ri]) {
        doc.setFillColor(...rowColors[ri])
        doc.rect(margin, y - 1, 2, rowH, 'F')
      }

      x = margin
      for (let ci = 0; ci < totalCols; ci++) {
        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', (boldFirstCol && ci === 0) ? 'bold' : 'normal')
        const lines = cellLines[ci]
        for (let li = 0; li < lines.length; li++) {
          doc.text(lines[li], x + 3, y + 3 + li * lineH)
        }
        x += cws[ci]
      }
      y += rowH
    }
    y += 6
  }

  // ========================
  // PAGE 1: COVER PAGE
  // ========================

  // Logo — centered, no top bar
  y = 28
  try {
    const logoBase64 = await loadImageAsBase64('/logo.jpeg')
    const logoW = 70
    const logoH = logoW * (401 / 1600)
    doc.addImage(logoBase64, 'JPEG', pageW / 2 - logoW / 2, y, logoW, logoH)
    y += logoH + 14
  } catch {
    y = 40
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(pageW / 2 - 12, y, 24, 24, 4, 4, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.text('RAD', pageW / 2, y + 15, { align: 'center' })
    y += 38
  }

  // Title — single line
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('B2B Revenue Acceleration Diagnostic [RAD] Report', pageW / 2, y, { align: 'center' })
  y += 14

  // Centered info table — 6 rows, 2 columns, bordered, centered on page
  const coverTableW = 130
  const coverLabelW = 42
  const coverValW = coverTableW - coverLabelW
  const coverTableX = (pageW - coverTableW) / 2
  const coverRowH = 8
  const coverRows = [
    ['Company', company],
    ['Assessment Date', dateStr],
    ['Industry', industry],
    ['Primary Markets', marketsStr],
    ['Revenue Band', sr.q7 || 'N/A'],
    ['Sales Model', sr.q10 || 'N/A'],
  ]

  coverRows.forEach(([label, value]) => {
    // Label cell — bold, light bg
    doc.setFillColor(...COLORS.bg)
    doc.rect(coverTableX, y, coverLabelW, coverRowH, 'F')
    doc.setDrawColor(...COLORS.border)
    doc.rect(coverTableX, y, coverLabelW, coverRowH, 'S')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(label, coverTableX + 4, y + 5.5)

    // Value cell
    doc.rect(coverTableX + coverLabelW, y, coverValW, coverRowH, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    const valStr = String(value || 'N/A')
    const truncVal = doc.getTextWidth(valStr) > coverValW - 8 ? valStr.substring(0, 40) + '...' : valStr
    doc.text(truncVal, coverTableX + coverLabelW + 4, y + 5.5)

    y += coverRowH
  })

  // Score block — text on white, centered, generous spacing
  y += 22
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.primary)
  doc.text('G R O W T H   S Y S T E M   S C O R E', pageW / 2, y, { align: 'center' })
  y += 14

  // Score value — large, band-colored
  doc.setFontSize(42)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...bandColor)
  doc.text(`${radScore.toFixed(1)}%`, pageW / 2, y, { align: 'center' })
  y += 12

  // Maturity band — "Maturity Band:" normal + band name bold
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.dark)
  const mbPrefix = 'Maturity Band: '
  const mbPrefixW = doc.getTextWidth(mbPrefix)
  doc.setFont('helvetica', 'bold')
  const mbBandW = doc.getTextWidth(maturityBand)
  const mbTotalW = mbPrefixW + mbBandW
  const mbStartX = (pageW - mbTotalW) / 2
  doc.setFont('helvetica', 'normal')
  doc.text(mbPrefix, mbStartX, y)
  doc.setFont('helvetica', 'bold')
  doc.text(maturityBand, mbStartX + mbPrefixW, y)
  y += 8

  // Score description (AI-generated) — uppercase, band-colored
  const scoreDesc = report?.executive_summary_v2?.headline_results_description || getBandName(radScore)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...bandColor)
  doc.text(scoreDesc.toUpperCase(), pageW / 2, y, { align: 'center' })

  // Thin teal horizontal line near bottom
  const coverLineY = y + 8
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.8)
  doc.line(margin, coverLineY, pageW - margin, coverLineY)
  doc.setLineWidth(0.2)

  addFooter()

  // ========================
  // PAGE 2: TABLE OF CONTENTS + DISCLAIMER
  // ========================
  addPage()
  y = margin
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('TABLE OF CONTENTS', margin, y)
  y += 4
  drawLine(y, COLORS.primary)
  y += 8

  const tocItems = [
    '1. Executive Summary',
    '2. Company Input Snapshot',
    '3. Growth System Diagnostic Overview',
    '4. Analysis of Lowest Scoring Pillar',
    '5. Pillar-by-Pillar Deep Dive',
    '6. Cross-Pillar Interaction Analysis',
    '7. Competitive Positioning Deep Dive',
    '8. Revenue Achievement Probability Score (RAPS)',
    '9. Market Opportunity Intelligence',
    '10. Organisational & Systems Readiness',
    '11. What Your Inputs Are Collectively Saying',
    '12. Recommended Growth Areas to Focus On',
    '13. 30-60-90 Day Action Roadmap',
    '14. Expected Outcomes If the Plan Is Followed',
    '15. Closing Observation',
    '16. Appendix A: Full Scoring Detail',
  ]

  tocItems.forEach((title) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(title, margin, y)
    y += 7
  })

  // DISCLAIMER section on same page
  y += 14
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('DISCLAIMER', margin, y)
  y += 4
  drawLine(y, COLORS.primary)
  y += 8

  // Sub-section 1: Confidentiality Notice
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Confidentiality Notice', margin, y)
  y += 6
  bodyText(`This report contains confidential and proprietary information prepared exclusively for ${company}. The report may not be reproduced, distributed, or disclosed to any third party without prior written consent from Biz Ascend.`, { fontSize: 8.5 })
  y += 4

  // Sub-section 2: Disclaimer of Liability
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Disclaimer of Liability', margin, y)
  y += 6
  bodyText(`This report is provided for informational purposes only. While the analysis is based on best-available market research and industry benchmarks, Biz Ascend makes no warranty regarding accuracy or completeness. The recommendations are indicative and should be adapted to ${company}'s specific circumstances, competitive environment, and internal capabilities. Biz Ascend is not responsible for outcomes resulting from implementation of these recommendations.`, { fontSize: 8.5 })
  y += 4

  // Sub-section 3: Forward-Looking Statements
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Forward-Looking Statements', margin, y)
  y += 6
  bodyText(`This report contains forward-looking statements, including revenue projections and RAPS scoring. These projections are based on current assumptions and may not materialize if market conditions, competitive dynamics, or organizational execution change. Actual results may differ materially.`, { fontSize: 8.5 })

  // ========================
  // SECTION 1: EXECUTIVE SUMMARY
  // ========================
  addPage()
  sectionTitle('1. Executive Summary')


  const sortedPillars = Object.entries(pillarScores).sort(([a], [b]) => a.localeCompare(b))

  // Headline Results subtitle
  subHeading('Headline Results')

  // Headline Results Table
  {
    checkSpace(50)
    const revenueAtRisk = raps?.revenueRemaining
      ? `US$${Math.round(raps.revenueRemaining * (1 - (raps.winRate || 0.3))).toLocaleString()}`
      : 'N/A'
    const hlRows = [
      ['RAD Score', `${radScore.toFixed(1)}/100`],
      ['Growth System Maturity Band', maturityBand],
      ['Primary Constraint', scores?.primaryConstraint?.name || 'N/A'],
      ['RAPS', `${raps?.score || 'N/A'}/100`],
      ['Revenue at Risk', revenueAtRisk],
    ]

    const hlLabelW = 55
    const hlValueW = contentW - hlLabelW
    for (let hlI = 0; hlI < hlRows.length; hlI++) {
      checkSpace(11)
      // Label column with primary bg
      drawRoundedRect(margin, y - 1, hlLabelW, 10, 0, COLORS.primary)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.white)
      doc.text(hlRows[hlI][0], margin + 3, y + 5.5)
      // Value column with border
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.3)
      doc.rect(margin + hlLabelW, y - 1, hlValueW, 10, 'S')
      // Maturity Band row — render as colored badge
      if (hlRows[hlI][0] === 'Growth System Maturity Band') {
        const badgeText = hlRows[hlI][1].toUpperCase()
        const badgeColor = getMaturityColor(radScore)
        const badgeW = doc.getTextWidth(badgeText) + 6
        const badgeH = 5.5
        const badgeX = margin + hlLabelW + 4
        const badgeY = y + 1
        doc.setFillColor(...badgeColor)
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F')
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.white)
        doc.text(badgeText, badgeX + 3, y + 5)
      } else {
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(hlRows[hlI][1], margin + hlLabelW + 4, y + 5.5)
      }
      y += 11
    }
    y += 6
  }

  // Inline bold heading helper for executive summary bullet sections
  function execSectionHeading(text) {
    checkSpace(12)
    y += 4
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(`${text}:`, margin, y)
    y += 6
  }

  // v2: Executive Summary structured content
  const execV2 = report?.executive_summary_v2
  if (execV2) {
    // Overall Diagnosis bullets
    if (execV2.overall_diagnosis?.length) {
      execSectionHeading('Overall Diagnosis')
      execV2.overall_diagnosis.forEach(b => { bulletPoint(b) })
    }
    // What Is Broken bullets
    if (execV2.what_is_broken?.length) {
      execSectionHeading('What is Broken')
      execV2.what_is_broken.forEach(b => { bulletPoint(b) })
    }
    // Secondary Findings
    if (execV2.secondary_findings?.length) {
      execSectionHeading('Secondary Findings')
      execV2.secondary_findings.forEach(b => { bulletPoint(b) })
    }
    // Positioning Assessment
    if (execV2.positioning_assessment_bullets?.length) {
      execSectionHeading('Current Positioning Assessment')
      execV2.positioning_assessment_bullets.forEach(b => { bulletPoint(b) })
    }
    // Bottom Line
    if (execV2.bottom_line?.length) {
      execSectionHeading('Bottom Line')
      execV2.bottom_line.forEach(b => { bulletPoint(b) })
    }
    // Section Takeaway
    renderSectionTakeaway(execV2.section_takeaway)
  }

  // ========================
  // SECTION 2: COMPANY INPUT SNAPSHOT
  // ========================
  addPage()
  sectionTitle('2. Company Input Snapshot')

  // Company Screener sub-heading
  subHeading('Company Screener')

  const gtmChannels = sr.q11
    ? (Array.isArray(sr.q11) ? sr.q11.join(', ') : String(sr.q11))
    : null

  const parseNum = (v) => { const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? null : n }
  const fmtUSD = (v) => { const n = parseNum(v); return n != null ? `US$${n.toLocaleString()}` : null }
  const remainingTarget = (sr.q18 && sr.q19) ? fmtUSD((parseNum(sr.q18) || 0) - (parseNum(sr.q19) || 0)) : null
  const monthsRemaining = sr.q20 ? (() => {
    const now = new Date()
    const fyEndMonth = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(sr.q20)
    if (fyEndMonth === -1) return null
    let fyEnd = new Date(now.getFullYear(), fyEndMonth + 1, 0)
    if (fyEnd < now) fyEnd = new Date(now.getFullYear() + 1, fyEndMonth + 1, 0)
    return String(Math.max(0, Math.ceil((fyEnd - now) / (1000 * 60 * 60 * 24 * 30))))
  })() : null

  // Build rows — only include if value exists
  const screenerRows = [
    ['Company Name', company],
    ['Assessment Date', dateStr],
    ['Industry', industry],
    ['Primary Markets', marketsStr],
    ['Revenue Band', sr.q7],
    ['Sales Team Size', sr.q8],
    ['Sales Model', sr.q10],
    ['GTM Channels', gtmChannels],
    ['Current Positioning', sr.q12],
    ['Key Competitors', sr.q13],
    ['Avg Deal Size', sr.q14],
    ['Avg Sales Cycle', sr.q15],
    ['Win Rate Range', sr.q17],
    ['Pipeline Value', sr.q16],
    ['FY Revenue Target', fmtUSD(sr.q18)],
    ['YTD Revenue', fmtUSD(sr.q19)],
    ['Remaining Target', remainingTarget],
    ['Months Remaining', monthsRemaining],
  ].filter(([, v]) => v != null && v !== '' && v !== 'N/A')

  // Bordered label-value table (matching reference UI)
  {
    const labelW = 35
    const valW = contentW - labelW
    screenerRows.forEach(([label, value]) => {
      const valStr = String(value)
      doc.setFontSize(8.5)
      const valLines = doc.splitTextToSize(valStr, valW - 6)
      const rowH = Math.max(10, valLines.length * 4 + 6)
      checkSpace(rowH + 1)

      // Draw borders
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.3)
      doc.rect(margin, y, labelW, rowH, 'S')
      doc.rect(margin + labelW, y, valW, rowH, 'S')

      // Label (bold)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.setFontSize(8.5)
      doc.text(label, margin + 3, y + 5)

      // Value (normal)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      valLines.forEach((line, li) => {
        doc.text(line, margin + labelW + 3, y + 5 + li * 4)
      })

      y += rowH
    })
    y += 6
  }

  // Qualitative Responses From Survey (new page)
  addPage()
  subHeading('Qualitative Responses From Survey')

  const qualitativeQuestions = [
    { ref: 'P3/12', key: 'p3_q12', text: 'What is the single biggest competitive challenge you face?' },
    { ref: 'P3/13', key: 'p3_q13', text: 'What is your differentiated value that makes you win against your competitors?' },
    { ref: 'P7/6', key: 'p7_q6', text: 'What is the single biggest strategic constraint limiting your growth right now?' },
    { ref: 'P8/13', key: 'p8_q13', text: 'What is the biggest people issue currently slowing growth?' },
    { ref: 'P9/13', key: 'p9_q13', text: 'What is the biggest systems, data, or AI-readiness issue currently slowing the business down?' },
  ]

  const qualRows = qualitativeQuestions
    .map(q => {
      const response = dr[q.key] || 'Not provided'
      return [`${q.ref}\n${q.text}`, response]
    })

  drawWrappedTable(['Diagnostic Question', 'Response'], qualRows, { colWidths: [contentW * 0.4, contentW * 0.6], fontSize: 8.5, headerColor: COLORS.primary })

  // Section takeaway for company input snapshot
  if (report?.snapshot_interpretations?.section_takeaway) {
    renderSectionTakeaway(report.snapshot_interpretations.section_takeaway)
  }

  // ========================
  // SECTION 3: GROWTH SYSTEM DIAGNOSTIC OVERVIEW
  // ========================
  addPage()

  // Custom mixed-style section title
  {
    checkSpace(20)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    const t1 = '3. GROWTH SYSTEM '
    doc.text(t1, margin, y)
    const t1w = doc.getTextWidth(t1)
    doc.setFont('helvetica', 'bolditalic')
    const t2 = 'DIAGNOSTIC '
    doc.text(t2, margin + t1w, y)
    const t2w = doc.getTextWidth(t2)
    doc.setFont('helvetica', 'bold')
    doc.text('OVERVIEW', margin + t1w + t2w, y)
    y += 2
    drawLine(y, COLORS.primary)
    y += 12
  }

  subHeading('Pillar Performance Matrix')
  y += 2

  // Custom Pillar Performance Matrix table
  {
    const colW = [contentW * 0.34, contentW * 0.10, contentW * 0.12, contentW * 0.18, contentW * 0.16]
    // Adjust last column to fill remaining width
    colW[4] = contentW - colW[0] - colW[1] - colW[2] - colW[3]
    const rowH = 9
    const headerLabels = ['Pillar', 'Weight', 'Raw\nAvg', 'Weighted\nScore', 'Status']

    // Header row — dark teal background
    const headerH = 12
    drawRoundedRect(margin, y - 1, contentW, headerH, 0, COLORS.primary)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    let hx = margin
    for (let ci = 0; ci < headerLabels.length; ci++) {
      const lines = headerLabels[ci].split('\n')
      if (lines.length > 1) {
        doc.text(lines[0], ci === 0 ? hx + 3 : hx + colW[ci] / 2, y + 3, { align: ci === 0 ? 'left' : 'center' })
        doc.text(lines[1], ci === 0 ? hx + 3 : hx + colW[ci] / 2, y + 7, { align: ci === 0 ? 'left' : 'center' })
      } else {
        doc.text(headerLabels[ci], ci === 0 ? hx + 3 : hx + colW[ci] / 2, y + 5.5, { align: ci === 0 ? 'left' : 'center' })
      }
      hx += colW[ci]
    }
    y += headerH

    // Data rows
    for (let ri = 0; ri < sortedPillars.length; ri++) {
      const [pid, data] = sortedPillars[ri]
      const weight = PILLAR_WEIGHTS[pid] || 0
      const weightedScore = (data.score * weight).toFixed(1)
      const status = getBandLabel(data.score).toUpperCase()
      const bandCol = getBandColor(data.score)

      checkSpace(rowH + 1)

      // Alternating row background
      if (ri % 2 === 0) {
        drawRoundedRect(margin, y - 1, contentW, rowH, 0, COLORS.pearl)
      }

      // Row border
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.3)
      doc.line(margin, y - 1, margin + contentW, y - 1)

      let cx = margin

      // Pillar name
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const pillarName = `P${pid.replace('p', '')}. ${PILLAR_NAMES[pid]}`
      doc.text(pillarName, cx + 3, y + 5)
      cx += colW[0]

      // Weight — centered
      doc.text(`${(weight * 100).toFixed(0)}%`, cx + colW[1] / 2, y + 5, { align: 'center' })
      cx += colW[1]

      // Raw Avg — centered
      doc.text(`${(data.avg || 0).toFixed(2)}/5.0`, cx + colW[2] / 2, y + 5, { align: 'center' })
      cx += colW[2]

      // Weighted Score — tinted background cell + bold colored text
      doc.setGState(new doc.GState({ opacity: 0.15 }))
      doc.setFillColor(...bandCol)
      doc.rect(cx, y - 1, colW[3], rowH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...bandCol)
      doc.text(weightedScore, cx + colW[3] / 2, y + 5, { align: 'center' })
      cx += colW[3]

      // Status — colored badge
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const badgeW = doc.getTextWidth(status) + 6
      const badgeH = 5.5
      const badgeX = cx + (colW[4] - badgeW) / 2
      const badgeY = y + (rowH - badgeH) / 2 - 1
      doc.setFillColor(...bandCol)
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(status, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1, { align: 'center' })

      y += rowH
    }

    // OVERALL SCORE row
    {
      checkSpace(rowH + 2)
      // Thicker top border
      doc.setDrawColor(...COLORS.dark)
      doc.setLineWidth(0.6)
      doc.line(margin, y - 1, margin + contentW, y - 1)

      // Slightly darker background
      drawRoundedRect(margin, y - 1, contentW, rowH, 0, [235, 238, 241])

      let cx = margin

      // Label
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text('OVERALL SCORE', cx + 3, y + 5)
      cx += colW[0]

      // Weight
      doc.text('100%', cx + colW[1] / 2, y + 5, { align: 'center' })
      cx += colW[1]

      // Raw Avg — empty
      cx += colW[2]

      // Weighted Score
      const overallBandCol = getMaturityColor(radScore)
      doc.setGState(new doc.GState({ opacity: 0.15 }))
      doc.setFillColor(...overallBandCol)
      doc.rect(cx, y - 1, colW[3], rowH, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...overallBandCol)
      doc.text(radScore.toFixed(1), cx + colW[3] / 2, y + 5, { align: 'center' })
      cx += colW[3]

      // Status badge
      const overallStatus = getBandLabel(radScore).toUpperCase()
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const oBadgeW = doc.getTextWidth(overallStatus) + 6
      const oBadgeH = 5.5
      const oBadgeX = cx + (colW[4] - oBadgeW) / 2
      const oBadgeY = y + (rowH - oBadgeH) / 2 - 1
      doc.setFillColor(...overallBandCol)
      doc.roundedRect(oBadgeX, oBadgeY, oBadgeW, oBadgeH, 1.5, 1.5, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(overallStatus, oBadgeX + oBadgeW / 2, oBadgeY + oBadgeH / 2 + 1, { align: 'center' })

      y += rowH
    }
    y += 6
  }

  // Maturity Band Legend
  y += 4
  subHeading('Maturity Band Legend')
  {
    const legendItems = [
      { color: COLORS.green, label: 'STRONG >=80%', desc: 'Pillar operating at competitive advantage level.' },
      { color: COLORS.sage, label: 'DEVELOPING 60-79%', desc: 'Pillar functional but lacks refinement.' },
      { color: COLORS.gold, label: 'FRAGILE 50-59%', desc: 'Pillar shows weakness; requires intervention.' },
      { color: COLORS.coral, label: 'AT RISK <50%', desc: 'Pillar broken; impairs overall system performance.' },
    ]
    // Use uniform badge width (widest label + generous padding)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    const maxBadgeW = Math.max(...legendItems.map(item => doc.getTextWidth(item.label))) + 10
    const descStartX = margin + maxBadgeW + 4

    for (const item of legendItems) {
      checkSpace(8)
      // Badge — uniform width, flat rectangle
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const bH = 5.5
      doc.setFillColor(...item.color)
      doc.rect(margin, y - 1, maxBadgeW, bH, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(item.label, margin + 3, y + 2.5)
      // Description text — aligned to fixed start position
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      doc.text(item.desc, descStartX, y + 2.5)
      y += 7
    }
  }
  y += 2

  // Growth System Heatmap — Horizontal Bar Chart
  // Pre-check: heading + all bars must fit on one page together
  const hmBarH = 4, hmGap = 1
  const hmTotalH = 14 + sortedPillars.length * (hmBarH + hmGap) + 6
  checkSpace(hmTotalH)
  subHeading('Growth System Heatmap')
  y += 2
  const heatmapData = sortedPillars.map(([pid, data]) => ({
    label: `P${pid.replace('p', '')}. ${PILLAR_NAMES[pid] || pid}`,
    score: data.score || 0,
  }))
  drawHBarChart(heatmapData, { barHeight: hmBarH, gap: hmGap, labelWidth: 58 })

  // Diagnostic Shape & Interpretation (first block — from diagnostic_interpretation)
  addPage()
  if (report?.diagnostic_interpretation) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Diagnostic Shape & Interpretation:', margin, y)
    y += 8
    // Split interpretation into sentences for multiple bullet points
    const interpText = report.diagnostic_interpretation
    const sentences = interpText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
    for (const sentence of sentences) {
      bulletPoint(sentence)
    }
  }

  // Pillar Radar Chart (same page flow — no page break)
  y += 6
  if (sortedPillars.length >= 3) {
    subHeading('Pillar Radar Chart')
    y += 4

    // Container dimensions
    const containerH = 130
    const containerPad = 6
    checkSpace(containerH + 4)

    // Light pink background container
    doc.setFillColor(253, 245, 245)
    doc.setDrawColor(240, 220, 220)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentW, containerH, 'FD')

    // Chart title — inside container with spacing
    const containerTop = y + containerPad
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('GROWTH SYSTEM PILLAR PERFORMANCE \u2014 RADAR VIEW', pageW / 2, containerTop, { align: 'center' })

    // Radar chart — centered in container with more vertical offset for label clearance
    const chartCy = containerTop + 58
    const radarChartData = sortedPillars.map(([pid, data]) => ({
      label: PILLAR_NAMES[pid] || pid,
      score: data.score || 0,
    }))
    drawRadarChart(radarChartData, { cx: pageW / 2, cy: chartCy, radius: 36, labelOffset: 16, showTarget: true, bandColors: true })

    // Legend — inside container at the bottom
    const legendY = containerTop + containerH - containerPad - 10
    // ASA Pillar Score legend item
    doc.setFillColor(...COLORS.green)
    doc.setDrawColor(...COLORS.green)
    doc.setLineWidth(0.5)
    doc.rect(pageW / 2 - 40, legendY, 8, 4, 'FD')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text('ASA Pillar Score (%)', pageW / 2 - 30, legendY + 3)
    // Target (80%) legend item
    doc.setDrawColor(...COLORS.gold)
    doc.setLineWidth(0.4)
    doc.setLineDashPattern([2, 2], 0)
    doc.rect(pageW / 2 + 20, legendY, 8, 4, 'S')
    doc.setLineDashPattern([], 0)
    doc.setTextColor(...COLORS.dark)
    doc.text('Target (80%)', pageW / 2 + 30, legendY + 3)

    y += containerH + 4
  }

  // Diagnostic Shape & Interpretation (second block — scorecard_explanation bullets)
  y += 4
  const scorecardBullets = report?.scorecard_explanation || []
  if (scorecardBullets.length > 0) {
    checkSpace(14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Diagnostic Shape & Interpretation:', margin, y)
    y += 8
    for (const bullet of scorecardBullets) {
      bulletPoint(bullet)
    }
  }

  // Section Takeaway for diagnostic interpretation
  renderSectionTakeaway(report?.diagnostic_interpretation_takeaway)

  // ========================
  // SECTION 4: ANALYSIS OF LOWEST SCORING PILLAR
  // ========================
  addPage()
  sectionTitle('4. Analysis of Lowest Scoring Pillar')

  // Collect all pillars scoring < 50% as primary constraints
  const primaryConstraints = sortedPillars.filter(([, data]) => data.score < 50)
  const constraintNames = primaryConstraints.length > 0
    ? primaryConstraints.map(([pid]) => PILLAR_NAMES[pid]).join(', ')
    : (constraint?.name || 'N/A')
  const ca = report?.constraint_analysis

  let constraintIdx = 0
  for (const [cPid, cData] of (primaryConstraints.length > 0 ? primaryConstraints : [[constraint?.id, constraint]])) {
    // Each additional constraint starts on a new page
    if (constraintIdx > 0) addPage()
    constraintIdx++

    const cName = PILLAR_NAMES[cPid] || constraint?.name || 'N/A'
    const cScore = cPid ? pillarScores[cPid]?.score ?? cData?.score : cData?.score
    const cLabel = `P${(cPid || '').replace('p', '')}. ${cName}`

    // Primary Constraint header bar — gray bg, coral left border, score in parentheses
    checkSpace(16)
    drawRoundedRect(margin, y - 2, contentW, 12, 0, COLORS.pearl)
    doc.setFillColor(...COLORS.coral)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(`Primary Constraint: ${cLabel} (${cScore !== undefined ? cScore + '%' : 'N/A'})`, margin + 8, y + 5)
    y += 16

    if (ca) {
      // Diagnosis: heading + key_friction_points as bullets
      if (ca.key_friction_points?.length > 0) {
        checkSpace(10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text('Diagnosis:', margin, y)
        y += 7
        for (const point of ca.key_friction_points) {
          bulletPoint(point, { fontSize: 9, boldLeadIn: false })
        }
      }

      // Revenue Impact: heading + bullets
      if (ca.revenue_impact?.length > 0) {
        checkSpace(10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text('Revenue Impact:', margin, y)
        y += 7
        for (const impact of ca.revenue_impact) {
          bulletPoint(impact, { fontSize: 9, boldLeadIn: false })
        }
      }

      // Cascade Effect: heading + bullets
      if (ca.cascade_effect?.length > 0) {
        checkSpace(10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text('Cascade Effect:', margin, y)
        y += 7
        for (const effect of ca.cascade_effect) {
          bulletPoint(effect, { fontSize: 9, boldLeadIn: false })
        }
      }

      // PRIMARY CONSTRAINT CASCADE EFFECT diagram
      if (ca.cascade_diagram?.length >= 2) {
        y += 4
        const nodes = ca.cascade_diagram
        // Limit to max 4 nodes to prevent overflow
        const dispNodes = nodes.slice(0, 4)
        const nodeCount = dispNodes.length
        const connW = 12
        const nodeW = (contentW - (nodeCount - 1) * connW) / nodeCount
        const nodeH = 30
        const diagramH = nodeH + 18
        checkSpace(diagramH + 14)

        // Container background
        doc.setFillColor(247, 249, 251)
        doc.setDrawColor(...COLORS.border)
        doc.setLineWidth(0.3)
        doc.rect(margin, y - 2, contentW, diagramH + 10, 'FD')

        // Title
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text('PRIMARY CONSTRAINT CASCADE EFFECT', pageW / 2, y + 4, { align: 'center' })
        const nodeStartY = y + 12
        const startX = margin

        for (let ni = 0; ni < nodeCount; ni++) {
          const nx = startX + ni * (nodeW + connW)
          const node = dispNodes[ni]
          const isLast = ni === nodeCount - 1

          // Node box
          doc.setFillColor(255, 255, 255)
          doc.rect(nx, nodeStartY, nodeW, nodeH, 'F')
          doc.setDrawColor(...COLORS.border)
          doc.setLineWidth(0.3)
          doc.rect(nx, nodeStartY, nodeW, nodeH, 'S')

          // Colored left border — resolve score from pillarScores by matching node label to pillar name
          let nodeScore = node.score || 0
          if (!nodeScore && node.label && !isLast) {
            const lbl = node.label.toLowerCase()
            const matchedPid = Object.entries(PILLAR_NAMES).find(([, name]) => {
              const keywords = name.toLowerCase().split(/[\s&]+/).filter(w => w.length > 3)
              return keywords.some(kw => lbl.includes(kw))
            })?.[0]
            if (matchedPid && pillarScores[matchedPid]) nodeScore = pillarScores[matchedPid].score || 0
          }
          const nodeBandCol = isLast ? COLORS.coral : getBandColor(nodeScore)
          doc.setFillColor(...nodeBandCol)
          doc.rect(nx, nodeStartY, 1.5, nodeH, 'F')

          // Score (large, bold, colored)
          doc.setFontSize(13)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...nodeBandCol)
          const scoreText = isLast ? (node.value || '') : `${nodeScore}%`
          doc.text(scoreText, nx + nodeW / 2, nodeStartY + 10, { align: 'center' })

          // Short label — extract just pillar name, truncate long labels
          doc.setFontSize(5.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...COLORS.dark)
          let shortLabel = isLast ? 'Revenue\nShortfall at Risk' : (node.label || '')
          // Strip anything after colon or parenthesis to keep label short
          if (!isLast && shortLabel.includes(':')) shortLabel = shortLabel.split(':')[0].trim()
          if (!isLast && shortLabel.includes('(')) shortLabel = shortLabel.split('(')[0].trim()
          const labelLines = doc.splitTextToSize(shortLabel, nodeW - 4)
          for (let li = 0; li < Math.min(labelLines.length, 3); li++) {
            doc.text(labelLines[li], nx + nodeW / 2, nodeStartY + 15 + li * 3, { align: 'center' })
          }

          // Connector between nodes
          if (ni < nodeCount - 1) {
            const arrowY = nodeStartY + nodeH / 2

            // Short connector label (first 2-3 words only)
            if (node.connector_label) {
              doc.setFontSize(4.5)
              doc.setFont('helvetica', 'italic')
              doc.setTextColor(...COLORS.medium)
              let connText = node.connector_label
              const connWords = connText.split(' ')
              if (connWords.length > 3) connText = connWords.slice(0, 3).join(' ')
              const connLines = doc.splitTextToSize(connText, connW - 2)
              for (let cli = 0; cli < Math.min(connLines.length, 2); cli++) {
                doc.text(connLines[cli], nx + nodeW + connW / 2, arrowY - 3 + cli * 2.5, { align: 'center' })
              }
            }

            // Arrow
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(...COLORS.dark)
            doc.text('-->', nx + nodeW + connW / 2, arrowY + 3, { align: 'center' })
          }
        }
        y = nodeStartY + nodeH + 12
      }

      // What Good Looks Like: heading + bullets
      if (ca.what_good_looks_like?.length) {
        checkSpace(10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text('What Good Looks Like:', margin, y)
        y += 7
        for (const item of ca.what_good_looks_like) {
          bulletPoint(item, { fontSize: 9 })
        }
      }

      // Friction Points Detail table
      if (ca.friction_points_table?.length) {
        checkSpace(14)
        subHeading('Friction Points Detail')
        const fpHeaders = ['Friction Point', 'Impact', 'Root Cause']
        const fpColWidths = [contentW * 0.25, contentW * 0.40, contentW * 0.35]
        const fpRows = ca.friction_points_table.map(fp => [
          fp.friction_point || '',
          fp.impact || '',
          fp.root_cause || '',
        ])
        drawWrappedTable(fpHeaders, fpRows, { colWidths: fpColWidths, fontSize: 8, headerColor: COLORS.coral })
      }

      // Section Takeaway
      renderSectionTakeaway(ca.section_takeaway)
    } else {
      // Fallback: render plain narrative for old reports without constraint_analysis
      if (cPid && report?.pillar_narratives?.[cPid]) {
        const pNarr = report.pillar_narratives[cPid]
        bodyText(typeof pNarr === 'string' ? pNarr : (pNarr?.narrative || ''))
      }
    }

    if (report?.positioning_assessment && cPid === 'p3') {
      bodyText(report.positioning_assessment, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 5: PILLAR-BY-PILLAR DEEP DIVE
  // ========================
  addPage()
  sectionTitle('5. Pillar-by-Pillar Deep Dive')

  let pillarIdx = 0
  for (const [pid, data] of sortedPillars) {
    const name = PILLAR_NAMES[pid] || pid
    const score = data.score || 0
    const narrativeRaw = report?.pillar_narratives?.[pid] || ''
    const narrative = typeof narrativeRaw === 'string' ? narrativeRaw : (narrativeRaw?.narrative || '')
    const color = getBandColor(score)
    const bandLabel = getBandLabel(score)
    const pillarDef = DIAGNOSTIC_PILLARS.find(p => p.id === pid)

    // First pillar stays on section title page, subsequent pillars get new pages
    if (pillarIdx > 0) addPage()
    pillarIdx++

    // Pillar header — gray box with band-colored left border
    checkSpace(20)
    drawRoundedRect(margin, y - 2, contentW, 12, 0, COLORS.pearl)
    doc.setFillColor(...color)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(`P${pid.replace('p', '')}: ${name} \u2014 ${score.toFixed(1)}% (${bandLabel})`, margin + 8, y + 5)
    y += 14

    // Band-colored progress bar (fills proportionally to score)
    doc.setFillColor(...COLORS.pearl)
    doc.rect(margin, y, contentW, 2.5, 'F')
    doc.setFillColor(...color)
    doc.rect(margin, y, contentW * (score / 100), 2.5, 'F')
    y += 8

    // "Your Answers & Scores" table
    const rankings = data?.questionRankings
    if (rankings && Array.isArray(rankings) && rankings.length > 0 && pillarDef) {
      // "Your Answers & Scores" heading in dark/black
      checkSpace(14)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text('Your Answers & Scores', margin, y)
      y += 5

      // Build table data with selected answer text
      const qaHeaders = ['Question', 'Selected Answer', 'Score']
      const qaColWidths = [contentW * 0.38, contentW * 0.48, contentW * 0.14]

      // Sort by question order (not by score)
      const orderedRankings = pillarDef.questions
        .filter(q => q.type === 'scored')
        .map(qDef => {
          const r = rankings.find(r => r.questionId === qDef.id)
          const qScore = r?.score ?? (dr[qDef.id] || 0)
          const selectedOption = qDef.options?.find(o => o.s === qScore)
          return {
            text: qDef.text,
            answer: selectedOption?.l || '',
            score: qScore,
          }
        })

      const qaRows = orderedRankings.map((q, i) => [
        `Q${i + 1}. ${q.text}`,
        q.answer,
        String(q.score),
      ])
      // Build row colors based on question scores (1-5 scale)
      const qaRowColors = orderedRankings.map(q => getScoreColor(q.score, true))
      // Add average score row (no color border)
      qaRows.push(['Average Score', '', (data.avg || 0).toFixed(2)])
      qaRowColors.push(null)

      drawWrappedTable(qaHeaders, qaRows, { colWidths: qaColWidths, fontSize: 8, headerColor: COLORS.dark, rowColors: qaRowColors })
    }

    // Strength Points
    const pd = report?.pillar_details?.[pid]
    const pillarNarr = report?.pillar_narratives?.[pid]
    const hasStrengthNarrative = typeof pillarNarr === 'object' && pillarNarr?.strength_points_narrative

    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Strength Points', margin, y)
    y += 7

    if (hasStrengthNarrative) {
      bodyText(pillarNarr.strength_points_narrative, { fontSize: 9 })
    } else if (pd?.strength_points?.length > 0) {
      for (const sp of pd.strength_points) {
        bulletPoint(sp, { fontSize: 9 })
      }
    } else {
      bodyText('No questions scored 4 or 5 in this pillar.', { fontSize: 9, italic: true, color: COLORS.medium })
    }

    // Critical Friction Points
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Critical Friction Points', margin, y)
    y += 7

    // All scored questions for structured friction point display
    const allScoredQs = pillarDef ? pillarDef.questions
      .filter(q => q.type === 'scored')
      .map((qDef, qi) => {
        const qScore = dr[qDef.id] || 0
        const selectedOption = qDef.options?.find(o => o.s === qScore)
        return { qNum: qi + 1, text: qDef.text, score: qScore, answer: selectedOption?.l || '' }
      }) : []

    if (pd?.critical_friction_points?.length > 0 && allScoredQs.length > 0) {
      // Structured format: question title, selected answer, interpretation
      for (let fi = 0; fi < allScoredQs.length; fi++) {
        const lq = allScoredQs[fi]
        const interpretation = pd.critical_friction_points[fi] || ''

        // Measure total box height
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        const qTitleLines = doc.splitTextToSize(`Q${lq.qNum}. ${lq.text}`, contentW - 12)
        doc.setFont('helvetica', 'italic')
        const ansLines = lq.answer ? doc.splitTextToSize(`Selected: ${lq.answer}`, contentW - 12) : []
        doc.setFont('helvetica', 'normal')
        const interpLines = interpretation ? doc.splitTextToSize(capPillarRefs(interpretation), contentW - 12) : []
        const boxH = (qTitleLines.length * 4) + (ansLines.length * 3.5) + (interpLines.length * 3.5) + 8

        checkSpace(boxH + 4)

        // Box background + score-colored left border
        const frictionColor = getScoreColor(lq.score, true)
        doc.setFillColor(254, 248, 248)
        doc.rect(margin, y - 2, contentW, boxH, 'F')
        doc.setFillColor(...frictionColor)
        doc.rect(margin, y - 2, 1.5, boxH, 'F')

        let ty = y + 2

        // Bold question title
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        for (const line of qTitleLines) { doc.text(line, margin + 6, ty); ty += 4 }

        // Italic selected answer
        if (ansLines.length > 0) {
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...COLORS.medium)
          doc.setFontSize(8.5)
          for (const line of ansLines) { doc.text(line, margin + 6, ty); ty += 3.5 }
        }

        // Interpretation paragraph
        if (interpLines.length > 0) {
          ty += 1
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          doc.setFontSize(8.5)
          for (const line of interpLines) { doc.text(line, margin + 6, ty); ty += 3.5 }
        }

        y += boxH + 3
      }
    } else if (pd?.critical_friction_points?.length > 0) {
      // Fallback: plain callout boxes
      for (const cfp of pd.critical_friction_points) {
        checkSpace(18)
        const cfpLines = doc.splitTextToSize(capPillarRefs(cfp), contentW - 12)
        const cfpH = cfpLines.length * 3.8 + 6
        doc.setFillColor(254, 248, 248)
        doc.rect(margin, y - 2, contentW, cfpH, 'F')
        doc.setFillColor(...COLORS.coral)
        doc.rect(margin, y - 2, 1.5, cfpH, 'F')
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        for (let li = 0; li < cfpLines.length; li++) {
          doc.text(cfpLines[li], margin + 6, y + 2 + li * 3.8)
        }
        y += cfpH + 3
      }
    } else {
      bodyText('No critical friction points identified in this pillar (no questions scored 1 or 2).', { fontSize: 9, italic: true, color: COLORS.medium })
    }

    // What This Score Means
    if (typeof pillarNarr === 'object' && pillarNarr?.what_this_score_means) {
      checkSpace(14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const wLabel = 'What This Score Means: '
      doc.text(wLabel, margin, y)
      doc.setFont('helvetica', 'normal')
      const wLabelW = doc.getTextWidth(wLabel)
      const wText = pillarNarr.what_this_score_means
      const wLines = doc.splitTextToSize(wText, contentW)
      // First line continues after the bold label
      const firstLineSpace = contentW - wLabelW
      const firstLinePart = doc.splitTextToSize(wText, firstLineSpace)
      doc.text(firstLinePart[0], margin + wLabelW, y)
      y += 4
      // Remaining text as body
      if (wText.length > firstLinePart[0].length) {
        bodyText(wText.substring(firstLinePart[0].length).trim(), { fontSize: 9 })
      } else {
        y += 3
      }
    }

    // Assessment
    if (typeof pillarNarr === 'object' && pillarNarr?.assessment) {
      checkSpace(14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const aLabel = 'Assessment: '
      doc.text(aLabel, margin, y)
      doc.setFont('helvetica', 'normal')
      const aLabelW = doc.getTextWidth(aLabel)
      const aText = pillarNarr.assessment
      const aFirstLine = doc.splitTextToSize(aText, contentW - aLabelW)
      doc.text(aFirstLine[0], margin + aLabelW, y)
      y += 4
      if (aText.length > aFirstLine[0].length) {
        bodyText(aText.substring(aFirstLine[0].length).trim(), { fontSize: 9 })
      } else {
        y += 3
      }
    }

    // Section Takeaway
    if (typeof pillarNarr === 'object') {
      renderSectionTakeaway(pillarNarr.section_takeaway)
    }

    y += 4
  }


  // ========================
  // SECTION 6: CROSS-PILLAR INTERACTION ANALYSIS
  // ========================
  addPage()
  sectionTitle('6. Cross-Pillar Interaction Analysis')

  let cpi = report?.cross_pillar_interaction

  // Deterministic fallback when AI generation failed
  const cpiEmpty = !cpi?.introduction && !cpi?.primary_causal_chain?.nodes?.length && !cpi?.reinforcing_loop?.nodes?.length && !cpi?.intervention_sequence?.steps?.length
  if (cpiEmpty) {
    cpi = buildCrossPillarFallback(pillarScores)
  }

  // Introduction paragraph
  if (cpi?.introduction) {
    bodyText(cpi.introduction, { fontSize: 9 })
  } else if (cpi?.narrative) {
    bodyText(cpi.narrative, { fontSize: 9 })
  }

  // Primary Causal Chain
  if (cpi?.primary_causal_chain?.nodes?.length >= 2) {
    y += 2
    subHeading('Primary Causal Chain')
    y += 4
    const pccNodes = cpi.primary_causal_chain.nodes
    const pccNodeCount = Math.min(pccNodes.length, 4)
    const pccConnW = 26
    const pccNodeW = (contentW - (pccNodeCount - 1) * pccConnW) / pccNodeCount
    const pccNodeH = 24
    checkSpace(pccNodeH + 16)

    // Light gray container
    doc.setFillColor(250, 250, 250)
    doc.rect(margin, y - 4, contentW, pccNodeH + 12, 'F')

    for (let ni = 0; ni < pccNodeCount; ni++) {
      const nx = margin + ni * (pccNodeW + pccConnW)
      const node = pccNodes[ni]
      const rawLbl = typeof node === 'string' ? node : (node?.pillar_label || node?.label || '')
      // Match pillar name to get ID prefix and score
      let scoreVal = ''
      let lbl = rawLbl
      const matchedPillar = Object.entries(PILLAR_NAMES).find(([, name]) => rawLbl.includes(name))
      if (matchedPillar) {
        const [pid, name] = matchedPillar
        lbl = `P${pid.replace('p', '')}: ${name}`
        scoreVal = pillarScores[pid]?.score || ''
      } else {
        // Truncate if no match found
        if (lbl.length > 30) lbl = lbl.substring(0, 30) + '..'
      }

      // Node box — white fill, score-colored border, rounded
      const nodeColor = scoreVal ? getScoreColor(scoreVal) : COLORS.coral
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(...nodeColor)
      doc.setLineWidth(0.8)
      doc.roundedRect(nx + 3, y, pccNodeW - 6, pccNodeH, 3, 3, 'FD')

      // Node label: bold pillar name on top, normal score below
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...nodeColor)
      const nodeLines = doc.splitTextToSize(lbl, pccNodeW - 12)
      const totalLines = Math.min(nodeLines.length, 3)
      const blockH = totalLines * 3.5 + (scoreVal ? 4 : 0)
      const textStartY = y + (pccNodeH - blockH) / 2 + 2
      for (let li = 0; li < totalLines; li++) {
        doc.text(nodeLines[li], nx + pccNodeW / 2, textStartY + li * 3.5, { align: 'center' })
      }
      // Score in normal weight below name
      if (scoreVal) {
        doc.setFont('helvetica', 'normal')
        doc.text(String(scoreVal) + '%', nx + pccNodeW / 2, textStartY + totalLines * 3.5 + 1, { align: 'center' })
      }

      // Connector arrow + label (placed above the arrow, not overlapping nodes)
      if (ni < pccNodeCount - 1) {
        const ax1 = nx + pccNodeW - 3
        const ax2 = nx + pccNodeW + pccConnW - 3
        const ay = y + pccNodeH / 2

        // Connector label above arrow
        if (typeof node === 'object' && node.connector_label) {
          doc.setFontSize(4.5)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...COLORS.medium)
          // Wrap connector label within connector width
          let connText = node.connector_label
          const connWords = connText.split(' ')
          if (connWords.length > 5) connText = connWords.slice(0, 5).join(' ')
          const connLines = doc.splitTextToSize(connText, pccConnW - 2)
          const connLineH = 2.5
          const connStartY = ay - 3 - (connLines.length - 1) * connLineH
          for (let ci = 0; ci < connLines.length; ci++) {
            doc.text(connLines[ci], (ax1 + ax2) / 2, connStartY + ci * connLineH, { align: 'center' })
          }
        }

        // Arrow — colored by source node score
        doc.setDrawColor(...nodeColor)
        doc.setLineWidth(0.6)
        doc.line(ax1, ay, ax2, ay)
        doc.line(ax2, ay, ax2 - 2, ay - 1.5)
        doc.line(ax2, ay, ax2 - 2, ay + 1.5)
      }
    }
    y += pccNodeH + 10

    // Explanation bullets
    if (cpi.primary_causal_chain.explanation_bullets?.length) {
      for (const b of cpi.primary_causal_chain.explanation_bullets) {
        bulletPoint(b, { fontSize: 9 })
      }
    }
  }

  // Reinforcing Loop: The Vicious Cycle
  if (cpi?.reinforcing_loop?.nodes?.length >= 3) {
    y += 4
    // Sub-heading with coral underline
    checkSpace(14)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    const rlTitle = cpi.reinforcing_loop.title || 'Reinforcing Loop: The Vicious Cycle'
    doc.text(rlTitle, margin, y)
    y += 2
    drawLine(y, COLORS.coral)
    y += 8

    const rlNodes = cpi.reinforcing_loop.nodes
    const rlNodeCount = Math.min(rlNodes.length, 4)

    // Diamond/cycle layout — render as 4 nodes in a diamond pattern
    const rlNodeW = 36
    const rlNodeH = 16
    const cycleRx = 55
    const cycleRy = 28
    const totalCycleH = cycleRy * 2 + rlNodeH + 8
    checkSpace(totalCycleH)
    const cycleCx = pageW / 2
    const cycleCy = y + cycleRy + rlNodeH / 2

    // "VICIOUS CYCLE" center text
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.medium)
    doc.text('VICIOUS', cycleCx, cycleCy - 2, { align: 'center' })
    doc.text('CYCLE', cycleCx, cycleCy + 2, { align: 'center' })

    // Position nodes: top, right, bottom, left — spread out to avoid overlap
    const positions = [
      { x: cycleCx - rlNodeW / 2, y: cycleCy - cycleRy - rlNodeH / 2 },
      { x: cycleCx + cycleRx - rlNodeW / 2 + 2, y: cycleCy - rlNodeH / 2 },
      { x: cycleCx - rlNodeW / 2, y: cycleCy + cycleRy - rlNodeH / 2 },
      { x: cycleCx - cycleRx - rlNodeW / 2 - 2, y: cycleCy - rlNodeH / 2 },
    ]

    const rlNodeColors = []
    for (let ni = 0; ni < Math.min(rlNodeCount, 4); ni++) {
      const pos = positions[ni]
      const node = rlNodes[ni]
      const rawLabel = typeof node === 'string' ? node : (node?.label || '')
      const subLabel = typeof node === 'object' ? (node?.sub_label || '') : ''

      // Build sub-text: always show "P{n}, {score}%" format
      let subText = ''
      let matchedPid = node?.pillar_id || null
      if (!matchedPid) {
        // Try to match label against pillar names
        const match = Object.entries(PILLAR_NAMES).find(([, name]) => rawLabel.toLowerCase().includes(name.toLowerCase().split(' ')[0]))
        if (match) matchedPid = match[0]
      }
      if (matchedPid) {
        const pScore = pillarScores[matchedPid]?.score
        subText = `P${matchedPid.replace('p', '')}${pScore !== undefined ? ', ' + pScore + '%' : ''}`
      }

      // Node box — white fill, score-colored border
      const rlNodeColor = matchedPid && pillarScores[matchedPid]?.score !== undefined
        ? getScoreColor(pillarScores[matchedPid].score)
        : COLORS.coral
      rlNodeColors.push(rlNodeColor)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(...rlNodeColor)
      doc.setLineWidth(0.8)
      doc.roundedRect(pos.x, pos.y, rlNodeW, rlNodeH, 3, 3, 'FD')

      // Node label (bold, top)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...rlNodeColor)
      const nodeLines = doc.splitTextToSize(rawLabel, rlNodeW - 4)
      const labelLineCount = Math.min(nodeLines.length, 2)
      const hasSubText = subText && subText.length > 0
      const totalBlockH = labelLineCount * 3 + (hasSubText ? 3.5 : 0)
      const labelStartY = pos.y + (rlNodeH - totalBlockH) / 2 + 2
      for (let li = 0; li < labelLineCount; li++) {
        doc.text(nodeLines[li], pos.x + rlNodeW / 2, labelStartY + li * 3, { align: 'center' })
      }

      // Sub-text below label (normal weight, e.g., "P3, 45.5%")
      if (hasSubText) {
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'normal')
        doc.text(subText, pos.x + rlNodeW / 2, labelStartY + labelLineCount * 3 + 1, { align: 'center' })
      }
    }

    // Draw connecting arrows between nodes (top->right->bottom->left->top)
    const arrowPairs = [[0, 1], [1, 2], [2, 3], [3, 0]]
    for (const [from, to] of arrowPairs) {
      if (from >= rlNodeCount || to >= rlNodeCount) continue
      const fp = positions[from]
      const tp = positions[to]
      const fcx = fp.x + rlNodeW / 2
      const fcy = fp.y + rlNodeH / 2
      const tcx = tp.x + rlNodeW / 2
      const tcy = tp.y + rlNodeH / 2

      // Calculate edge points
      const dx = tcx - fcx
      const dy = tcy - fcy
      const angle = Math.atan2(dy, dx)
      const sx = fcx + (rlNodeW / 2 + 1) * Math.cos(angle)
      const sy = fcy + (rlNodeH / 2 + 1) * Math.sin(angle)
      const ex = tcx - (rlNodeW / 2 + 1) * Math.cos(angle)
      const ey = tcy - (rlNodeH / 2 + 1) * Math.sin(angle)

      // Arrow colored by source node score
      doc.setDrawColor(...(rlNodeColors[from] || COLORS.coral))
      doc.setLineWidth(0.5)
      doc.line(sx, sy, ex, ey)
      // Arrowhead
      const aLen = 2
      doc.line(ex, ey, ex - aLen * Math.cos(angle - 0.4), ey - aLen * Math.sin(angle - 0.4))
      doc.line(ex, ey, ex - aLen * Math.cos(angle + 0.4), ey - aLen * Math.sin(angle + 0.4))
    }

    y = cycleCy + cycleRy + rlNodeH / 2 + 6

    // Explanation bullets
    if (cpi.reinforcing_loop.explanation_bullets?.length) {
      for (const b of cpi.reinforcing_loop.explanation_bullets) {
        bulletPoint(b, { fontSize: 9 })
      }
    }
  }

  // Highest-Leverage Intervention Sequence
  if (cpi?.intervention_sequence?.steps?.length >= 2) {
    y += 4
    // Sub-heading with line underneath
    checkSpace(14)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Highest-Leverage Intervention Sequence', margin, y)
    y += 2
    drawLine(y, COLORS.dark)
    y += 8

    const isSteps = cpi.intervention_sequence.steps
    const stepCount = Math.min(isSteps.length, 5)

    // Numbered boxes in a row — teal filled with white text
    const isConnW = 6
    const isNodeW = (contentW - (stepCount - 1) * isConnW) / stepCount
    const isNodeH = 26
    checkSpace(isNodeH + 14)

    // Light gray container
    doc.setFillColor(247, 249, 251)
    doc.rect(margin, y - 4, contentW, isNodeH + 10, 'F')

    for (let si = 0; si < stepCount; si++) {
      const step = isSteps[si]
      const stepLabel = typeof step === 'string' ? step : (step?.title || step?.label || step?.action || '')
      const stepTimeline = typeof step === 'object' ? (step?.timeline || '') : ''
      const stepSubtitle = typeof step === 'object' ? (step?.subtitle || '') : ''
      const nx = margin + si * (isNodeW + isConnW)

      // Node box — grey fill, teal border
      doc.setFillColor(...COLORS.bg)
      doc.setDrawColor(...COLORS.primary)
      doc.setLineWidth(0.6)
      doc.roundedRect(nx + 1, y, isNodeW - 2, isNodeH, 2, 2, 'FD')

      // Line 1: step number + short title (bold, teal)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      const maxTextW = isNodeW - 8
      const titleFull = `${si + 1}) ${stepLabel}`
      const titleLines = doc.splitTextToSize(titleFull, maxTextW)
      doc.text(titleLines[0] || '', nx + isNodeW / 2, y + 6, { align: 'center' })
      if (titleLines[1]) doc.text(titleLines[1], nx + isNodeW / 2, y + 9, { align: 'center' })

      // Line 2: subtitle (normal, teal)
      doc.setFontSize(5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.primary)
      const sub = stepSubtitle || stepLabel
      const subLines = doc.splitTextToSize(sub, maxTextW)
      const subStartY = titleLines[1] ? y + 13 : y + 11
      doc.text(subLines[0] || '', nx + isNodeW / 2, subStartY, { align: 'center' })
      if (subLines[1]) doc.text(subLines[1], nx + isNodeW / 2, subStartY + 3, { align: 'center' })

      // Line 3: timeline (normal, teal)
      if (stepTimeline) {
        doc.setFontSize(5)
        doc.setTextColor(...COLORS.primary)
        doc.text(stepTimeline, nx + isNodeW / 2, y + 21, { align: 'center' })
      }

      // Connector arrow (teal)
      if (si < stepCount - 1) {
        const ax1 = nx + isNodeW - 1
        const ax2 = nx + isNodeW + isConnW - 1
        const ay = y + isNodeH / 2
        doc.setDrawColor(...COLORS.primary)
        doc.setLineWidth(0.6)
        doc.line(ax1, ay, ax2, ay)
        doc.line(ax2, ay, ax2 - 1.5, ay - 1.5)
        doc.line(ax2, ay, ax2 - 1.5, ay + 1.5)
      }
    }
    y += isNodeH + 10

    // Numbered explanation bullets with card title as bold prefix
    if (cpi.intervention_sequence.explanation_bullets?.length) {
      for (let bi = 0; bi < cpi.intervention_sequence.explanation_bullets.length; bi++) {
        const b = cpi.intervention_sequence.explanation_bullets[bi]
        const step = isSteps[bi]
        const stepTitle = typeof step === 'object' ? (step?.title || '') : ''
        const stepTimeline = typeof step === 'object' ? (step?.timeline || '') : ''
        checkSpace(12)

        // Number prefix
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.dark)
        const numPrefix = `${bi + 1}. `
        doc.setFont('helvetica', 'bold')
        doc.text(numPrefix, margin, y)
        const numW = doc.getTextWidth(numPrefix)

        // Bold title with timeline
        if (stepTitle) {
          const titleText = stepTimeline ? `${stepTitle} (${stepTimeline}):` : `${stepTitle}:`
          doc.setFont('helvetica', 'bold')
          const titleLines = doc.splitTextToSize(titleText, contentW - numW)
          doc.text(titleLines[0], margin + numW, y)
          y += 4
          for (let tl = 1; tl < titleLines.length; tl++) {
            checkSpace(4)
            doc.text(titleLines[tl], margin + numW, y)
            y += 4
          }
        }

        // Normal explanation text
        doc.setFont('helvetica', 'normal')
        const indent = numW
        const bLines = doc.splitTextToSize(b, contentW - indent)
        for (let li = 0; li < bLines.length; li++) {
          checkSpace(4)
          doc.text(bLines[li], margin + indent, y)
          y += 4
        }
        y += 3
      }
    }
  }

  // Cross-Pillar Section Takeaway
  renderSectionTakeaway(cpi?.section_takeaway)

  // ========================
  // SECTION 7: COMPETITIVE POSITIONING DEEP DIVE
  // ========================
  addPage()
  sectionTitle('7. Competitive Positioning Deep Dive')

  const cpData = report?.competitive_positioning

  // Helper: render "Assessment: " bold prefix + text
  // Split paragraph text into sentences and render as bullet points
  function paragraphAsBullets(text, opts = {}) {
    if (!text) return
    text = sanitizeText(capPillarRefs(String(text)))
    // Split on sentence boundaries (period/exclamation/question followed by space + capital letter)
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(s => s.trim())
    for (const sentence of sentences) {
      bulletPoint(sentence.trim(), { fontSize: opts.fontSize || 9, ...opts })
    }
  }

  function assessmentText(text) {
    if (!text) return
    checkSpace(10)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Assessment:', margin, y)
    y += 7
    paragraphAsBullets(text, { fontSize: 9 })
  }

  // Helper: render italic sources line
  function sourcesLine(text) {
    if (!text) return
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.medium)
    const srcLines = doc.splitTextToSize(text, contentW)
    const lineH = 3.5
    checkSpace(srcLines.length * lineH + 2)
    for (const line of srcLines) {
      doc.text(line, margin, y)
      y += lineH
    }
    y += 2
  }

  if (cpData) {
    // Introduction
    if (cpData.introduction) {
      bodyText(cpData.introduction, { fontSize: 9 })
    }

    // Comparative Company Facts table
    if (cpData.comparative_company_facts?.column_headers?.length && cpData.comparative_company_facts?.rows?.length) {
      subHeading('Comparative Company Facts')
      const ccf = cpData.comparative_company_facts
      const ccfHeaders = ccf.column_headers
      const numCols = ccfHeaders.length
      const attrW = contentW * 0.12
      const remainingW = contentW - attrW
      const ccfColWidths = ccfHeaders.map((_, i) => i === 0 ? attrW : remainingW / (numCols - 1))
      const ccfRows = ccf.rows.map(r => [r.field, ...(r.values || [])])
      drawWrappedTable(ccfHeaders, ccfRows, { colWidths: ccfColWidths, fontSize: 7, boldFirstCol: true })
      sourcesLine(ccf.sources_line || 'Sources: SGX filings, company annual reports, company websites.')
    }

    assessmentText(cpData.company_facts_assessment)

    // Growth-Relevant Evidence Signals table
    if (cpData.growth_evidence_signals?.column_headers?.length && cpData.growth_evidence_signals?.rows?.length) {
      addPage()
      subHeading('Growth-Relevant Evidence Signals')
      const ges = cpData.growth_evidence_signals
      const gesHeaders = ges.column_headers
      const gesNumCols = gesHeaders.length
      const gesAttrW = contentW * 0.15
      const gesRemainingW = contentW - gesAttrW
      const gesColWidths = gesHeaders.map((_, i) => i === 0 ? gesAttrW : gesRemainingW / (gesNumCols - 1))
      const gesRows = ges.rows.map(r => [r.field, ...(r.values || [])])
      drawWrappedTable(gesHeaders, gesRows, { colWidths: gesColWidths, fontSize: 7, boldFirstCol: true })
      sourcesLine(ges.sources_line || 'Sources: SGX filings, company annual reports, investor presentations, company websites.')
    }

    assessmentText(cpData.evidence_signals_assessment)

    // Comparative Positioning Statement Assessment table
    if (cpData.positioning_statements?.length) {
      subHeading('Comparative Positioning Statement Assessment')
      const psHeaders = ['Company', 'Public Positioning Statement', 'Source']
      const psColWidths = [contentW * 0.15, contentW * 0.6, contentW * 0.25]
      const psRows = cpData.positioning_statements.map(ps => [ps.company_name || '', ps.statement || '', ps.source_ref || ''])
      drawWrappedTable(psHeaders, psRows, { colWidths: psColWidths, fontSize: 7.5, boldFirstCol: true })
    }

    // Positioning Analysis
    if (cpData.positioning_analysis) {
      addPage()
      subHeading('Positioning Analysis')
      paragraphAsBullets(cpData.positioning_analysis, { fontSize: 9 })
    }

    // Recommended Positioning Direction
    if (cpData.recommended_positioning_direction) {
      subHeading('Recommended Positioning Direction')
      const rpd = cpData.recommended_positioning_direction
      // Guidance as bullet points
      if (rpd.guidance) {
        paragraphAsBullets(rpd.guidance, { fontSize: 9 })
      }
      // Example statement as blockquote with coral left border
      if (rpd.example_statement) {
        checkSpace(16)
        const exLines = doc.splitTextToSize(`"${rpd.example_statement}"`, contentW - 14)
        const exBoxH = exLines.length * 3.5 + 8
        drawRoundedRect(margin, y - 2, contentW, exBoxH, 2, COLORS.bg)
        doc.setFillColor(...COLORS.coral)
        doc.rect(margin, y - 2, 4, exBoxH, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...COLORS.dark)
        for (let li = 0; li < exLines.length; li++) {
          doc.text(exLines[li], margin + 10, y + 4 + li * 3.5)
        }
        y += exBoxH + 6
      }
      // Caveat as bullet points
      if (rpd.caveat) {
        paragraphAsBullets(rpd.caveat, { fontSize: 9 })
      }
    }

    // Growth-Based Assessment scoring table
    if (cpData.growth_based_assessment?.column_headers?.length && cpData.growth_based_assessment?.dimensions?.length) {
      addPage()
      subHeading('Growth-Based Assessment')
      // Scale legend
      checkSpace(8)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      doc.text('Scale: 1 = Weak, 2 = Developing, 3 = Competitive, 4 = Strong, 5 = Leading', margin, y)
      y += 6

      const gba = cpData.growth_based_assessment
      const gbaHeaders = ['Dimension', ...gba.column_headers]
      const gbaColWidths = gbaHeaders.map(() => contentW / gbaHeaders.length)
      const gbaRows = gba.dimensions.map(d => [d.dimension, ...(d.scores || []).map(s => String(s))])
      drawWrappedTable(gbaHeaders, gbaRows, { colWidths: gbaColWidths, fontSize: 7.5, boldFirstCol: true })
    }

    assessmentText(cpData.growth_assessment_narrative)

    // Weighted Growth Scoring table (computed from growth_based_assessment)
    if (cpData.growth_based_assessment?.column_headers?.length && cpData.growth_based_assessment?.dimensions?.length) {
      const gba = cpData.growth_based_assessment
      const dims = gba.dimensions
      const companies = gba.column_headers

      // Predefined weights by dimension name (case-insensitive match)
      const WEIGHTS = {
        'revenue scale': 0.15, 'profitability strength': 0.15, 'positioning clarity': 0.15,
        'technology investment': 0.10, 'technology investment depth': 0.10,
        'ai readiness': 0.10, 'customer confidence': 0.15,
        'market visibility': 0.10, 'delivery capability': 0.10,
      }
      const equalWeight = 1 / dims.length

      subHeading('Weighted Growth Scoring')
      const wgsHeaders = ['Dimension', 'Weight', ...companies]
      const dimLabelW = contentW * 0.22
      const weightColW = contentW * 0.1
      const compColW = (contentW - dimLabelW - weightColW) / companies.length
      const wgsColWidths = [dimLabelW, weightColW, ...companies.map(() => compColW)]

      const wgsRows = dims.map(d => {
        const w = WEIGHTS[d.dimension.toLowerCase()] || equalWeight
        const weightedScores = (d.scores || []).map(s => ((s / 5) * w).toFixed(2))
        return [d.dimension, `${(w * 100).toFixed(0)}%`, ...weightedScores]
      })
      drawWrappedTable(wgsHeaders, wgsRows, { colWidths: wgsColWidths, fontSize: 7.5, boldFirstCol: true })

      // Weighted Score Summary table
      subHeading('Weighted Score Summary')
      const summaryHeaders = ['Company', 'Score / 5', 'Score / 100']
      const summaryColWidths = [contentW * 0.4, contentW * 0.3, contentW * 0.3]
      const summaryRows = companies.map((comp, ci) => {
        let totalWeighted = 0
        dims.forEach(d => {
          const w = WEIGHTS[d.dimension.toLowerCase()] || equalWeight
          const score = (d.scores || [])[ci] || 0
          totalWeighted += (score / 5) * w
        })
        const scoreFive = (totalWeighted * 5).toFixed(2)
        const scoreHundred = Math.round(totalWeighted * 100)
        return [comp, scoreFive, String(scoreHundred)]
      })
      drawWrappedTable(summaryHeaders, summaryRows, { colWidths: summaryColWidths, fontSize: 7.5, boldFirstCol: true })
    }

    // Section Takeaway
    renderSectionTakeaway(cpData.section_takeaway?.paragraphs)
  } else {
    bodyText('Competitive positioning data not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // SECTION 8: RAPS
  // ========================
  addPage()
  sectionTitle('8. Revenue Achievement Probability Score (RAPS)')

  // Intro paragraph
  bodyText('The Revenue Achievement Probability Score (RAPS) is a composite metric that quantifies the statistical likelihood of a company hitting its annual revenue target, calculated from win rate, pipeline coverage ratio, and time remaining in the financial year. Understanding your RAPS is critical because it replaces gut-feel forecasting with a mathematically grounded read on whether your current commercial system can actually close the gap between year-to-date performance and year-end target.', { fontSize: 9 })

  if (raps?.score !== undefined) {
    // "RAPS FUEL GAUGE" title
    y += 4
    checkSpace(75)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text('RAPS FUEL GAUGE \u2014 REVENUE ACHIEVEMENT PROBABILITY', pageW / 2, y, { align: 'center' })
    y += 6

    // Gauge
    drawGauge(raps.score, { cx: pageW / 2, cy: y + 35, radius: 28, label: '' })

    // Label below gauge (score already shown inside gauge)
    y += 55
    const rapsLabel = raps.label || getBandLabel(raps.score)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(rapsLabel.toUpperCase(), pageW / 2, y, { align: 'center' })
    y += 10

    // Key Inputs — simple bordered 2-column table
    subHeading('Key Inputs')
    y += 2
    const winRateMid = raps.winRate ? `${(raps.winRate * 100).toFixed(0)}%` : (sr.q17 || 'N/A')
    const fmtExpConv = raps.expectedConvertible != null
      ? `US$${Math.round(raps.expectedConvertible).toLocaleString()}`
      : 'N/A'
    const coverageDisplay = raps.coverageRatio != null
      ? `${(raps.coverageRatio * 100).toFixed(1)}%`
      : 'N/A'
    const timeFactor = raps.timeFactor != null ? String(raps.timeFactor) : 'N/A'

    const kiRows = [
      ['Revenue Target', raps.revenueTarget ? `US$${Number(String(raps.revenueTarget).replace(/[^0-9.\-]/g, '')).toLocaleString()}` : 'N/A'],
      ['YTD Invoiced', raps.revenueInvoiced ? `US$${Number(String(raps.revenueInvoiced).replace(/[^0-9.\-]/g, '')).toLocaleString()}` : 'N/A'],
      ['Remaining', raps.revenueRemaining ? `US$${Number(String(raps.revenueRemaining).replace(/[^0-9.\-]/g, '')).toLocaleString()}` : 'N/A'],
      ['Months Left', String(raps.monthsRemaining || 'N/A')],
      ['Win Rate', winRateMid],
      ['Pipeline Coverage', coverageDisplay],
      ['Expected Convertible', fmtExpConv],
      ['Time Factor', timeFactor],
    ]

    // Render as compact bordered table
    {
      const labelW = contentW * 0.45
      const valW = contentW * 0.55
      for (const [label, value] of kiRows) {
        checkSpace(7)
        doc.setDrawColor(...COLORS.border)
        doc.setLineWidth(0.3)
        doc.rect(margin, y, labelW, 6.5, 'S')
        doc.rect(margin + labelW, y, valW, 6.5, 'S')
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(label, margin + 3, y + 4.5)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), margin + labelW + 3, y + 4.5)
        y += 6.5
      }
      y += 4
    }

    // RAPS Narrative — The Probability Gap
    y += 6
    if (Array.isArray(report?.raps_narrative_bullets) && report.raps_narrative_bullets.length > 0) {
      subHeading('RAPS Narrative \u2014 The Probability Gap')
      for (const b of report.raps_narrative_bullets) {
        bulletPoint(b, { fontSize: 8 })
      }
    } else if (report?.raps_narrative) {
      subHeading('RAPS Narrative \u2014 The Probability Gap')
      bodyText(report.raps_narrative, { fontSize: 8 })
    }

    // Revenue Waterfall Analysis
    if (report?.revenue_waterfall) {
      y += 4
      subHeading('Revenue Waterfall Analysis')
      bodyText('A revenue waterfall analysis breaks down the full-year target into what has been invoiced, what is in active pipeline, and the uncovered gap \u2014 making the scale and timing of at-risk revenue immediately visible to leadership and the board.', { fontSize: 9 })
      y += 2

      // Light gray container + centered title
      const wfH = 80
      checkSpace(wfH + 16)
      doc.setFillColor(247, 249, 251)
      doc.rect(margin, y, contentW, wfH + 12, 'F')

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      doc.text('REVENUE WATERFALL \u2014 FY TARGET VS ACTUALS VS GAP', pageW / 2, y + 6, { align: 'center' })

      const savedY = y
      y += 10
      drawWaterfallChart(report.revenue_waterfall, { height: wfH })
      y = savedY + wfH + 16
    }

    // Scenario Analysis table
    if (Array.isArray(report?.raps_scenario_analysis) && report.raps_scenario_analysis.length > 0) {
      subHeading('Scenario Analysis')
      if (report.raps_scenarios_narrative) {
        bodyText(report.raps_scenarios_narrative, { fontSize: 8 })
      }
      const rsaHeaders = ['Scenario', 'Win Rate', 'Pipeline Coverage', 'Projected RAPS', 'Probability']
      const rsaColWidths = [contentW * 0.25, contentW * 0.15, contentW * 0.2, contentW * 0.2, contentW * 0.2]
      const rsaRows = report.raps_scenario_analysis.map(s => [
        s.scenario || '',
        s.win_rate || '',
        s.pipeline_coverage || '',
        s.projected_raps != null ? String(s.projected_raps) : '',
        s.probability || '',
      ])
      drawWrappedTable(rsaHeaders, rsaRows, { colWidths: rsaColWidths, fontSize: 8 })
    }

  } else {
    bodyText(report?.raps_narrative || '')
  }

  // RAPS section takeaway
  renderSectionTakeaway(report?.raps_section_takeaway || report?.raps_scenario_analysis_section_takeaway)

  // ========================
  // SECTION 9: MARKET OPPORTUNITY INTELLIGENCE
  // ========================
  addPage()
  sectionTitle('9. Market Opportunity Intelligence')

  const countries = marketReport?.countries || []
  if (countries.length > 0) {
    for (let mi = 0; mi < countries.length; mi++) {
      const market = countries[mi]
      if (mi > 0) addPage()

      // Market header bar — dark teal background
      checkSpace(20)
      const marketName = market.market_name || market.name || 'Market'
      const designation = market.market_designation || ''
      doc.setFillColor(...COLORS.primary)
      doc.rect(margin, y, contentW, 12, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.white)
      doc.text(`Market ${mi + 1}: ${marketName} \u2014 ${designation}`, margin + 6, y + 8)
      y += 18

      // Macro Considerations heading
      subHeading('Macro Considerations')

      // Helper: render a section heading with spaced uppercase letters and teal underline
      function marketSectionHeading(title) {
        y += 6
        checkSpace(16)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.primary)
        doc.text(title.toUpperCase().split('').join(' '), margin, y)
        y += 2
        doc.setDrawColor(...COLORS.primary)
        doc.setLineWidth(0.5)
        doc.line(margin, y, margin + contentW, y)
        y += 6
      }

      // Helper: render a simple bordered label-value table
      function marketTable(rows) {
        const labelW = contentW * 0.35
        const valW = contentW * 0.65
        const cellPad = 3
        const lineH = 3.5
        for (const [label, value] of rows) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          const labelLines = doc.splitTextToSize(String(label), labelW - cellPad * 2)
          doc.setFont('helvetica', 'normal')
          const valLines = doc.splitTextToSize(String(value || ''), valW - cellPad * 2)
          const rowH = Math.max(labelLines.length, valLines.length) * lineH + cellPad * 2
          checkSpace(rowH + 1)
          doc.setDrawColor(...COLORS.border)
          doc.setLineWidth(0.3)
          doc.rect(margin, y, labelW, rowH, 'S')
          doc.rect(margin + labelW, y, valW, rowH, 'S')
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...COLORS.dark)
          for (let li = 0; li < labelLines.length; li++) {
            doc.text(labelLines[li], margin + cellPad, y + cellPad + lineH * (li + 0.7))
          }
          doc.setFont('helvetica', 'normal')
          for (let li = 0; li < valLines.length; li++) {
            doc.text(valLines[li], margin + labelW + cellPad, y + cellPad + lineH * (li + 0.7))
          }
          y += rowH
        }
        y += 4
      }

      // ECONOMIC CONDITIONS
      const econRows = (market.economic_data_table || []).map(r => [r.metric, r.value])
      if (econRows.length > 0) {
        marketSectionHeading('Economic Conditions')
        marketTable(econRows)
      }

      // SECTOR CONDITIONS
      const sectorRows = (market.sector_data_table || []).map(r => [r.metric, r.value])
      if (sectorRows.length > 0) {
        marketSectionHeading('Sector Conditions')
        marketTable(sectorRows)
      }

      // Narrative sections with bullet points
      const narrativeSections = [
        { title: 'Political Environment', key: 'political_environment' },
        { title: 'Geopolitical Factors', key: 'geopolitical_factors' },
        { title: 'Socio-Economic Trends', key: 'socio_economic_trends' },
        { title: 'Industry Growth Signals', key: 'industry_growth_signals' },
      ]

      // Economic narrative bullets (after economic table)
      const econNarr = market.economic_narrative
      const econBullets = econNarr?.bullets || (Array.isArray(econNarr) ? econNarr : null)
      if (econBullets && econBullets.length > 0) {
        for (const item of econBullets) {
          bulletPoint(typeof item === 'string' ? item : String(item), { fontSize: 9 })
        }
      }

      for (const sub of narrativeSections) {
        const section = market[sub.key]
        const bullets = section?.bullets || (Array.isArray(section) ? section : null)
        if (!bullets || bullets.length === 0) continue
        marketSectionHeading(sub.title)
        for (const item of bullets) {
          bulletPoint(typeof item === 'string' ? item : String(item), { fontSize: 9 })
        }
      }

      // SUMMARY ON GROWTH PROPENSITY — gray box with teal left border
      const gp = market.growth_propensity
      if (gp && typeof gp === 'object') {
        y += 4
        checkSpace(30)

        // Build content lines
        const gpContentItems = []
        gpContentItems.push({ bold: true, text: 'SUMMARY ON GROWTH PROPENSITY' })
        if (gp.position) gpContentItems.push({ bold: true, text: `Position: ${gp.position}` })
        if (gp.drivers && gp.drivers.length > 0) {
          gpContentItems.push({ bold: true, text: 'Drivers:' })
          gp.drivers.forEach((d, di) => gpContentItems.push({ bold: false, text: `${di + 1}. ${d}` }))
        }
        if (gp.risk) gpContentItems.push({ boldLabel: 'Risk:', text: gp.risk })
        if (gp.strategic_implications) gpContentItems.push({ boldLabel: 'Strategic Implications:', text: gp.strategic_implications })

        // Measure height
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        let gpH = 10
        for (const item of gpContentItems) {
          const t = item.boldLabel ? `${item.boldLabel} ${item.text}` : item.text
          const lines = doc.splitTextToSize(t, contentW - 20)
          gpH += lines.length * 4 + 4
        }
        gpH += 8

        checkSpace(gpH + 4)

        // Gray background box
        doc.setFillColor(240, 242, 245)
        doc.rect(margin, y, contentW, gpH, 'F')
        doc.setFillColor(...COLORS.primary)
        doc.rect(margin, y, 2, gpH, 'F')

        let gpY = y + 10
        for (const item of gpContentItems) {
          doc.setFontSize(8.5)
          if (item.bold) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...COLORS.dark)
            doc.text(item.text, margin + 10, gpY)
            gpY += 6
          } else if (item.boldLabel) {
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...COLORS.dark)
            doc.text(item.boldLabel, margin + 10, gpY)
            const lblW = doc.getTextWidth(item.boldLabel + ' ')
            doc.setFont('helvetica', 'normal')
            const restLines = doc.splitTextToSize(item.text, contentW - 20 - lblW)
            doc.text(restLines[0], margin + 10 + lblW, gpY)
            gpY += 4
            if (item.text.length > (restLines[0] || '').length) {
              const rem = doc.splitTextToSize(item.text.substring((restLines[0] || '').length).trim(), contentW - 20)
              for (const rl of rem) { doc.text(rl, margin + 10, gpY); gpY += 4 }
            }
            gpY += 3
          } else {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...COLORS.dark)
            const lines = doc.splitTextToSize(item.text, contentW - 20)
            for (const l of lines) { doc.text(l, margin + 10, gpY); gpY += 4 }
            gpY += 1
          }
        }
        y += gpH + 6
      }

      y += 6
    }
  } else {
    bodyText(report?.market_summary || '')
  }

  // ========================
  // SECTION 10: ORG & SYSTEMS READINESS
  // ========================
  addPage()
  sectionTitle('10. Organisational & Systems Readiness')

  const p8Score = pillarScores.p8?.score || 0
  const p9Score = pillarScores.p9?.score || 0
  const osrDetailed = report?.org_systems_readiness_detailed

  // Introduction text before chart
  if (osrDetailed?.introduction) {
    bodyText(osrDetailed.introduction, { fontSize: 9 })
  }

  // Readiness Assessment chart — P8 & P9 vs 80% target
  {
    const containerH = 80
    checkSpace(containerH + 4)
    drawRoundedRect(margin, y, contentW, containerH, 6, COLORS.bg)

    // Chart title
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.green)
    doc.text('READINESS ASSESSMENT: P8 & P9 VS 80% TARGET THRESHOLD', pageW / 2, y + 10, { align: 'center' })

    const barStartX = margin + 10
    const barMaxW = contentW - 24
    const barH = 8

    // P8 label + bar
    const p8LabelY = y + 22
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('P8. Organisational Alignment & Capability', barStartX, p8LabelY)
    const p8BarY = p8LabelY + 4
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(barStartX, p8BarY, barMaxW, barH, 3, 3, 'F')
    const p8Color = getBandColor(p8Score)
    doc.setFillColor(...p8Color)
    const p8BarW = Math.max(barMaxW * (p8Score / 100), 1)
    doc.roundedRect(barStartX, p8BarY, p8BarW, barH, 3, 3, 'F')
    // Score inside bar
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text(`${p8Score.toFixed(1)}%`, barStartX + 4, p8BarY + barH / 2 + 1.5)

    // P9 label + bar
    const p9LabelY = p8BarY + barH + 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('P9. Systems Readiness & AI Transformation', barStartX, p9LabelY)
    const p9BarY = p9LabelY + 4
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(barStartX, p9BarY, barMaxW, barH, 3, 3, 'F')
    const p9Color = getBandColor(p9Score)
    doc.setFillColor(...p9Color)
    const p9BarW = Math.max(barMaxW * (p9Score / 100), 1)
    doc.roundedRect(barStartX, p9BarY, p9BarW, barH, 3, 3, 'F')
    // Score inside bar
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    doc.text(`${p9Score.toFixed(1)}%`, barStartX + 4, p9BarY + barH / 2 + 1.5)

    // 80% threshold dashed line
    const thresholdX = barStartX + barMaxW * 0.8
    doc.setDrawColor(...COLORS.coral)
    doc.setLineDashPattern([3, 3], 0)
    doc.setLineWidth(0.7)
    doc.line(thresholdX, p8BarY - 2, thresholdX, p9BarY + barH + 2)
    doc.setLineDashPattern([], 0)

    // Legend: dashed line + "80% Target Threshold"
    const legendY = p9BarY + barH + 8
    doc.setDrawColor(...COLORS.coral)
    doc.setLineDashPattern([2, 2], 0)
    doc.setLineWidth(0.5)
    doc.line(barStartX, legendY, barStartX + 10, legendY)
    doc.setLineDashPattern([], 0)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text('80% Target Threshold', barStartX + 13, legendY + 1)

    y += containerH + 6
  }

  // Assessment Parameters heading
  subHeading('Assessment Parameters')

  // Organisation Readiness: P8 — with score on right
  {
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Organisation Readiness: P8', margin, y)
    doc.setTextColor(...getBandColor(p8Score))
    doc.text(`${p8Score.toFixed(1)}%`, pageW - margin, y, { align: 'right' })
    y += 6

    const p8Part = osrDetailed?.parts?.find(p => p.title && (p.title.includes('P8') || p.title.toLowerCase().includes('organisation') || p.title.toLowerCase().includes('organizational')))
    const p8Text = p8Part?.content || (report?.pillar_narratives?.p8 ? (typeof report.pillar_narratives.p8 === 'string' ? report.pillar_narratives.p8 : (report.pillar_narratives.p8?.narrative || '')) : '')
    if (p8Text) {
      for (const s of p8Text.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
    }
  }

  // Systems Infrastructure: P9 — with score on right
  {
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Systems Infrastructure: P9', margin, y)
    doc.setTextColor(...getBandColor(p9Score))
    doc.text(`${p9Score.toFixed(1)}%`, pageW - margin, y, { align: 'right' })
    y += 6

    const p9Part = osrDetailed?.parts?.find(p => p.title && (p.title.includes('P9') || p.title.toLowerCase().includes('systems')))
    const p9Text = p9Part?.content || (report?.pillar_narratives?.p9 ? (typeof report.pillar_narratives.p9 === 'string' ? report.pillar_narratives.p9 : (report.pillar_narratives.p9?.narrative || '')) : '')
    if (p9Text) {
      for (const s of p9Text.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
    }
  }

  // Joint Implication — The Readiness Paradox
  if (osrDetailed?.readiness_paradox) {
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Joint Implication \u2014 The Readiness Paradox', margin, y)
    y += 6
    for (const s of osrDetailed.readiness_paradox.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
  }

  // AI Readiness Status
  if (osrDetailed?.ai_readiness) {
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('AI Readiness Status', margin, y)
    y += 6
    for (const s of osrDetailed.ai_readiness.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
  }

  // Summary Takeaway
  if (osrDetailed?.summary) {
    checkSpace(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Summary Takeaway', margin, y)
    y += 6
    for (const s of osrDetailed.summary.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
  }

  // Remaining parts not already rendered
  if (osrDetailed?.parts && Array.isArray(osrDetailed.parts)) {
    for (const part of osrDetailed.parts) {
      if (!part.title || !part.content) continue
      if (part.title.includes('P8') || part.title.toLowerCase().includes('organisation') || part.title.toLowerCase().includes('organizational')) continue
      if (part.title.includes('P9') || part.title.toLowerCase().includes('systems')) continue
      checkSpace(12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(part.title, margin, y)
      y += 6
      for (const s of part.content.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim())) { bulletPoint(s.trim(), { fontSize: 8.5 }) }
    }
  }

  renderSectionTakeaway(osrDetailed?.section_takeaway)

  // ========================
  // SECTION 11: WHAT YOUR INPUTS ARE COLLECTIVELY SAYING
  // ========================
  addPage()
  sectionTitle('11. What Your Inputs Are Collectively Saying')

  if (report?.strategic_signals) {
    const ss = report.strategic_signals

    // Introduction
    if (ss?.introduction) {
      bodyText(ss.introduction, { fontSize: 9 })
    } else {
      bodyText('This section looks at what your answers are signalling beneath the scores. It helps show whether the findings reflect real patterns in how the business thinks, works, and makes growth decisions, so you can see what may actually be holding progress back, beyond just the headline numbers.', { fontSize: 9 })
    }

    // Signals as flowing paragraphs with bold title prefix
    if (ss?.signals && Array.isArray(ss.signals) && ss.signals.length > 0) {
      let alignCount = 0
      let misalignCount = 0
      for (const sig of ss.signals) {
        const isAligned = (sig.signal_type === 'Aligned' || sig.type === 'alignment')
        const isMisaligned = (sig.signal_type === 'Misaligned' || sig.type === 'misalignment')
        let label
        if (isAligned) {
          alignCount++
          label = `Alignment Signal ${alignCount}`
        } else if (isMisaligned) {
          misalignCount++
          label = `Misalignment Signal ${misalignCount}`
        } else {
          alignCount++
          label = `Signal ${alignCount}`
        }
        const sigTitle = sig.title || ''
        const boldPrefix = sigTitle ? `${label} \u2014 ${sigTitle}:` : `${label}:`

        checkSpace(10)

        // Colored dot — green for alignment, red for misalignment
        const dotColor = isAligned ? [39, 174, 96] : [192, 57, 43]
        doc.setFillColor(...dotColor)
        doc.circle(margin + 2, y - 1, 2, 'F')

        const dotOffset = 7
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        const prefixW = doc.getTextWidth(boldPrefix + ' ')
        doc.text(boldPrefix, margin + dotOffset, y)

        // Description text flows after bold prefix
        doc.setFont('helvetica', 'normal')
        const descText = sig.description || ''
        const firstLineW = contentW - prefixW - dotOffset
        const firstLineWords = descText.split(' ')
        let firstLine = ''
        let remaining = descText
        for (const word of firstLineWords) {
          const test = firstLine ? firstLine + ' ' + word : word
          if (doc.getTextWidth(test) <= firstLineW) {
            firstLine = test
          } else break
        }
        remaining = descText.substring(firstLine.length).trim()
        doc.text(firstLine, margin + dotOffset + prefixW, y)
        y += 4

        if (remaining) {
          const restLines = doc.splitTextToSize(remaining, contentW - dotOffset)
          for (const rl of restLines) {
            checkSpace(4)
            doc.text(rl, margin + dotOffset, y)
            y += 4
          }
        }
        y += 4
      }
    }

    // Implication — rendered as bullet points
    if (ss?.narrative) {
      checkSpace(10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text('Implication:', margin, y)
      y += 6

      // Split narrative into sentences for bullet points
      const sentences = ss.narrative
        .split(/(?<=\.)\s+(?=[A-Z])/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const sentence of sentences) {
        bulletPoint(sentence, { fontSize: 8.5 })
      }
      y += 2
    }

    renderSectionTakeaway(ss?.section_takeaway)
  } else {
    bodyText('Strategic signals data not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // SECTION 12: RECOMMENDED GROWTH AREAS TO FOCUS ON
  // ========================
  addPage()
  sectionTitle('12. Recommended Growth Areas to Focus On')

  // I7: Use AI-generated advisory workstream data
  const aw = report?.advisory_workstream
  if (aw && aw.recommended_engagement && aw.recommended_engagement !== 'N/A') {
    // Structured focus areas table
    if (aw.focus_areas?.length > 0 && typeof aw.focus_areas[0] === 'object') {
      subHeading('Recommended Focus Areas (Priority Order)')
      const faHeaders = ['Focus Area', 'Scope', 'Timeline', 'Ideal Owner', 'Outcome']
      const faColWidths = [contentW * 0.2, contentW * 0.25, contentW * 0.12, contentW * 0.15, contentW * 0.28]
      const faRows = aw.focus_areas.map(fa => [
        fa.focus_area || '',
        fa.scope || '',
        fa.timeline || '',
        fa.ideal_owner || '',
        fa.outcome || '',
      ])
      drawWrappedTable(faHeaders, faRows, { colWidths: faColWidths, fontSize: 7.5, boldFirstCol: true })
    }

    // Advisory rationale
    if (aw.advisory_rationale) {
      addPage()
      subHeading('Advisory Rationale')
      paragraphAsBullets(aw.advisory_rationale, { fontSize: 9 })
    }

    // Section takeaway
    renderSectionTakeaway(aw.section_takeaway)
  } else {
    // Fallback: derive from lowest scoring pillars
    const ranked = [...sortedPillars].sort(([, a], [, b]) => a.score - b.score)
    const workstreams = ranked.slice(0, 3).map(([pid, data], i) => ({
      priority: i + 1,
      workstream: PILLAR_NAMES[pid],
      reason: report?.pillar_narratives?.[pid] || `Score: ${data.score}/100 \u2014 requires attention.`,
    }))

    const wsHeaders = ['Priority', 'Recommended Workstream', 'Reason']
    const wsColWidths = [contentW * 0.12, contentW * 0.33, contentW * 0.55]
    const wsRows = workstreams.map(ws => [String(ws.priority), ws.workstream, ws.reason.substring(0, 80)])
    drawTable(wsHeaders, wsRows, { colWidths: wsColWidths, fontSize: 9 })
  }

  // ========================
  // SECTION 13: 30-60-90 DAY ACTION ROADMAP
  // ========================
  addPage()
  // I8/E5: Conditional title for high-performers
  sectionTitle(isHighPerformer ? '13. Acceleration Plan' : '13. 30-60-90 Day Action Roadmap')

  if (report?.action_plan) {
    // Introduction paragraph
    if (report.action_plan.introduction) {
      bodyText(report.action_plan.introduction, { fontSize: 9 })
    }

    // Phase tables — 5 columns: Action, Pillar, Ideal Owner, Deliverable, Metric
    const phases = [
      { titleKey: 'phase1_title', itemsKey: 'phase1_items', label: 'Phase 1: Days 1-30' },
      { titleKey: 'phase2_title', itemsKey: 'phase2_items', label: 'Phase 2: Days 31-60' },
      { titleKey: 'phase3_title', itemsKey: 'phase3_items', label: 'Phase 3: Days 61-90' },
    ]

    const phaseHeaders = ['Action', 'Pillar', 'Ideal\nOwner', 'Deliverable', 'Metric']
    const phaseColWidths = [contentW * 0.22, contentW * 0.08, contentW * 0.12, contentW * 0.30, contentW * 0.28]

    for (const phase of phases) {
      const title = report.action_plan[phase.titleKey] || ''
      const items = report.action_plan[phase.itemsKey] || []
      if (items.length === 0) continue

      // Phase heading — teal colored, wrapped if too long
      y += 4
      checkSpace(18)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      const phaseFullTitle = `${phase.label} \u2014 ${title}`
      const phaseTitleLines = doc.splitTextToSize(phaseFullTitle, contentW)
      for (const ptl of phaseTitleLines) {
        doc.text(ptl, margin, y)
        y += 5
      }
      y += 3

      // Phase table
      const phaseRows = items.map(item => [
        typeof item === 'string' ? item : (item.action || ''),
        typeof item === 'object' ? (item.pillar || '') : '',
        typeof item === 'object' ? (item.ideal_owner || '') : '',
        typeof item === 'object' ? (item.deliverable || '') : '',
        typeof item === 'object' ? (item.metric || '') : '',
      ])
      drawWrappedTable(phaseHeaders, phaseRows, { colWidths: phaseColWidths, fontSize: 7.5, headerColor: COLORS.dark })
    }

    // Roadmap Rationale bullets
    if (report.action_plan.roadmap_rationale?.length) {
      y += 4
      checkSpace(12)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text('Roadmap Rationale:', margin, y)
      y += 6
      for (const b of report.action_plan.roadmap_rationale) {
        bulletPoint(b, { fontSize: 9 })
      }
    }

    // Qualitative Responses: Coverage in the 30-60-90 Day Plan
    if (report.action_plan.qualitative_coverage_table?.length) {
      y += 4
      subHeading('Qualitative Responses: Coverage in the 30-60-90 Day Plan')
      bodyText('The table below maps each qualitative response from the diagnostic to the specific corrective actions addressed within the 30-60-90 day roadmap.', { fontSize: 9 })

      const qcHeaders = ['Qualitative Question', 'Submitted Response', 'Corrective Action in the 30-60-90 Day Plan']
      const qcColWidths = [contentW * 0.28, contentW * 0.30, contentW * 0.42]
      const qcRows = report.action_plan.qualitative_coverage_table.map(row => [
        `${row.question_ref || ''}. ${row.question_text || ''}`,
        row.submitted_response || '',
        row.corrective_action || '',
      ])
      drawWrappedTable(qcHeaders, qcRows, { colWidths: qcColWidths, fontSize: 7.5, headerColor: COLORS.dark })
    }

    // Section takeaway
    renderSectionTakeaway(report.action_plan.section_takeaway)
  } else {
    bodyText(report?.action_summary || '')
  }

  // ========================
  // SECTION 14: EXPECTED OUTCOMES IF THE PLAN IS FOLLOWED
  // ========================
  const expectedOutcomes = report?.expected_outcomes
  if (expectedOutcomes) {
    addPage()
    sectionTitle('14. Expected Outcomes If the Plan Is Followed')

    // Introduction
    if (expectedOutcomes.introduction) {
      bodyText(expectedOutcomes.introduction, { fontSize: 9 })
    }

    // Priority tiers table
    if (expectedOutcomes.priority_tiers?.length) {
      const ptHeaders = ['Tier', 'Actions', 'Rationale']
      const ptColWidths = [contentW * 0.12, contentW * 0.44, contentW * 0.44]
      const ptRows = expectedOutcomes.priority_tiers.map(t => [
        t.tier || '',
        Array.isArray(t.actions) ? t.actions.join('; ') : (t.actions || ''),
        t.rationale || '',
      ])
      drawWrappedTable(ptHeaders, ptRows, { colWidths: ptColWidths, fontSize: 8, boldFirstCol: true })
    }

    // Execution Discipline — bold prefix inline (new page)
    addPage()
    if (expectedOutcomes.execution_discipline) {
      checkSpace(10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const edPrefix = 'Execution Discipline: '
      const edPrefixW = doc.getTextWidth(edPrefix)
      doc.text(edPrefix, margin, y)
      doc.setFont('helvetica', 'normal')
      const edLines = doc.splitTextToSize(expectedOutcomes.execution_discipline, contentW - edPrefixW)
      doc.text(edLines[0], margin + edPrefixW, y)
      y += 4
      if (edLines.length > 1) {
        const edRest = doc.splitTextToSize(expectedOutcomes.execution_discipline.substring(edLines[0].length).trim(), contentW)
        for (const rl of edRest) {
          checkSpace(4)
          doc.text(rl, margin, y)
          y += 4
        }
      }
      y += 4
    }

    // Revenue Confidence Outlook
    subHeading('Revenue Confidence Outlook')
    if (expectedOutcomes.revenue_confidence_intro) {
      paragraphAsBullets(expectedOutcomes.revenue_confidence_intro, { fontSize: 9 })
    }

    // Note: bold prefix
    if (expectedOutcomes.revenue_confidence_note) {
      checkSpace(10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const notePrefix = 'Note: '
      const notePrefixW = doc.getTextWidth(notePrefix)
      doc.text(notePrefix, margin, y)
      doc.setFont('helvetica', 'normal')
      const noteLines = doc.splitTextToSize(expectedOutcomes.revenue_confidence_note, contentW - notePrefixW)
      doc.text(noteLines[0], margin + notePrefixW, y)
      y += 4
      if (noteLines.length > 1) {
        const noteRest = doc.splitTextToSize(expectedOutcomes.revenue_confidence_note.substring(noteLines[0].length).trim(), contentW)
        for (const rl of noteRest) {
          checkSpace(4)
          doc.text(rl, margin, y)
          y += 4
        }
      }
      y += 4
    }

    // Current RAPS Score — teal subHeading
    if (raps?.score !== undefined) {
      subHeading(`Current RAPS Score for ${company}: ${raps.score} / 100`)
    }

    // RAPS context
    if (expectedOutcomes.raps_context) {
      paragraphAsBullets(expectedOutcomes.raps_context, { fontSize: 9 })
    }

    // Formula line — bold
    checkSpace(10)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    const formulaLines = doc.splitTextToSize('Projected RAPS = Current RAPS + estimated improvement from implementing the recommended 30-60-90 day plan', contentW)
    for (const fl of formulaLines) {
      doc.text(fl, margin, y)
      y += 4
    }
    y += 4

    // Revenue confidence scenarios table
    if (expectedOutcomes.revenue_confidence_scenarios?.length) {
      const rcsHeaders = ['Scenario', 'What Happens', 'Projected RAPS', 'Projected Increase']
      const rcsColWidths = [contentW * 0.16, contentW * 0.39, contentW * 0.2, contentW * 0.25]
      const rcsRows = expectedOutcomes.revenue_confidence_scenarios.map(s => [
        s.scenario || '',
        s.description || '',
        s.projected_raps != null ? String(s.projected_raps) : '',
        s.projected_increase || '',
      ])
      drawWrappedTable(rcsHeaders, rcsRows, { colWidths: rcsColWidths, fontSize: 8, boldFirstCol: true })
    }

    // Closing Summary — bold prefix inline
    if (expectedOutcomes.closing_summary) {
      checkSpace(10)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const csPrefix = 'Closing Summary: '
      const csPrefixW = doc.getTextWidth(csPrefix)
      doc.text(csPrefix, margin, y)
      doc.setFont('helvetica', 'normal')
      const csLines = doc.splitTextToSize(expectedOutcomes.closing_summary, contentW - csPrefixW)
      doc.text(csLines[0], margin + csPrefixW, y)
      y += 4
      if (csLines.length > 1) {
        const csRest = doc.splitTextToSize(expectedOutcomes.closing_summary.substring(csLines[0].length).trim(), contentW)
        for (const rl of csRest) {
          checkSpace(4)
          doc.text(rl, margin, y)
          y += 4
        }
      }
      y += 4
    }

    // Section takeaway
    renderSectionTakeaway(expectedOutcomes.section_takeaway)
  }

  // ========================
  // SECTION 15: CLOSING OBSERVATION
  // ========================
  addPage()
  sectionTitle('15. Closing Observation')

  // v2: Use closing_observation_v2 paragraphs if available
  const closingV2 = report?.closing_observation_v2
  if (closingV2?.paragraphs?.length) {
    for (const para of closingV2.paragraphs) {
      bodyText(para, { fontSize: 10 })
    }
    renderSectionTakeaway(closingV2.section_takeaway)
  } else if (report?.closing_observation) {
    // C1: Use dedicated closing_observation field instead of exec summary last paragraph
    bodyText(report.closing_observation, { fontSize: 10 })
  } else {
    bodyText(`${company}'s growth system diagnostic reveals a score of ${radScore}/100 (${maturityBand}). The primary constraint${primaryConstraints.length > 1 ? 's are' : ' is'} ${constraintNames}. Addressing ${primaryConstraints.length > 1 ? 'these' : 'this'}, along with strengthening the supporting pillars, will position the business for more efficient and scalable growth.`, { fontSize: 10 })
  }

  // ========================
  // APPENDIX A: FULL SCORING DETAIL
  // ========================
  addPage()
  sectionTitle('Appendix A: Full Scoring Detail')

  // Summary table — 9 pillar rows + total, with status badges
  {
    const appHeaders = ['Pillar', 'Raw Avg', 'Weight', 'Weighted Contrib', 'Contrib %', 'Status']
    const appColWidths = [contentW * 0.28, contentW * 0.1, contentW * 0.1, contentW * 0.16, contentW * 0.13, contentW * 0.23]
    const appData = sortedPillars.map(([pid, ps]) => {
      const weight = PILLAR_WEIGHTS[pid] || 0
      const weightedContrib = (ps.avg || 0) * (weight * 100) / 100
      const contribPct = radScore > 0 ? ((ps.score * weight) / radScore * 100).toFixed(1) + '%' : '0%'
      return { cells: [pillarLabel(pid), (ps.avg || 0).toFixed(2), `${(weight * 100).toFixed(0)}%`, weightedContrib.toFixed(2), contribPct, getBandLabel(ps.score)], score: ps.score, isTotal: false }
    })
    // Total row
    appData.push({ cells: ['TOTAL / OVERALL SCORE', '', '100%', radScore.toFixed(2), '100%', getBandLabel(radScore)], score: radScore, isTotal: true })

    // Header
    checkSpace(12)
    let x = margin
    drawRoundedRect(margin, y - 1, contentW, 10, 1, COLORS.primary)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.white)
    for (let i = 0; i < appHeaders.length; i++) {
      doc.text(appHeaders[i], x + 2, y + 5)
      x += appColWidths[i]
    }
    y += 11

    // Data rows
    for (let ri = 0; ri < appData.length; ri++) {
      const row = appData[ri]
      const cells = row.cells

      // Compute row height for wrapped text
      doc.setFontSize(7.5)
      const cellLines = cells.map((cell, ci) => doc.splitTextToSize(String(cell || ''), appColWidths[ci] - 4))
      const maxLines = Math.max(...cellLines.map(l => l.length))
      const lineH = 7.5 * 0.353 * 1.3
      const rowH = Math.max(maxLines * lineH + 4, 8)

      checkSpace(rowH + 2)

      // Alternating bg
      if (ri % 2 === 0) {
        drawRoundedRect(margin, y - 1, contentW, rowH, 0, COLORS.pearl)
      }
      if (row.isTotal) {
        drawRoundedRect(margin, y - 1, contentW, rowH, 0, COLORS.bg)
      }
      drawLine(y - 1, COLORS.border)

      x = margin
      for (let ci = 0; ci < cells.length; ci++) {
        doc.setFontSize(7.5)

        if (ci === cells.length - 1) {
          // Status column — render as colored badge
          const bandColor = row.isTotal ? getMaturityColor(row.score) : getBandColor(row.score)
          const badgeText = String(cells[ci]).toUpperCase()
          doc.setFont('helvetica', 'bold')
          const badgeW = Math.min(doc.getTextWidth(badgeText) + 5, appColWidths[ci] - 2)
          const badgeH = 5
          const badgeX = x + 2
          const badgeY = y + (rowH - badgeH) / 2 - 1
          doc.setFillColor(...bandColor)
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F')
          doc.setTextColor(...COLORS.white)
          doc.text(badgeText, badgeX + 2.5, badgeY + 3.5)
        } else if (ci === 0) {
          // First column bold
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...COLORS.dark)
          const lines = cellLines[ci]
          for (let li = 0; li < lines.length; li++) {
            doc.text(lines[li], x + 2, y + 3 + li * lineH)
          }
        } else {
          // Normal cells
          doc.setFont('helvetica', row.isTotal ? 'bold' : 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = cellLines[ci]
          for (let li = 0; li < lines.length; li++) {
            doc.text(lines[li], x + 2, y + 3 + li * lineH)
          }
        }
        x += appColWidths[ci]
      }
      y += rowH
    }
    y += 6
  }

  // Scoring methodology
  bodyText('Scoring Methodology: Each pillar is evaluated on a 0-5 scale across 5-8 sub-criteria. Raw average is the mean of sub-criterion scores. This is converted to a percentage (0-100%) and weighted by pillar importance (total weights sum to 100%). Weighted contribution is multiplied into overall score. Status is determined by percentage: >=80% = Strong, 60-79% = Developing, 50-59% = Fragile, <50% = At Risk.', { fontSize: 8, color: COLORS.medium })

  // Post-process: fill in "Page X of Y" on all pages
  addPageNumbers()

  // Save
  const filename = `${company.replace(/\s+/g, '_')}_RAD_Report.pdf`
  doc.save(filename)
  return filename
}
