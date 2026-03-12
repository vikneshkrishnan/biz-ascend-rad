// Mock data for demo mode - allows full UI preview without Supabase

// ===== ORGANIZATIONS (Multi-tenant) =====
export const DEMO_ORGANIZATIONS = [
  {
    id: 'org-001',
    name: 'Biz Ascend Consulting',
    slug: 'biz-ascend',
    logo_url: null,
    plan: 'enterprise',
    max_users: 50,
    max_projects: 500,
    features: ['ai_reports', 'pdf_export', 'email_reports', 'public_questionnaire', 'reassessments', 'multi_user'],
    created_at: '2025-01-01T10:00:00Z',
    settings: {
      branding: { primary_color: '#000000', logo_url: null },
      email: { sender_name: 'Biz Ascend RAD', reply_to: 'support@bizascend.com' }
    }
  },
  {
    id: 'org-002',
    name: 'Growth Partners Inc',
    slug: 'growth-partners',
    logo_url: null,
    plan: 'professional',
    max_users: 10,
    max_projects: 100,
    features: ['ai_reports', 'pdf_export', 'email_reports', 'public_questionnaire'],
    created_at: '2025-02-15T10:00:00Z',
    settings: {
      branding: { primary_color: '#3b82f6', logo_url: null },
      email: { sender_name: 'Growth Partners', reply_to: 'hello@growthpartners.com' }
    }
  },
  {
    id: 'org-003',
    name: 'Revenue Experts',
    slug: 'revenue-experts',
    logo_url: null,
    plan: 'starter',
    max_users: 3,
    max_projects: 20,
    features: ['ai_reports', 'pdf_export'],
    created_at: '2025-03-20T10:00:00Z',
    settings: {
      branding: { primary_color: '#10b981', logo_url: null },
      email: { sender_name: 'Revenue Experts', reply_to: 'team@revenueexperts.io' }
    }
  }
]

export const DEMO_PROFILE = {
  id: 'demo-admin-001',
  auth_id: 'demo-auth-001',
  email: 'admin@bizascend.com',
  name: 'Sarah Mitchell',
  role: 'admin',
  is_active: true,
  organization_id: 'org-001',
  organization: DEMO_ORGANIZATIONS[0],
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-06-01T10:00:00Z',
}

export const DEMO_USERS = [
  { id: 'demo-admin-001', auth_id: 'demo-auth-001', email: 'admin@bizascend.com', name: 'Sarah Mitchell', role: 'admin', is_active: true, organization_id: 'org-001', created_at: '2025-01-15T10:00:00Z' },
  { id: 'demo-user-002', auth_id: 'demo-auth-002', email: 'james@bizascend.com', name: 'James Carter', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-02-20T10:00:00Z' },
  { id: 'demo-user-003', auth_id: 'demo-auth-003', email: 'maya@bizascend.com', name: 'Maya Patel', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-03-10T10:00:00Z' },
  { id: 'demo-user-004', auth_id: 'demo-auth-004', email: 'alex@bizascend.com', name: 'Alex Thompson', role: 'consultant', is_active: false, organization_id: 'org-001', created_at: '2025-01-28T10:00:00Z' },
  { id: 'demo-user-005', auth_id: 'demo-auth-005', email: 'priya@bizascend.com', name: 'Priya Sharma', role: 'consultant', is_active: true, organization_id: 'org-001', created_at: '2025-04-05T10:00:00Z' },
]

const mkAssessment = (pid, num, sStatus, dStatus, scores = null) => ({
  id: `assess-${pid}-${num}`,
  project_id: pid,
  assessment_number: num,
  screener_status: sStatus,
  diagnostic_status: dStatus,
  screener_responses: sStatus !== 'not_started' ? {
    q1: 'John Smith', q2: 'CEO/Founder', q3: 'john@acmecorp.com', q4: 'Acme Corporation',
    q5: 'SaaS / Software Platforms', q6: 'United States, United Kingdom, Germany',
    q7: '$20\u201350M', q8: '11\u201320', q9: '$500k\u20131M', q10: 'Direct Sales',
    q11: ['Cold outreach', 'Content/inbound marketing', 'Events/trade shows'],
    q12: 'We provide AI-powered revenue analytics that help B2B companies predict and accelerate growth.',
    q13: 'Gong, Clari, InsightSquared',
    q14: '$25k\u2013$100k', q15: '3\u20136 months', q16: '2\u20133\u00d7', q17: '20\u201330%',
    q18: '15000000', q19: '8500000', q20: '12',
  } : {},
  diagnostic_responses: dStatus !== 'not_started' ? {
    p1_q1: 4, p1_q2: 3, p1_q3: 4, p1_q4: 3, p1_q5: 3, p1_q6: 4, p1_q7: 3,
    p2_q1: 4, p2_q2: 3, p2_q3: 4, p2_q4: 3, p2_q5: 2, p2_q6: 3, p2_q7: 4,
    p3_q1: 3, p3_q2: 3, p3_q3: 2, p3_q4: 3, p3_q5: 2, p3_q6: 2, p3_q7: 3, p3_q8: 3, p3_q9: 2, p3_q10: 2, p3_q11: 2, p3_q12: 'Our main challenge is differentiation in a crowded market with well-funded competitors.',
    p4_q1: 4, p4_q2: 3, p4_q3: 3, p4_q4: 4, p4_q5: 3, p4_q6: 2, p4_q7: 3, p4_q8: 3, p4_q9: 4, p4_q10: 3, p4_q11: 3,
    p5_q1: 3, p5_q2: 3, p5_q3: 2, p5_q4: 3, p5_q5: 2, p5_q6: 3,
    p6_q1: 3, p6_q2: 2, p6_q3: 3, p6_q4: 3, p6_q5: 3,
    p7_q1: 3, p7_q2: 4, p7_q3: 3, p7_q4: 2, p7_q5: 3, p7_q6: 'Our biggest constraint is limited sales headcount relative to market opportunity.',
    p8_q1: 3, p8_q2: 3, p8_q3: 3, p8_q4: 2, p8_q5: 3, p8_q6: 2, p8_q7: 3, p8_q8: 3, p8_q9: 2, p8_q10: 3, p8_q11: 3, p8_q12: 2, p8_q13: 'Follow-through becomes inconsistent once initiatives move beyond planning, especially across sales, marketing, and delivery teams.',
    p9_q1: 3, p9_q2: 3, p9_q3: 2, p9_q4: 3, p9_q5: 2, p9_q6: 2, p9_q7: 3, p9_q8: 2, p9_q9: 3, p9_q10: 2, p9_q11: 2, p9_q12: 3, p9_q13: 'Data is spread across several tools and teams, which makes reporting slower, reduces trust in the numbers, and limits automation.',
  } : {},
  scores,
  report_data: null,
  created_at: '2025-04-01T10:00:00Z',
  completed_at: scores ? '2025-04-15T10:00:00Z' : null,
})

const SCORES_ACME = {
  radScore: 56.5,
  maturityBand: 'Growth System Underpowered',
  primaryConstraint: { id: 'p3', score: 48.0, name: 'Positioning & Competitive Clarity' },
  pillarScores: {
    p1: { score: 68.6, avg: 3.43, count: 7 },
    p2: { score: 65.7, avg: 3.29, count: 7 },
    p3: { score: 48.0, avg: 2.40, count: 11 },
    p4: { score: 62.2, avg: 3.11, count: 11 },
    p5: { score: 53.3, avg: 2.67, count: 6 },
    p6: { score: 56.0, avg: 2.80, count: 5 },
    p7: { score: 60.0, avg: 3.00, count: 5 },
    p8: { score: 53.3, avg: 2.67, count: 12 },
    p9: { score: 50.0, avg: 2.50, count: 12 },
  },
  raps: {
    score: 37,
    revenueTarget: 15000000,
    revenueInvoiced: 8500000,
    revenueRemaining: 6500000,
    monthsRemaining: 6,
    pipelineCoverage: 2.5,
    winRate: 0.25,
    salesCycle: 4.5,
    timeFactor: 1,
    radModifier: 0.593,
  },
}

const SCORES_NOVA = {
  radScore: 76.1,
  maturityBand: 'Growth System Constrained',
  primaryConstraint: { id: 'p5', score: 66.7, name: 'Pipeline Generation' },
  pillarScores: {
    p1: { score: 82.9, avg: 4.14, count: 7 },
    p2: { score: 80.0, avg: 4.00, count: 7 },
    p3: { score: 76.4, avg: 3.82, count: 11 },
    p4: { score: 80.0, avg: 4.00, count: 11 },
    p5: { score: 66.7, avg: 3.33, count: 6 },
    p6: { score: 76.0, avg: 3.80, count: 5 },
    p7: { score: 80.0, avg: 4.00, count: 5 },
    p8: { score: 73.3, avg: 3.67, count: 12 },
    p9: { score: 66.7, avg: 3.33, count: 12 },
  },
  raps: { score: 62, revenueTarget: 8000000, revenueInvoiced: 5200000, revenueRemaining: 2800000, monthsRemaining: 4, pipelineCoverage: 4, winRate: 0.35, salesCycle: 2, timeFactor: 1, radModifier: 0.785 },
}

export const DEMO_PROJECTS = [
  {
    id: 'proj-001', company_name: 'Acme Corporation', industry: 'SaaS / Software Platforms', status: 'completed',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-04-01T10:00:00Z', updated_at: '2025-04-15T10:00:00Z',
    latest_assessment: mkAssessment('proj-001', 3, 'completed', 'completed', SCORES_ACME),
    assessments: [
      mkAssessment('proj-001', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 42.1, maturityBand: 'Growth System At Risk', raps: { ...SCORES_ACME.raps, score: 18 } }),
      mkAssessment('proj-001', 2, 'completed', 'completed', { ...SCORES_ACME, radScore: 51.8, maturityBand: 'Growth System Underpowered', raps: { ...SCORES_ACME.raps, score: 28 } }),
      mkAssessment('proj-001', 3, 'completed', 'completed', SCORES_ACME),
    ],
    questionnaire_link: { id: 'link-001', token: 'demo-token-abc', status: 'completed', url: '#/assess/demo-token-abc', created_at: '2025-04-02T10:00:00Z' },
  },
  {
    id: 'proj-002', company_name: 'Nova Health Systems', industry: 'Healthcare Technology', status: 'completed',
    consultant_id: 'demo-user-003', consultant: { id: 'demo-user-003', name: 'Maya Patel', email: 'maya@bizascend.com' },
    created_at: '2025-03-15T10:00:00Z', updated_at: '2025-05-20T10:00:00Z',
    latest_assessment: mkAssessment('proj-002', 3, 'completed', 'completed', SCORES_NOVA),
    assessments: [
      mkAssessment('proj-002', 1, 'completed', 'completed', { ...SCORES_NOVA, radScore: 62.4, maturityBand: 'Growth System Underpowered', raps: { ...SCORES_NOVA.raps, score: 41 } }),
      mkAssessment('proj-002', 2, 'completed', 'completed', { ...SCORES_NOVA, radScore: 71.2, maturityBand: 'Growth System Constrained', raps: { ...SCORES_NOVA.raps, score: 52 } }),
      mkAssessment('proj-002', 3, 'completed', 'completed', SCORES_NOVA),
    ],
    questionnaire_link: null,
  },
  {
    id: 'proj-003', company_name: 'Quantum Dynamics', industry: 'Artificial Intelligence', status: 'in_progress',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-05-10T10:00:00Z', updated_at: '2025-06-01T10:00:00Z',
    latest_assessment: mkAssessment('proj-003', 1, 'completed', 'in_progress'),
    assessments: [mkAssessment('proj-003', 1, 'completed', 'in_progress')],
    questionnaire_link: { id: 'link-003', token: 'demo-token-qd', status: 'active', url: '#/assess/demo-token-qd', created_at: '2025-05-12T10:00:00Z' },
  },
  {
    id: 'proj-004', company_name: 'SteelBridge Manufacturing', industry: 'Manufacturing', status: 'in_progress',
    consultant_id: 'demo-user-005', consultant: { id: 'demo-user-005', name: 'Priya Sharma', email: 'priya@bizascend.com' },
    created_at: '2025-05-25T10:00:00Z', updated_at: '2025-06-05T10:00:00Z',
    latest_assessment: mkAssessment('proj-004', 1, 'in_progress', 'not_started'),
    assessments: [mkAssessment('proj-004', 1, 'in_progress', 'not_started')],
    questionnaire_link: null,
  },
  {
    id: 'proj-005', company_name: 'GreenWave Energy', industry: 'Energy / Utilities', status: 'draft',
    consultant_id: 'demo-user-003', consultant: { id: 'demo-user-003', name: 'Maya Patel', email: 'maya@bizascend.com' },
    created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-01T10:00:00Z',
    latest_assessment: mkAssessment('proj-005', 1, 'not_started', 'not_started'),
    assessments: [mkAssessment('proj-005', 1, 'not_started', 'not_started')],
    questionnaire_link: null,
  },
  {
    id: 'proj-006', company_name: 'CyberShield Security', industry: 'Cybersecurity', status: 'completed',
    consultant_id: 'demo-user-002', consultant: { id: 'demo-user-002', name: 'James Carter', email: 'james@bizascend.com' },
    created_at: '2025-02-01T10:00:00Z', updated_at: '2025-03-15T10:00:00Z',
    latest_assessment: mkAssessment('proj-006', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 81.2, maturityBand: 'Growth Engine Strong', primaryConstraint: { id: 'p6', score: 72.0, name: 'Revconomics' }, pillarScores: { p1: {score:88,avg:4.4,count:7}, p2: {score:85,avg:4.25,count:7}, p3: {score:80,avg:4.0,count:11}, p4: {score:84,avg:4.2,count:11}, p5: {score:78,avg:3.9,count:6}, p6: {score:72,avg:3.6,count:5}, p7: {score:82,avg:4.1,count:5}, p8: {score:80,avg:4.0,count:12}, p9: {score:76,avg:3.8,count:12} } }),
    assessments: [],
    questionnaire_link: null,
  },
  {
    id: 'proj-007', company_name: 'FintechFlow', industry: 'Fintech', status: 'archived',
    consultant_id: 'demo-user-005', consultant: { id: 'demo-user-005', name: 'Priya Sharma', email: 'priya@bizascend.com' },
    created_at: '2025-01-10T10:00:00Z', updated_at: '2025-02-28T10:00:00Z',
    latest_assessment: mkAssessment('proj-007', 1, 'completed', 'completed', { ...SCORES_ACME, radScore: 34.2, maturityBand: 'Growth System At Risk', primaryConstraint: { id: 'p1', score: 28.6, name: 'Commercial Baseline' } }),
    assessments: [],
    questionnaire_link: null,
  },
]

export const DEMO_STATS = {
  total_projects: 7,
  total_consultants: 4,
  active_diagnostics: 2,
  completed_diagnostics: 4,
  sectors: {
    'SaaS / Software Platforms': 1,
    'Healthcare Technology': 1,
    'Artificial Intelligence': 1,
    'Manufacturing': 1,
    'Energy / Utilities': 1,
    'Cybersecurity': 1,
    'Fintech': 1,
  },
}

export const DEMO_ACTIVITY = [
  { id: 'act-1', action: 'Created project: GreenWave Energy', created_at: '2025-06-01T10:00:00Z' },
  { id: 'act-2', action: 'Completed diagnostic for Nova Health Systems', created_at: '2025-05-20T10:00:00Z' },
  { id: 'act-3', action: 'Generated questionnaire link for Quantum Dynamics', created_at: '2025-05-12T10:00:00Z' },
  { id: 'act-4', action: 'Started screener for SteelBridge Manufacturing', created_at: '2025-05-25T10:00:00Z' },
  { id: 'act-5', action: 'Created consultant: Priya Sharma', created_at: '2025-04-05T10:00:00Z' },
]

// Demo API handler - returns mock data based on the path
export function demoApiFetch(path) {
  // Auth
  if (path === '/auth/me') return DEMO_PROFILE
  // Stats
  if (path === '/admin/stats') return DEMO_STATS
  if (path.startsWith('/activity')) return { activities: DEMO_ACTIVITY }
  // Users
  if (path === '/users') return DEMO_USERS
  // Projects list
  if (path === '/projects') return DEMO_PROJECTS
  // Project detail
  const pdMatch = path.match(/^\/projects\/([^/]+)$/)
  if (pdMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === pdMatch[1])
    return p || { error: 'Not found' }
  }
  // Screener
  const scrMatch = path.match(/^\/projects\/([^/]+)\/screener$/)
  if (scrMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === scrMatch[1])
    const a = p?.latest_assessment
    return { responses: a?.screener_responses || {}, status: a?.screener_status || 'not_started', assessment_id: a?.id }
  }
  // Diagnostic
  const diagMatch = path.match(/^\/projects\/([^/]+)\/diagnostic$/)
  if (diagMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === diagMatch[1])
    const a = p?.latest_assessment
    return { responses: a?.diagnostic_responses || {}, status: a?.diagnostic_status || 'not_started', screener_responses: a?.screener_responses || {}, assessment_id: a?.id }
  }
  // Scores
  const scoresMatch = path.match(/^\/projects\/([^/]+)\/scores$/)
  if (scoresMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === scoresMatch[1])
    return p?.latest_assessment?.scores || { error: 'No scores' }
  }
  // Link
  const linkMatch = path.match(/^\/projects\/([^/]+)\/link$/)
  if (linkMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === linkMatch[1])
    return p?.questionnaire_link || { link: null }
  }
  // Assessments
  const assessMatch = path.match(/^\/projects\/([^/]+)\/assessments$/)
  if (assessMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === assessMatch[1])
    return p?.assessments || []
  }
  // Sectors
  if (path === '/admin/sectors') return DEMO_STATS.sectors

  // Report generation (demo mode returns mock report)
  const reportGenMatch = path.match(/^\/projects\/([^/]+)\/report\/generate$/)
  if (reportGenMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === reportGenMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'No scores available' }
    return DEMO_REPORT
  }

  // Get report
  const reportMatch = path.match(/^\/projects\/([^/]+)\/report$/)
  if (reportMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === reportMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'Report not generated yet' }
    return { ...DEMO_REPORT, scores: p.latest_assessment.scores, screener_responses: p.latest_assessment.screener_responses }
  }

  // PDF download (demo mode returns a mock base64 PDF placeholder)
  const pdfMatch = path.match(/^\/projects\/([^/]+)\/report\/pdf$/)
  if (pdfMatch) {
    const p = DEMO_PROJECTS.find(pr => pr.id === pdfMatch[1])
    if (!p?.latest_assessment?.scores) return { error: 'Report not generated yet. Generate AI report first.' }
    // Return a minimal valid PDF (just header) as placeholder in demo mode
    // Real PDF generation happens via WeasyPrint in production
    return { 
      pdf: 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Pj4KL0NvbnRlbnRzIDQgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihEZW1vIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNQowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyMzQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA1Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgozMjgKJSVFT0Y=',
      filename: `${p.company_name.replace(/\s+/g, '_')}_RAD_Report_Demo.pdf`
    }
  }

  // Organization endpoints
  if (path === '/organization') {
    return DEMO_ORGANIZATIONS[0]
  }
  
  if (path === '/organizations') {
    return DEMO_ORGANIZATIONS
  }

  // Organization settings update - handled via POST return
  if (path === '/organization/settings') {
    return { success: true, message: 'Settings updated' }
  }

  return { success: true }
}

// Demo report data
export const DEMO_REPORT = {
  executive_summary: `Acme Corporation demonstrates significant revenue growth potential with a RAD Score of 59.3/100, positioning them in the "Growth System Fragile" category. The company shows strength in Commercial Baseline (68.6) and ICP & Buyer Urgency (65.7), indicating a solid foundation for revenue operations.

However, the primary growth constraint lies in Positioning & Competitive Clarity (48.0), which directly impacts market differentiation and sales effectiveness. With a RAPS score of 37%, achieving the remaining $6.5M revenue target within 6 months will require immediate strategic intervention.

The path forward requires focusing on crystallizing market positioning, strengthening competitive differentiation, and accelerating pipeline generation to improve win rates and shorten sales cycles.`,
  pillar_narratives: {
    p1: "Commercial Baseline scores 68.6/100, reflecting a moderately mature revenue foundation. Sales staff of 11-20 personnel and established GTM channels provide adequate coverage, though optimization opportunities exist in sales process standardization.",
    p2: "ICP & Buyer Urgency at 65.7/100 indicates reasonable customer targeting clarity. Deal sizes of $25k-$100k and 3-6 month sales cycles are healthy for the SaaS segment, but buyer urgency signals could be strengthened.",
    p3: "Positioning & Competitive Clarity is the critical constraint at 48.0/100. The company struggles to differentiate against well-funded competitors like Gong, Clari, and InsightSquared, creating confusion in the market and lengthening sales cycles.",
    p4: "Sales System Repeatability scores 62.2/100, showing developing but inconsistent sales processes. The direct sales model is functional but lacks the documentation and training infrastructure needed for scale.",
    p5: "Pipeline Generation at 53.3/100 reveals significant gaps in lead generation capacity. With only 2-3x pipeline coverage, the company lacks sufficient cushion to weather normal deal slippage.",
    p6: "Revconomics scores 56.0/100, indicating concerns about unit economics sustainability. The 20-30% win rate combined with long sales cycles creates challenging CAC:LTV dynamics.",
    p7: "Strategic Constraints at 60.0/100 highlights resource limitations relative to market opportunity. Limited sales headcount constrains market penetration velocity.",
    p8: "Organisational Alignment & Capability scores 53.3/100, indicating the organisation is not yet fully disciplined enough to support faster, cleaner growth execution. Follow-through becomes inconsistent once initiatives move beyond planning, especially across sales, marketing, and delivery teams.",
    p9: "Systems Readiness & AI Transformation scores 50.0/100, revealing usable but fragmented systems. Data is spread across several tools and teams, which makes reporting slower, reduces trust in the numbers, and limits automation potential."
  },
  positioning_assessment: `Acme Corporation's positioning as "AI-powered revenue analytics that help B2B companies predict and accelerate growth" competes directly in a crowded market dominated by well-capitalized players.

The competitive landscape includes Gong (conversation intelligence), Clari (revenue operations), and InsightSquared (revenue analytics) — each with significant market presence and brand recognition. The current positioning fails to carve out a distinct territory.

To improve positioning potency, consider narrowing to a specific use case or buyer persona where the platform delivers uniquely superior outcomes. The strategic moat must be deepened through proprietary data, integrations, or methodology that cannot be easily replicated.`,
  strategic_moat_score: 5,
  strategic_moat_narrative: `The strategic moat assessment reveals moderate defensibility with a score of 5/10. While the AI-powered analytics capability provides some differentiation, it does not yet constitute a sustainable competitive advantage.

Strengthening the moat requires building proprietary benchmarking data across clients, developing unique revenue prediction algorithms, or establishing deep integrations that create switching costs. Without these investments, the competitive position remains vulnerable to well-resourced competitors.`,
  raps_narrative: `The Revenue Achievement Probability Score (RAPS) of 37% indicates a concerning gap between targets and realistic outcomes. With $6.5M remaining to close in 6 months and only 2.5x pipeline coverage at a 25% win rate, the mathematical probability of hitting target is low.

The core challenge is inadequate pipeline volume combined with extended sales cycles. Even executing perfectly on existing opportunities, the numbers suggest a significant miss unless fundamental changes are made to pipeline generation velocity.`,
  raps_improvement_scenario: `Improving RAPS from 37% to 65% is achievable by: (1) Increasing pipeline coverage to 4x through intensified outbound and marketing programs, (2) Improving win rate to 35% via enhanced positioning and sales enablement, and (3) Compressing sales cycle by 30% through better qualification and deal acceleration tactics.`,
  action_plan: {
    phase1_title: "Critical Fixes (0-30 Days)",
    phase1_items: [
      "Conduct competitive positioning workshop to identify unique differentiation angle",
      "Implement win/loss analysis program for last 20 closed opportunities",
      "Launch emergency pipeline generation sprint with SDR blitz campaign",
      "Create battle cards for top 3 competitors (Gong, Clari, InsightSquared)",
      "Define and document ICP with specific buyer personas and urgency triggers"
    ],
    phase2_title: "Important Improvements (30-60 Days)",
    phase2_items: [
      "Redesign sales deck and collateral around new positioning",
      "Implement sales process standardization with stage exit criteria",
      "Deploy content marketing campaign targeting high-urgency scenarios",
      "Establish customer reference program with 5-7 referenceable accounts",
      "Launch partner channel exploration with 2-3 complementary vendors"
    ],
    phase3_title: "Consolidation & Growth (60-90 Days)",
    phase3_items: [
      "Roll out sales enablement training on new positioning and messaging",
      "Implement revenue forecasting discipline with weekly pipeline reviews",
      "Evaluate hiring plan for additional sales capacity",
      "Develop case studies demonstrating ROI for key use cases",
      "Begin building proprietary benchmarking database from customer data"
    ]
  },
  market_report: {
    countries: [
      {
        name: "United States",
        dimensions: [
          { name: "Economic Environment", findings: ["GDP growth projected at 2.3% for FY2025", "B2B SaaS spending continues upward trajectory", "Enterprise software budgets show resilience despite macro headwinds"] },
          { name: "Political & Regulatory", findings: ["Stable regulatory environment for SaaS", "Data privacy regulations maturing but manageable", "Government tech spending increasing"] },
          { name: "Geopolitical Factors", findings: ["Domestic market preference strengthening", "Cloud sovereignty concerns driving local data requirements", "Supply chain reshoring benefiting US-based vendors"] },
          { name: "Socio-economic Trends", findings: ["Remote work normalization driving software adoption", "Revenue operations emerging as strategic priority", "CFO influence on tech purchasing increasing"] },
          { name: "Industry Growth Outlook", findings: ["Revenue intelligence market growing 23% annually", "AI integration becoming table stakes", "Consolidation expected among point solutions"] }
        ],
        growth_propensity: "High",
        key_drivers: "Strong enterprise digitization momentum, mature buyer awareness of revenue analytics value, and accessible capital markets for growth investment.",
        risks: "Increasing competition from well-funded players, potential economic slowdown affecting software budgets, and talent acquisition challenges in key markets.",
        strategic_implications: "Prioritize US market penetration while establishing clear differentiation. Consider vertical specialization to reduce competitive overlap."
      },
      {
        name: "United Kingdom",
        dimensions: [
          { name: "Economic Environment", findings: ["Post-Brexit stabilization underway", "Financial services sector remains strong buyer", "GBP weakness creating budget pressures"] },
          { name: "Political & Regulatory", findings: ["GDPR compliance requirements continue", "UK GDPR alignment with EU standards", "Digital economy initiatives supportive"] },
          { name: "Geopolitical Factors", findings: ["Transatlantic alignment remains strong", "EU market access complexity for UK buyers", "Trade deal opportunities emerging"] },
          { name: "Socio-economic Trends", findings: ["London fintech hub driving innovation adoption", "Professional services vertical strong adopters", "Cost efficiency pressures driving analytics demand"] },
          { name: "Industry Growth Outlook", findings: ["Revenue intelligence adoption accelerating", "UK enterprises increasingly US-software friendly", "Integration with UK-specific data sources important"] }
        ],
        growth_propensity: "Medium-High",
        key_drivers: "Sophisticated buyer base in financial services and professional services, English language alignment, and similar business practices to US.",
        risks: "Currency fluctuations impacting pricing, Brexit-related budget constraints, and competition from UK-based alternatives.",
        strategic_implications: "Develop UK-specific case studies and local partner relationships. Consider London office or dedicated UK sales resource once US base is stable."
      },
      {
        name: "Germany",
        dimensions: [
          { name: "Economic Environment", findings: ["Manufacturing sector facing digital transformation needs", "Mittelstand companies increasingly adopting SaaS", "Economic uncertainty affecting large enterprise spending"] },
          { name: "Political & Regulatory", findings: ["Strict data residency requirements", "German-specific compliance needs (GoBD)", "Strong worker protection laws affecting sales tools"] },
          { name: "Geopolitical Factors", findings: ["EU market gateway potential", "US vendor skepticism in some segments", "Data sovereignty concerns prominent"] },
          { name: "Socio-economic Trends", findings: ["Digital transformation lagging Anglo markets", "Relationship-based sales culture", "Longer evaluation and procurement cycles"] },
          { name: "Industry Growth Outlook", findings: ["Revenue analytics awareness growing", "Preference for German-language interfaces", "Implementation partner ecosystem important"] }
        ],
        growth_propensity: "Medium",
        key_drivers: "Large addressable market with growing digital maturity, strong economy, and enterprise willingness to invest in proven solutions.",
        risks: "Language localization requirements, longer sales cycles, data residency compliance costs, and cultural preference for European vendors.",
        strategic_implications: "Consider Germany as medium-term expansion opportunity. Would require German language capabilities and local implementation partners before entry."
      }
    ]
  },
  generated_at: new Date().toISOString()
}
