import { jsPDF } from 'jspdf'

const PILLAR_NAMES = {
  p1: 'Commercial Baseline', p2: 'ICP & Buyer Urgency',
  p3: 'Positioning & Competitive Clarity', p4: 'Sales System Repeatability',
  p5: 'Pipeline Generation', p6: 'Revconomics', p7: 'Strategic Constraints',
  p8: 'Organisational Alignment & Capability', p9: 'Systems Readiness & AI Transformation',
}

const COLORS = {
  primary: [185, 28, 28],      // dark red / brand
  accent: [249, 115, 22],      // orange accent
  dark: [0, 0, 0],              // text black
  medium: [107, 114, 128],     // text medium
  light: [156, 163, 175],      // text light
  white: [255, 255, 255],
  bg: [249, 250, 251],         // light gray bg
  border: [229, 231, 235],
  green: [34, 197, 94],
  lime: [132, 204, 22],
  orange: [234, 88, 12],
  red: [239, 68, 68],
  rose: [225, 29, 72],
}

function getBandColor(score) {
  if (score >= 80) return COLORS.green
  if (score >= 65) return COLORS.lime
  if (score >= 50) return COLORS.orange
  return COLORS.red
}

function getTrafficColor(avg) {
  if (avg >= 4) return COLORS.green
  if (avg >= 3) return COLORS.orange
  return COLORS.red
}

function pillarLabel(pid) {
  return `Pillar ${pid.replace('p', '')} - ${PILLAR_NAMES[pid] || pid}`
}

export function generateClientPdf({ scores, report, project, screenerResponses }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 0

  const company = screenerResponses?.q4 || project?.company_name || 'Company'
  const industry = screenerResponses?.q5 || 'Industry'
  const radScore = scores?.radScore || 0
  const maturityBand = scores?.maturityBand || 'Unknown'
  const constraint = scores?.primaryConstraint || {}
  const pillarScores = scores?.pillarScores || {}
  const raps = scores?.raps || {}
  const bandColor = getBandColor(radScore)

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
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.light)
    doc.text(`Biz Ascend RAD™ — Revenue Acceleration Diagnostic`, margin, pageH - 10)
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 10, { align: 'right' })
    doc.text('Confidential', pageW / 2, pageH - 10, { align: 'center' })
  }

  function drawLine(yPos, color = COLORS.border) {
    doc.setDrawColor(...color)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageW - margin, yPos)
  }

  function sectionTitle(title) {
    checkSpace(20)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(title, margin, y)
    y += 2
    drawLine(y, COLORS.primary)
    y += 12
  }

  function bodyText(text, opts = {}) {
    if (!text) return
    const { fontSize = 10, color = COLORS.dark, indent = 0, bold = false, lineHeight = 1.5 } = opts
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentW - indent)
    const lineSpacing = fontSize * 0.353 * lineHeight
    for (const line of lines) {
      checkSpace(lineSpacing + 2)
      doc.text(line, margin + indent, y)
      y += lineSpacing
    }
    y += 4
  }

  function drawRoundedRect(x, yPos, w, h, r, fillColor) {
    doc.setFillColor(...fillColor)
    doc.roundedRect(x, yPos, w, h, r, r, 'F')
  }

  // ========================
  // PAGE 1: COVER PAGE
  // ========================
  // Background accent bar
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageW, 6, 'F')

  // Logo placeholder
  y = 40
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageW / 2 - 12, y, 24, 24, 4, 4, 'F')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text('RAD', pageW / 2, y + 15, { align: 'center' })

  // Title
  y = 80
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('Revenue Acceleration', pageW / 2, y, { align: 'center' })
  y += 14
  doc.text('Diagnostic Report', pageW / 2, y, { align: 'center' })

  // Subtitle
  y += 12
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.medium)
  doc.text('Biz Ascend RAD™ — Strategic Performance Analysis', pageW / 2, y, { align: 'center' })

  // Divider
  y += 12
  drawLine(y, COLORS.primary)

  // Company info
  y += 16
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text(company, pageW / 2, y, { align: 'center' })

  y += 10
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.medium)
  doc.text(industry, pageW / 2, y, { align: 'center' })

  // Score card on cover
  y += 20
  const cardX = pageW / 2 - 45
  const cardW = 90
  drawRoundedRect(cardX, y, cardW, 55, 4, [255, 247, 237])
  doc.setFillColor(...bandColor)
  doc.rect(cardX, y, cardW, 4, 'F')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.medium)
  doc.text('SYSTEM MATURITY SCORE', pageW / 2, y + 14, { align: 'center' })

  doc.setFontSize(40)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(String(radScore), pageW / 2, y + 34, { align: 'center' })

  // Band badge
  const badgeW = doc.getTextWidth(maturityBand.toUpperCase()) + 16
  doc.setFillColor(...bandColor)
  doc.roundedRect(pageW / 2 - badgeW / 2, y + 40, badgeW, 8, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.white)
  doc.text(maturityBand.toUpperCase(), pageW / 2, y + 46, { align: 'center' })

  // Date
  y += 70
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.light)
  const dateStr = report?.generated_at ? new Date(report.generated_at).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Report Generated: ${dateStr}`, pageW / 2, y, { align: 'center' })

  // Bottom accent
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, pageH - 6, pageW, 6, 'F')

  addFooter()

  // ========================
  // PAGE 2: TABLE OF CONTENTS
  // ========================
  addPage()
  y = margin

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('Table of Contents', margin, y)
  y += 4
  drawLine(y, COLORS.primary)
  y += 12

  const tocItems = [
    { title: 'Executive Summary', page: 3 },
    { title: 'System Maturity Score Overview', page: 3 },
    { title: 'Pillar Diagnostic Breakdown', page: 4 },
  ]
  let tocPage = 5
  if (report?.positioning_assessment) {
    tocItems.push({ title: 'Positioning & Competitive Assessment', page: tocPage })
    tocPage++
  }
  if (raps?.score !== undefined) {
    tocItems.push({ title: 'Revenue Achievement Probability (RAPS)', page: tocPage })
    tocPage++
  }
  if (report?.action_plan) {
    tocItems.push({ title: '30-60-90 Day Action Plan', page: tocPage })
    tocPage++
  }

  tocItems.forEach((item, i) => {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(`${i + 1}.`, margin, y)
    doc.text(item.title, margin + 10, y)
    doc.setTextColor(...COLORS.medium)
    // Dotted leader
    const titleW = doc.getTextWidth(item.title)
    const pageNumStr = String(item.page)
    const pageNumW = doc.getTextWidth(pageNumStr)
    const dotsStart = margin + 10 + titleW + 3
    const dotsEnd = pageW - margin - pageNumW - 3
    let dotX = dotsStart
    doc.setFontSize(10)
    while (dotX < dotsEnd) {
      doc.text('.', dotX, y)
      dotX += 2.5
    }
    doc.text(pageNumStr, pageW - margin, y, { align: 'right' })
    y += 12
  })

  // ========================
  // PAGE 3: EXECUTIVE SUMMARY + SCORE OVERVIEW
  // ========================
  addPage()

  sectionTitle('1. Executive Summary')
  if (report?.executive_summary) {
    drawRoundedRect(margin, y - 2, contentW, 0.1, 2, COLORS.bg) // measure needed
    const summaryLines = doc.splitTextToSize(report.executive_summary, contentW - 16)
    const boxH = summaryLines.length * 4.5 + 14
    drawRoundedRect(margin, y - 2, contentW, boxH, 3, COLORS.bg)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.dark)
    doc.text(summaryLines, margin + 8, y + 6)
    y += boxH + 14
  } else {
    bodyText('No executive summary available. Please generate the AI Intelligence report first.')
    y += 4
  }

  // Score Overview
  sectionTitle('2. System Maturity Score Overview')

  // Score summary row
  const colW = contentW / 3
  const items = [
    { label: 'RAD Score', value: String(radScore), color: COLORS.primary },
    { label: 'Maturity Band', value: maturityBand, color: bandColor },
    { label: 'Primary Constraint', value: constraint.id ? pillarLabel(constraint.id) : constraint.name || 'N/A', color: COLORS.rose },
  ]

  items.forEach((item, i) => {
    const x = margin + i * colW
    drawRoundedRect(x + 1, y, colW - 2, 28, 3, COLORS.bg)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.medium)
    doc.text(item.label.toUpperCase(), x + colW / 2, y + 8, { align: 'center' })
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...item.color)
    const valLines = doc.splitTextToSize(item.value, colW - 8)
    doc.text(valLines, x + colW / 2, y + 17, { align: 'center' })
  })
  y += 42

  // RAPS summary if available
  if (raps?.score !== undefined) {
    drawRoundedRect(margin, y, contentW, 20, 3, [255, 247, 237])
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.medium)
    doc.text('REVENUE ACHIEVEMENT PROBABILITY', margin + 8, y + 8)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.orange)
    doc.text(`${raps.score}%`, margin + contentW - 8, y + 14, { align: 'right' })
    y += 26
  }

  // ========================
  // PAGE 4+: PILLAR DIAGNOSTICS
  // ========================
  addPage()
  sectionTitle('3. Pillar Diagnostic Breakdown')

  const sortedPillars = Object.entries(pillarScores).sort(([a], [b]) => a.localeCompare(b))
  for (const [pid, data] of sortedPillars) {
    const isPrimary = constraint?.id === pid
    const tColor = getTrafficColor(data.avg)
    const narrative = report?.pillar_narratives?.[pid] || ''
    const neededH = narrative ? 42 : 26

    checkSpace(neededH)

    // Pillar card
    const cardH = neededH
    if (isPrimary) {
      drawRoundedRect(margin, y - 2, contentW, cardH, 3, [254, 242, 242])
      doc.setFillColor(...COLORS.red)
      doc.rect(margin, y - 2, 2, cardH, 'F')
    } else {
      drawRoundedRect(margin, y - 2, contentW, cardH, 3, COLORS.bg)
    }

    // Traffic light dot
    doc.setFillColor(...tColor)
    doc.circle(margin + 8, y + 5, 2.5, 'F')

    // Pillar name
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text(pillarLabel(pid), margin + 15, y + 7)

    // Constraint badge
    if (isPrimary) {
      // Measure pillar name width at the correct font (11pt bold)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const pillarNameW = doc.getTextWidth(pillarLabel(pid))
      const badgeText = 'PRIMARY CONSTRAINT'
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      const bw = doc.getTextWidth(badgeText) + 8
      const badgeX = margin + 15 + pillarNameW + 4
      doc.setFillColor(...COLORS.red)
      doc.roundedRect(badgeX, y + 2, bw, 6, 2, 2, 'F')
      doc.setTextColor(...COLORS.white)
      doc.text(badgeText, badgeX + bw / 2, y + 6.2, { align: 'center' })
    }

    // Score
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...tColor)
    doc.text(String(data.score), pageW - margin - 8, y + 7, { align: 'right' })

    // Progress bar
    const barY = y + 12
    const barW = contentW - 16
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(margin + 8, barY, barW, 3, 1.5, 1.5, 'F')
    doc.setFillColor(...tColor)
    doc.roundedRect(margin + 8, barY, barW * (data.score / 100), 3, 1.5, 1.5, 'F')

    // Narrative
    if (narrative) {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      const narLines = doc.splitTextToSize(narrative, contentW - 24)
      const maxLines = 4
      const displayLines = narLines.slice(0, maxLines)
      doc.text(displayLines, margin + 12, barY + 8)
    }

    y += cardH + 4
  }

  // ========================
  // POSITIONING ASSESSMENT
  // ========================
  if (report?.positioning_assessment) {
    addPage()
    sectionTitle('4. Positioning & Competitive Assessment')
    bodyText(report.positioning_assessment)
    y += 4

    if (report?.strategic_moat_score) {
      checkSpace(30)
      drawRoundedRect(margin, y, contentW, 24, 3, [240, 253, 244])
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(`Strategic Moat Score: ${report.strategic_moat_score}/10`, margin + 8, y + 9)
      if (report?.strategic_moat_narrative) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.medium)
        const moatLines = doc.splitTextToSize(report.strategic_moat_narrative, contentW - 20)
        doc.text(moatLines.slice(0, 2), margin + 8, y + 16)
      }
      y += 30
    }
  }

  // ========================
  // RAPS SECTION
  // ========================
  if (raps?.score !== undefined) {
    addPage()
    const sectionNum = report?.positioning_assessment ? 5 : 4
    sectionTitle(`${sectionNum}. Revenue Achievement Probability (RAPS)`)

    // Big score
    checkSpace(40)
    drawRoundedRect(margin, y, contentW, 35, 4, COLORS.bg)
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.orange)
    doc.text(`${raps.score}%`, pageW / 2, y + 20, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.medium)
    doc.text('Probability of Achieving Revenue Target', pageW / 2, y + 30, { align: 'center' })
    y += 46

    // RAPS metrics grid
    const rapsItems = [
      { label: 'Revenue Target', value: `$${(raps.revenueTarget || 0).toLocaleString()}` },
      { label: 'Already Invoiced', value: `$${(raps.revenueInvoiced || 0).toLocaleString()}` },
      { label: 'Remaining', value: `$${(raps.revenueRemaining || 0).toLocaleString()}` },
      { label: 'Months Left', value: String(raps.monthsRemaining || 0) },
    ]

    checkSpace(28)
    const rColW = contentW / 4
    rapsItems.forEach((item, i) => {
      const x = margin + i * rColW
      drawRoundedRect(x + 1, y, rColW - 2, 22, 3, COLORS.bg)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.orange)
      doc.text(item.value, x + rColW / 2, y + 10, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.medium)
      doc.text(item.label, x + rColW / 2, y + 18, { align: 'center' })
    })
    y += 34

    // RAPS narrative
    if (report?.raps_narrative) {
      bodyText(report.raps_narrative)
      y += 4
    }

    // Improvement scenario
    if (report?.raps_improvement_scenario) {
      checkSpace(20)
      drawRoundedRect(margin, y, contentW, 0.1, 3, [240, 253, 244])
      const impLines = doc.splitTextToSize(report.raps_improvement_scenario, contentW - 20)
      const impH = impLines.length * 4 + 14
      drawRoundedRect(margin, y, contentW, impH, 3, [240, 253, 244])
      doc.setFillColor(...COLORS.green)
      doc.rect(margin, y, 2, impH, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(22, 163, 74)
      doc.text('Improvement Scenario', margin + 8, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      doc.text(impLines, margin + 8, y + 14)
      y += impH + 6
    }
  }

  // ========================
  // ACTION PLAN
  // ========================
  if (report?.action_plan) {
    addPage()
    let sectionNum = 4
    if (report?.positioning_assessment) sectionNum++
    if (raps?.score !== undefined) sectionNum++
    sectionTitle(`${sectionNum}. 30-60-90 Day Action Plan`)

    const phases = [
      { titleKey: 'phase1_title', itemsKey: 'phase1_items', color: COLORS.red, bgColor: [254, 242, 242], label: 'PHASE 1' },
      { titleKey: 'phase2_title', itemsKey: 'phase2_items', color: COLORS.orange, bgColor: [255, 251, 235], label: 'PHASE 2' },
      { titleKey: 'phase3_title', itemsKey: 'phase3_items', color: COLORS.green, bgColor: [240, 253, 244], label: 'PHASE 3' },
    ]

    for (const phase of phases) {
      const title = report.action_plan[phase.titleKey]
      const items = report.action_plan[phase.itemsKey] || []
      if (!title || items.length === 0) continue

      const itemHeight = items.length * 7 + 20
      checkSpace(itemHeight)

      drawRoundedRect(margin, y, contentW, itemHeight, 3, phase.bgColor)
      doc.setFillColor(...phase.color)
      doc.rect(margin, y, 3, itemHeight, 'F')

      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...phase.color)
      doc.text(phase.label, margin + 10, y + 7)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.dark)
      doc.text(title, margin + 10, y + 14)

      let itemY = y + 22
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      for (const item of items) {
        doc.setFillColor(...phase.color)
        doc.circle(margin + 14, itemY - 1, 1, 'F')
        const itemLines = doc.splitTextToSize(item, contentW - 30)
        doc.text(itemLines[0], margin + 20, itemY)
        itemY += 7
      }

      y += itemHeight + 10
    }
  }

  // ========================
  // FINAL PAGE: DISCLAIMER / FOOTER
  // ========================
  addPage()
  y = pageH / 2 - 30

  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(pageW / 2 - 12, y, 24, 24, 4, 4, 'F')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.text('RAD', pageW / 2, y + 15, { align: 'center' })

  y += 36
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text('Biz Ascend RAD™', pageW / 2, y, { align: 'center' })

  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.medium)
  doc.text('Revenue Acceleration Diagnostic', pageW / 2, y, { align: 'center' })

  y += 16
  drawLine(y, COLORS.border)
  y += 10

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.light)
  const disclaimer = 'This report is generated using proprietary scoring algorithms and AI-powered analysis. The insights provided are based on the diagnostic responses submitted and should be used as a strategic guide alongside professional judgement.'
  const discLines = doc.splitTextToSize(disclaimer, contentW - 20)
  doc.text(discLines, pageW / 2, y, { align: 'center' })

  y += discLines.length * 4 + 8
  doc.text(`Report generated on ${dateStr}`, pageW / 2, y, { align: 'center' })
  y += 5
  doc.text('Powered by Biz Ascend RAD™ | Confidential', pageW / 2, y, { align: 'center' })

  // Bottom accent
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, pageH - 6, pageW, 6, 'F')

  // Save
  const filename = `${company.replace(/\s+/g, '_')}_RAD_Report.pdf`
  doc.save(filename)
  return filename
}
