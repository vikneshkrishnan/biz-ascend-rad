import { jsPDF } from 'jspdf'

const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revenue Economics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

const PILLAR_WEIGHTS = {
  p1: 0.12, p2: 0.11, p3: 0.15, p4: 0.15, p5: 0.10,
  p6: 0.07, p7: 0.08, p8: 0.10, p9: 0.12,
}

const COLORS = {
  primary: [185, 28, 28],
  accent: [249, 115, 22],
  dark: [0, 0, 0],
  medium: [107, 114, 128],
  light: [156, 163, 175],
  white: [255, 255, 255],
  bg: [249, 250, 251],
  border: [229, 231, 235],
  green: [40, 167, 69],
  yellow: [50, 205, 50],
  orange: [255, 140, 0],
  red: [220, 53, 69],
  rose: [220, 53, 69],
}

function getBandColor(score) {
  if (score >= 80) return COLORS.green
  if (score >= 65) return COLORS.yellow
  if (score >= 50) return COLORS.orange
  return COLORS.rose
}

function getBandLabel(score) {
  if (score >= 80) return 'Green'
  if (score >= 65) return 'Lime Green'
  if (score >= 50) return 'Dark Orange'
  return 'Red'
}

function getBandName(score) {
  if (score >= 80) return 'Growth Engine Strong'
  if (score >= 65) return 'Growth System Constrained'
  if (score >= 50) return 'Growth System Underpowered'
  return 'Growth System At Risk'
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

export async function generateClientPdf({ scores, report, project, screenerResponses }) {
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
  const bandColor = getBandColor(radScore)
  const dateStr = report?.generated_at
    ? new Date(report.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const marketReport = report?.market_report || {}

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
    doc.setTextColor(...COLORS.dark)
    doc.text(title, margin, y)
    y += 2
    drawLine(y, COLORS.primary)
    y += 10
  }

  function subHeading(text) {
    checkSpace(14)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(text, margin, y)
    y += 7
  }

  function bodyText(text, opts = {}) {
    if (!text) return
    const { fontSize = 9.5, color = COLORS.dark, indent = 0, bold = false, italic = false, lineHeight = 1.5 } = opts
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
    y += 3
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
  }

  // Draw a simple table
  function drawTable(headers, rows, opts = {}) {
    const { colWidths, headerBg = [240, 240, 240], fontSize = 8, rowHeight = 7, rowColors } = opts
    const totalCols = headers.length
    const cws = colWidths || headers.map(() => contentW / totalCols)

    checkSpace(rowHeight * (rows.length + 1) + 4)

    // Header
    let x = margin
    drawRoundedRect(margin, y - 1, contentW, rowHeight + 1, 1, headerBg)
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
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
    y += 4
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

    // Draw grid rings (20, 40, 60, 80, 100)
    for (let ring = 20; ring <= 100; ring += 20) {
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.2)
      for (let i = 0; i < n; i++) {
        const p1 = getPoint(i, ring)
        const p2 = getPoint((i + 1) % n, ring)
        doc.line(p1.x, p1.y, p2.x, p2.y)
      }
    }

    // Draw axis lines
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.15)
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, 100)
      doc.line(cx, cy, p.x, p.y)
    }

    // Draw data polygon (filled)
    const points = data.map((d, i) => getPoint(i, d.score))
    // Fill polygon using triangles from center
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      doc.setFillColor(185, 28, 28, 0.15)
      doc.setDrawColor(...COLORS.primary)
      doc.setLineWidth(0)
      // Use triangle fill
      const trianglePath = `${p1.x} ${p1.y} m ${p2.x - p1.x} ${p2.y - p1.y} l ${cx - p2.x} ${cy - p2.y} l h`
    }

    // Draw data polygon outline
    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(0.8)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      doc.line(p1.x, p1.y, p2.x, p2.y)
    }

    // Fill with semi-transparent effect using light color
    // Draw filled triangles from center
    doc.setLineWidth(0)
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % points.length]
      doc.setFillColor(185, 28, 28)
      doc.setGState(new doc.GState({ opacity: 0.12 }))
      doc.triangle(cx, cy, p1.x, p1.y, p2.x, p2.y, 'F')
    }
    doc.setGState(new doc.GState({ opacity: 1 }))

    // Draw data points
    for (const p of points) {
      doc.setFillColor(...COLORS.primary)
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
      doc.roundedRect(barX, y, barMaxW, barHeight, 1.5, 1.5, 'F')

      // Value bar
      const color = getBandColor(item.score)
      doc.setFillColor(...color)
      const valW = Math.max(barMaxW * (item.score / 100), 1)
      doc.roundedRect(barX, y, valW, barHeight, 1.5, 1.5, 'F')

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
    const startAngle = Math.PI // left (180°)
    const endAngle = 0 // right (0°)

    // Background arc segments
    const segments = [
      { from: 0, to: 0.5, color: COLORS.red },
      { from: 0.5, to: 0.64, color: COLORS.orange },
      { from: 0.64, to: 0.79, color: COLORS.yellow },
      { from: 0.79, to: 1, color: COLORS.green },
    ]

    for (const seg of segments) {
      const a1 = startAngle - seg.from * Math.PI
      const a2 = startAngle - seg.to * Math.PI
      doc.setDrawColor(...seg.color)
      doc.setLineWidth(5)
      // Draw arc using small line segments
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

    // Needle
    const normalizedScore = Math.min(Math.max(score / 100, 0), 1)
    const needleAngle = startAngle - normalizedScore * Math.PI
    const nx = cx + (radius - 8) * Math.cos(needleAngle)
    const ny = cy - (radius - 8) * Math.sin(needleAngle)
    doc.setDrawColor(...COLORS.dark)
    doc.setLineWidth(1)
    doc.line(cx, cy, nx, ny)

    // Center dot
    doc.setFillColor(...COLORS.dark)
    doc.circle(cx, cy, 2, 'F')

    // Score text
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(String(score), cx, cy + 10, { align: 'center' })

    if (label) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      doc.text(label, cx, cy + 15, { align: 'center' })
    }

    // Scale labels
    doc.setFontSize(6)
    doc.setTextColor(...COLORS.light)
    doc.text('0', cx - radius - 4, cy + 3, { align: 'center' })
    doc.text('100', cx + radius + 4, cy + 3, { align: 'center' })
    doc.text('50', cx, cy - radius - 3, { align: 'center' })
  }

  // Two-column info table (Field | Value | Field | Value)
  function drawInfoTable(pairs) {
    const rowH = 7
    const col1 = 38
    const col2 = (contentW / 2) - col1
    const col3 = 38
    const col4 = (contentW / 2) - col3

    for (let i = 0; i < pairs.length; i += 2) {
      checkSpace(rowH + 2)
      const isEven = (i / 2) % 2 === 0
      if (isEven) {
        drawRoundedRect(margin, y - 1, contentW, rowH + 1, 0, [252, 252, 253])
      }
      // Left pair
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.medium)
      doc.text(pairs[i][0], margin + 2, y + 4)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const val1 = String(pairs[i][1] || 'N/A')
      const tVal1 = val1.length > 35 ? val1.substring(0, 35) + '..' : val1
      doc.text(tVal1, margin + col1, y + 4)

      // Right pair (if exists)
      if (i + 1 < pairs.length) {
        const rightX = margin + contentW / 2
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.medium)
        doc.text(pairs[i + 1][0], rightX + 2, y + 4)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const val2 = String(pairs[i + 1][1] || 'N/A')
        const tVal2 = val2.length > 35 ? val2.substring(0, 35) + '..' : val2
        doc.text(tVal2, rightX + col3, y + 4)
      }
      y += rowH + 1
    }
    y += 4
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

  // Score card
  y += 4
  const cardX = pageW / 2 - 40
  const cardW = 80
  drawRoundedRect(cardX, y, cardW, 50, 4, [255, 247, 237])
  doc.setFillColor(...bandColor)
  doc.rect(cardX, y, cardW, 4, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.medium)
  doc.setFont('helvetica', 'bold')
  doc.text('GROWTH SYSTEM SCORE', pageW / 2, y + 14, { align: 'center' })
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
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
  doc.setTextColor(...COLORS.dark)
  doc.text('Table of Contents', margin, y)
  y += 4
  drawLine(y, COLORS.primary)
  y += 12

  const tocItems = [
    'Executive Summary',
    'Company Input Snapshot',
    'Growth System Diagnostic Overview',
    'Primary Growth Constraint',
    'Pillar-by-Pillar Review',
    'Growth Constraint Map',
    'Revenue Achievement Probability Score (RAPS)',
    'Market Opportunity Context',
    'Organisational and Systems Readiness Summary',
    'Advisory Workstream Recommendation',
    '30-60-90 Day Action Roadmap',
    'Priority Actions Summary',
    'Closing Observation',
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

  const sortedPillars = Object.entries(pillarScores).sort(([a], [b]) => a.localeCompare(b))

  bodyText(report?.executive_summary || '')

  // Executive Scorecard — Radar Chart
  if (sortedPillars.length >= 3) {
    checkSpace(110)
    y += 4
    subHeading('Executive Scorecard')
    y += 4
    const radarData = sortedPillars.map(([pid, data]) => ({
      label: PILLAR_NAMES[pid] || pid,
      score: data.score || 0,
    }))
    drawRadarChart(radarData, { cx: pageW / 2, cy: y + 45, radius: 38, labelOffset: 14 })
    y += 100
  }

  // ========================
  // SECTION 2: COMPANY INPUT SNAPSHOT
  // ========================
  y += 4
  sectionTitle('2. Company Input Snapshot')

  const gtmChannels = sr.q11
    ? (Array.isArray(sr.q11) ? sr.q11.join(', ') : String(sr.q11))
    : 'N/A'

  drawInfoTable([
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
  ])

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
  pRowColors.push(getBandColor(radScore))

  drawTable(pHeaders, pRows, { colWidths: pColWidths, fontSize: 7.5, rowHeight: 6.5, rowColors: pRowColors })

  // Growth System Heatmap — Horizontal Bar Chart
  y += 4
  subHeading('Growth System Heatmap')
  y += 2
  const heatmapData = sortedPillars.map(([pid, data]) => ({
    label: PILLAR_NAMES[pid] || pid,
    score: data.score || 0,
  }))
  drawHBarChart(heatmapData, { barHeight: 7, gap: 3, labelWidth: 55 })

  y += 4
  if (report?.executive_summary) {
    const overview = report.executive_summary.split('\n').slice(0, 2).join(' ')
    if (overview) {
      bodyText(overview, { fontSize: 9 })
    }
  }

  // ========================
  // SECTION 4: PRIMARY GROWTH CONSTRAINT
  // ========================
  y += 4
  sectionTitle('4. Primary Growth Constraint')

  // Collect all pillars scoring < 50% as primary constraints
  const primaryConstraints = sortedPillars.filter(([, data]) => data.score < 50)
  const constraintNames = primaryConstraints.length > 0
    ? primaryConstraints.map(([pid]) => PILLAR_NAMES[pid]).join(', ')
    : (constraint?.name || 'N/A')

  for (const [cPid, cData] of (primaryConstraints.length > 0 ? primaryConstraints : [[constraint?.id, constraint]])) {
    const cName = PILLAR_NAMES[cPid] || constraint?.name || 'N/A'
    const cScore = cPid ? pillarScores[cPid]?.score ?? cData?.score : cData?.score

    checkSpace(16)
    drawRoundedRect(margin, y - 2, contentW, 12, 3, [253, 237, 238])
    doc.setFillColor(...COLORS.red)
    doc.rect(margin, y - 2, 2, 12, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.red)
    doc.text(`Primary Constraint: ${cName}`, margin + 8, y + 5)
    if (cScore !== undefined) {
      doc.text(`Score: ${cScore}`, pageW - margin - 8, y + 5, { align: 'right' })
    }
    y += 16

    if (cPid && report?.pillar_narratives?.[cPid]) {
      bodyText(report.pillar_narratives[cPid])
    }

    if (report?.positioning_assessment && cPid === 'p3') {
      bodyText(report.positioning_assessment, { fontSize: 9 })
    }
  }

  y += 2
  bodyText('Constraint impact flows into:', { bold: true, fontSize: 9 })
  const impactAreas = ['First-impression buyer clarity', 'Pipeline quality', 'Proposal competitiveness', 'Sales cycle efficiency', 'Pricing confidence']
  for (const area of impactAreas) {
    bulletPoint(area, { fontSize: 8.5 })
  }

  // ========================
  // SECTION 5: PILLAR-BY-PILLAR REVIEW
  // ========================
  addPage()
  sectionTitle('5. Pillar-by-Pillar Review')

  for (const [pid, data] of sortedPillars) {
    const name = PILLAR_NAMES[pid] || pid
    const score = data.score || 0
    const narrative = report?.pillar_narratives?.[pid] || ''
    const isPrimary = score < 50
    const color = getBandColor(score)

    // Estimate needed space
    const narLines = narrative ? doc.splitTextToSize(narrative, contentW - 8) : []
    const neededH = 20 + (narLines.length * 3.5) + 8
    checkSpace(Math.max(neededH, 30))

    // Pillar header
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
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
      doc.setFillColor(...COLORS.red)
      doc.roundedRect(margin + 35, y - 4, badgeWidth, 6, 2, 2, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(badgeText, margin + 35 + badgeWidth / 2, y - 0.5, { align: 'center' })
    }
    y += 5

    // Progress bar
    const barW = contentW
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(margin, y, barW, 2.5, 1, 1, 'F')
    doc.setFillColor(...color)
    doc.roundedRect(margin, y, barW * (score / 100), 2.5, 1, 1, 'F')
    y += 8

    // Narrative / AI assessment
    if (narrative) {
      bodyText('AI Assessment:', { bold: true, fontSize: 8.5, color: COLORS.medium })
      bodyText(narrative, { fontSize: 9, indent: 2 })
    }

    y += 4
    drawLine(y, COLORS.border)
    y += 6
  }

  // Positioning comparison (if positioning assessment exists)
  if (report?.positioning_assessment) {
    checkSpace(30)
    subHeading('Competitive Positioning Assessment')
    bodyText(report.positioning_assessment, { fontSize: 9 })

    if (report?.strategic_moat_score) {
      y += 2
      checkSpace(14)
      drawRoundedRect(margin, y - 2, contentW, 12, 3, [240, 253, 244])
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
  // SECTION 6: GROWTH CONSTRAINT MAP
  // ========================
  addPage()
  sectionTitle('6. Growth Constraint Map')

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
  // SECTION 7: RAPS
  // ========================
  y += 6
  sectionTitle('7. Revenue Achievement Probability Score (RAPS)')

  if (raps?.score !== undefined) {
    // RAPS Gauge
    checkSpace(55)
    drawRoundedRect(margin, y, contentW, 50, 4, COLORS.bg)
    drawGauge(raps.score, { cx: pageW / 2, cy: y + 35, radius: 25, label: 'Revenue Achievement Probability' })
    y += 56

    // Key inputs table
    subHeading('Key Inputs')
    const winRateMid = raps.winRate ? `${(raps.winRate * 100).toFixed(0)}%` : (sr.q17 || 'N/A')
    const expectedConvertible = raps.revenueRemaining && raps.winRate
      ? `$${(raps.revenueRemaining * raps.winRate * 0.7).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : 'N/A'

    drawInfoTable([
      ['Annual Revenue Target', raps.revenueTarget ? `$${Number(raps.revenueTarget).toLocaleString()}` : 'N/A'],
      ['Revenue Invoiced YTD', raps.revenueInvoiced ? `$${Number(raps.revenueInvoiced).toLocaleString()}` : 'N/A'],
      ['Revenue Remaining', raps.revenueRemaining ? `$${Number(raps.revenueRemaining).toLocaleString()}` : 'N/A'],
      ['Months Remaining', String(raps.monthsRemaining || 'N/A')],
      ['Win Rate Midpoint', winRateMid],
      ['Expected Convertible', expectedConvertible],
    ])

    if (report?.raps_narrative) {
      bodyText(report.raps_narrative, { fontSize: 9 })
    }

    if (report?.raps_improvement_scenario) {
      y += 2
      checkSpace(18)
      const impLines = doc.splitTextToSize(report.raps_improvement_scenario, contentW - 18)
      const impH = impLines.length * 3.5 + 12
      drawRoundedRect(margin, y, contentW, impH, 3, [240, 253, 244])
      doc.setFillColor(...COLORS.green)
      doc.rect(margin, y, 2, impH, 'F')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 163, 74)
      doc.text('Improvement Scenario', margin + 8, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      doc.setFontSize(8)
      doc.text(impLines, margin + 8, y + 12)
      y += impH + 6
    }
  } else {
    bodyText(report?.raps_narrative || '')
  }

  // ========================
  // SECTION 8: MARKET OPPORTUNITY CONTEXT
  // ========================
  addPage()
  sectionTitle('8. Market Opportunity Context')

  const countries = marketReport?.countries || []
  if (countries.length > 0) {
    const mHeaders = ['Market', 'Growth Propensity', 'Key Drivers']
    const mColWidths = [contentW * 0.2, contentW * 0.2, contentW * 0.6]
    const mRows = countries.map(c => [
      c.name || 'N/A',
      c.growth_propensity || 'N/A',
      (c.key_drivers || 'N/A').substring(0, 80),
    ])
    drawTable(mHeaders, mRows, { colWidths: mColWidths, fontSize: 8 })

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
  // SECTION 9: ORG & SYSTEMS READINESS
  // ========================
  y += 6
  sectionTitle('9. Organisational and Systems Readiness Summary')

  const p8Score = pillarScores.p8?.score || 0
  const p9Score = pillarScores.p9?.score || 0

  const readinessHeaders = ['Readiness Layer', 'Score', 'Interpretation']
  const readinessColWidths = [contentW * 0.35, contentW * 0.15, contentW * 0.5]
  const readinessRows = [
    ['Organisational Readiness (P8)', `${p8Score} / 100`, p8Score >= 80 ? 'Well-aligned and execution-ready.' : p8Score >= 65 ? 'Reasonably aligned, but not yet execution-tight.' : p8Score >= 50 ? 'Alignment gaps creating execution friction.' : 'Significant alignment issues limiting growth.'],
    ['Systems & AI Readiness (P9)', `${p9Score} / 100`, p9Score >= 80 ? 'Systems strong and AI-ready.' : p9Score >= 65 ? 'Usable systems, but integration gaps reduce trust and speed.' : p9Score >= 50 ? 'Moderate systems with fragmented data and manual dependency.' : 'Systems not yet ready to support scale.'],
  ]
  drawTable(readinessHeaders, readinessRows, { colWidths: readinessColWidths, fontSize: 8 })

  if (report?.pillar_narratives?.p8) {
    bodyText(report.pillar_narratives.p8, { fontSize: 9 })
  }
  if (report?.pillar_narratives?.p9) {
    bodyText(report.pillar_narratives.p9, { fontSize: 9 })
  }

  // ========================
  // SECTION 10: ADVISORY WORKSTREAM RECOMMENDATION
  // ========================
  addPage()
  sectionTitle('10. Advisory Workstream Recommendation')

  // Derive from lowest scoring pillars
  const ranked = [...sortedPillars].sort(([, a], [, b]) => a.score - b.score)
  const workstreams = ranked.slice(0, 3).map(([pid, data], i) => ({
    priority: i + 1,
    workstream: PILLAR_NAMES[pid],
    reason: report?.pillar_narratives?.[pid] || `Score: ${data.score}/100 — requires attention.`,
  }))

  const wsHeaders = ['Priority', 'Recommended Workstream', 'Reason']
  const wsColWidths = [contentW * 0.12, contentW * 0.33, contentW * 0.55]
  const wsRows = workstreams.map(ws => [String(ws.priority), ws.workstream, ws.reason.substring(0, 80)])
  drawTable(wsHeaders, wsRows, { colWidths: wsColWidths, fontSize: 8 })

  // ========================
  // SECTION 11: 30-60-90 DAY ACTION ROADMAP
  // ========================
  y += 6
  sectionTitle('11. 30-60-90 Day Action Roadmap')

  if (report?.action_plan) {
    const phases = [
      { titleKey: 'phase1_title', itemsKey: 'phase1_items', color: COLORS.red, bgColor: [253, 237, 238], label: 'Days 1\u201330' },
      { titleKey: 'phase2_title', itemsKey: 'phase2_items', color: COLORS.orange, bgColor: [255, 248, 230], label: 'Days 31\u201360' },
      { titleKey: 'phase3_title', itemsKey: 'phase3_items', color: COLORS.green, bgColor: [235, 250, 240], label: 'Days 61\u201390' },
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
        doc.setFillColor(...phase.color)
        doc.circle(margin + 14, itemY - 1, 0.8, 'F')
        const itemLines = doc.splitTextToSize(item, contentW - 28)
        doc.text(itemLines[0], margin + 19, itemY)
        itemY += 6
      }

      y += itemHeight + 8
    }
  } else {
    bodyText(report?.action_summary || '')
  }

  // ========================
  // SECTION 12: PRIORITY ACTIONS SUMMARY
  // ========================
  y += 4
  sectionTitle('12. Priority Actions Summary')

  // Derive priority actions from scores
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
  // SECTION 13: CLOSING OBSERVATION
  // ========================
  y += 6
  sectionTitle('13. Closing Observation')

  if (report?.executive_summary) {
    // Use last paragraph of executive summary as closing, or generate one
    const paragraphs = report.executive_summary.split('\n').filter(p => p.trim())
    const closing = paragraphs.length > 1
      ? paragraphs.slice(-1).join('\n')
      : `${company}'s growth system diagnostic reveals a score of ${radScore}/100 (${maturityBand}). The primary constraint${primaryConstraints.length > 1 ? 's are' : ' is'} ${constraintNames}. Addressing ${primaryConstraints.length > 1 ? 'these' : 'this'}, along with strengthening the supporting pillars, will position the business for more efficient and scalable growth.`
    bodyText(closing, { fontSize: 9.5 })
  } else {
    bodyText(`${company}'s growth system diagnostic reveals a score of ${radScore}/100 (${maturityBand}). The primary constraint${primaryConstraints.length > 1 ? 's are' : ' is'} ${constraintNames}. Addressing ${primaryConstraints.length > 1 ? 'these' : 'this'}, along with strengthening the supporting pillars, will position the business for more efficient and scalable growth.`, { fontSize: 9.5 })
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
  doc.setTextColor(...COLORS.dark)
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
