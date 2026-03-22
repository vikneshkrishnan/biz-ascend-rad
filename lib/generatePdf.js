import { jsPDF } from 'jspdf'
import { PILLAR_WEIGHTS, PILLAR_NAMES, CLUSTER_DEFINITIONS, DATA_SOURCE_LABELS, MOAT_RUBRIC, CAUSAL_LINKAGES } from '@/lib/constants'

const COLORS = {
  primary: [38, 70, 83],       // Deep Navy #264653
  accent: [69, 123, 157],      // Ocean Blue #457B9D
  dark: [51, 51, 51],          // #333333
  medium: [108, 117, 125],     // Slate Grey #6C757D
  light: [108, 117, 125],     // Slate Grey #6C757D (subtle text per spec)
  lavender: [184, 184, 209],   // Soft Lavender #B8B8D1 (neutral/informational accent)
  white: [255, 255, 255],
  bg: [250, 249, 246],         // Warm White #FAF9F6
  border: [224, 224, 224],     // #E0E0E0 (unfilled bar track, subtle borders per spec)
  pearl: [240, 239, 235],      // Light Pearl #F0EFEB
  green: [42, 157, 143],       // Soft Teal #2A9D8F (Strong)
  sage: [138, 177, 125],       // Warm Sage #8AB17D (Developing)
  gold: [233, 196, 106],       // Muted Gold #E9C46A (Intermediate)
  coral: [231, 111, 81],       // Warm Coral #E76F51 (At Risk)
  darkCard: [45, 52, 54],      // #2D3436
  oceanBlue: [69, 123, 157],   // #457B9D
}

// Default thresholds - can be overridden via platform_settings
const DEFAULT_THRESHOLDS = { green: 80, yellow: 65, orange: 50 }
let activeThresholds = DEFAULT_THRESHOLDS

function getBandColor(score) {
  if (score >= 80) return COLORS.green     // Soft Teal — Strong
  if (score >= 60) return COLORS.sage      // Warm Sage — Developing
  if (score >= 40) return COLORS.gold      // Muted Gold — Fragile/Amber
  return COLORS.coral                       // Warm Coral — At Risk
}

// 3-tier maturity band colour (cover page badge, overall maturity)
function getMaturityColor(score) {
  if (score >= 80) return COLORS.green     // Growth Engine Strong
  if (score >= 50) return COLORS.sage      // Growth System Developing
  return COLORS.coral                       // Growth System At Risk
}

function getBandLabel(score) {
  if (score >= 80) return 'Strong'
  if (score >= 50) return 'Developing'
  return 'At Risk'
}

function getBandName(score) {
  if (score >= 80) return 'Growth Engine Strong'
  if (score >= 50) return 'Growth System Developing'
  return 'Growth System At Risk'
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

function getMoatLabel(score) {
  const entry = MOAT_RUBRIC.find(r => score >= r.min && score <= r.max)
  return entry ? entry.label : 'Unknown'
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

export async function generateClientPdf({ scores, report, project, screenerResponses, thresholds }) {
  if (thresholds) activeThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 0

  const sr = screenerResponses || {}
  const company = sr.q4 || project?.company_name || 'Company'
  const industry = sr.q5 || 'Industry'
  const markets = sr.q6 || 'N/A'
  const marketsStr = Array.isArray(markets) ? markets.join(', ') : String(markets)
  const radScore = scores?.radScore || 0
  const maturityBand = scores?.maturityBand || getBandName(radScore)
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
  const diagnosticResponses = scores?.diagnosticResponses || {}

  // --- Utility functions ---
  function addPage() {
    doc.addPage()
    y = margin
    addFooter()
  }

  function checkSpace(needed) {
    if (y + needed > pageH - 25) {
      addPage()
      return true
    }
    return false
  }

  function addFooter() {
    const pageNum = doc.internal.getNumberOfPages()
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.light)
    doc.text('Biz Ascend RAD\u2122 \u2014 Revenue Acceleration Diagnostic', margin, pageH - 8)
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 8, { align: 'right' })
    doc.text('Confidential', pageW / 2, pageH - 8, { align: 'center' })
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
    doc.text(title, margin, y)
    y += 2
    drawLine(y, COLORS.primary)
    y += 12
  }

  function sourceLabel(key) {
    const label = DATA_SOURCE_LABELS[key]
    if (!label) return
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.light)
    doc.text(label, margin, y)
    y += 5
  }

  function subHeading(text) {
    checkSpace(14)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(text, margin, y)
    y += 9
  }

  function bodyText(text, opts = {}) {
    if (!text) return
    const { fontSize = 10, color = COLORS.dark, indent = 0, bold = false, italic = false, lineHeight = 1.5 } = opts
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : italic ? 'italic' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW - indent)
    const lineSpacing = fontSize * 0.353 * lineHeight
    for (const line of lines) {
      checkSpace(lineSpacing + 2)
      doc.text(line, margin + indent, y)
      y += lineSpacing
    }
    y += 5
  }

  function bulletPoint(text, opts = {}) {
    const { indent = 4, fontSize = 9, color = COLORS.dark } = opts
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW - indent - 6)
    const lineSpacing = fontSize * 0.353 * 1.4
    for (let i = 0; i < lines.length; i++) {
      checkSpace(lineSpacing + 2)
      if (i === 0) {
        doc.text('\u2022', margin + indent, y)
      }
      doc.text(lines[i], margin + indent + 5, y)
      y += lineSpacing
    }
    y += 2
  }

  // Draw a simple table
  function drawTable(headers, rows, opts = {}) {
    const { colWidths, fontSize = 9, rowHeight = 7, rowColors } = opts
    const totalCols = headers.length
    const cws = colWidths || headers.map(() => contentW / totalCols)

    checkSpace(rowHeight * (rows.length + 1) + 4)

    // Header - Deep Navy background with white text
    let x = margin
    drawRoundedRect(margin, y - 1, contentW, rowHeight + 1, 1, COLORS.primary)
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

    // Draw data points - Soft Teal
    for (const p of points) {
      doc.setFillColor(...COLORS.green)
      doc.circle(p.x, p.y, 1.2, 'F')
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

    for (const item of data) {
      checkSpace(barHeight + gap + 2)

      // Label
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const truncLabel = item.label.length > 28 ? item.label.substring(0, 28) + '..' : item.label
      doc.text(truncLabel, margin, y + barHeight / 2 + 1)

      // Background bar
      const barX = margin + labelWidth
      doc.setFillColor(...COLORS.border)
      doc.roundedRect(barX, y, barMaxW, barHeight, 4, 4, 'F')

      // Value bar — semi-transparent fill (0.85) with full-opacity border per spec
      const color = getBandColor(item.score)
      doc.setFillColor(...color)
      doc.setDrawColor(...color)
      doc.setLineWidth(0.5)
      const valW = Math.max(barMaxW * (item.score / 100), 1)
      doc.setGState(new doc.GState({ opacity: 0.85 }))
      doc.roundedRect(barX, y, valW, barHeight, 4, 4, 'F')
      doc.setGState(new doc.GState({ opacity: 1 }))
      doc.roundedRect(barX, y, valW, barHeight, 4, 4, 'S')

      // Score label
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(String(item.score) + '%', barX + barMaxW + 3, y + barHeight / 2 + 1)

      y += barHeight + gap
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

    // Score text - 24pt, status colour per spec
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...getBandColor(score))
    doc.text(String(score), cx, cy + 10, { align: 'center' })

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
      { label: 'Target', value: data.target || 0, type: 'total' },
      { label: 'Invoiced', value: -(data.invoiced || 0), type: 'negative' },
      { label: 'Remaining', value: data.remaining || 0, type: 'subtotal' },
      { label: 'Pipeline', value: data.pipeline || 0, type: 'positive' },
      { label: 'Exp. Conv.', value: -(data.expected_convertible || 0), type: 'negative' },
      { label: 'Gap', value: data.gap || 0, type: 'result' },
    ]

    const maxVal = Math.max(...bars.map(b => Math.abs(b.value)), 1)
    const barW = (width - 30) / bars.length
    const barGap = 4

    checkSpace(height + 20)

    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]
      const barH = Math.max((Math.abs(bar.value) / maxVal) * (height - 20), 2)
      const bx = startX + i * (barW + barGap / bars.length)
      const by = startY + height - barH - 10

      // Waterfall colors per spec: Ocean Blue for positive, Warm Coral for negative/gap, Muted Gold for remaining
      let color = COLORS.oceanBlue
      if (bar.type === 'negative') color = COLORS.coral
      else if (bar.type === 'positive') color = COLORS.oceanBlue
      else if (bar.type === 'subtotal') color = COLORS.gold
      else if (bar.type === 'result') color = bar.value > 0 ? COLORS.oceanBlue : COLORS.coral

      doc.setFillColor(...color)
      doc.roundedRect(bx, by, barW - 4, barH, 2, 2, 'F')

      // Value label
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      const valStr = bar.value < 0
        ? `-$${Math.abs(bar.value).toLocaleString()}`
        : `$${Math.abs(bar.value).toLocaleString()}`
      doc.text(valStr, bx + (barW - 4) / 2, by - 2, { align: 'center' })

      // Label
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      doc.text(bar.label, bx + (barW - 4) / 2, startY + height, { align: 'center' })
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

  // ========================
  // PAGE 1: COVER PAGE
  // ========================
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageW, 6, 'F')

  // Logo
  y = 30
  try {
    const logoBase64 = await loadImageAsBase64('/logo.jpeg')
    const logoW = 70
    const logoH = logoW * (401 / 1600) // maintain aspect ratio
    doc.addImage(logoBase64, 'JPEG', pageW / 2 - logoW / 2, y, logoW, logoH)
    y += logoH + 6
  } catch {
    // Fallback if logo fails to load
    y = 40
    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(pageW / 2 - 12, y, 24, 24, 4, 4, 'F')
    doc.setFontSize(14)
    doc.setTextColor(...COLORS.white)
    doc.setFont('helvetica', 'bold')
    doc.text('RAD', pageW / 2, y + 15, { align: 'center' })
    y += 30
  }

  y = Math.max(y + 8, 80)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('B2B Revenue Acceleration', pageW / 2, y, { align: 'center' })
  y += 12
  doc.text('Diagnostic [RAD] Report', pageW / 2, y, { align: 'center' })

  y += 10
  drawLine(y, COLORS.primary)

  // Report Information table
  y += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('Report Information', margin, y)
  y += 8

  drawInfoTable([
    ['Company', company],
    ['Assessment Date', dateStr],
    ['Industry', industry],
    ['Markets', marketsStr],
    ['Revenue Band', sr.q7 || 'N/A'],
    ['Sales Model', sr.q10 || 'N/A'],
  ])

  // Score card - darkCard background
  y += 4
  const cardX = pageW / 2 - 40
  const cardW = 80
  drawRoundedRect(cardX, y, cardW, 50, 4, COLORS.darkCard)
  doc.setFillColor(...bandColor)
  doc.rect(cardX, y, cardW, 4, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text('GROWTH SYSTEM SCORE', pageW / 2, y + 14, { align: 'center' })
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...bandColor)
  doc.text(String(radScore) + '%', pageW / 2, y + 32, { align: 'center' })
  const bText = maturityBand.toUpperCase()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  const bw = doc.getTextWidth(bText) + 14
  doc.setFillColor(...bandColor)
  doc.roundedRect(pageW / 2 - bw / 2, y + 37, bw, 7, 3, 3, 'F')
  doc.setTextColor(...COLORS.white)
  doc.text(bText, pageW / 2, y + 42.5, { align: 'center' })

  doc.setFillColor(...COLORS.primary)
  doc.rect(0, pageH - 6, pageW, 6, 'F')
  addFooter()

  // ========================
  // PAGE 2: TABLE OF CONTENTS
  // ========================
  addPage()
  y = margin
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Table of Contents', margin, y)
  y += 4
  drawLine(y, COLORS.primary)
  y += 12

  const tocItems = [
    'Executive Summary',
    'Company Input Snapshot',
    'Growth System Diagnostic Overview',
    'Primary Growth Constraint',
    'Pillar Deep Dive: P1\u2013P3',
    'Pillar Deep Dive: P4\u2013P6',
    'Pillar Deep Dive: P7\u2013P9',
    'Growth Constraint Map',
    'Cross-Pillar Interaction Analysis',
    'Competitive Positioning Assessment',
    'Revenue Achievement Probability Score (RAPS)',
    'Market Opportunity Context',
    'Organisational and Systems Readiness',
    'Strategic Signals',
    'Advisory Workstream Recommendation',
    '30-60-90 Day Action Roadmap',
    'Priority Actions Summary',
    'Closing Observation',
    'Appendix A: Full Scoring Detail',
  ]

  tocItems.forEach((title, i) => {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(`${i + 1}.`, margin, y)
    doc.text(title, margin + 10, y)
    y += 10
  })

  // ========================
  // SECTION 1: EXECUTIVE SUMMARY
  // ========================
  addPage()
  sectionTitle('1. Executive Summary')
  sourceLabel('executive_summary')

  const sortedPillars = Object.entries(pillarScores).sort(([a], [b]) => a.localeCompare(b))

  // Ensure enough space for a meaningful chunk of text before page break
  checkSpace(60)
  bodyText(report?.executive_summary || '')

  // Executive Scorecard — Radar Chart
  if (sortedPillars.length >= 3) {
    addPage()
    y += 4
    subHeading('Executive Scorecard')
    y += 4
    const radarData = sortedPillars.map(([pid, data]) => ({
      label: PILLAR_NAMES[pid] || pid,
      score: data.score || 0,
    }))
    drawRadarChart(radarData, { cx: pageW / 2, cy: y + 45, radius: 38, labelOffset: 14 })
    y += 100

    // Executive Scorecard explanation bullets
    const scorecardBullets = report?.scorecard_explanation || []
    if (scorecardBullets.length > 0) {
      y += 2
      for (const bullet of scorecardBullets) {
        bulletPoint(bullet)
      }
    }
  }

  // ========================
  // SECTION 2: COMPANY INPUT SNAPSHOT
  // ========================
  addPage()
  sectionTitle('2. Company Input Snapshot')
  sourceLabel('company_snapshot')

  const gtmChannels = sr.q11
    ? (Array.isArray(sr.q11) ? sr.q11.join(', ') : String(sr.q11))
    : 'N/A'

  // I1: If snapshot interpretations exist, show them alongside the values
  const si = report?.snapshot_interpretations || {}
  const siMap = {
    'Revenue Band': si.revenue_band,
    'Sales Team': si.sales_team,
    'Marketing Budget': si.marketing_budget,
    'Sales Model': si.sales_model,
    'Average Deal Size': si.deal_size,
    'Avg Sales Cycle': si.sales_cycle,
    'Avg Win Rate': si.win_rate,
    'FY Revenue Target': si.revenue_target,
    'Revenue Invoiced YTD': si.revenue_invoiced,
  }

  const snapshotPairs = [
    ['Respondent', sr.q1 || 'N/A'],
    ['Revenue Band', sr.q7 || 'N/A'],
    ['Industry', industry],
    ['Sales Team', sr.q8 || 'N/A'],
    ['Markets', marketsStr],
    ['Marketing Budget', sr.q9 || 'N/A'],
    ['Sales Model', sr.q10 || 'N/A'],
    ['Average Deal Size', sr.q14 || 'N/A'],
    ['GTM Channels', gtmChannels],
    ['Avg Sales Cycle', sr.q15 || 'N/A'],
    ['Avg Win Rate', sr.q17 || 'N/A'],
    ['FY Revenue Target', sr.q18 ? `$${Number(sr.q18).toLocaleString()}` : 'N/A'],
    ['Revenue Invoiced YTD', sr.q19 ? `$${Number(sr.q19).toLocaleString()}` : 'N/A'],
    ['Fiscal Year End', sr.q20 || 'N/A'],
  ]

  drawInfoTable(snapshotPairs)

  // Render AI interpretations if available
  if (Object.keys(si).length > 0) {
    y += 2
    bodyText('AI Metric Interpretations:', { bold: true, fontSize: 8.5, color: COLORS.medium })
    for (const [label, interp] of Object.entries(siMap)) {
      if (interp) {
        checkSpace(5)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.medium)
        doc.text(`${label}: `, margin + 4, y)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...COLORS.accent)
        doc.text(interp, margin + 4 + doc.getTextWidth(`${label}: `), y)
        y += 4
      }
    }
    y += 4
  }

  if (sr.q12) {
    y += 2
    bodyText('Submitted Positioning Statement:', { bold: true, fontSize: 9 })
    bodyText(`"${sr.q12}"`, { italic: true, fontSize: 9, indent: 4 })
  }
  if (sr.q13) {
    bodyText('Top Competitors:', { bold: true, fontSize: 9 })
    bodyText(sr.q13, { fontSize: 9, indent: 4 })
  }

  // ========================
  // SECTION 3: GROWTH SYSTEM DIAGNOSTIC OVERVIEW
  // ========================
  addPage()
  sectionTitle('3. Growth System Diagnostic Overview')
  sourceLabel('diagnostic_overview')

  subHeading('Pillar Performance')
  y += 2

  // Pillar table
  const pHeaders = ['Pillar', 'Weight', 'Raw Avg (/5)', 'Weighted Score', 'Status']
  const pColWidths = [contentW * 0.36, contentW * 0.12, contentW * 0.16, contentW * 0.2, contentW * 0.16]
  const pRows = sortedPillars.map(([pid, data]) => {
    const weight = PILLAR_WEIGHTS[pid] || 0
    const weightedScore = (data.score * weight).toFixed(2) + '%'
    const status = getBandLabel(data.score)
    return [pillarLabel(pid), `${(weight * 100).toFixed(0)}%`, (data.avg || 0).toFixed(2), weightedScore, status]
  })

  // Total row
  let twSum = 0
  for (const [pid, data] of sortedPillars) {
    twSum += (PILLAR_WEIGHTS[pid] || 0) * data.score
  }
  pRows.push(['Total', '100%', '', twSum.toFixed(2) + '%', getBandLabel(radScore)])

  const pRowColors = sortedPillars.map(([, data]) => getBandColor(data.score))
  pRowColors.push(getMaturityColor(radScore))

  drawTable(pHeaders, pRows, { colWidths: pColWidths, fontSize: 8, rowHeight: 6.5, rowColors: pRowColors })

  // Growth System Heatmap — Horizontal Bar Chart
  y += 4
  subHeading('Growth System Heatmap')
  y += 2
  const heatmapData = sortedPillars.map(([pid, data]) => ({
    label: PILLAR_NAMES[pid] || pid,
    score: data.score || 0,
  }))
  drawHBarChart(heatmapData, { barHeight: 7, gap: 3, labelWidth: 55 })

  // C3: AI Diagnostic Interpretation (replaces exec summary excerpt)
  y += 4
  if (report?.diagnostic_interpretation) {
    subHeading('Diagnostic Interpretation')
    bodyText(report.diagnostic_interpretation, { fontSize: 9 })
  } else if (report?.executive_summary) {
    const overview = report.executive_summary.split('\n').slice(0, 2).join(' ')
    if (overview) {
      bodyText(overview, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 4: PRIMARY GROWTH CONSTRAINT
  // ========================
  addPage()
  // C4/E5: Conditional heading for high-performers
  sectionTitle(isHighPerformer ? '4. Primary Optimisation Opportunity' : '4. Primary Growth Constraint')
  sourceLabel('primary_constraint')

  // Collect all pillars scoring < 50% as primary constraints
  const primaryConstraints = sortedPillars.filter(([, data]) => data.score < 50)
  const constraintNames = primaryConstraints.length > 0
    ? primaryConstraints.map(([pid]) => PILLAR_NAMES[pid]).join(', ')
    : (constraint?.name || 'N/A')
  const ca = report?.constraint_analysis

  for (const [cPid, cData] of (primaryConstraints.length > 0 ? primaryConstraints : [[constraint?.id, constraint]])) {
    const cName = PILLAR_NAMES[cPid] || constraint?.name || 'N/A'
    const cScore = cPid ? pillarScores[cPid]?.score ?? cData?.score : cData?.score

    // Header bar
    checkSpace(16)
    drawRoundedRect(margin, y - 2, contentW, 12, 3, COLORS.pearl)
    doc.setFillColor(...COLORS.coral)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.coral)
    doc.text(`Primary Constraint: ${cName}`, margin + 8, y + 5)
    if (cScore !== undefined) {
      doc.text(`Score: ${cScore}`, pageW - margin - 8, y + 5, { align: 'right' })
    }
    y += 16

    if (ca) {
      // Summary callout
      if (ca.summary) {
        checkSpace(14)
        drawRoundedRect(margin, y - 2, contentW, 10, 2, [254, 242, 242])
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bolditalic')
        doc.setTextColor(...COLORS.coral)
        doc.text(ca.summary, margin + 4, y + 4)
        y += 14
      }

      // Score context
      if (ca.score_context) {
        bodyText(ca.score_context, { fontSize: 9, italic: true, color: COLORS.medium })
      }

      // Key Friction Points
      if (ca.key_friction_points?.length > 0) {
        checkSpace(10)
        bodyText('Key Friction Points', { bold: true, fontSize: 9 })
        for (const point of ca.key_friction_points) {
          checkSpace(6)
          doc.setFillColor(...COLORS.coral)
          doc.circle(margin + 6, y - 1.2, 1.5, 'F')
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = doc.splitTextToSize(point, contentW - 14)
          for (let li = 0; li < lines.length; li++) {
            checkSpace(4)
            doc.text(lines[li], margin + 11, y)
            y += 3.5
          }
          y += 1.5
        }
        y += 2
      }

      // Business Impact
      if (ca.business_impact?.length > 0) {
        checkSpace(10)
        bodyText('Business Impact', { bold: true, fontSize: 9 })
        for (const impact of ca.business_impact) {
          checkSpace(6)
          doc.setFillColor(...COLORS.gold)
          doc.circle(margin + 6, y - 1.2, 1.5, 'F')
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = doc.splitTextToSize(impact, contentW - 14)
          for (let li = 0; li < lines.length; li++) {
            checkSpace(4)
            doc.text(lines[li], margin + 11, y)
            y += 3.5
          }
          y += 1.5
        }
        y += 2
      }

      // Downstream Effects
      if (ca.downstream_effects?.length > 0) {
        checkSpace(10)
        bodyText('Downstream Effects on Other Pillars', { bold: true, fontSize: 9 })
        for (const effect of ca.downstream_effects) {
          checkSpace(6)
          doc.setFillColor(...COLORS.accent)
          doc.circle(margin + 6, y - 1.2, 1.5, 'F')
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = doc.splitTextToSize(effect, contentW - 14)
          for (let li = 0; li < lines.length; li++) {
            checkSpace(4)
            doc.text(lines[li], margin + 11, y)
            y += 3.5
          }
          y += 1.5
        }
        y += 2
      }

      // Recommended Focus
      if (ca.recommended_focus) {
        checkSpace(16)
        drawRoundedRect(margin, y - 2, contentW, 12, 2, [240, 253, 244])
        doc.setFillColor(...COLORS.green)
        doc.rect(margin, y - 2, 2, 12, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.green)
        doc.text('Recommended Focus:', margin + 6, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const focusX = margin + 6 + doc.getTextWidth('Recommended Focus: ') + 1
        const focusLines = doc.splitTextToSize(ca.recommended_focus, pageW - margin - focusX)
        doc.text(focusLines[0], focusX, y + 4)
        y += 16
      }

      // C4: Revenue Impact Estimation
      if (ca.revenue_impact_estimation) {
        checkSpace(20)
        const riLines = doc.splitTextToSize(ca.revenue_impact_estimation, contentW - 16)
        const riH = riLines.length * 3.5 + 10
        drawRoundedRect(margin, y - 2, contentW, riH, 2, [240, 248, 255])
        doc.setFillColor(...COLORS.accent)
        doc.rect(margin, y - 2, 2, riH, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.accent)
        doc.text('Revenue Impact Estimation', margin + 6, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(8)
        doc.text(riLines, margin + 6, y + 10)
        y += riH + 4
      }
    } else {
      // Fallback: render plain narrative for old reports without constraint_analysis
      if (cPid && report?.pillar_narratives?.[cPid]) {
        bodyText(report.pillar_narratives[cPid])
      }
    }

    if (report?.positioning_assessment && cPid === 'p3') {
      bodyText(report.positioning_assessment, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 5: PILLAR-BY-PILLAR REVIEW
  // ========================
  addPage()
  sectionTitle('5. Pillar Deep Dive: P1\u2013P3')
  sourceLabel('pillar_deep_dive')

  let pillarSectionCount = 0
  for (const [pid, data] of sortedPillars) {
    const name = PILLAR_NAMES[pid] || pid
    const score = data.score || 0
    const narrative = report?.pillar_narratives?.[pid] || ''
    const isPrimary = score < 50
    const color = getBandColor(score)

    // Start new sections for P4-P6 and P7-P9
    pillarSectionCount++
    if (pillarSectionCount === 4) {
      addPage()
      sectionTitle('6. Pillar Deep Dive: P4\u2013P6')
    } else if (pillarSectionCount === 7) {
      addPage()
      sectionTitle('7. Pillar Deep Dive: P7\u2013P9')
    }

    // Ensure minimum space for pillar header + first content
    checkSpace(40)

    // Pillar header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`Pillar ${pid.replace('p', '')}: ${name}`, margin, y)
    y += 7

    // Score + bar
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(`Score: ${score}%`, margin, y)

    if (isPrimary) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      const badgeText = 'PRIMARY CONSTRAINT'
      const badgeWidth = doc.getTextWidth(badgeText) + 8
      doc.setFillColor(...COLORS.coral)
      doc.roundedRect(margin + 35, y - 4, badgeWidth, 6, 2, 2, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(badgeText, margin + 35 + badgeWidth / 2, y - 0.5, { align: 'center' })
    }
    y += 5

    // Progress bar — dark track per spec (#2D3436)
    const barW = contentW
    doc.setFillColor(...COLORS.darkCard)
    doc.roundedRect(margin, y, barW, 2.5, 1, 1, 'F')
    doc.setFillColor(...color)
    doc.roundedRect(margin, y, barW * (score / 100), 2.5, 1, 1, 'F')
    y += 8

    // Narrative / AI assessment
    const pd = report?.pillar_details?.[pid]
    if (pd && (pd.operationalStrengths?.length > 0 || pd.frictionPoints?.length > 0)) {
      // Structured bullet point format
      if (pd.operationalStrengths?.length > 0) {
        bodyText('Operational Strengths', { bold: true, fontSize: 8.5, color: COLORS.green })
        for (const s of pd.operationalStrengths) {
          checkSpace(6)
          doc.setFillColor(...COLORS.green)
          doc.circle(margin + 6, y - 1.2, 1.5, 'F')
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = doc.splitTextToSize(s, contentW - 14)
          for (let li = 0; li < lines.length; li++) {
            checkSpace(4)
            doc.text(lines[li], margin + 11, y)
            y += 3.5
          }
          y += 1.5
        }
        y += 2
      }

      if (pd.frictionPoints?.length > 0) {
        bodyText('Friction Points', { bold: true, fontSize: 8.5, color: COLORS.coral })
        for (const f of pd.frictionPoints) {
          checkSpace(6)
          doc.setFillColor(...COLORS.coral)
          doc.circle(margin + 6, y - 1.2, 1.5, 'F')
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
          const lines = doc.splitTextToSize(f, contentW - 14)
          for (let li = 0; li < lines.length; li++) {
            checkSpace(4)
            doc.text(lines[li], margin + 11, y)
            y += 3.5
          }
          y += 1.5
        }
        y += 2
      }

      if (pd.respondentSignal) {
        checkSpace(12)
        drawRoundedRect(margin, y - 2, contentW, 10, 2, COLORS.pearl)
        doc.setFillColor(...COLORS.accent)
        doc.rect(margin, y - 2, 2, 10, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...COLORS.medium)
        const sigLines = doc.splitTextToSize(`Respondent Signal: ${pd.respondentSignal}`, contentW - 10)
        doc.text(sigLines[0], margin + 6, y + 4)
        y += 14
      }
    } else if (narrative) {
      // Fallback: plain narrative for old reports
      bodyText('AI Assessment:', { bold: true, fontSize: 8.5, color: COLORS.medium })
      bodyText(narrative, { fontSize: 9, indent: 2 })
    }

    // C5: P3 Positioning Critique
    if (pid === 'p3' && pd?.positioning_critique) {
      checkSpace(12)
      subHeading('Positioning Critique')
      bodyText(pd.positioning_critique, { fontSize: 8.5, italic: true })
    }

    // C5: Question-Level Scoring Table
    const rankings = data?.questionRankings
    if (rankings && Array.isArray(rankings) && rankings.length > 0) {
      checkSpace(10 + rankings.length * 5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.medium)
      doc.text('Question-Level Scores', margin, y)
      y += 4
      const qHeaders = ['Question', 'Score', 'Band']
      const qColWidths = [contentW * 0.7, contentW * 0.15, contentW * 0.15]
      const qRows = rankings.map(q => [
        (q.text || q.questionId || '').substring(0, 70),
        String(q.score ?? ''),
        q.score <= 2 ? 'At Risk' : q.score === 3 ? 'Developing' : 'Strong',
      ])
      const qRowColors = rankings.map(q => getScoreColor(q.score || 0, true))
      drawTable(qHeaders, qRows, { colWidths: qColWidths, fontSize: 7, rowHeight: 5.5, rowColors: qRowColors })
    }

    // C5: Cluster Breakdown
    const pillarClusters = clusterScores[pid]
    if (pillarClusters && pillarClusters.length > 0) {
      checkSpace(8 + pillarClusters.length * 5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.medium)
      doc.text('Cluster Scores', margin, y)
      y += 4
      for (const cluster of pillarClusters) {
        checkSpace(5)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        doc.text(cluster.name, margin + 4, y)
        const cColor = getBandColor(cluster.score)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...cColor)
        doc.text(`${cluster.score}%`, margin + contentW * 0.7, y)
        y += 4.5
      }
      y += 2
    }

    y += 4
    drawLine(y, COLORS.border)
    y += 8
  }

  // Positioning comparison (if positioning assessment exists)
  if (report?.positioning_assessment) {
    checkSpace(30)
    subHeading('Competitive Positioning Assessment')
    bodyText(report.positioning_assessment, { fontSize: 9 })

    if (report?.strategic_moat_score) {
      y += 2
      checkSpace(14)
      drawRoundedRect(margin, y - 2, contentW, 12, 3, COLORS.pearl)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(`Strategic Moat Score: ${report.strategic_moat_score}/10`, margin + 6, y + 5)
      y += 14
    }
    if (report?.strategic_moat_narrative) {
      bodyText(report.strategic_moat_narrative, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 8: GROWTH CONSTRAINT MAP
  // ========================
  addPage()
  sectionTitle('8. Growth Constraint Map')

  bodyText('The score pattern across all nine pillars reveals where the growth system is experiencing the most friction. The constraint sequence below shows how weakness in one area compounds into downstream impact.', { fontSize: 9 })
  y += 4

  // Show pillars sorted by score (lowest first) as constraint chain bar chart
  const constraintChain = [...sortedPillars].sort(([, a], [, b]) => a.score - b.score)
  const constraintBarData = constraintChain.map(([pid, data]) => ({
    label: PILLAR_NAMES[pid] || pid,
    score: data.score || 0,
  }))
  drawHBarChart(constraintBarData, { barHeight: 7, gap: 3, labelWidth: 55 })

  // ========================
  // SECTION 9: CROSS-PILLAR INTERACTION ANALYSIS
  // ========================
  addPage()
  sectionTitle('9. Cross-Pillar Interaction Analysis')
  sourceLabel('cross_pillar')

  const cpi = report?.cross_pillar_interaction
  const hasCpiData = cpi && (
    (Array.isArray(cpi.causal_links) && cpi.causal_links.length > 0) ||
    (Array.isArray(cpi.reinforcing_loops) && cpi.reinforcing_loops.length > 0) ||
    cpi.narrative
  )

  if (hasCpiData) {
    if (cpi.causal_links && Array.isArray(cpi.causal_links) && cpi.causal_links.length > 0) {
      subHeading('Causal Links')
      for (const link of cpi.causal_links) {
        bulletPoint(typeof link === 'string' ? link : `${link.from_pillar || ''} -> ${link.to_pillar || ''}: ${link.mechanism || ''}`, { fontSize: 9 })
      }
      y += 4
    }

    if (cpi.reinforcing_loops && Array.isArray(cpi.reinforcing_loops) && cpi.reinforcing_loops.length > 0) {
      subHeading('Reinforcing Loops')
      for (const loop of cpi.reinforcing_loops) {
        const text = typeof loop === 'string' ? loop : loop.description || ''
        if (text) bulletPoint(text, { fontSize: 9 })
      }
    }

    if (cpi.narrative) {
      bodyText(cpi.narrative, { fontSize: 9 })
    }
  } else {
    bodyText('Cross-pillar interaction data not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // SECTION 10: COMPETITIVE POSITIONING ASSESSMENT
  // ========================
  addPage()
  sectionTitle('10. Competitive Positioning Assessment')
  sourceLabel('competitive_positioning')

  // I3: Use competitive_clarity data (8-dimension scoring)
  const ccData = report?.competitive_clarity
  if (ccData?.dimensions && typeof ccData.dimensions === 'object') {
    const dimNames = ['clarity', 'specificity', 'buyer_relevance', 'differentiation', 'memorability', 'proof_tension', 'category_ownership', 'commercial_sharpness']
    const dimLabels = {
      clarity: 'Clarity', specificity: 'Specificity', buyer_relevance: 'Buyer Relevance',
      differentiation: 'Differentiation', memorability: 'Memorability', proof_tension: 'Proof & Tension',
      category_ownership: 'Category Ownership', commercial_sharpness: 'Commercial Sharpness',
    }
    const cpHeaders = ['Dimension', 'Score (/10)']
    const cpColWidths = [contentW * 0.6, contentW * 0.4]
    const cpRows = dimNames.map(d => [dimLabels[d] || d, String(ccData.dimensions[d] ?? '')])
    const cpRowColors = dimNames.map(d => {
      const s = ccData.dimensions[d] || 0
      return s >= 7 ? COLORS.green : s >= 4 ? COLORS.gold : COLORS.coral
    })
    drawTable(cpHeaders, cpRows, { colWidths: cpColWidths, fontSize: 9, rowColors: cpRowColors })

    // E7: Moat Score with rubric label
    if (ccData.overall_score) {
      checkSpace(14)
      const moatLbl = getMoatLabel(Math.round(ccData.overall_score))
      drawRoundedRect(margin, y - 2, contentW, 12, 3, COLORS.pearl)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(`Strategic Moat Score: ${ccData.overall_score.toFixed(1)}/10 — ${moatLbl}`, margin + 6, y + 5)
      y += 14
    }

    if (ccData.positioning_critique) {
      subHeading('Positioning Critique')
      bodyText(ccData.positioning_critique, { fontSize: 9 })
    }

    if (ccData.positioning_rewrite) {
      subHeading('Recommended Positioning')
      bodyText(ccData.positioning_rewrite, { fontSize: 9, italic: true })
    }

    if (ccData.white_space_insight) {
      subHeading('White Space Opportunity')
      bodyText(ccData.white_space_insight, { fontSize: 9 })
    }
  } else if (report?.competitive_positioning) {
    const cp = report.competitive_positioning

    if (cp?.dimensions && Array.isArray(cp.dimensions)) {
      const cpHeaders = ['Dimension', 'Score', 'Assessment']
      const cpColWidths = [contentW * 0.3, contentW * 0.1, contentW * 0.6]
      const cpRows = cp.dimensions.map(d => [
        d.name || '',
        String(d.score ?? ''),
        (d.assessment || '').substring(0, 70),
      ])
      const cpRowColors = cp.dimensions.map(d => getScoreColor(d.score || 0))
      drawTable(cpHeaders, cpRows, { colWidths: cpColWidths, fontSize: 9, rowColors: cpRowColors })
    }

    if (cp?.critique) {
      subHeading('Positioning Critique')
      bodyText(cp.critique, { fontSize: 9 })
    }

    if (cp?.recommended_rewrite) {
      subHeading('Recommended Positioning')
      bodyText(cp.recommended_rewrite, { fontSize: 9, italic: true })
    }
  } else if (report?.positioning_assessment) {
    bodyText(report.positioning_assessment, { fontSize: 9 })
  } else {
    bodyText('Competitive positioning data not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // SECTION 11: RAPS
  // ========================
  addPage()
  sectionTitle('11. Revenue Achievement Probability Score (RAPS)')
  sourceLabel('raps')

  if (raps?.score !== undefined) {
    // RAPS Gauge
    checkSpace(60)
    drawRoundedRect(margin, y, contentW, 62, 4, COLORS.bg)
    drawGauge(raps.score, { cx: pageW / 2, cy: y + 38, radius: 25, label: 'Revenue Achievement Probability' })
    // Interpretation label below gauge
    const rapsLabel = raps.label || ''
    if (rapsLabel) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      const labelText = `${raps.score} / 100 - ${rapsLabel}`
      doc.text(labelText, pageW / 2, y + 60, { align: 'center' })
      doc.setFont('helvetica', 'normal')
    }
    y += 67

    // Revenue waterfall chart (if data available)
    if (report?.revenue_waterfall) {
      y += 4
      subHeading('Revenue Waterfall')
      drawWaterfallChart(report.revenue_waterfall)
    }

    // Key inputs table
    subHeading('Key Inputs')
    const winRateMid = raps.winRate ? `${(raps.winRate * 100).toFixed(0)}%` : (sr.q17 || 'N/A')
    const fmtExpConv = raps.expectedConvertible != null
      ? `$${Math.round(raps.expectedConvertible).toLocaleString()}`
      : (raps.revenueRemaining && raps.winRate
        ? `$${Math.round(raps.revenueRemaining * raps.winRate * 0.7).toLocaleString()}`
        : 'N/A')
    const coverageDisplay = raps.coverageRatio != null
      ? `${raps.coverageRatio}x (${raps.coverageRating || 'N/A'})`
      : 'N/A'
    const radModDisplay = raps.radModifierValue != null
      ? `${raps.radModifierValue > 0 ? '+' : ''}${raps.radModifierValue}`
      : 'N/A'

    drawInfoTable([
      ['Annual Revenue Target', raps.revenueTarget ? `$${Number(raps.revenueTarget).toLocaleString()}` : 'N/A'],
      ['Revenue Invoiced YTD', raps.revenueInvoiced ? `$${Number(raps.revenueInvoiced).toLocaleString()}` : 'N/A'],
      ['Revenue Remaining', raps.revenueRemaining ? `$${Number(raps.revenueRemaining).toLocaleString()}` : 'N/A'],
      ['Required Monthly Revenue', raps.requiredMonthlyRevenue ? `$${Number(raps.requiredMonthlyRevenue).toLocaleString()}` : 'N/A'],
      ['Months Remaining', String(raps.monthsRemaining || 'N/A')],
      ['Open Pipeline Value', raps.openPipeline ? `$${Number(raps.openPipeline).toLocaleString()}` : 'N/A'],
      ['Expected Convertible Revenue', fmtExpConv],
      ['Coverage Ratio + Rating', coverageDisplay],
      ['Win Rate Midpoint', winRateMid],
      ['RAD Modifier', radModDisplay],
    ])

    if (report?.raps_narrative) {
      bodyText(report.raps_narrative, { fontSize: 9 })
    }

    if (Array.isArray(report?.raps_why_factors) && report.raps_why_factors.length > 0) {
      subHeading('Why This Score')
      for (const factor of report.raps_why_factors) {
        checkSpace(8)
        doc.setFillColor(...COLORS.coral)
        doc.circle(margin + 6, y - 1.2, 1.5, 'F')
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const lines = doc.splitTextToSize(factor, contentW - 14)
        for (let li = 0; li < lines.length; li++) {
          checkSpace(4)
          doc.text(lines[li], margin + 11, y)
          y += 3.5
        }
        y += 2
      }
      y += 3
    }

    if (Array.isArray(report?.raps_must_improve) && report.raps_must_improve.length > 0) {
      subHeading('What Must Improve')
      for (const item of report.raps_must_improve) {
        checkSpace(8)
        doc.setFillColor(...COLORS.gold)
        doc.circle(margin + 6, y - 1.2, 1.5, 'F')
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const lines = doc.splitTextToSize(item, contentW - 14)
        for (let li = 0; li < lines.length; li++) {
          checkSpace(4)
          doc.text(lines[li], margin + 11, y)
          y += 3.5
        }
        y += 2
      }
      y += 3
    }

    // 3 scenarios table (if available)
    if (Array.isArray(report?.raps_scenarios) && report.raps_scenarios.length > 0) {
      subHeading('Scenario Comparison')
      const scenHeaders = ['Scenario', 'Score', 'Label', 'Key Assumptions']
      const scenColWidths = [contentW * 0.2, contentW * 0.1, contentW * 0.2, contentW * 0.5]
      const scenRows = report.raps_scenarios.map(s => [
        s.name || '',
        String(s.score ?? ''),
        s.label || '',
        (Array.isArray(s.assumptions) ? s.assumptions.join('; ') : (s.assumptions || '')).substring(0, 60),
      ])
      drawTable(scenHeaders, scenRows, { colWidths: scenColWidths, fontSize: 8 })
    }

    if (report?.raps_improvement_scenario) {
      y += 2
      const scenario = report.raps_improvement_scenario
      if (typeof scenario === 'object' && scenario.current && scenario.improved) {
        subHeading('Improvement Scenario')
        drawInfoTable([
          ['Current Score', `${scenario.current.score ?? raps.score} / 100 \u2014 ${scenario.current.label || raps.label || ''}`],
          ['Projected Score', `${scenario.improved.score} / 100 \u2014 ${scenario.improved.label || ''}`],
          ['Assumptions', Array.isArray(scenario.improved.assumptions) ? scenario.improved.assumptions.join('; ') : (scenario.improved.assumptions || 'N/A')],
        ])
      } else {
        checkSpace(18)
        const impText = typeof scenario === 'string' ? scenario : JSON.stringify(scenario)
        const impLines = doc.splitTextToSize(impText, contentW - 18)
        const impH = impLines.length * 3.5 + 12
        drawRoundedRect(margin, y, contentW, impH, 3, COLORS.pearl)
        doc.setFillColor(...COLORS.green)
        doc.rect(margin, y, 2, impH, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.green)
        doc.text('Improvement Scenario', margin + 8, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(8)
        doc.text(impLines, margin + 8, y + 12)
        y += impH + 6
      }
    }
  } else {
    bodyText(report?.raps_narrative || '')
  }

  // ========================
  // SECTION 12: MARKET OPPORTUNITY CONTEXT
  // ========================
  addPage()
  sectionTitle('12. Market Opportunity Context')
  sourceLabel('market_opportunity')

  const countries = marketReport?.countries || []
  if (countries.length > 0) {
    const mHeaders = ['Market', 'Growth Propensity', 'Key Drivers']
    const mColWidths = [contentW * 0.2, contentW * 0.2, contentW * 0.6]
    const mRows = countries.map(c => [
      c.name || 'N/A',
      c.growth_propensity || 'N/A',
      String(Array.isArray(c.key_drivers) ? c.key_drivers.join(', ') : (c.key_drivers || 'N/A')).substring(0, 80),
    ])
    drawTable(mHeaders, mRows, { colWidths: mColWidths, fontSize: 9 })

    y += 4
    for (const country of countries) {
      if (!country.strategic_implications) continue
      checkSpace(12)
      bodyText(`${country.name}:`, { bold: true, fontSize: 9 })
      bodyText(country.strategic_implications, { fontSize: 8.5, indent: 4 })
    }
  } else {
    bodyText(report?.market_summary || '')
  }

  // ========================
  // SECTION 13: ORG & SYSTEMS READINESS
  // ========================
  addPage()
  sectionTitle('13. Organisational and Systems Readiness')
  sourceLabel('org_systems')

  const p8Score = pillarScores.p8?.score || 0
  const p9Score = pillarScores.p9?.score || 0

  // I5: AI Readiness Index as prominent metric
  if (aiReadinessIndex !== null) {
    checkSpace(14)
    const aiColor = aiReadinessIndex >= 60 ? COLORS.green : aiReadinessIndex >= 40 ? COLORS.gold : COLORS.coral
    drawRoundedRect(margin, y - 2, contentW, 12, 3, COLORS.pearl)
    doc.setFillColor(...aiColor)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...aiColor)
    doc.text(`AI Transformation Readiness Index: ${aiReadinessIndex}%`, margin + 8, y + 5)
    y += 16
  }

  const readinessHeaders = ['Readiness Layer', 'Score', 'Interpretation']
  const readinessColWidths = [contentW * 0.35, contentW * 0.15, contentW * 0.5]
  const readinessRows = [
    ['Organisational Readiness (P8)', `${p8Score} / 100`, p8Score >= 80 ? 'Well-aligned and execution-ready.' : p8Score >= 50 ? 'Alignment gaps creating execution friction.' : 'Significant alignment issues limiting growth.'],
    ['Systems & AI Readiness (P9)', `${p9Score} / 100`, p9Score >= 80 ? 'Systems strong and AI-ready.' : p9Score >= 50 ? 'Moderate systems with fragmented data and manual dependency.' : 'Systems not yet ready to support scale.'],
  ]
  drawTable(readinessHeaders, readinessRows, { colWidths: readinessColWidths, fontSize: 9 })

  // I5: Use structured parts from org_systems_readiness_detailed
  const osrDetailed = report?.org_systems_readiness_detailed
  if (osrDetailed?.parts && Array.isArray(osrDetailed.parts) && osrDetailed.parts.length > 0) {
    for (const part of osrDetailed.parts) {
      if (part.title && part.content) {
        subHeading(part.title)
        bodyText(part.content, { fontSize: 9 })
      }
    }

    // Render cluster scores for P8 and P9
    for (const pid of ['p8', 'p9']) {
      const clusters = clusterScores[pid]
      if (!clusters || clusters.length === 0) continue
      checkSpace(8 + clusters.length * 5)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      doc.text(`${pillarLabel(pid)} Clusters`, margin, y)
      y += 4
      for (const cluster of clusters) {
        checkSpace(5)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        doc.text(cluster.name, margin + 4, y)
        const cColor = getBandColor(cluster.score)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...cColor)
        doc.text(`${cluster.score}%`, margin + contentW * 0.7, y)
        y += 4.5
      }
      y += 2
    }
  } else {
    // Fallback: use bare pillar narratives
    if (report?.pillar_narratives?.p8) {
      bodyText(report.pillar_narratives.p8, { fontSize: 9 })
    }
    if (report?.pillar_narratives?.p9) {
      bodyText(report.pillar_narratives.p9, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 14: STRATEGIC SIGNALS
  // ========================
  addPage()
  sectionTitle('14. Strategic Signals')
  sourceLabel('strategic_signals')

  if (report?.strategic_signals) {
    const ss = report.strategic_signals

    // I6: Use new signals array with alignment_category
    if (ss?.signals && Array.isArray(ss.signals) && ss.signals.length > 0) {
      const sigHeaders = ['Pillar', 'Category', 'Description', 'Implication']
      const sigColWidths = [contentW * 0.1, contentW * 0.15, contentW * 0.4, contentW * 0.35]
      const sigRows = ss.signals.map(s => [
        s.pillar?.toUpperCase() || '',
        s.alignment_category || s.type || '',
        (s.description || '').substring(0, 60),
        (s.implication || '').substring(0, 50),
      ])
      const sigRowColors = ss.signals.map(s => {
        const cat = s.alignment_category || s.type || ''
        if (cat === 'Aligned' || cat === 'alignment') return COLORS.green
        if (cat === 'Partially Aligned') return COLORS.gold
        return COLORS.coral
      })
      drawTable(sigHeaders, sigRows, { colWidths: sigColWidths, fontSize: 8, rowColors: sigRowColors })
    } else {
      // Fallback: old format with alignment/misalignment arrays
      if (ss?.alignment_signals && Array.isArray(ss.alignment_signals)) {
        subHeading('Alignment Signals')
        const sigHeaders = ['Qualitative Signal', 'Quantitative Evidence']
        const sigColWidths = [contentW * 0.5, contentW * 0.5]
        const sigRows = ss.alignment_signals.map(s => [
          typeof s === 'string' ? s : (s.signal || ''),
          typeof s === 'string' ? '' : (s.evidence || ''),
        ])
        drawTable(sigHeaders, sigRows, { colWidths: sigColWidths, fontSize: 8 })
      }

      if (ss?.misalignment_signals && Array.isArray(ss.misalignment_signals)) {
        subHeading('Misalignment Signals')
        const misHeaders = ['Qualitative Signal', 'Quantitative Evidence']
        const misColWidths = [contentW * 0.5, contentW * 0.5]
        const misRows = ss.misalignment_signals.map(s => [
          typeof s === 'string' ? s : (s.signal || ''),
          typeof s === 'string' ? '' : (s.evidence || ''),
        ])
        drawTable(misHeaders, misRows, { colWidths: misColWidths, fontSize: 8 })
      }
    }

    // I6: Diagnostic Awareness Assessment
    if (ss?.diagnostic_awareness) {
      checkSpace(14)
      drawRoundedRect(margin, y - 2, contentW, 12, 2, COLORS.pearl)
      doc.setFillColor(...COLORS.accent)
      doc.rect(margin, y - 2, 2, 12, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.accent)
      doc.text('Diagnostic Awareness:', margin + 6, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const awarenessX = margin + 6 + doc.getTextWidth('Diagnostic Awareness: ') + 1
      const awarenessLines = doc.splitTextToSize(ss.diagnostic_awareness, pageW - margin - awarenessX)
      doc.text(awarenessLines[0], awarenessX, y + 4)
      y += 16
    }

    if (ss?.narrative) {
      bodyText(ss.narrative, { fontSize: 9 })
    }
  } else {
    bodyText('Strategic signals data not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // SECTION 15: ADVISORY WORKSTREAM RECOMMENDATION
  // ========================
  addPage()
  sectionTitle('15. Advisory Workstream Recommendation')
  sourceLabel('advisory_workstream')

  // I7: Use AI-generated advisory workstream data
  const aw = report?.advisory_workstream
  if (aw && aw.recommended_engagement && aw.recommended_engagement !== 'N/A') {
    // Engagement name
    checkSpace(14)
    drawRoundedRect(margin, y - 2, contentW, 12, 3, COLORS.pearl)
    doc.setFillColor(...COLORS.primary)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(aw.recommended_engagement, margin + 8, y + 5)
    y += 16

    // Focus areas with RAPS connection
    if (aw.focus_areas?.length > 0) {
      subHeading('Focus Areas')
      for (let i = 0; i < aw.focus_areas.length; i++) {
        bulletPoint(aw.focus_areas[i], { fontSize: 9 })
        const rapsConn = aw.raps_connection?.[i]
        if (rapsConn) {
          bodyText(`RAPS Connection: ${rapsConn}`, { fontSize: 7.5, italic: true, color: COLORS.medium, indent: 9 })
        }
      }
    }

    // Expected outcomes
    if (aw.expected_outcomes?.length > 0) {
      subHeading('Expected Outcomes')
      for (const outcome of aw.expected_outcomes) {
        bulletPoint(outcome, { fontSize: 9 })
      }
    }

    // Sequence logic
    if (aw.sequence_logic) {
      subHeading('Sequencing Rationale')
      bodyText(aw.sequence_logic, { fontSize: 9 })
    }

    // Engagement framework
    if (aw.engagement_framework) {
      subHeading('Engagement Framework')
      bodyText(aw.engagement_framework, { fontSize: 9 })
    }
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
  // SECTION 16: 30-60-90 DAY ACTION ROADMAP
  // ========================
  addPage()
  // I8/E5: Conditional title for high-performers
  sectionTitle(isHighPerformer ? '16. Acceleration Plan' : '16. 30-60-90 Day Action Roadmap')
  sourceLabel('action_roadmap')

  if (report?.action_plan) {
    const phases = [
      { titleKey: 'phase1_title', itemsKey: 'phase1_items', color: COLORS.coral, bgColor: COLORS.pearl, label: 'Days 1\u201330' },
      { titleKey: 'phase2_title', itemsKey: 'phase2_items', color: COLORS.gold, bgColor: COLORS.pearl, label: 'Days 31\u201360' },
      { titleKey: 'phase3_title', itemsKey: 'phase3_items', color: COLORS.green, bgColor: COLORS.pearl, label: 'Days 61\u201390' },
    ]

    for (const phase of phases) {
      const title = report.action_plan[phase.titleKey] || phase.label
      const items = report.action_plan[phase.itemsKey] || []
      if (items.length === 0) continue

      const itemHeight = items.length * 6 + 18
      checkSpace(itemHeight)

      drawRoundedRect(margin, y, contentW, itemHeight, 3, phase.bgColor)
      doc.setFillColor(...phase.color)
      doc.rect(margin, y, 3, itemHeight, 'F')

      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...phase.color)
      doc.text(phase.label.toUpperCase(), margin + 10, y + 6)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(title, margin + 10, y + 13)

      let itemY = y + 20
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      for (const item of items) {
        const actionText = typeof item === 'string' ? item : item.action
        const priority = typeof item === 'object' ? item.priority : null
        const qRef = typeof item === 'object' ? item.question_reference : null
        doc.setFillColor(...phase.color)
        doc.circle(margin + 14, itemY - 1, 0.8, 'F')
        const priorityTag = priority ? `[${priority.toUpperCase()}] ` : ''
        const itemLines = doc.splitTextToSize(priorityTag + actionText, contentW - 28)
        doc.text(itemLines[0], margin + 19, itemY)
        // I8: Show question reference
        if (qRef) {
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...COLORS.medium)
          doc.text(`(${qRef})`, margin + 19 + doc.getTextWidth(itemLines[0]) + 2, itemY)
          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...COLORS.dark)
        }
        itemY += 6
      }

      y += itemHeight + 8
    }
  } else {
    bodyText(report?.action_summary || '')
  }

  // ========================
  // SECTION 17: PRIORITY ACTIONS SUMMARY
  // ========================
  addPage()
  sectionTitle('17. Priority Actions Summary')

  // Derive priority actions from scores
  const ranked = [...sortedPillars].sort(([, a], [, b]) => a.score - b.score)
  const fixFirst = primaryConstraints.length > 0 ? primaryConstraints.map(([pid]) => PILLAR_NAMES[pid]).join(', ') : (constraint?.id ? PILLAR_NAMES[constraint.id] : 'N/A')
  const fixNext = ranked.length > 1 ? PILLAR_NAMES[ranked[1][0]] + (ranked.length > 2 ? ' + ' + PILLAR_NAMES[ranked[2][0]] : '') : 'N/A'
  const stabilise = ranked.length > 3 ? ranked.slice(3, 5).map(([pid]) => PILLAR_NAMES[pid]).join(', ') : 'N/A'
  const protect = ranked.length > 5 ? ranked.slice(ranked.length - 2).map(([pid]) => PILLAR_NAMES[pid]).join(', ') : 'N/A'

  const paHeaders = ['Action Tier', 'Focus']
  const paColWidths = [contentW * 0.25, contentW * 0.75]
  const paRows = [
    ['Fix First', fixFirst],
    ['Fix Next', fixNext],
    ['Stabilise', stabilise],
    ['Protect', protect],
  ]
  drawTable(paHeaders, paRows, { colWidths: paColWidths, fontSize: 9 })

  // ========================
  // SECTION 18: CLOSING OBSERVATION
  // ========================
  addPage()
  sectionTitle('18. Closing Observation')
  sourceLabel('closing')

  // C1: Use dedicated closing_observation field instead of exec summary last paragraph
  if (report?.closing_observation) {
    bodyText(report.closing_observation, { fontSize: 10 })
  } else {
    bodyText(`${company}'s growth system diagnostic reveals a score of ${radScore}/100 (${maturityBand}). The primary constraint${primaryConstraints.length > 1 ? 's are' : ' is'} ${constraintNames}. Addressing ${primaryConstraints.length > 1 ? 'these' : 'this'}, along with strengthening the supporting pillars, will position the business for more efficient and scalable growth.`, { fontSize: 10 })
  }

  // ========================
  // APPENDIX A: FULL SCORING DETAIL
  // ========================
  addPage()
  sectionTitle('19. Appendix A: Full Scoring Detail')
  sourceLabel('appendix')

  // Render all question scores with conditional formatting
  let hasQuestionData = false
  // E6: Map pillar IDs to their qualitative question IDs
  const qualitativeQuestionMap = {
    p3: ['p3_q12', 'p3_q13'],
    p7: ['p7_q6'],
    p8: ['p8_q13'],
    p9: ['p9_q13'],
  }
  const qualitativeLabels = {
    p3_q12: 'Positioning Challenge',
    p3_q13: 'Differentiated Value vs Customers',
    p7_q6: 'Strategic Constraint',
    p8_q13: 'Organisational Alignment',
    p9_q13: 'Systems & AI Readiness Issue',
  }

  for (const [pid, data] of sortedPillars) {
    const rankings = data?.questionRankings
    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) continue
    hasQuestionData = true

    checkSpace(16)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`${pillarLabel(pid)}`, margin, y)
    y += 6

    const qHeaders = ['Question', 'Score', 'Band']
    const qColWidths = [contentW * 0.7, contentW * 0.15, contentW * 0.15]
    const qRows = rankings.map(q => [
      (q.text || q.questionId || '').substring(0, 80),
      String(q.score ?? ''),
      q.score <= 2 ? 'At Risk' : q.score === 3 ? 'Developing' : 'Strong',
    ])
    const qRowColors = rankings.map(q => getScoreColor(q.score || 0, true))
    drawTable(qHeaders, qRows, { colWidths: qColWidths, fontSize: 8, rowHeight: 6, rowColors: qRowColors })

    // E6: Render open-ended qualitative responses for this pillar
    const qualQIds = qualitativeQuestionMap[pid]
    if (qualQIds) {
      for (const qid of qualQIds) {
        const response = screenerResponses?.[qid] || screenerResponses?.[qid.replace('p3_q12', 'q12')]
        // Check diagnostic responses as well
        const diagResponse = scores?.diagnosticResponses?.[qid]
        const text = diagResponse || response
        if (text && typeof text === 'string' && text !== 'Not provided') {
          checkSpace(12)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...COLORS.medium)
          doc.text(`${qualitativeLabels[qid] || qid}:`, margin + 4, y)
          y += 4
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(...COLORS.dark)
          const respLines = doc.splitTextToSize(`"${text}"`, contentW - 8)
          for (const line of respLines.slice(0, 4)) {
            checkSpace(4)
            doc.text(line, margin + 4, y)
            y += 3.5
          }
          y += 2
        }
      }
    }
    y += 2
  }

  if (!hasQuestionData) {
    bodyText('Detailed question-level scoring data is not available for this report.', { fontSize: 9, color: COLORS.medium })
  }

  // ========================
  // FINAL PAGE: DISCLAIMER
  // ========================
  addPage()
  y = pageH / 2 - 30

  try {
    const logoBase64End = await loadImageAsBase64('/logo.jpeg')
    const logoW = 70
    const logoH = logoW * (401 / 1600)
    doc.addImage(logoBase64End, 'JPEG', pageW / 2 - logoW / 2, y, logoW, logoH)
    y += logoH + 8
  } catch {
    y += 8
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('B2B Revenue Acceleration', pageW / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.medium)
  doc.text('Diagnostic [RAD] Report', pageW / 2, y, { align: 'center' })

  y += 14
  drawLine(y, COLORS.border)
  y += 8

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.light)
  const disclaimer = 'This report is generated using proprietary scoring algorithms and AI-powered analysis. The insights provided are based on the diagnostic responses submitted and should be used as a strategic guide alongside professional judgement.'
  const discLines = doc.splitTextToSize(disclaimer, contentW - 20)
  doc.text(discLines, pageW / 2, y, { align: 'center' })

  y += discLines.length * 4 + 6
  doc.text(`Report generated on ${dateStr}`, pageW / 2, y, { align: 'center' })

  doc.setFillColor(...COLORS.primary)
  doc.rect(0, pageH - 6, pageW, 6, 'F')

  // Save
  const filename = `${company.replace(/\s+/g, '_')}_RAD_Report.pdf`
  doc.save(filename)
  return filename
}
